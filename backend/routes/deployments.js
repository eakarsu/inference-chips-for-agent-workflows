const router = require('express').Router();
const db = require('../db');
const verifyToken = require('../middleware/auth');
router.get('/', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT d.*, c.name as chip_name FROM deployments d LEFT JOIN chips c ON d.chip_id = c.id ORDER BY d.id'); res.json(r.rows); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT d.*, c.name as chip_name FROM deployments d LEFT JOIN chips c ON d.chip_id = c.id WHERE d.id=$1', [req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { chip_id, customer, use_case, deployed_at, performance_score, cost_savings_pct, status, region, scale_units } = req.body;
  try { const r = await db.query('INSERT INTO deployments (chip_id,customer,use_case,deployed_at,performance_score,cost_savings_pct,status,region,scale_units) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *', [chip_id, customer, use_case, deployed_at||null, performance_score, cost_savings_pct, status||'active', region, scale_units]); res.status(201).json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { chip_id, customer, use_case, deployed_at, performance_score, cost_savings_pct, status, region, scale_units } = req.body;
  try { const r = await db.query('UPDATE deployments SET chip_id=$1,customer=$2,use_case=$3,deployed_at=$4,performance_score=$5,cost_savings_pct=$6,status=$7,region=$8,scale_units=$9 WHERE id=$10 RETURNING *', [chip_id, customer, use_case, deployed_at||null, performance_score, cost_savings_pct, status, region, scale_units, req.params.id]); if (!r.rows.length) return res.status(404).json({ error: 'Not found' }); res.json(r.rows[0]); } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM deployments WHERE id=$1', [req.params.id]); res.json({ success: true }); } catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
