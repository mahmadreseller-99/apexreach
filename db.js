import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = path.join(__dirname, process.env.DB_PATH || 'database.sqlite');
const db = new Database(dbPath);

// Enable foreign keys
db.pragma('foreign_keys = ON');
// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');

const initDb = () => {
  // Activity Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);


  // Users
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // SMTP Accounts
  db.exec(`
    CREATE TABLE IF NOT EXISTS smtp_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      host TEXT NOT NULL,
      port INTEGER DEFAULT 587,
      secure BOOLEAN DEFAULT 0,
      username TEXT NOT NULL,
      password TEXT NOT NULL,
      from_email TEXT NOT NULL,
      from_name TEXT,
      imap_host TEXT,
      imap_port INTEGER,
      daily_limit INTEGER DEFAULT 500,
      sent_today INTEGER DEFAULT 0,
      warmup_enabled BOOLEAN DEFAULT 0,
      warmup_days INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      last_error TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Contact Lists
  db.exec(`
    CREATE TABLE IF NOT EXISTS contact_lists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      contact_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Contacts
  db.exec(`
    CREATE TABLE IF NOT EXISTS contacts (
      id TEXT PRIMARY KEY,
      list_id TEXT NOT NULL,
      email TEXT NOT NULL,
      first_name TEXT,
      last_name TEXT,
      status TEXT DEFAULT 'active',
      custom_fields TEXT,
      unsubscribed BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(list_id) REFERENCES contact_lists(id) ON DELETE CASCADE
    );
  `);

  // Campaigns
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      list_id TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      attachments TEXT,
      status TEXT DEFAULT 'draft',
      rotation_mode TEXT DEFAULT 'round_robin',
      delay_seconds INTEGER DEFAULT 10,
      sent_count INTEGER DEFAULT 0,
      opened_count INTEGER DEFAULT 0,
      replied_count INTEGER DEFAULT 0,
      failed_count INTEGER DEFAULT 0,
      total_contacts INTEGER DEFAULT 0,
      last_smtp_index INTEGER DEFAULT 0,
      track_opens BOOLEAN DEFAULT 1,
      is_drip BOOLEAN DEFAULT 0,
      stop_on_reply BOOLEAN DEFAULT 1,
      scheduled_at DATETIME,
      started_at DATETIME,
      completed_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(list_id) REFERENCES contact_lists(id)
    );
  `);

  // Campaign SMTP Map
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaign_smtp_map (
      campaign_id TEXT NOT NULL,
      smtp_id TEXT NOT NULL,
      PRIMARY KEY (campaign_id, smtp_id)
    );
  `);

  // Send Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS send_logs (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      contact_id TEXT NOT NULL,
      smtp_id TEXT,
      message_id TEXT,
      status TEXT DEFAULT 'pending',
      error TEXT,
      retry_count INTEGER DEFAULT 0,
      sent_at DATETIME,
      opened_at DATETIME,
      replied_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE,
      FOREIGN KEY(contact_id) REFERENCES contacts(id) ON DELETE CASCADE
    );
  `);

  // Drip Sequences
  db.exec(`
    CREATE TABLE IF NOT EXISTS drip_sequences (
      id TEXT PRIMARY KEY,
      campaign_id TEXT NOT NULL,
      step_order INTEGER NOT NULL,
      delay_hours INTEGER DEFAULT 24,
      subject TEXT NOT NULL,
      body TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
    );
  `);

  // Templates
  db.exec(`
    CREATE TABLE IF NOT EXISTS templates (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      subject TEXT,
      body TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Activity Logs
  db.exec(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      user_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Automatic migrations for new columns
  const runMigration = (cmd) => { try { db.exec(cmd); } catch (e) { } };

  runMigration('ALTER TABLE smtp_accounts ADD COLUMN user_id TEXT');
  runMigration('ALTER TABLE smtp_accounts ADD COLUMN imap_host TEXT');
  runMigration('ALTER TABLE smtp_accounts ADD COLUMN imap_port INTEGER');
  runMigration('ALTER TABLE smtp_accounts ADD COLUMN warmup_enabled BOOLEAN DEFAULT 0');
  runMigration('ALTER TABLE smtp_accounts ADD COLUMN warmup_days INTEGER DEFAULT 0');
  runMigration('ALTER TABLE smtp_accounts ADD COLUMN last_error TEXT');

  runMigration('ALTER TABLE campaigns ADD COLUMN user_id TEXT');
  runMigration('ALTER TABLE campaigns ADD COLUMN attachments TEXT');
  runMigration('ALTER TABLE campaigns ADD COLUMN rotation_mode TEXT DEFAULT "round_robin"');
  runMigration('ALTER TABLE campaigns ADD COLUMN sent_count INTEGER DEFAULT 0');
  runMigration('ALTER TABLE campaigns ADD COLUMN last_smtp_index INTEGER DEFAULT 0');
  runMigration('ALTER TABLE campaigns ADD COLUMN started_at DATETIME');
  runMigration('ALTER TABLE campaigns ADD COLUMN is_drip BOOLEAN DEFAULT 0');
  runMigration('ALTER TABLE campaigns ADD COLUMN stop_on_reply BOOLEAN DEFAULT 1');

  runMigration('ALTER TABLE contact_lists ADD COLUMN user_id TEXT');
  runMigration('ALTER TABLE templates ADD COLUMN user_id TEXT');

  // Fix historic replies not tracked as opens
  try {
    db.prepare('UPDATE send_logs SET opened_at = COALESCE(opened_at, replied_at) WHERE replied_at IS NOT NULL').run();
    const allCampaigns = db.prepare('SELECT id FROM campaigns').all();
    for (const c of allCampaigns) {
      const opens = db.prepare('SELECT COUNT(*) as cnt FROM send_logs WHERE campaign_id=? AND opened_at IS NOT NULL').get(c.id).cnt || 0;
      db.prepare('UPDATE campaigns SET opened_count=? WHERE id=?').run(opens, c.id);
    }
  } catch (e) { }

  console.log('Database tables verified/created successfully.');
};

initDb();

export default db;
