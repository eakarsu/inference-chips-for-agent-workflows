const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");

router.get('/', verifyToken, async (req, res) => {
  try { res.json((await db.query('SELECT * FROM chips ORDER BY compute_tops DESC NULLS LAST')).rows); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.get('/:id', verifyToken, async (req, res) => {
  try { const r = await db.query('SELECT * FROM chips WHERE id=$1', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
router.post('/', verifyToken, async (req, res) => {
  const { name, manufacturer, architecture, context_switch_ns, kv_cache_gb, speculative_decode, tdp_watts, memory_bandwidth_gbps, compute_tops, process_node_nm, price_usd, availability, released_date } = req.body;
  try {
    const r = await db.query('INSERT INTO chips (name,manufacturer,architecture,context_switch_ns,kv_cache_gb,speculative_decode,tdp_watts,memory_bandwidth_gbps,compute_tops,process_node_nm,price_usd,availability,released_date) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *',
      [name, manufacturer, architecture, context_switch_ns, kv_cache_gb, speculative_decode||false, tdp_watts, memory_bandwidth_gbps, compute_tops, process_node_nm, price_usd, availability, released_date||null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.put('/:id', verifyToken, async (req, res) => {
  const { name, manufacturer, architecture, context_switch_ns, kv_cache_gb, speculative_decode, tdp_watts, memory_bandwidth_gbps, compute_tops, process_node_nm, price_usd, availability, released_date } = req.body;
  try {
    const r = await db.query('UPDATE chips SET name=$1,manufacturer=$2,architecture=$3,context_switch_ns=$4,kv_cache_gb=$5,speculative_decode=$6,tdp_watts=$7,memory_bandwidth_gbps=$8,compute_tops=$9,process_node_nm=$10,price_usd=$11,availability=$12,released_date=$13 WHERE id=$14 RETURNING *',
      [name, manufacturer, architecture, context_switch_ns, kv_cache_gb, speculative_decode, tdp_watts, memory_bandwidth_gbps, compute_tops, process_node_nm, price_usd, availability, released_date||null, req.params.id]);
    if (!r.rows.length) return res.status(404).json({ error: 'Not found' });
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
router.delete('/:id', verifyToken, async (req, res) => {
  try { await db.query('DELETE FROM chips WHERE id=$1', [req.params.id]); res.json({ success: true }); }
  catch (e) { res.status(500).json({ error: e.message }); }
});
module.exports = router;
