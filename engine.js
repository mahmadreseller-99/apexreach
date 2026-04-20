import nodemailer from 'nodemailer';
import db from './db.js';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const APP_URL = process.env.APP_URL || 'http://localhost:3000';
const transporters = {};

function getTransporter(smtp) {
  if (transporters[smtp.id]) return transporters[smtp.id];
  const t = nodemailer.createTransport({
    host: smtp.host,
    port: smtp.port,
    secure: smtp.port === 465,
    requireTLS: smtp.port === 587,
    auth: { user: smtp.username, pass: smtp.password },
    tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
    pool: true, maxConnections: 5
  });
  transporters[smtp.id] = t;
  return t;
}

const pauseCampaign = (id) => {
  db.prepare('UPDATE campaigns SET status="paused" WHERE id=?').run(id);
};

const stripHtml = (html) => html ? html.replace(/<[^>]*>?/gm, '') : '';

const processCampaigns = async () => {
  // Check for any scheduled campaigns where the start time has arrived
  // Use JavaScript Date comparison for proper timezone handling
  const scheduledCampaigns = db.prepare("SELECT id, scheduled_at FROM campaigns WHERE status='scheduled' AND scheduled_at IS NOT NULL").all();
  const now = new Date();
  for (const sc of scheduledCampaigns) {
    try {
      const scheduledTime = new Date(sc.scheduled_at.endsWith('Z') ? sc.scheduled_at : sc.scheduled_at + 'Z');
      if (now >= scheduledTime) {
        db.prepare("UPDATE campaigns SET status='sending', started_at=CURRENT_TIMESTAMP WHERE id=?").run(sc.id);
        console.log(`[ENGINE] Scheduled campaign ${sc.id} started at ${now.toISOString()}`);
      }
    } catch (e) {
      console.error('[ENGINE] Error checking scheduled campaign:', sc.id, e.message);
    }
  }

  // Also start any campaigns with 'ready' status (immediate send)
  db.prepare("UPDATE campaigns SET status='sending', started_at=CURRENT_TIMESTAMP WHERE status='ready'").run();

  const campaigns = db.prepare("SELECT * FROM campaigns WHERE status='sending' AND (is_drip=0 OR is_drip IS NULL)").all();
  for (const campaign of campaigns) {
    const smtpRows = db.prepare('SELECT smtp_id FROM campaign_smtp_map WHERE campaign_id=?').all(campaign.id);
    if (!smtpRows.length) {
      pauseCampaign(campaign.id);
      continue;
    }

    const smtpIds = smtpRows.map(r => r.smtp_id);
    const smtps = db.prepare(`SELECT * FROM smtp_accounts WHERE id IN (${smtpIds.map(() => '?').join(',')})`).all(...smtpIds);
    
    // Check if any SMTP is exhausted
    const activeSmtps = smtps.filter(s => s.status !== 'error' && s.sent_today < s.daily_limit);
    if (!activeSmtps.length) {
      pauseCampaign(campaign.id);
      continue;
    }

    const pendingContacts = db.prepare(`
      SELECT c.* FROM contacts c
      WHERE c.list_id = ? AND c.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM send_logs 
        WHERE campaign_id = ? AND contact_id = c.id
      )
      LIMIT 50
    `).all(campaign.list_id, campaign.id);

    if (pendingContacts.length === 0) {
      db.prepare('UPDATE campaigns SET status="completed", completed_at=CURRENT_TIMESTAMP WHERE id=?').run(campaign.id);
      continue;
    }

    let smtpIndex = campaign.last_smtp_index || 0;

    for (const contact of pendingContacts) {
      const currentStatus = db.prepare("SELECT status FROM campaigns WHERE id=?").get(campaign.id);
      if (!currentStatus || currentStatus.status !== 'sending') break;

      let smtp = null;
      for (let i = 0; i < smtps.length; i++) {
        const candidate = smtps[(smtpIndex + i) % smtps.length];
        if (candidate.sent_today < candidate.daily_limit && candidate.status !== 'error') {
          smtp = candidate;
          smtpIndex += i + 1;
          break;
        }
      }

      if (!smtp) {
        pauseCampaign(campaign.id);
        break; 
      }

      db.prepare('UPDATE campaigns SET last_smtp_index=? WHERE id=?').run(smtpIndex, campaign.id);

      const personalizedSubject = (campaign.subject || '')
        .replace(/\{\{name\}\}/gi, contact.name || '')
        .replace(/\{\{first_name\}\}/gi, contact.name ? contact.name.split(' ')[0] : '')
        .replace(/\{\{email\}\}/gi, contact.email || '')
        .replace(/\{\{company\}\}/gi, (() => { try { return JSON.parse(contact.custom_fields || '{}').company || ''; } catch { return ''; } })());
        
      // Extract __html from visual template JSON if needed
      let emailBody = campaign.body || '';
      try {
        const parsed = JSON.parse(emailBody);
        if (parsed.__html) emailBody = parsed.__html;
      } catch {}
        
      const personalizedBody = emailBody
        .replace(/\{\{name\}\}/gi, contact.name || '')
        .replace(/\{\{first_name\}\}/gi, contact.name ? contact.name.split(' ')[0] : '')
        .replace(/\{\{email\}\}/gi, contact.email || '')
        .replace(/\{\{company\}\}/gi, (() => { try { return JSON.parse(contact.custom_fields || '{}').company || ''; } catch { return ''; } })());

      let finalHtml = personalizedBody;
      if (campaign.track_opens) {
        // Pointing strictly to backend API URL to avoid frontend router mismatches
        const trackingUrl = process.env.VITE_API_URL || process.env.APP_URL || 'http://localhost:3000';
        const trackingPixel = `<img src="${trackingUrl}/api/track/open?c=${campaign.id}&ct=${contact.id}" width="1" height="1" style="display:none" alt="" />`;
        if (finalHtml.includes('</body>')) {
          finalHtml = finalHtml.replace('</body>', `${trackingPixel}</body>`);
        } else {
          finalHtml += trackingPixel;
        }
      }

      let mailAttachments = [];
      try {
        const parsed = JSON.parse(campaign.attachments || '[]');
        mailAttachments = parsed.map(url => {
          if (url.startsWith('/uploads/')) {
            return { path: path.join(__dirname, url) };
          }
          return { path: url };
        });
      } catch (e) {
        console.error('Error parsing attachments:', e);
      }

      try {
        const transporter = getTransporter(smtp);
        await transporter.sendMail({
          from: `"${smtp.from_name}" <${smtp.from_email}>`,
          to: contact.email,
          subject: personalizedSubject,
          html: finalHtml,
          text: stripHtml(personalizedBody),
          attachments: mailAttachments,
          headers: {
            'X-Mailer': 'Microsoft Outlook 16.0',
            'X-Priority': '3',
            'Importance': 'Normal',
            'MIME-Version': '1.0'
          }
        });

        db.prepare(`INSERT INTO send_logs (id, campaign_id, contact_id, smtp_id, status, sent_at) VALUES (?,?,?,?,'sent',CURRENT_TIMESTAMP)`).run(crypto.randomUUID(), campaign.id, contact.id, smtp.id);
        db.prepare(`UPDATE campaigns SET sent_count = sent_count + 1 WHERE id=?`).run(campaign.id);
        db.prepare(`UPDATE smtp_accounts SET sent_today = sent_today + 1 WHERE id=?`).run(smtp.id);
        smtp.sent_today++;

      } catch (err) {
        const msg = String(err.message || '');
        db.prepare(`INSERT INTO send_logs (id, campaign_id, contact_id, smtp_id, status, error) VALUES (?,?,?,?,'failed',?)`).run(crypto.randomUUID(), campaign.id, contact.id, smtp.id, msg);
        db.prepare(`UPDATE campaigns SET failed_count = failed_count + 1 WHERE id=?`).run(campaign.id);
        
        if (msg.includes('535') || msg.includes('auth') || err.code === 'EAUTH') {
          db.prepare('UPDATE smtp_accounts SET status="error", last_error=? WHERE id=?').run(msg, smtp.id);
          smtp.status = 'error';
        }
      }

      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 5000) + 10000));
    }

    const remaining = db.prepare(`
      SELECT COUNT(*) as cnt FROM contacts c
      WHERE c.list_id = ? AND c.status = 'active'
      AND NOT EXISTS (
        SELECT 1 FROM send_logs 
        WHERE campaign_id = ? AND contact_id = c.id
      )
    `).get(campaign.list_id, campaign.id);

    if (remaining.cnt === 0) {
      db.prepare(`UPDATE campaigns SET status='completed', 
        completed_at=CURRENT_TIMESTAMP WHERE id=?`
      ).run(campaign.id);
      console.log('[ENGINE] Campaign completed:', campaign.name);
    }
  }
};

// ==========================================
// DRIP SEQUENCE PROCESSING ENGINE
// ==========================================
const processDripCampaigns = async () => {
  // Get all active drip campaigns
  const dripCampaigns = db.prepare("SELECT * FROM campaigns WHERE status='sending' AND is_drip=1").all();
  
  for (const campaign of dripCampaigns) {
    try {
      // Get drip steps for this campaign
      const steps = db.prepare('SELECT * FROM drip_sequences WHERE campaign_id=? ORDER BY step_order ASC').all(campaign.id);
      if (!steps.length) {
        console.log(`[DRIP] No steps for campaign ${campaign.id}, skipping`);
        continue;
      }

      // Get SMTP accounts
      const smtpRows = db.prepare('SELECT smtp_id FROM campaign_smtp_map WHERE campaign_id=?').all(campaign.id);
      if (!smtpRows.length) {
        console.log(`[DRIP] No SMTP for campaign ${campaign.id}, pausing`);
        pauseCampaign(campaign.id);
        continue;
      }
      
      const smtpIds = smtpRows.map(r => r.smtp_id);
      const smtps = db.prepare(`SELECT * FROM smtp_accounts WHERE id IN (${smtpIds.map(() => '?').join(',')})`).all(...smtpIds);
      const activeSmtps = smtps.filter(s => s.status !== 'error' && s.sent_today < s.daily_limit);
      if (!activeSmtps.length) {
        continue; // No available SMTP, try again next cycle
      }

      // Get all contacts in this campaign's list
      const contacts = db.prepare("SELECT * FROM contacts WHERE list_id=? AND status='active'").all(campaign.list_id);
      
      let smtpIndex = campaign.last_smtp_index || 0;
      let allCompleted = true;
      let sentThisCycle = 0;

      for (const contact of contacts) {
        // Check campaign is still active
        const currentStatus = db.prepare("SELECT status FROM campaigns WHERE id=?").get(campaign.id);
        if (!currentStatus || currentStatus.status !== 'sending') break;

        // Get all send_logs for this contact in this campaign (each log = one step sent)
        const contactLogs = db.prepare(
          'SELECT * FROM send_logs WHERE campaign_id=? AND contact_id=? ORDER BY sent_at ASC'
        ).all(campaign.id, contact.id);

        // If stop_on_reply is enabled and contact has replied, skip them entirely
        if (campaign.stop_on_reply) {
          const hasReplied = contactLogs.some(l => l.replied_at != null);
          if (hasReplied) continue;
        }

        const stepsSentCount = contactLogs.filter(l => l.status === 'sent' || l.status === 'opened' || l.status === 'replied').length;
        
        // All steps sent for this contact
        if (stepsSentCount >= steps.length) continue;

        // Still has steps to go
        allCompleted = false;

        // Determine which step is next
        const nextStepIndex = stepsSentCount;
        const nextStep = steps[nextStepIndex];
        if (!nextStep) continue;

        // Check if enough time has elapsed since the last sent email
        if (nextStepIndex > 0 && contactLogs.length > 0) {
          const lastLog = contactLogs[contactLogs.length - 1];
          if (lastLog.sent_at) {
            const lastSentTime = new Date(lastLog.sent_at.endsWith('Z') ? lastLog.sent_at : lastLog.sent_at + 'Z');
            const delayMs = (nextStep.delay_hours || 24) * 60 * 60 * 1000;
            const now = new Date();
            if (now.getTime() - lastSentTime.getTime() < delayMs) {
              allCompleted = false; // Still has pending items
              continue; // Not time yet for this contact
            }
          }
        }

        // Time to send! Pick an SMTP
        let smtp = null;
        for (let i = 0; i < smtps.length; i++) {
          const candidate = smtps[(smtpIndex + i) % smtps.length];
          if (candidate.sent_today < candidate.daily_limit && candidate.status !== 'error') {
            smtp = candidate;
            smtpIndex += i + 1;
            break;
          }
        }
        if (!smtp) break; // No SMTP available

        db.prepare('UPDATE campaigns SET last_smtp_index=? WHERE id=?').run(smtpIndex, campaign.id);

        // Personalize the step's subject and body
        const getCompany = () => { try { return JSON.parse(contact.custom_fields || '{}').company || ''; } catch { return ''; } };
        const contactName = contact.first_name || contact.name || '';
        
        const personalizedSubject = (nextStep.subject || '')
          .replace(/\{\{name\}\}/gi, contactName)
          .replace(/\{\{first_name\}\}/gi, contactName.split(' ')[0])
          .replace(/\{\{email\}\}/gi, contact.email || '')
          .replace(/\{\{company\}\}/gi, getCompany());

        let emailBody = nextStep.body || '';
        try { const p = JSON.parse(emailBody); if (p.__html) emailBody = p.__html; } catch {}

        const personalizedBody = emailBody
          .replace(/\{\{name\}\}/gi, contactName)
          .replace(/\{\{first_name\}\}/gi, contactName.split(' ')[0])
          .replace(/\{\{email\}\}/gi, contact.email || '')
          .replace(/\{\{company\}\}/gi, getCompany());

        let finalHtml = personalizedBody;
        if (campaign.track_opens) {
          const trackingUrl = process.env.VITE_API_URL || process.env.APP_URL || 'http://localhost:3000';
          const trackingPixel = `<img src="${trackingUrl}/api/track/open?c=${campaign.id}&ct=${contact.id}" width="1" height="1" style="display:none" alt="" />`;
          if (finalHtml.includes('</body>')) {
            finalHtml = finalHtml.replace('</body>', `${trackingPixel}</body>`);
          } else {
            finalHtml += trackingPixel;
          }
        }

        try {
          const transporter = getTransporter(smtp);
          await transporter.sendMail({
            from: `"${smtp.from_name}" <${smtp.from_email}>`,
            to: contact.email,
            subject: personalizedSubject,
            html: finalHtml,
            text: stripHtml(personalizedBody),
            headers: {
              'X-Mailer': 'Microsoft Outlook 16.0',
              'X-Priority': '3',
              'Importance': 'Normal',
              'MIME-Version': '1.0'
            }
          });

          db.prepare(`INSERT INTO send_logs (id, campaign_id, contact_id, smtp_id, status, sent_at) VALUES (?,?,?,?,'sent',CURRENT_TIMESTAMP)`)
            .run(crypto.randomUUID(), campaign.id, contact.id, smtp.id);
          db.prepare(`UPDATE campaigns SET sent_count = sent_count + 1 WHERE id=?`).run(campaign.id);
          db.prepare(`UPDATE smtp_accounts SET sent_today = sent_today + 1 WHERE id=?`).run(smtp.id);
          smtp.sent_today++;
          sentThisCycle++;
          
          console.log(`[DRIP] Sent step ${nextStepIndex + 1}/${steps.length} to ${contact.email} for "${campaign.name}"`);

        } catch (err) {
          const msg = String(err.message || '');
          db.prepare(`INSERT INTO send_logs (id, campaign_id, contact_id, smtp_id, status, error) VALUES (?,?,?,?,'failed',?)`)
            .run(crypto.randomUUID(), campaign.id, contact.id, smtp.id, msg);
          db.prepare(`UPDATE campaigns SET failed_count = failed_count + 1 WHERE id=?`).run(campaign.id);
          
          if (msg.includes('535') || msg.includes('auth') || err.code === 'EAUTH') {
            db.prepare('UPDATE smtp_accounts SET status="error", last_error=? WHERE id=?').run(msg, smtp.id);
            smtp.status = 'error';
          }
        }

        // Delay between sends (10-15s randomized)
        await new Promise(r => setTimeout(r, Math.floor(Math.random() * 5000) + 10000));
      }

      // Check if all contacts have completed all steps
      if (allCompleted && contacts.length > 0) {
        db.prepare("UPDATE campaigns SET status='completed', completed_at=CURRENT_TIMESTAMP WHERE id=?").run(campaign.id);
        console.log(`[DRIP] Sequence "${campaign.name}" completed — all contacts have received all ${steps.length} steps`);
      }
      
    } catch (err) {
      console.error(`[DRIP] Error processing campaign ${campaign.id}:`, err.message);
    }
  }
};

let lastResetDay = new Date().getDate();
setInterval(() => {
  const currentDay = new Date().getDate();
  if (currentDay !== lastResetDay) {
    db.prepare('UPDATE smtp_accounts SET sent_today = 0').run();
    lastResetDay = currentDay;
  }
}, 60 * 60 * 1000); 

let isEngineRunning = false;
setInterval(async () => {
  if (isEngineRunning) return;
  isEngineRunning = true;
  try { 
    await processCampaigns(); 
    await processDripCampaigns();
  } 
  catch (e) { console.error('Engine error:', e); }
  finally { isEngineRunning = false; }
}, 15000);

console.log('Engine running processing campaigns every 15s');
