// Speculative decoding tuner — deep feature.
//
// Models the expected speedup of speculative decoding given:
//   gamma  = num_draft_tokens
//   alpha  = acceptance_rate (per-token probability)
//   c      = ratio of draft-model-cost vs target-model-cost per token
//
// Leviathan et al. 2023:  E[tokens per target verify step] = (1 - alpha^(gamma+1)) / (1 - alpha)
// Speedup ≈ E[tokens] / (1 + c*gamma)
//
// Endpoints:
//   GET  /api/feat-spec-decode/                    list configs
//   GET  /api/feat-spec-decode/by-chip             grouped by chip
//   GET  /api/feat-spec-decode/best                top speedups
//   POST /api/feat-spec-decode/simulate            run the math without DB write
//   POST /api/feat-spec-decode/                    create
//   PUT  /api/feat-spec-decode/:id                 update
//   DELETE /api/feat-spec-decode/:id               remove

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

function simulate({ acceptance_rate, num_draft_tokens, draft_cost_ratio, baseline_tokens_per_sec, prompt_caching_hit_rate }) {
  const alpha = Math.max(0, Math.min(1, Number(acceptance_rate || 0)));
  const gamma = Math.max(0, Math.floor(Number(num_draft_tokens || 0)));
  const c = Math.max(0, Number(draft_cost_ratio ?? 0.05));     // 1B/70B ≈ 0.014; default 0.05 conservative
  // Expected accepted tokens per verify step (geometric sum capped at gamma+1)
  let expectedTokens;
  if (alpha === 1) expectedTokens = gamma + 1;
  else expectedTokens = (1 - Math.pow(alpha, gamma + 1)) / (1 - alpha);
  // Cost per step = 1 target forward + gamma draft forwards
  const costPerStep = 1 + c * gamma;
  let speedup = expectedTokens / costPerStep;
  // Prompt-caching layered effect: hits roughly compound on prefill latency, modeled as 1 + 0.5 * hit_rate.
  const pHit = Math.max(0, Math.min(1, Number(prompt_caching_hit_rate ?? 0)));
  const cacheMultiplier = 1 + 0.5 * pHit;
  speedup *= cacheMultiplier;
  const baseTps = Number(baseline_tokens_per_sec || 0);
  const projectedTps = baseTps > 0 ? +(baseTps * speedup).toFixed(2) : null;
  return {
    alpha, gamma, draft_cost_ratio: c,
    expected_tokens_per_verify: +expectedTokens.toFixed(3),
    cost_per_step: +costPerStep.toFixed(3),
    cache_multiplier: +cacheMultiplier.toFixed(3),
    speedup: +speedup.toFixed(3),
    projected_tokens_per_sec: projectedTps
  };
}

router.get('/', async (req, res) => {
  try {
    const { chip_id, target_model, workload } = req.query;
    const params = []; const where = [];
    if (chip_id)      { params.push(chip_id);            where.push(`s.chip_id = $${params.length}`); }
    if (target_model) { params.push(`%${target_model}%`); where.push(`s.target_model ILIKE $${params.length}`); }
    if (workload)     { params.push(workload);           where.push(`s.workload = $${params.length}`); }
    const sql = `
      SELECT s.*, c.name AS chip_name, c.manufacturer
      FROM spec_decode_configs s
      LEFT JOIN chips c ON c.id = s.chip_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY s.speedup DESC NULLS LAST
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-chip', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT c.id AS chip_id, c.name AS chip_name, c.manufacturer,
             COUNT(s.id) AS config_count,
             AVG(s.speedup) AS avg_speedup,
             MAX(s.speedup) AS best_speedup,
             AVG(s.acceptance_rate) AS avg_acceptance
      FROM chips c
      LEFT JOIN spec_decode_configs s ON s.chip_id = c.id
      GROUP BY c.id, c.name, c.manufacturer
      HAVING COUNT(s.id) > 0
      ORDER BY best_speedup DESC NULLS LAST
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/best', async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit || 10), 50);
    const r = await pool.query(`
      SELECT s.*, c.name AS chip_name
      FROM spec_decode_configs s
      LEFT JOIN chips c ON c.id = s.chip_id
      ORDER BY s.speedup DESC NULLS LAST
      LIMIT $1
    `, [limit]);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/simulate', async (req, res) => {
  try {
    const body = req.body || {};
    const result = simulate(body);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.target_model) return res.status(400).json({ error: 'target_model required' });
    // Auto-fill speedup if not provided but baseline+spec given
    let speedup = b.speedup;
    if (speedup == null && b.baseline_tokens_per_sec && b.spec_tokens_per_sec) {
      speedup = +(Number(b.spec_tokens_per_sec) / Number(b.baseline_tokens_per_sec)).toFixed(2);
    }
    const r = await pool.query(
      `INSERT INTO spec_decode_configs
       (chip_id, target_model, draft_model, draft_params_b, num_draft_tokens, acceptance_rate,
        baseline_tokens_per_sec, spec_tokens_per_sec, speedup, extra_kv_mb, prompt_caching_hit_rate,
        workload, observed_at, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [b.chip_id, b.target_model, b.draft_model, b.draft_params_b, b.num_draft_tokens,
       b.acceptance_rate, b.baseline_tokens_per_sec, b.spec_tokens_per_sec, speedup,
       b.extra_kv_mb, b.prompt_caching_hit_rate, b.workload,
       b.observed_at || new Date().toISOString().slice(0,10), b.notes]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE spec_decode_configs SET
         chip_id=COALESCE($2, chip_id), target_model=COALESCE($3, target_model),
         draft_model=COALESCE($4, draft_model), draft_params_b=COALESCE($5, draft_params_b),
         num_draft_tokens=COALESCE($6, num_draft_tokens), acceptance_rate=COALESCE($7, acceptance_rate),
         baseline_tokens_per_sec=COALESCE($8, baseline_tokens_per_sec), spec_tokens_per_sec=COALESCE($9, spec_tokens_per_sec),
         speedup=COALESCE($10, speedup), extra_kv_mb=COALESCE($11, extra_kv_mb),
         prompt_caching_hit_rate=COALESCE($12, prompt_caching_hit_rate), workload=COALESCE($13, workload),
         notes=COALESCE($14, notes)
       WHERE id=$1 RETURNING *`,
      [id, b.chip_id, b.target_model, b.draft_model, b.draft_params_b, b.num_draft_tokens,
       b.acceptance_rate, b.baseline_tokens_per_sec, b.spec_tokens_per_sec, b.speedup,
       b.extra_kv_mb, b.prompt_caching_hit_rate, b.workload, b.notes]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM spec_decode_configs WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
