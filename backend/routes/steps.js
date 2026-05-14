const router = require('express').Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
router.get('/', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT s.*, w.name as workflow_name FROM steps s LEFT JOIN workflows w ON s.workflow_id = w.id ORDER BY s.workflow_id, s.position'); res.json(r.rows); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT s.*, w.name as workflow_name FROM steps s LEFT JOIN workflows w ON s.workflow_id = w.id WHERE s.id=$1', [req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { workflow_id, step_name, step_type, avg_duration_ms, memory_mb, is_bottleneck, is_io_bound, description, position } = req.body;
  try { const r = await db.query('INSERT INTO steps (workflow_id,step_name,step_type,avg_duration_ms,memory_mb,is_bottleneck,is_io_bound,description,position) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [workflow_id, step_name, step_type, avg_duration_ms, memory_mb, is_bottleneck||false, is_io_bound||false, description, position]); res.status(201).json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { workflow_id, step_name, step_type, avg_duration_ms, memory_mb, is_bottleneck, is_io_bound, description, position } = req.body;
  try { const r = await db.query('UPDATE steps SET workflow_id=$1,step_name=$2,step_type=$3,avg_duration_ms=$4,memory_mb=$5,is_bottleneck=$6,is_io_bound=$7,description=$8,position=$9 WHERE id=$10 RETURNING *', [workflow_id, step_name, step_type, avg_duration_ms, memory_mb, is_bottleneck, is_io_bound, description, position, req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM steps WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
