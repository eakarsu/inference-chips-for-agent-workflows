const router = require('express').Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

// Lazy-create the audit_log table if missing (defensive — schema.sql also has it).
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS audit_log (
      id SERIAL PRIMARY KEY,
      user_id INTEGER,
      user_email VARCHAR(255),
      action VARCHAR(100),
      details TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

router.get('/', verifyToken, async (req, res) => {
  try {
    await ensureTable();
    const limit = Math.min(parseInt(req.query.limit) || 200, 1000);
    const action = req.query.action;
    const params = [];
    let where = '';
    if (action) { params.push(`%${action}%`); where = 'WHERE action ILIKE $1'; }
    params.push(limit);
    const r = await db.query(
      `SELECT * FROM audit_log ${where} ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    res.json(r.rows);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/', verifyToken, async (req, res) => {
  try {
    await ensureTable();
    const { action, details } = req.body;
    const r = await db.query(
      'INSERT INTO audit_log (user_id, user_email, action, details, created_at) VALUES ($1,$2,$3,$4,NOW()) RETURNING *',
      [req.user?.id || null, req.user?.email || null, action || 'manual', JSON.stringify(details || {})]
    );
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.delete('/', verifyToken, async (req, res) => {
  try {
    await ensureTable();
    await db.query('DELETE FROM audit_log');
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
