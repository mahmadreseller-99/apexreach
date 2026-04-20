import db from './db.js';

try {
  console.log('[DEBUG] Running start queries...');
  const c = db.prepare('SELECT * FROM campaigns LIMIT 1').get();
  if (c) {
      console.log('campaign', c.id);
      db.prepare('SELECT smtp_id FROM campaign_smtp_map WHERE campaign_id=?').all(c.id);
      db.prepare('SELECT COUNT(*) as cnt FROM contacts WHERE list_id=? AND unsubscribed=0 AND status="active"').get('some_list_id');
      console.log('Update statement: UPDATE campaigns SET status="sending", started_at=CURRENT_TIMESTAMP, total_contacts=? WHERE id=?');
      
      // Look for the activity table missing bug
      try {
        db.prepare('INSERT INTO activity_logs (id, type) VALUES (?, ?)').run('1', 'test');
      } catch (e) {
        console.error('[START] Log Activity Error:', e.message);
      }
  }

  console.log('\n[DEBUG] Running stats queries...');
  db.prepare('SELECT COUNT(*) as c FROM campaigns WHERE status="sending"').get();
  db.prepare('SELECT COUNT(*) as c FROM campaigns WHERE status="completed"').get();
  db.prepare('SELECT COUNT(*) as c FROM contacts').get();
  db.prepare('SELECT COUNT(*) as c FROM smtp_accounts').get();
  db.prepare("SELECT COUNT(*) as c FROM send_logs WHERE status='sent'").get();
  db.prepare("SELECT COUNT(*) as c FROM send_logs WHERE opened_at IS NOT NULL").get();
  db.prepare("SELECT COUNT(*) as c FROM send_logs WHERE replied_at IS NOT NULL").get();
  db.prepare("SELECT COUNT(*) as c FROM send_logs WHERE status='failed'").get();
  db.prepare("SELECT * FROM campaigns ORDER BY created_at DESC LIMIT 5").all();

  console.log('[DEBUG] Stat queries finished without errors.');

} catch (err) {
  console.error('\n[FATAL ERROR]', err.message);
}
