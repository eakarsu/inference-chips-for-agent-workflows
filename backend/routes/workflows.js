const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");
router.get('/', verifyToken, async (req, res) => {
  try { res.json((await db.query('SELECT * FROM workflows ORDER BY id')).rows); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT * FROM workflows WHERE id=$1', [req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { name, description, agent_type, total_steps, avg_duration_ms, model_call_pct, tool_use_pct, memory_read_pct, cpu_compute_pct, complexity, use_case } = req.body;
  try { const r = await db.query('INSERT INTO workflows (name,description,agent_type,total_steps,avg_duration_ms,model_call_pct,tool_use_pct,memory_read_pct,cpu_compute_pct,complexity,use_case) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING *', [name, description, agent_type, total_steps, avg_duration_ms, model_call_pct, tool_use_pct, memory_read_pct, cpu_compute_pct, complexity, use_case]); res.status(201).json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { name, description, agent_type, total_steps, avg_duration_ms, model_call_pct, tool_use_pct, memory_read_pct, cpu_compute_pct, complexity, use_case } = req.body;
  try { const r = await db.query('UPDATE workflows SET name=$1,description=$2,agent_type=$3,total_steps=$4,avg_duration_ms=$5,model_call_pct=$6,tool_use_pct=$7,memory_read_pct=$8,cpu_compute_pct=$9,complexity=$10,use_case=$11 WHERE id=$12 RETURNING *', [name, description, agent_type, total_steps, avg_duration_ms, model_call_pct, tool_use_pct, memory_read_pct, cpu_compute_pct, complexity, use_case, req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM workflows WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
