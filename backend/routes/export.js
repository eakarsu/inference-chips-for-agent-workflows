const router = require('express').Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');

const TABLES = {
  chips: 'SELECT * FROM chips ORDER BY id',
  workflows: 'SELECT * FROM workflows ORDER BY id',
  steps: 'SELECT s.*, w.name AS workflow_name FROM steps s LEFT JOIN workflows w ON s.workflow_id = w.id ORDER BY s.id',
  benchmarks: 'SELECT b.*, c.name AS chip_name, w.name AS workflow_name FROM benchmarks b LEFT JOIN chips c ON b.chip_id=c.id LEFT JOIN workflows w ON b.workflow_id=w.id ORDER BY b.id',
  deployments: 'SELECT d.*, c.name AS chip_name FROM deployments d LEFT JOIN chips c ON d.chip_id=c.id ORDER BY d.id',
  research: 'SELECT * FROM research ORDER BY id',
};

function escapeCsv(v) {
  if (v === null || v === undefined) return '';
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function rowsToCsv(rows) {
  if (!rows.length) return '';
  const cols = Object.keys(rows[0]);
  const header = cols.join(',');
  const body = rows.map(r => cols.map(c => escapeCsv(r[c])).join(',')).join('\n');
  return header + '\n' + body;
}

router.get('/:table', verifyToken, async (req, res) => {
  const sql = TABLES[req.params.table];
  if (!sql) return res.status(400).json({ error: 'Unknown table. Allowed: ' + Object.keys(TABLES).join(', ') });
  try {
    const r = await db.query(sql);
    const csv = rowsToCsv(r.rows);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${req.params.table}-${new Date().toISOString().slice(0, 10)}.csv"`);
    try {
      await db.query(
        'INSERT INTO audit_log (user_id, user_email, action, details, created_at) VALUES ($1,$2,$3,$4,NOW())',
        [req.user?.id || null, req.user?.email || null, 'export.csv', JSON.stringify({ table: req.params.table, rows: r.rows.length })]
      );
    } catch (_) { /* ignore */ }
    res.send(csv);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/', verifyToken, (req, res) => {
  res.json({ tables: Object.keys(TABLES) });
});

module.exports = router;
