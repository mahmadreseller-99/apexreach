import dotenv from 'dotenv';
dotenv.config();

console.log('[ENV] GEMINI_API_KEY loaded:', process.env.GEMINI_API_KEY ? 'YES' : 'NO - KEY MISSING');

import express from 'express';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import csvParser from 'csv-parser';
import fs from 'fs';
import nodemailer from 'nodemailer';
import path from 'path';
import { ImapFlow } from 'imapflow';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import db from './db.js';
import './engine.js'; // Start the SMTP engine background loop

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ dest: 'uploads/' });

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_key';

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '50mb' })); // Support large JSON payloads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static('uploads'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// --- UNPROTECTED TRACKING ---
app.get('/api/track/open', (req, res) => {
  const { c: campaignId, ct: contactId } = req.query;
  if (campaignId && contactId) {
    try {
      db.prepare(`UPDATE send_logs SET status='opened', opened_at=CURRENT_TIMESTAMP WHERE campaign_id=? AND contact_id=? AND opened_at IS NULL`).run(campaignId, contactId);
      db.prepare(`UPDATE campaigns SET opened_count = opened_count + 1 WHERE id=?`).run(campaignId);
    } catch (e) {
      console.error('[TRACKING] Error recording open:', e);
    }
  }
  
  // Return standard 1x1 transparent tracking pixel
  const pixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.writeHead(200, {
    'Content-Type': 'image/gif',
    'Content-Length': pixel.length,
    'Cache-Control': 'no-store, no-cache, must-revalidate, private'
  });
  res.end(pixel);
});

// Helper to log activity
const logActivity = (type, description, user_id = null) => {
  try {
    db.prepare('INSERT INTO activity_logs (id, type, description, user_id) VALUES (?, ?, ?, ?)').run(
      crypto.randomUUID(), type, description, user_id
    );
  } catch (err) {
    console.error('Failed to log activity', err);
  }
};

// Helper to convert a local datetime (e.g. "2026-04-21T09:00") in a given timezone to UTC ISO string
const convertToUTC = (localDatetime, tz) => {
  if (!localDatetime) return null;
  try {
    // Create a formatter that outputs the offset for the given timezone
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tz || 'UTC',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false, timeZoneName: 'longOffset'
    });
    
    // Parse the local datetime parts
    const [datePart, timePart] = localDatetime.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = (timePart || '09:00').split(':').map(Number);
    
    // Create a UTC date then adjust for timezone offset
    // First, get the offset for the target timezone at the given date
    const testDate = new Date(Date.UTC(year, month - 1, day, hour, minute, 0));
    const parts = formatter.formatToParts(testDate);
    const tzOffset = parts.find(p => p.type === 'timeZoneName')?.value || '+00:00';
    
    // Parse the offset like "GMT+05:00" or "GMT-05:00"  
    const offsetMatch = tzOffset.match(/([+-])(\d{2}):(\d{2})/);
    if (!offsetMatch) {
      // Timezone offset not parseable, store as-is in UTC
      return new Date(Date.UTC(year, month - 1, day, hour, minute, 0)).toISOString();
    }
    
    const offsetSign = offsetMatch[1] === '+' ? 1 : -1;
    const offsetHours = parseInt(offsetMatch[2]);
    const offsetMinutes = parseInt(offsetMatch[3]);
    const totalOffsetMs = offsetSign * (offsetHours * 60 + offsetMinutes) * 60 * 1000;
    
    // The local time IS the user's wall clock time, so subtract the offset to get UTC
    const utcMs = Date.UTC(year, month - 1, day, hour, minute, 0) - totalOffsetMs;
    return new Date(utcMs).toISOString();
  } catch (e) {
    console.error('[TIMEZONE] Conversion error:', e.message);
    // Fallback: treat as UTC
    return localDatetime.endsWith('Z') ? localDatetime : localDatetime + 'Z';
  }
};

// --- AUTH MIDDLEWARE ---
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = payload;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// --- AUTH APIs ---
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) return res.status(400).json({ error: 'All fields required' });

    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) return res.status(400).json({ error: 'Email already in use' });

    const hash = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    db.prepare('INSERT INTO users (id, email, password, name) VALUES (?, ?, ?, ?)').run(userId, email, hash, name);

    logActivity('user_signup', `User ${email} signed up`);
    const token = jwt.sign({ id: userId, email }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, email, name } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid credentials' });

    logActivity('user_login', `User ${email} logged in`, user.id);
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    delete user.password;
    res.json({ token, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  res.json({ success: true });
});

// Retrieves current user session
app.get('/api/auth/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT id, email, name, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user });
});

// --- SMTP ACCOUNTS ---
app.get('/api/smtp', requireAuth, (req, res) => {
  const accounts = db.prepare('SELECT * FROM smtp_accounts WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id);
  res.json(accounts);
});
app.get('/api/smtp/:id', requireAuth, (req, res) => {
  const acc = db.prepare('SELECT * FROM smtp_accounts WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!acc) return res.status(404).json({ error: 'Not found' });
  res.json(acc);
});
app.post('/api/smtp', requireAuth, (req, res) => {
  const { name, host, port, secure, username, password, from_email, from_name, imap_host, imap_port, daily_limit } = req.body;
  const id = crypto.randomUUID();
  db.prepare(`
    INSERT INTO smtp_accounts (id, user_id, name, host, port, secure, username, password, from_email, from_name, imap_host, imap_port, daily_limit)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, req.user.id, name, host, port || 587, secure ? 1 : 0, username, password, from_email, from_name, imap_host || null, imap_port || null, daily_limit || 500);
  logActivity('smtp_added', `SMTP account ${name} created`, req.user.id);
  res.json({ id });
});
app.put('/api/smtp/:id', requireAuth, (req, res) => {
  const { name, host, port, secure, username, password, from_email, from_name, imap_host, imap_port, daily_limit, status } = req.body;
  const result = db.prepare(`
    UPDATE smtp_accounts SET name = ?, host = ?, port = ?, secure = ?, username = ?, 
    password = ?, from_email = ?, from_name = ?, imap_host = ?, imap_port = ?, daily_limit = ?, status = ? WHERE id = ? AND user_id = ?
  `).run(name, host, port, secure ? 1 : 0, username, password, from_email, from_name, imap_host || null, imap_port || null, daily_limit, status, req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});
app.delete('/api/smtp/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM smtp_accounts WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  logActivity('smtp_deleted', `SMTP account deleted`, req.user.id);
  res.json({ success: true });
});

// SMTP TESTING / WARMUP
app.post('/api/smtp/test', requireAuth, async (req, res) => {
  try {
    const { host, port, secure, username, password, from_email, from_name } = req.body;
    const transporter = nodemailer.createTransport({
      host, port: Number(port),
      secure: Number(port) === 465,
      auth: { user: username, pass: password },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      requireTLS: Number(port) === 587,
      connectionTimeout: 30000,
      greetingTimeout: 30000
    });
    await transporter.verify();
    res.json({ success: true, message: 'Connection successful!' });
  } catch (err) {
    let msg = err.message;
    if (msg.includes('535')) msg = 'Wrong username or password';
    else if (msg.includes('ECONNREFUSED')) msg = 'Cannot connect to server';
    else if (msg.includes('certificate')) msg = 'SSL certificate error';
    res.status(400).json({ error: msg });
  }
});

app.post('/api/smtp/:id/warmup/toggle', requireAuth, (req, res) => {
  db.prepare('UPDATE smtp_accounts SET warmup_enabled = NOT warmup_enabled WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

app.get('/api/smtp/:id/warmup/status', requireAuth, (req, res) => {
  const smtp = db.prepare('SELECT warmup_days, warmup_enabled, sent_today FROM smtp_accounts WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  res.json(smtp);
});

app.post('/api/smtp/:id/warmup/run', requireAuth, async (req, res) => {
  try {
    const smtp = db.prepare('SELECT * FROM smtp_accounts WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
    if (!smtp) return res.status(404).json({ error: 'SMTP not found' });
    
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Generate 5 different short natural business emails for inbox warmup. Each under 60 words. Subjects should be like real conversations: Quick follow-up, Checking in, Re: Our call, Following up, Brief update. Return ONLY JSON: { "emails": [{"subject": "...", "body": "..."}] } NO placeholder like [Name] or [Your Name]. Use 'Hi,' as greeting. Sign off with 'Best regards'`
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();
    if (!response.ok) return res.status(500).json({ error: data.error?.message || 'API failed' });

    const text = data.choices[0].message.content;
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const transporter = nodemailer.createTransport({
      host: smtp.host, port: Number(smtp.port),
      secure: Number(smtp.port) === 465,
      auth: { user: smtp.username, pass: smtp.password },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      requireTLS: Number(smtp.port) === 587,
      connectionTimeout: 30000, greetingTimeout: 30000
    });

    for (const email of parsed.emails) {
      await transporter.sendMail({
        from: `"${smtp.from_name}" <${smtp.from_email}>`,
        to: smtp.from_email,
        subject: email.subject,
        text: email.body.replace(/<[^>]+>/g, ''), // Plain text
        html: email.body, // HTML
        headers: {
          'X-Mailer': 'Microsoft Outlook 16.0',
          'X-Priority': '3',
          'X-MSMail-Priority': 'Normal',
          'Importance': 'Normal',
          'MIME-Version': '1.0'
        }
      });
      // Delay 2-4 seconds between warmup sends
      await new Promise(r => setTimeout(r, Math.floor(Math.random() * 2000) + 2000));
    }

    db.prepare('UPDATE smtp_accounts SET warmup_days=warmup_days+1, sent_today=sent_today+? WHERE id=?').run(parsed.emails.length, smtp.id);
    
    res.json({ success: true, sent: parsed.emails.length, day: smtp.warmup_days + 1 });
  } catch (err) {
    console.error('Warmup routing crash', err);
    res.status(500).json({ error: err.message });
  }
});

// --- CONTACT LISTS ---
app.get('/api/lists', requireAuth, (req, res) => {
  const lists = db.prepare(`
    SELECT l.*, (SELECT COUNT(*) FROM contacts c WHERE c.list_id = l.id) as contact_count 
    FROM contact_lists l WHERE l.user_id = ? ORDER BY l.created_at DESC
  `).all(req.user.id);
  res.json(lists);
});
app.get('/api/lists/:id', requireAuth, (req, res) => {
  const list = db.prepare('SELECT * FROM contact_lists WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!list) return res.status(404).json({ error: 'Not found' });
  res.json(list);
});
app.post('/api/lists', requireAuth, (req, res) => {
  const { name } = req.body;
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO contact_lists (id, user_id, name) VALUES (?, ?, ?)').run(id, req.user.id, name);
  logActivity('list_created', `List ${name} created`, req.user.id);
  res.json({ id, name, contact_count: 0 });
});
app.put('/api/lists/:id', requireAuth, (req, res) => {
  const result = db.prepare('UPDATE contact_lists SET name = ? WHERE id = ? AND user_id = ?').run(req.body.name, req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});
app.delete('/api/lists/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM contact_lists WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  logActivity('list_deleted', `List deleted`, req.user.id);
  res.json({ success: true });
});

// --- CONTACTS ---
app.get('/api/contacts', requireAuth, (req, res) => {
  const listId = req.query.list_id;
  let contacts = [];
  if (listId) {
    contacts = db.prepare(`
      SELECT c.* FROM contacts c 
      JOIN contact_lists cl ON c.list_id = cl.id 
      WHERE c.list_id = ? AND cl.user_id = ? ORDER BY c.created_at DESC
    `).all(listId, req.user.id);
  } else {
    contacts = db.prepare(`
      SELECT c.* FROM contacts c 
      JOIN contact_lists cl ON c.list_id = cl.id 
      WHERE cl.user_id = ? ORDER BY c.created_at DESC LIMIT 1000
    `).all(req.user.id);
  }
  res.json(contacts);
});
app.get('/api/contacts/:id', requireAuth, (req, res) => {
  const item = db.prepare(`
    SELECT c.* FROM contacts c 
    JOIN contact_lists cl ON c.list_id = cl.id 
    WHERE c.id = ? AND cl.user_id = ?
  `).get(req.params.id, req.user.id);
  if (!item) return res.status(404).json({ error: 'Not found' });
  res.json(item);
});
app.post('/api/contacts', requireAuth, (req, res) => {
  const { list_id, email, first_name, last_name, custom_fields } = req.body;
  const list = db.prepare('SELECT id FROM contact_lists WHERE id = ? AND user_id = ?').get(list_id, req.user.id);
  if (!list) return res.status(403).json({ error: 'Forbidden' });
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO contacts (id, list_id, email, first_name, last_name, custom_fields) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, list_id, email, first_name, last_name, custom_fields ? JSON.stringify(custom_fields) : null);
  // update contact count cache
  db.prepare('UPDATE contact_lists SET contact_count = (SELECT COUNT(*) FROM contacts WHERE list_id = ?) WHERE id = ?').run(list_id, list_id);
  res.json({ id });
});
app.put('/api/contacts/:id', requireAuth, (req, res) => {
  const { email, first_name, last_name, status, unsubscribed } = req.body;
  const isOwner = db.prepare(`SELECT 1 FROM contacts c JOIN contact_lists cl ON c.list_id = cl.id WHERE c.id = ? AND cl.user_id = ?`).get(req.params.id, req.user.id);
  if (!isOwner) return res.status(403).json({ error: 'Forbidden' });
  db.prepare('UPDATE contacts SET email=?, first_name=?, last_name=?, status=?, unsubscribed=? WHERE id=?')
    .run(email, first_name, last_name, status, unsubscribed ? 1 : 0, req.params.id);
  res.json({ success: true });
});
app.delete('/api/contacts/:id', requireAuth, (req, res) => {
  const contact = db.prepare('SELECT list_id, cl.user_id FROM contacts c JOIN contact_lists cl ON c.list_id = cl.id WHERE c.id = ?').get(req.params.id);
  if (contact && contact.user_id === req.user.id) {
    db.prepare('DELETE FROM contacts WHERE id = ?').run(req.params.id);
    db.prepare('UPDATE contact_lists SET contact_count = (SELECT COUNT(*) FROM contacts WHERE list_id = ?) WHERE id = ?').run(contact.list_id, contact.list_id);
  } else if (!contact || contact.user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
  res.json({ success: true });
});

app.post('/api/contacts/bulk', requireAuth, upload.single('file'), (req, res) => {
  console.log('[BULK] Route hit');
  console.log('[BULK] File:', req.file?.originalname);
  console.log('[BULK] list_id:', req.body?.list_id);

  const list_id = req.body.list_id;
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  if (!list_id) return res.status(400).json({ error: 'list_id required' });

  const list = db.prepare('SELECT id FROM contact_lists WHERE id = ? AND user_id = ?').get(list_id, req.user.id);
  if (!list) return res.status(403).json({ error: 'Forbidden' });

  const contacts = [];

  fs.createReadStream(req.file.path)
    .pipe(csvParser())
    .on('data', (row) => {
      console.log('[BULK] Row:', row);
      const email = row.email || row.Email || row.EMAIL;
      const name = row.name || row.Name || row.NAME || '';
      if (email && email.includes('@')) {
        contacts.push({ email: email.trim(), name: name.trim() });
      }
    })
    .on('end', () => {
      console.log('[BULK] Total contacts parsed:', contacts.length);
      try {
        const insert = db.prepare(
          'INSERT OR IGNORE INTO contacts (id, list_id, email, first_name, last_name, status) VALUES (?, ?, ?, ?, ?, ?)'
        );
        const insertMany = db.transaction((rows) => {
          for (const row of rows) {
            insert.run(crypto.randomUUID(), list_id, row.email, row.name, '', 'active');
          }
        });
        insertMany(contacts);

        // update count metadata
        db.prepare('UPDATE contact_lists SET contact_count = (SELECT COUNT(*) FROM contacts WHERE list_id = ?) WHERE id = ?').run(list_id, list_id);

        try { fs.unlinkSync(req.file.path); } catch (e) { }
        console.log('[BULK] Import complete:', contacts.length);
        res.json({ count: contacts.length, message: `${contacts.length} contacts imported successfully` });
      } catch (err) {
        console.error('[BULK] DB Error:', err);
        res.status(500).json({ error: err.message });
      }
    })
    .on('error', (err) => {
      console.error('[BULK] CSV Error:', err);
      res.status(500).json({ error: err.message });
    });
});

app.post('/api/upload', requireAuth, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file handled' });
  const url = `/uploads/${req.file.filename}`;
  res.json({ url, name: req.file.originalname });
});

// --- TEMPLATES ---
app.get('/api/templates', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM templates WHERE user_id = ? ORDER BY created_at DESC').all(req.user.id));
});
app.get('/api/templates/:id', requireAuth, (req, res) => {
  const template = db.prepare('SELECT * FROM templates WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!template) return res.status(404).json({ error: 'Not found' });
  res.json(template);
});
app.post('/api/templates', requireAuth, (req, res) => {
  const { name, subject, body } = req.body;
  const id = crypto.randomUUID();
  db.prepare('INSERT INTO templates (id, user_id, name, subject, body) VALUES (?, ?, ?, ?, ?)').run(id, req.user.id, name, subject, body);
  res.json({ id });
});
app.put('/api/templates/:id', requireAuth, (req, res) => {
  const { name, subject, body } = req.body;
  const result = db.prepare('UPDATE templates SET name=?, subject=?, body=? WHERE id=? AND user_id=?').run(name, subject, body, req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});
app.delete('/api/templates/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM templates WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// --- DRIP SEQUENCES ---

// List all drip campaigns with their steps grouped
app.get('/api/drip-sequences', requireAuth, (req, res) => {
  try {
    // Get all drip campaigns
    const dripCampaigns = db.prepare(
      'SELECT * FROM campaigns WHERE user_id=? AND is_drip=1 ORDER BY created_at DESC'
    ).all(req.user.id);
    
    // For each, get its steps
    const result = dripCampaigns.map(campaign => {
      const steps = db.prepare(
        'SELECT * FROM drip_sequences WHERE campaign_id=? ORDER BY step_order ASC'
      ).all(campaign.id);
      
      // Get smtp_ids
      const smtpIds = db.prepare(
        'SELECT smtp_id FROM campaign_smtp_map WHERE campaign_id=?'
      ).all(campaign.id).map(r => r.smtp_id);
      
      // Get stats
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as total_sent,
          SUM(CASE WHEN replied_at IS NOT NULL THEN 1 ELSE 0 END) as total_replied,
          SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as total_opened
        FROM send_logs WHERE campaign_id=?
      `).get(campaign.id) || {};

      return {
        ...campaign,
        steps,
        smtp_ids: smtpIds,
        stats: {
          total_sent: stats.total_sent || 0,
          total_replied: stats.total_replied || 0,
          total_opened: stats.total_opened || 0,
        }
      };
    });
    
    res.json(result);
  } catch (err) {
    console.error('[DRIP LIST]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Bulk create: creates a drip campaign + all steps in one call
app.post('/api/drip-sequences', requireAuth, (req, res) => {
  try {
    const { name, list_id, smtp_ids, stop_on_reply, steps } = req.body;
    
    if (!name || !list_id || !steps || steps.length === 0) {
      return res.status(400).json({ error: 'Name, list, and at least one step are required' });
    }
    
    const list = db.prepare('SELECT contact_count FROM contact_lists WHERE id=? AND user_id=?').get(list_id, req.user.id);
    if (!list) return res.status(403).json({ error: 'Valid contact list required' });
    
    const campaignId = crypto.randomUUID();
    
    // Create the backing campaign with is_drip=1
    db.prepare(`
      INSERT INTO campaigns (id, user_id, name, list_id, subject, body, delay_seconds, track_opens, total_contacts, is_drip, stop_on_reply, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, 1, ?, 'draft')
    `).run(
      campaignId, req.user.id, name, list_id,
      steps[0].subject || '', steps[0].body || '', 15,
      list.contact_count || 0, stop_on_reply !== false ? 1 : 0
    );
    
    // Link SMTP accounts
    if (smtp_ids && Array.isArray(smtp_ids)) {
      const insertSmtp = db.prepare('INSERT INTO campaign_smtp_map (campaign_id, smtp_id) VALUES (?, ?)');
      for (const sid of smtp_ids) {
        const validSmtp = db.prepare('SELECT id FROM smtp_accounts WHERE id=? AND user_id=?').get(sid, req.user.id);
        if (validSmtp) {
          try { insertSmtp.run(campaignId, sid); } catch (e) {}
        }
      }
    }
    
    // Insert all steps
    const insertStep = db.prepare(
      'INSERT INTO drip_sequences (id, campaign_id, step_order, delay_hours, subject, body) VALUES (?, ?, ?, ?, ?, ?)'
    );
    for (let i = 0; i < steps.length; i++) {
      insertStep.run(
        crypto.randomUUID(), campaignId, i + 1,
        i === 0 ? 0 : (steps[i].delay_hours || 24),
        steps[i].subject || '', steps[i].body || ''
      );
    }
    
    logActivity('drip_created', `Drip sequence "${name}" created with ${steps.length} steps`, req.user.id);
    res.json({ id: campaignId });
  } catch (err) {
    console.error('[DRIP CREATE]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Update an existing drip sequence (bulk save steps + meta)
app.put('/api/drip-sequences/:id', requireAuth, (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=? AND is_drip=1').get(campaignId, req.user.id);
    if (!campaign) return res.status(404).json({ error: 'Drip sequence not found' });
    
    const { name, list_id, smtp_ids, stop_on_reply, steps } = req.body;
    
    // Update campaign metadata
    db.prepare(`
      UPDATE campaigns SET name=?, list_id=?, stop_on_reply=?, subject=?, body=? WHERE id=?
    `).run(
      name || campaign.name, list_id || campaign.list_id,
      stop_on_reply !== false ? 1 : 0,
      steps?.[0]?.subject || campaign.subject, steps?.[0]?.body || campaign.body,
      campaignId
    );
    
    // Update list contact count
    if (list_id) {
      const list = db.prepare('SELECT contact_count FROM contact_lists WHERE id=? AND user_id=?').get(list_id, req.user.id);
      if (list) {
        db.prepare('UPDATE campaigns SET total_contacts=? WHERE id=?').run(list.contact_count || 0, campaignId);
      }
    }
    
    // Update SMTP map
    if (smtp_ids && Array.isArray(smtp_ids)) {
      db.prepare('DELETE FROM campaign_smtp_map WHERE campaign_id=?').run(campaignId);
      const insertSmtp = db.prepare('INSERT INTO campaign_smtp_map (campaign_id, smtp_id) VALUES (?, ?)');
      for (const sid of smtp_ids) {
        const validSmtp = db.prepare('SELECT id FROM smtp_accounts WHERE id=? AND user_id=?').get(sid, req.user.id);
        if (validSmtp) {
          try { insertSmtp.run(campaignId, sid); } catch (e) {}
        }
      }
    }
    
    // Replace all steps
    if (steps && steps.length > 0) {
      db.prepare('DELETE FROM drip_sequences WHERE campaign_id=?').run(campaignId);
      const insertStep = db.prepare(
        'INSERT INTO drip_sequences (id, campaign_id, step_order, delay_hours, subject, body) VALUES (?, ?, ?, ?, ?, ?)'
      );
      for (let i = 0; i < steps.length; i++) {
        insertStep.run(
          crypto.randomUUID(), campaignId, i + 1,
          i === 0 ? 0 : (steps[i].delay_hours || 24),
          steps[i].subject || '', steps[i].body || ''
        );
      }
    }
    
    res.json({ success: true });
  } catch (err) {
    console.error('[DRIP UPDATE]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Delete a drip sequence (campaign + all steps)
app.delete('/api/drip-sequences/:id', requireAuth, (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=? AND is_drip=1').get(campaignId, req.user.id);
    if (!campaign) return res.status(404).json({ error: 'Drip sequence not found' });
    
    db.prepare('DELETE FROM drip_sequences WHERE campaign_id=?').run(campaignId);
    db.prepare('DELETE FROM campaign_smtp_map WHERE campaign_id=?').run(campaignId);
    db.prepare('DELETE FROM send_logs WHERE campaign_id=?').run(campaignId);
    db.prepare('DELETE FROM campaigns WHERE id=?').run(campaignId);
    
    logActivity('drip_deleted', `Drip sequence "${campaign.name}" deleted`, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('[DRIP DELETE]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Start/Pause a drip sequence
app.post('/api/drip-sequences/:id/start', requireAuth, (req, res) => {
  try {
    const campaignId = req.params.id;
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=? AND is_drip=1').get(campaignId, req.user.id);
    if (!campaign) return res.status(404).json({ error: 'Drip sequence not found' });
    
    const newStatus = campaign.status === 'sending' ? 'paused' : 'sending';
    db.prepare('UPDATE campaigns SET status=?, started_at=COALESCE(started_at, CURRENT_TIMESTAMP) WHERE id=?').run(newStatus, campaignId);
    
    logActivity('drip_' + (newStatus === 'sending' ? 'started' : 'paused'), 
      `Drip sequence "${campaign.name}" ${newStatus === 'sending' ? 'started' : 'paused'}`, req.user.id);
    res.json({ success: true, status: newStatus });
  } catch (err) {
    console.error('[DRIP START]', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Get replied contacts for a campaign (for export)
app.get('/api/campaigns/:id/replied-contacts', requireAuth, (req, res) => {
  try {
    const campaign = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    
    const replied = db.prepare(`
      SELECT ct.email, ct.first_name, ct.last_name, ct.custom_fields,
             sl.replied_at, sl.sent_at, sl.opened_at
      FROM send_logs sl
      JOIN contacts ct ON sl.contact_id = ct.id
      WHERE sl.campaign_id = ? AND sl.replied_at IS NOT NULL
      ORDER BY sl.replied_at DESC
    `).all(req.params.id);
    
    // Fix timestamps
    const fixTs = (ts) => ts ? (ts.endsWith('Z') ? ts : ts + 'Z') : null;
    const fixed = replied.map(r => ({
      ...r,
      replied_at: fixTs(r.replied_at),
      sent_at: fixTs(r.sent_at),
      opened_at: fixTs(r.opened_at),
    }));
    
    res.json(fixed);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- CAMPAIGNS ---
app.get('/api/campaigns', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT * FROM campaigns WHERE user_id = ? AND (is_drip=0 OR is_drip IS NULL) ORDER BY created_at DESC').all(req.user.id));
});
app.get('/api/campaigns/:id', requireAuth, (req, res) => {
  const c = db.prepare('SELECT * FROM campaigns WHERE id = ? AND user_id = ?').get(req.params.id, req.user.id);
  if (!c) return res.status(404).json({ error: 'Not found' });
  res.json(c);
});
app.post('/api/campaigns', requireAuth, (req, res) => {
  const { name, list_id, subject, body, smtp_ids, delay_seconds, track_opens, track_clicks, attachment_urls, rotation_mode, status, scheduled_at, timezone } = req.body;
  const id = crypto.randomUUID();
  const list = db.prepare('SELECT contact_count FROM contact_lists WHERE id=? AND user_id=?').get(list_id, req.user.id);
  if (!list && list_id) return res.status(403).json({ error: 'Valid list required' });
  // If body is a visual template JSON, extract the rendered HTML
  let campaignBody = body || '';
  try {
    const parsed = JSON.parse(campaignBody);
    if (parsed.__html) campaignBody = parsed.__html;
  } catch {}
  // Convert scheduled_at from user's timezone to UTC
  const utcScheduledAt = scheduled_at ? convertToUTC(scheduled_at, timezone) : null;
  db.prepare(`
    INSERT INTO campaigns (id, user_id, name, list_id, subject, body, delay_seconds, track_opens, track_clicks, total_contacts, attachments, rotation_mode, status, scheduled_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, req.user.id, name, list_id, subject, campaignBody, delay_seconds || 15, 
    track_opens === false ? 0 : 1, track_clicks === false ? 0 : 1, 
    list ? list.contact_count : 0, JSON.stringify(attachment_urls || []), 
    rotation_mode || 'round_robin', status || 'draft', utcScheduledAt
  );

  if (smtp_ids && Array.isArray(smtp_ids)) {
    const insertSmtp = db.prepare('INSERT INTO campaign_smtp_map (campaign_id, smtp_id) VALUES (?, ?)');
    for (const sid of smtp_ids) {
      const validSmtp = db.prepare('SELECT id FROM smtp_accounts WHERE id=? AND user_id=?').get(sid, req.user.id);
      if (validSmtp) {
        try { insertSmtp.run(id, sid); } catch (e) {}
      }
    }
  }

  logActivity('campaign_created', `Campaign ${name} created`, req.user.id);
  res.json({ id });
});
app.put('/api/campaigns/:id', requireAuth, (req, res) => {
  const { name, subject, body: rawBody, smtp_ids, delay_seconds, attachment_urls, status, scheduled_at, timezone } = req.body;
  // If body is a visual template JSON, extract the rendered HTML
  let campaignBody = rawBody || '';
  try {
    const parsed = JSON.parse(campaignBody);
    if (parsed.__html) campaignBody = parsed.__html;
  } catch {}
  // Convert scheduled_at from user's timezone to UTC
  const utcScheduledAt = scheduled_at ? convertToUTC(scheduled_at, timezone) : null;
  const result = db.prepare(`
    UPDATE campaigns SET name=?, subject=?, body=?, delay_seconds=?, attachments=?, status=COALESCE(?, status), scheduled_at=? WHERE id=? AND user_id=?
  `).run(name, subject, campaignBody, delay_seconds, JSON.stringify(attachment_urls || []), status || null, utcScheduledAt, req.params.id, req.user.id);
  
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });

  if (smtp_ids && Array.isArray(smtp_ids)) {
    db.prepare('DELETE FROM campaign_smtp_map WHERE campaign_id=?').run(req.params.id);
    const insertSmtp = db.prepare('INSERT INTO campaign_smtp_map (campaign_id, smtp_id) VALUES (?, ?)');
    for (const sid of smtp_ids) {
      const validSmtp = db.prepare('SELECT id FROM smtp_accounts WHERE id=? AND user_id=?').get(sid, req.user.id);
      if (validSmtp) {
        try { insertSmtp.run(req.params.id, sid); } catch (e) {}
      }
    }
  }
  res.json({ success: true });
});
app.delete('/api/campaigns/:id', requireAuth, (req, res) => {
  const result = db.prepare('DELETE FROM campaigns WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// Campaign Actions
app.post('/api/campaigns/:id/start', requireAuth, (req, res) => {
  console.log('[START] Campaign ID:', req.params.id);
  console.log('[START] User ID:', req.user?.id);
  try {
    const c = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
    if (!c) return res.status(404).json({ error: 'Not found' });
    
    const smtps = db.prepare('SELECT smtp_id FROM campaign_smtp_map WHERE campaign_id=?').all(c.id);
    if (smtps.length === 0) return res.status(400).json({ error: 'No SMTP accounts assigned' });
    if (!c.list_id) return res.status(400).json({ error: 'No contact list assigned' });

    const total = db.prepare(`SELECT COUNT(*) as cnt FROM contacts WHERE list_id=? AND unsubscribed=0 AND status='active'`).get(c.list_id).cnt || 0;
    db.prepare(`UPDATE campaigns SET status='sending', started_at=CURRENT_TIMESTAMP, total_contacts=? WHERE id=?`).run(total, req.params.id);
    
    logActivity('campaign_start', `Campaign ${req.params.id} started`, req.user.id);
    res.json({ success: true, total_contacts: total });
  } catch(err) {
    console.error('[START] Error:', err.message);
    console.error('[START] Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaigns/:id/pause', requireAuth, (req, res) => {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id=? AND user_id=?'
    ).get(req.params.id, req.user.id);
    if (!campaign) return res.status(404).json({ error: 'Not found' });
    db.prepare(
      "UPDATE campaigns SET status='paused' WHERE id=?"
    ).run(req.params.id);
    logActivity('campaign_pause', `Campaign ${req.params.id} paused`, req.user.id);
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/campaigns/:id/analytics', requireAuth, (req, res) => {
  try {
    const campaign = db.prepare(
      'SELECT * FROM campaigns WHERE id=? AND user_id=?'
    ).get(req.params.id, req.user.id);
    if (!campaign) return res.status(404).json({ error: 'Not found' });

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total,
        SUM(CASE WHEN status != 'failed' THEN 1 ELSE 0 END) as sent,
        SUM(CASE WHEN status='failed' THEN 1 ELSE 0 END) as failed,
        SUM(CASE WHEN opened_at IS NOT NULL THEN 1 ELSE 0 END) as opened,
        SUM(CASE WHEN replied_at IS NOT NULL THEN 1 ELSE 0 END) as replied
      FROM send_logs WHERE campaign_id=?
    `).get(req.params.id) || {};

    const logs = db.prepare(`
      SELECT sl.id, sl.status, sl.error, sl.sent_at, 
             sl.opened_at, sl.replied_at,
             ct.email, ct.first_name as name
      FROM send_logs sl
      LEFT JOIN contacts ct ON sl.contact_id = ct.id
      WHERE sl.campaign_id = ?
      ORDER BY sl.sent_at DESC
    `).all(req.params.id);

    const sent = stats.sent || 0;
    const opened = stats.opened || 0;
    const replied = stats.replied || 0;

    // Fix timestamps with Z suffix for proper UTC interpretation
    const fixTimestamp = (ts) => ts ? (ts.endsWith('Z') ? ts : ts + 'Z') : null;
    const fixedLogs = (logs || []).map(log => ({
      ...log,
      sent_at: fixTimestamp(log.sent_at),
      opened_at: fixTimestamp(log.opened_at),
      replied_at: fixTimestamp(log.replied_at),
    }));

    res.json({
      campaign,
      stats: {
        total_contacts: campaign.total_contacts || 0,
        sent,
        failed: stats.failed || 0,
        opened,
        replied,
        open_rate: sent > 0 ? Math.round((opened/sent)*100) : 0,
        reply_rate: sent > 0 ? Math.round((replied/sent)*100) : 0
      },
      logs: fixedLogs
    });
  } catch(err) {
    console.error('[ANALYTICS]', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/campaigns/:id/resume', requireAuth, (req, res) => {
  db.prepare('UPDATE campaigns SET status="sending" WHERE id=? AND user_id=?').run(req.params.id, req.user.id);
  logActivity('campaign_resume', `Campaign ${req.params.id} resumed`, req.user.id);
  res.json({ success: true });
});
app.post('/api/campaigns/:id/clone', requireAuth, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id=? AND user_id=?').get(req.params.id, req.user.id);
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  const newId = crypto.randomUUID();
  db.prepare(`
    INSERT INTO campaigns (id, user_id, name, list_id, subject, body, delay_seconds, track_opens, total_contacts)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(newId, req.user.id, campaign.name + ' (Copy)', campaign.list_id, campaign.subject, campaign.body, campaign.delay_seconds, campaign.track_opens, campaign.total_contacts);
  logActivity('campaign_cloned', `Campaign ${campaign.name} cloned`, req.user.id);
  res.json({ id: newId });
});

// TEST SEND ENDPOINT
app.post('/api/campaigns/test-send', requireAuth, async (req, res) => {
  try {
    const { to, subject, body: rawBody, smtp_id } = req.body;
    const smtp = db.prepare('SELECT * FROM smtp_accounts WHERE id=? AND user_id=?').get(smtp_id, req.user.id);
    if (!smtp) return res.status(404).json({ error: 'SMTP not found' });

    // Extract __html from visual template JSON if needed
    let body = rawBody || '';
    try {
      const parsed = JSON.parse(body);
      if (parsed.__html) body = parsed.__html;
    } catch {}

    let pSubject = subject.replace(/\{\{name\}\}/g, 'Test User').replace(/\{\{first_name\}\}/g, 'Test').replace(/\{\{email\}\}/g, to).replace(/\{\{company\}\}/g, 'Test Company');
    let pBody = body.replace(/\{\{name\}\}/g, 'Test User').replace(/\{\{first_name\}\}/g, 'Test').replace(/\{\{email\}\}/g, to).replace(/\{\{company\}\}/g, 'Test Company');

    const transporter = nodemailer.createTransport({
      host: smtp.host, port: Number(smtp.port),
      secure: Number(smtp.port) === 465,
      auth: { user: smtp.username, pass: smtp.password },
      tls: { rejectUnauthorized: false, minVersion: 'TLSv1.2' },
      requireTLS: Number(smtp.port) === 587
    });

    await transporter.sendMail({
      from: `"${smtp.from_name}" <${smtp.from_email}>`,
      to,
      subject: pSubject,
      text: pBody.replace(/<[^>]*>?/gm, ''), 
      html: pBody,
      headers: {
        'X-Mailer': 'Microsoft Outlook 16.0',
        'X-Priority': '3',
        'X-MSMail-Priority': 'Normal',
        'Importance': 'Normal',
        'MIME-Version': '1.0'
      }
    });
    
    res.json({ success: true });
  } catch(err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/campaigns/:id/logs', requireAuth, (req, res) => {
  res.json(db.prepare('SELECT sl.* FROM send_logs sl JOIN campaigns c ON sl.campaign_id = c.id WHERE sl.campaign_id=? AND c.user_id=? ORDER BY sl.created_at DESC LIMIT 500').all(req.params.id, req.user.id));
});

// --- DASHBOARD AND ACTIVITIES ---
app.get('/api/activity', requireAuth, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT 
        sl.id,
        CASE 
          WHEN sl.replied_at IS NOT NULL OR sl.status = 'replied' THEN 'email_replied'
          WHEN sl.opened_at IS NOT NULL OR sl.status = 'opened' THEN 'email_opened'
          WHEN sl.status = 'failed' THEN 'email_failed'
          ELSE 'email_sent'
        END as action,
        COALESCE(sl.replied_at, sl.opened_at, sl.sent_at) as created_date,
        ct.email as contact_email,
        c.name as campaign_name
      FROM send_logs sl
      JOIN contacts ct ON sl.contact_id = ct.id
      JOIN campaigns c ON sl.campaign_id = c.id
      WHERE c.user_id = ?
      ORDER BY created_date DESC
      LIMIT 100
    `).all(req.user.id);
    // Ensure timestamps have 'Z' suffix for proper UTC interpretation in browser
    const fixedLogs = logs.map(log => ({
      ...log,
      created_date: log.created_date ? (log.created_date.endsWith('Z') ? log.created_date : log.created_date + 'Z') : null
    }));
    res.json(fixedLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/activity/replies', requireAuth, (req, res) => {
  try {
    const logs = db.prepare(`
      SELECT sl.id, sl.status, sl.replied_at, sl.campaign_id, ct.email as contact_email, c.name as campaign_name
      FROM send_logs sl
      JOIN contacts ct ON sl.contact_id = ct.id
      JOIN campaigns c ON sl.campaign_id = c.id
      WHERE (sl.replied_at IS NOT NULL OR sl.status='replied') AND c.user_id = ?
      ORDER BY sl.replied_at DESC
      LIMIT 20
    `).all(req.user.id);
    // Ensure timestamps have 'Z' suffix for proper UTC interpretation in browser
    const fixedLogs = logs.map(log => ({
      ...log,
      replied_at: log.replied_at ? (log.replied_at.endsWith('Z') ? log.replied_at : log.replied_at + 'Z') : null
    }));
    res.json(fixedLogs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/dashboard/stats', requireAuth, (req, res) => {
  console.log('[STATS] Fetching dashboard stats for User ID:', req.user?.id);
  try {
    const active_campaigns = db.prepare('SELECT COUNT(*) as c FROM campaigns WHERE status="sending" AND user_id=?').get(req.user.id).c || 0;
    const completed_campaigns = db.prepare('SELECT COUNT(*) as c FROM campaigns WHERE status="completed" AND user_id=?').get(req.user.id).c || 0;
    
    // Connect contacts to user through contact_lists
    const total_contacts = db.prepare(`
      SELECT COUNT(c.id) as c FROM contacts c 
      JOIN contact_lists cl ON c.list_id = cl.id 
      WHERE cl.user_id = ?
    `).get(req.user.id).c || 0;
    
    const total_smtp = db.prepare('SELECT COUNT(*) as c FROM smtp_accounts WHERE user_id=?').get(req.user.id).c || 0;

    const total_sent = db.prepare("SELECT SUM(sent_count) as c FROM campaigns WHERE user_id=?").get(req.user.id).c || 0;
    const total_opened = db.prepare("SELECT SUM(opened_count) as c FROM campaigns WHERE user_id=?").get(req.user.id).c || 0;
    const total_replied = db.prepare("SELECT SUM(replied_count) as c FROM campaigns WHERE user_id=?").get(req.user.id).c || 0;
    const total_failed = db.prepare("SELECT SUM(failed_count) as c FROM campaigns WHERE user_id=?").get(req.user.id).c || 0;

    const recent_campaigns = db.prepare("SELECT * FROM campaigns WHERE user_id=? ORDER BY created_at DESC LIMIT 5").all(req.user.id).map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      sent_count: c.sent_count,
      failed_count: c.failed_count,
      opened_count: c.opened_count,
      created_at: c.created_at
    }));

    res.json({
      total_sent,
      total_opened,
      total_replied,
      total_failed,
      active_campaigns,
      completed_campaigns,
      total_contacts,
      total_smtp,
      open_rate: total_sent > 0 ? (total_opened / total_sent) * 100 : 0,
      reply_rate: total_sent > 0 ? (total_replied / total_sent) * 100 : 0,
      recent_campaigns
    });
  } catch(err) {
    console.error('[STATS] Error:', err.message);
    console.error('[STATS] Stack:', err.stack);
    res.status(500).json({ error: err.message });
  }
});

// Add a catchall for serving Vite (if build exists)
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// --- AI CONTENT GENERATION ---
app.post('/api/ai/generate', requireAuth, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt required' });

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) return res.status(500).json({ error: 'GROQ_API_KEY not set' });

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [{
          role: 'user',
          content: `Generate a professional cold email for: "${prompt}". 
          Return ONLY valid JSON, no markdown, no extra text:
          {"subject": "subject here", "body": "email body here"}`
        }],
        temperature: 0.7,
        max_tokens: 1000
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({ error: data.error?.message || 'Groq API failed' });
    }

    const text = data.choices[0].message.content;
    const cleaned = text.replace(/```json|```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    res.json({ subject: parsed.subject, body: parsed.body });

  } catch (err) {
    console.error('[AI] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// --- IMAP REPLY CHECKER ---
const checkReplies = async () => {
  const smtps = db.prepare("SELECT * FROM smtp_accounts WHERE imap_host IS NOT NULL AND imap_host != ''").all();

  for (const smtp of smtps) {
    try {
      const client = new ImapFlow({
        host: smtp.imap_host,
        port: smtp.imap_port || 993,
        secure: true,
        auth: { user: smtp.username, pass: smtp.password },
        logger: false,
        tls: { rejectUnauthorized: false }
      });

      await client.connect();
      const lock = await client.getMailboxLock('INBOX');
      
      try {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        const messages = await client.search({ seen: false, since: sevenDaysAgo });

        for await (const msg of client.fetch(messages, { envelope: true })) {
          const fromEmail = msg.envelope.from?.[0]?.address;
          if (!fromEmail) continue;

          const log = db.prepare(`
            SELECT cl.id, cl.campaign_id, cl.opened_at
            FROM send_logs cl
            JOIN contacts ct ON cl.contact_id = ct.id
            WHERE ct.email = ? AND cl.replied_at IS NULL
            ORDER BY cl.sent_at DESC LIMIT 1
          `).get(fromEmail);

          if (log) {
            db.prepare("UPDATE send_logs SET replied_at = CURRENT_TIMESTAMP, opened_at = COALESCE(opened_at, CURRENT_TIMESTAMP) WHERE id = ?").run(log.id);
            db.prepare("UPDATE campaigns SET replied_count = replied_count + 1 WHERE id = ?").run(log.campaign_id);
            if (!log.opened_at) {
              db.prepare("UPDATE campaigns SET opened_count = opened_count + 1 WHERE id = ?").run(log.campaign_id);
            }
          }
        }
      } finally {
        lock.release();
      }
      await client.logout();
    } catch (err) {
      console.error(`[IMAP] Error for ${smtp.username}:`, err.message);
    }
  }
};
setInterval(checkReplies, 5 * 60 * 1000); // 5 mins

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
