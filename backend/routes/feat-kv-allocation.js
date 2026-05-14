// KV-cache allocation tracker — deep feature.
//
// Real per-token KV math for transformer inference:
//   kv_bytes_per_token = 2 * num_layers * num_kv_heads * head_dim * dtype_bytes
//   total_kv_gb        = kv_bytes_per_token * context_length * concurrent_requests / 1e9
//
// Endpoints:
//   GET  /api/feat-kv-allocation/                       list rows (filter: chip_id, model_name)
//   GET  /api/feat-kv-allocation/by-chip                grouped by chip
//   GET  /api/feat-kv-allocation/headroom               does (context * batch) fit in HBM?
//   POST /api/feat-kv-allocation/compute                pure math (no DB write)
//   POST /api/feat-kv-allocation/                       create
//   PUT  /api/feat-kv-allocation/:id                    update
//   DELETE /api/feat-kv-allocation/:id                  remove

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

const DTYPE_BYTES = { fp32: 4, bf16: 2, fp16: 2, fp8: 1, int8: 1, int4: 0.5 };

function dtypeBytes(d) { return DTYPE_BYTES[(d || 'fp16').toLowerCase()] || 2; }

function computeKv({ num_layers, num_kv_heads, head_dim, dtype, context_length, concurrent_requests, reuse_across_steps }) {
  const bytesPerToken = 2 * Number(num_layers || 0) * Number(num_kv_heads || 0) * Number(head_dim || 0) * dtypeBytes(dtype);
  const totalTokens = Number(context_length || 0) * Number(concurrent_requests || 1);
  // If KV is reused across agent tool calls we model 60% effective sharing.
  const effectiveTokens = reuse_across_steps ? totalTokens * 0.4 : totalTokens;
  const kvBytes = bytesPerToken * effectiveTokens;
  return {
    bytes_per_token: bytesPerToken,
    bytes_per_token_mb: +(bytesPerToken / 1024 / 1024).toFixed(4),
    total_kv_bytes: kvBytes,
    total_kv_gb: +(kvBytes / 1e9).toFixed(2),
    effective_tokens: effectiveTokens,
    raw_tokens: totalTokens,
    reuse_factor_applied: reuse_across_steps ? 0.4 : 1
  };
}

router.get('/', async (req, res) => {
  try {
    const { chip_id, model_name } = req.query;
    const params = [];
    const where = [];
    if (chip_id)    { params.push(chip_id);             where.push(`kv.chip_id = $${params.length}`); }
    if (model_name) { params.push(`%${model_name}%`);   where.push(`kv.model_name ILIKE $${params.length}`); }
    const sql = `
      SELECT kv.*, c.name AS chip_name, c.manufacturer, c.memory_bandwidth_gbps,
             c.kv_cache_gb AS chip_hbm_gb
      FROM kv_allocations kv
      LEFT JOIN chips c ON c.id = kv.chip_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY kv.model_name, kv.chip_id, kv.recorded_at DESC
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows.map(row => ({
      ...row,
      computed: computeKv(row)
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-chip', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id AS chip_id, c.name AS chip_name, c.kv_cache_gb AS hbm_gb,
             COUNT(kv.id) AS allocation_count,
             COALESCE(AVG(kv.measured_kv_gb), 0) AS avg_kv_gb,
             COALESCE(MAX(kv.measured_kv_gb), 0) AS peak_kv_gb,
             COALESCE(AVG(kv.decode_tokens_per_sec), 0) AS avg_decode_tps
      FROM chips c
      LEFT JOIN kv_allocations kv ON kv.chip_id = c.id
      GROUP BY c.id, c.name, c.kv_cache_gb
      HAVING COUNT(kv.id) > 0
      ORDER BY peak_kv_gb DESC
    `);
    res.json(r.rows.map(row => ({
      ...row,
      headroom_gb: Math.max(Number(row.hbm_gb || 0) - Number(row.peak_kv_gb || 0), 0),
      utilization_pct: Number(row.hbm_gb) > 0 ? +(100 * Number(row.peak_kv_gb) / Number(row.hbm_gb)).toFixed(1) : 0
    })));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/headroom', async (req, res) => {
  try {
    const chip_id = Number(req.query.chip_id || 0);
    if (!chip_id) return res.status(400).json({ error: 'chip_id query param required' });
    const chip = await pool.query('SELECT * FROM chips WHERE id=$1', [chip_id]);
    if (!chip.rows[0]) return res.status(404).json({ error: 'chip not found' });
    const allocs = await pool.query('SELECT * FROM kv_allocations WHERE chip_id=$1 ORDER BY measured_kv_gb DESC', [chip_id]);
    const hbmGB = Number(chip.rows[0].kv_cache_gb || 0);
    const rows = allocs.rows.map(a => {
      const computed = computeKv(a);
      const fits = computed.total_kv_gb <= hbmGB;
      return {
        ...a, computed,
        fits, headroom_gb: +(hbmGB - computed.total_kv_gb).toFixed(2),
        utilization_pct: hbmGB > 0 ? +(100 * computed.total_kv_gb / hbmGB).toFixed(1) : 0
      };
    });
    res.json({ chip: chip.rows[0], hbm_gb: hbmGB, allocations: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/compute', async (req, res) => {
  try {
    const body = req.body || {};
    const computed = computeKv(body);
    // Bandwidth-bound decode throughput estimate (memory-bound):
    //   tokens/sec ≈ memory_bandwidth_GBps / kv_bytes_per_token-active
    // For decode each step touches KV for one token; bound is mem_BW / weight_bytes.
    let bw_bound_tps = null;
    if (body.chip_id) {
      const c = await pool.query('SELECT memory_bandwidth_gbps FROM chips WHERE id=$1', [body.chip_id]);
      const bw = Number(c.rows[0]?.memory_bandwidth_gbps || 0);
      const paramBytes = Number(body.model_params_b || 0) * 1e9 * dtypeBytes(body.dtype);
      if (bw > 0 && paramBytes > 0) bw_bound_tps = +((bw * 1e9) / paramBytes).toFixed(1);
    }
    res.json({ ...computed, bandwidth_bound_decode_tps: bw_bound_tps });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    const r = await pool.query(
      `INSERT INTO kv_allocations
       (chip_id, model_name, model_params_b, hidden_size, num_layers, num_kv_heads, head_dim,
        dtype, context_length, concurrent_requests, reuse_across_steps, measured_kv_gb,
        prefill_tokens_per_sec, decode_tokens_per_sec, notes, recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16) RETURNING *`,
      [b.chip_id, b.model_name, b.model_params_b, b.hidden_size, b.num_layers, b.num_kv_heads,
       b.head_dim, b.dtype, b.context_length, b.concurrent_requests, !!b.reuse_across_steps,
       b.measured_kv_gb, b.prefill_tokens_per_sec, b.decode_tokens_per_sec, b.notes,
       b.recorded_at || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json({ ...r.rows[0], computed: computeKv(r.rows[0]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE kv_allocations SET
         chip_id=COALESCE($2, chip_id), model_name=COALESCE($3, model_name),
         model_params_b=COALESCE($4, model_params_b), hidden_size=COALESCE($5, hidden_size),
         num_layers=COALESCE($6, num_layers), num_kv_heads=COALESCE($7, num_kv_heads),
         head_dim=COALESCE($8, head_dim), dtype=COALESCE($9, dtype),
         context_length=COALESCE($10, context_length), concurrent_requests=COALESCE($11, concurrent_requests),
         reuse_across_steps=COALESCE($12, reuse_across_steps), measured_kv_gb=COALESCE($13, measured_kv_gb),
         prefill_tokens_per_sec=COALESCE($14, prefill_tokens_per_sec), decode_tokens_per_sec=COALESCE($15, decode_tokens_per_sec),
         notes=COALESCE($16, notes)
       WHERE id=$1 RETURNING *`,
      [id, b.chip_id, b.model_name, b.model_params_b, b.hidden_size, b.num_layers, b.num_kv_heads,
       b.head_dim, b.dtype, b.context_length, b.concurrent_requests, b.reuse_across_steps,
       b.measured_kv_gb, b.prefill_tokens_per_sec, b.decode_tokens_per_sec, b.notes]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ ...r.rows[0], computed: computeKv(r.rows[0]) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM kv_allocations WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
