const router = require('express').Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
router.get('/', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT b.*, c.name as chip_name, w.name as workflow_name FROM benchmarks b LEFT JOIN chips c ON b.chip_id = c.id LEFT JOIN workflows w ON b.workflow_id = w.id ORDER BY b.id'); res.json(r.rows); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT b.*, c.name as chip_name, w.name as workflow_name FROM benchmarks b LEFT JOIN chips c ON b.chip_id = c.id LEFT JOIN workflows w ON b.workflow_id = w.id WHERE b.id=$1', [req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { chip_id, workflow_id, utilization_pct, speedup_factor, throughput_steps_per_sec, latency_ms, power_efficiency, benchmark_date, test_environment, notes } = req.body;
  try { const r = await db.query('INSERT INTO benchmarks (chip_id,workflow_id,utilization_pct,speedup_factor,throughput_steps_per_sec,latency_ms,power_efficiency,benchmark_date,test_environment,notes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *', [chip_id, workflow_id, utilization_pct, speedup_factor, throughput_steps_per_sec, latency_ms, power_efficiency, benchmark_date, test_environment, notes]); res.status(201).json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { chip_id, workflow_id, utilization_pct, speedup_factor, throughput_steps_per_sec, latency_ms, power_efficiency, benchmark_date, test_environment, notes } = req.body;
  try { const r = await db.query('UPDATE benchmarks SET chip_id=$1,workflow_id=$2,utilization_pct=$3,speedup_factor=$4,throughput_steps_per_sec=$5,latency_ms=$6,power_efficiency=$7,benchmark_date=$8,test_environment=$9,notes=$10 WHERE id=$11 RETURNING *', [chip_id, workflow_id, utilization_pct, speedup_factor, throughput_steps_per_sec, latency_ms, power_efficiency, benchmark_date, test_environment, notes, req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM benchmarks WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
