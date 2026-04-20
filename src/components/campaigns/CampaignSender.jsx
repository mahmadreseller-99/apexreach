import { useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * CampaignSender — invisible background engine.
 * Sends emails via base44 SendEmail integration.
 * Lead scoring: +5 open, +10 click, +20 reply (tracked via CampaignLog events).
 */
export default function CampaignSender({ campaign, smtpAccounts, onDone }) {
  const runningRef = useRef(false);

  useEffect(() => {
    if (!campaign || campaign.status !== 'sending' || runningRef.current) return;
    runningRef.current = true;

    runSendLoop(campaign, smtpAccounts).finally(() => {
      runningRef.current = false;
      if (onDone) onDone();
    });
  }, [campaign?.id, campaign?.status]);

  return null;
}

async function fetchAllContacts(listId) {
  const PAGE = 200;
  let all = [];
  let skip = 0;
  while (true) {
    const page = await base44.entities.Contact.filter(
      { list_id: listId },
      'created_date',
      PAGE,
      skip
    );
    if (!page?.length) break;
    all = all.concat(page);
    if (page.length < PAGE) break;
    skip += PAGE;
  }
  return all;
}

async function runSendLoop(campaign, smtpAccounts) {
  let allContacts = await fetchAllContacts(campaign.list_id);
  allContacts = allContacts.filter(
    c => c.status !== 'bounced' && c.status !== 'unsubscribed'
  );

  if (!allContacts.length) {
    await base44.entities.Campaign.update(campaign.id, {
      status: 'completed',
      total_contacts: 0,
      processed_count: 0,
      completed_at: new Date().toISOString(),
    });
    return;
  }

  // Resume: skip already-sent
  const alreadySentEmails = new Set();
  let logSkip = 0;
  while (true) {
    const logs = await base44.entities.CampaignLog.filter(
      { campaign_id: campaign.id },
      'created_date',
      500,
      logSkip
    );
    if (!logs?.length) break;
    logs
      .filter(l => l.status === 'sent' || l.status === 'delivered')
      .forEach(l => alreadySentEmails.add(l.contact_email));
    if (logs.length < 500) break;
    logSkip += 500;
  }

  const remaining = allContacts.filter(c => !alreadySentEmails.has(c.email));
  const alreadyProcessed = allContacts.length - remaining.length;

  await base44.entities.Campaign.update(campaign.id, {
    total_contacts: allContacts.length,
    processed_count: alreadyProcessed,
    failed_count: campaign.failed_count || 0,
  });

  // Round-robin SMTP rotation
  let smtpList = (smtpAccounts || []).filter(
    s => campaign.smtp_ids?.includes(s.id) && s.status !== 'inactive'
  );
  if (!smtpList.length) {
    smtpList = (smtpAccounts || []).filter(s => s.status !== 'inactive');
  }

  const subjects =
    campaign.subjects?.filter(s => s?.trim()).length > 0
      ? campaign.subjects.filter(s => s?.trim())
      : [campaign.subject || '(no subject)'];

  let processedCount = alreadyProcessed;
  let failedCount = campaign.failed_count || 0;

  for (let i = 0; i < remaining.length; i++) {
    // Pause/cancel check every 5 emails
    if (i > 0 && i % 5 === 0) {
      const allCampaigns = await base44.entities.Campaign.list('-created_date', 100);
      const fresh = allCampaigns.find(c => c.id === campaign.id);
      if (fresh?.status === 'paused' || fresh?.status === 'completed') return;
    }

    const contact = remaining[i];
    // Round-robin rotation
    const smtp = smtpList.length > 0 ? smtpList[i % smtpList.length] : null;
    const rawSubject = subjects[i % subjects.length];
    const subject = personalize(rawSubject, contact);
    const personalizedBody = personalize(campaign.body || '', contact);
    const emailBody = buildCleanBody(personalizedBody);

    try {
      await sendEmail({ smtp, to: contact.email, subject, body: emailBody, attachmentUrls: campaign.attachment_urls || [] });
      processedCount++;

      await base44.entities.CampaignLog.create({
        campaign_id: campaign.id,
        contact_id: contact.id,
        contact_email: contact.email,
        smtp_id: smtp?.id || '',
        status: 'sent',
        subject_used: subject,
      });
      await base44.entities.ActivityLog.create({
        action: 'email_sent',
        entity_type: 'campaign',
        entity_id: campaign.id,
        contact_email: contact.email,
        campaign_name: campaign.name,
      });

    } catch (err) {
      failedCount++;
      await base44.entities.CampaignLog.create({
        campaign_id: campaign.id,
        contact_id: contact.id,
        contact_email: contact.email,
        smtp_id: smtp?.id || '',
        status: 'failed',
        subject_used: subject,
        error: String(err?.message || err),
      });
    }

    if ((i + 1) % 5 === 0 || i === remaining.length - 1) {
      await base44.entities.Campaign.update(campaign.id, {
        processed_count: processedCount,
        failed_count: failedCount,
      });
    }

    // Track SMTP daily usage
    if (smtp && (i + 1) % 10 === 0) {
      await base44.entities.SmtpAccount.update(smtp.id, {
        sent_today: (smtp.sent_today || 0) + 10,
      });
    }

    if (i < remaining.length - 1) {
      await sleep((campaign.delay_seconds || 5) * 1000);
    }
  }

  await base44.entities.Campaign.update(campaign.id, {
    status: 'completed',
    processed_count: processedCount,
    failed_count: failedCount,
    completed_at: new Date().toISOString(),
  });
}

/**
 * updateLeadScore — called when engagement events occur.
 * +5 open, +10 click, +20 reply.
 */
export async function updateLeadScore(contactEmail, eventType) {
  const points = eventType === 'opened' ? 5 : eventType === 'clicked' ? 10 : eventType === 'replied' ? 20 : 0;
  if (!points) return;

  const contacts = await base44.entities.Contact.filter({ email: contactEmail }, 'created_date', 1);
  if (!contacts?.length) return;

  const contact = contacts[0];
  const newScore = (contact.lead_score || 0) + points;
  await base44.entities.Contact.update(contact.id, { lead_score: newScore });
}

/**
 * sendEmail — uses base44 SendEmail. Clean body, no unsubscribe footer added by us.
 * The from_name is set to the SMTP account's from_name for correct sender identity.
 */
async function sendEmail({ smtp, to, subject, body, attachmentUrls = [] }) {
  const fromName = smtp ? (smtp.from_name || smtp.name || '') : '';

  await base44.integrations.Core.SendEmail({
    to,
    subject,
    body,
    from_name: fromName,
    ...(attachmentUrls.length > 0 ? { file_urls: attachmentUrls } : {}),
  });
}

function personalize(text, contact) {
  if (!text) return '';
  const firstName = contact.name
    ? contact.name.split(' ')[0]
    : contact.email.split('@')[0];
  return text
    .replace(/\{\{first_name\}\}/gi, firstName)
    .replace(/\{\{name\}\}/gi, firstName)
    .replace(/\{\{full_name\}\}/gi, contact.name || firstName)
    .replace(/\{\{email\}\}/gi, contact.email || '')
    .replace(/\{\{company\}\}/gi, contact.company || '')
    .replace(/\{\{phone\}\}/gi, contact.phone || '')
    .replace(/\{\{website\}\}/gi, contact.website || '');
}

/**
 * Build a clean, plain personal-looking email body.
 * No promotional wrappers, no footers, no unsubscribe links.
 * Looks like a 1:1 email → better inbox placement.
 */
function buildCleanBody(body) {
  if (!body) return '';
  const hasHtml = /<[a-z][\s\S]*>/i.test(body);
  if (!hasHtml) {
    const lines = body.split('\n').map(line => `<p style="margin:0 0 12px 0;">${line || '&nbsp;'}</p>`).join('');
    return `<div style="font-family:Arial,sans-serif;font-size:15px;color:#1a1a1a;line-height:1.6;max-width:580px;">${lines}</div>`;
  }
  return body;
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}