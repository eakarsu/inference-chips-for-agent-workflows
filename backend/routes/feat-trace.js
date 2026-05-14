// Agent loop trace profiler — ingest agent-runtime traces and analyze the loop.
//
// Two-level model:
//   agent_traces       — header with totals
//   agent_trace_steps  — per-step rows with latency/memory/KV deltas
//
// Endpoints:
//   GET  /api/feat-trace/                       list trace headers (filter workflow_id, framework, chip_id)
//   GET  /api/feat-trace/:id                    full trace with steps
//   GET  /api/feat-trace/:id/bottlenecks        ranked bottleneck steps
//   POST /api/feat-trace/                       create trace + steps (atomic)
//   POST /api/feat-trace/:id/steps              append steps to an existing trace
//   PUT  /api/feat-trace/:id                    update trace header
//   DELETE /api/feat-trace/:id                  remove trace + steps

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { workflow_id, framework, chip_id } = req.query;
    const params = []; const where = [];
    if (workflow_id) { params.push(workflow_id); where.push(`t.workflow_id = $${params.length}`); }
    if (framework)   { params.push(framework);   where.push(`t.framework = $${params.length}`); }
    if (chip_id)     { params.push(chip_id);     where.push(`t.chip_id = $${params.length}`); }
    const sql = `
      SELECT t.*, w.name AS workflow_name, c.name AS chip_name,
             (SELECT COUNT(*) FROM agent_trace_steps WHERE trace_id = t.id) AS recorded_step_count
      FROM agent_traces t
      LEFT JOIN workflows w ON w.id = t.workflow_id
      LEFT JOIN chips c ON c.id = t.chip_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY t.recorded_at DESC
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const t = await pool.query(`
      SELECT t.*, w.name AS workflow_name, c.name AS chip_name, c.manufacturer
      FROM agent_traces t
      LEFT JOIN workflows w ON w.id = t.workflow_id
      LEFT JOIN chips c ON c.id = t.chip_id
      WHERE t.id = $1
    `, [id]);
    if (!t.rows[0]) return res.status(404).json({ error: 'not found' });
    const steps = await pool.query(
      'SELECT * FROM agent_trace_steps WHERE trace_id=$1 ORDER BY position ASC',
      [id]
    );
    // Per-type aggregations
    const byType = {};
    steps.rows.forEach(s => {
      const t = s.step_type || 'unknown';
      byType[t] = byType[t] || { type: t, count: 0, total_latency_ms: 0, total_kv_delta_mb: 0 };
      byType[t].count++;
      byType[t].total_latency_ms += Number(s.latency_ms || 0);
      byType[t].total_kv_delta_mb += Number(s.kv_delta_mb || 0);
    });
    const totalLatency = steps.rows.reduce((a, s) => a + Number(s.latency_ms || 0), 0);
    const breakdown = Object.values(byType).map(b => ({
      ...b,
      latency_pct: totalLatency > 0 ? +(100 * b.total_latency_ms / totalLatency).toFixed(1) : 0
    })).sort((a, b) => b.total_latency_ms - a.total_latency_ms);

    res.json({ trace: t.rows[0], steps: steps.rows, type_breakdown: breakdown, computed_total_latency_ms: +totalLatency.toFixed(1) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id/bottlenecks', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const steps = await pool.query(
      'SELECT * FROM agent_trace_steps WHERE trace_id=$1 ORDER BY latency_ms DESC NULLS LAST',
      [id]
    );
    const total = steps.rows.reduce((a, s) => a + Number(s.latency_ms || 0), 0) || 1;
    const ranked = steps.rows.map(s => ({
      ...s,
      latency_pct: +(100 * Number(s.latency_ms || 0) / total).toFixed(1)
    }));
    res.json({ trace_id: id, total_latency_ms: total, ranked });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const b = req.body || {};
    if (!b.trace_label) { await client.query('ROLLBACK'); return res.status(400).json({ error: 'trace_label required' }); }
    const headerRes = await client.query(
      `INSERT INTO agent_traces
       (workflow_id, chip_id, trace_label, framework, total_steps, total_latency_ms, total_tokens_in,
        total_tokens_out, kv_peak_gb, prompt_cache_hit_rate, notes, recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
      [b.workflow_id || null, b.chip_id || null, b.trace_label, b.framework || 'custom',
       b.total_steps || (b.steps ? b.steps.length : null), b.total_latency_ms || null,
       b.total_tokens_in || null, b.total_tokens_out || null, b.kv_peak_gb || null,
       b.prompt_cache_hit_rate || null, b.notes || null,
       b.recorded_at || new Date().toISOString().slice(0,10)]
    );
    const trace = headerRes.rows[0];
    const steps = Array.isArray(b.steps) ? b.steps : [];
    const insertedSteps = [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const stepRes = await client.query(
        `INSERT INTO agent_trace_steps
         (trace_id, position, step_name, step_type, latency_ms, memory_mb, tokens_in, tokens_out,
          kv_delta_mb, cache_hit, is_bottleneck, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [trace.id, s.position ?? i + 1, s.step_name || `step_${i+1}`, s.step_type || 'model_call',
         s.latency_ms || null, s.memory_mb || null, s.tokens_in || null, s.tokens_out || null,
         s.kv_delta_mb || null, !!s.cache_hit, !!s.is_bottleneck, s.notes || null]
      );
      insertedSteps.push(stepRes.rows[0]);
    }
    await client.query('COMMIT');
    res.status(201).json({ trace, steps: insertedSteps });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

router.post('/:id/steps', async (req, res) => {
  try {
    const trace_id = Number(req.params.id);
    const steps = Array.isArray(req.body?.steps) ? req.body.steps : [];
    if (!steps.length) return res.status(400).json({ error: 'steps array required' });
    const inserted = [];
    for (let i = 0; i < steps.length; i++) {
      const s = steps[i];
      const r = await pool.query(
        `INSERT INTO agent_trace_steps
         (trace_id, position, step_name, step_type, latency_ms, memory_mb, tokens_in, tokens_out,
          kv_delta_mb, cache_hit, is_bottleneck, notes)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING *`,
        [trace_id, s.position ?? null, s.step_name, s.step_type, s.latency_ms, s.memory_mb,
         s.tokens_in, s.tokens_out, s.kv_delta_mb, !!s.cache_hit, !!s.is_bottleneck, s.notes]
      );
      inserted.push(r.rows[0]);
    }
    res.status(201).json({ trace_id, added: inserted.length, steps: inserted });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE agent_traces SET
         workflow_id=COALESCE($2, workflow_id), chip_id=COALESCE($3, chip_id),
         trace_label=COALESCE($4, trace_label), framework=COALESCE($5, framework),
         total_steps=COALESCE($6, total_steps), total_latency_ms=COALESCE($7, total_latency_ms),
         total_tokens_in=COALESCE($8, total_tokens_in), total_tokens_out=COALESCE($9, total_tokens_out),
         kv_peak_gb=COALESCE($10, kv_peak_gb), prompt_cache_hit_rate=COALESCE($11, prompt_cache_hit_rate),
         notes=COALESCE($12, notes)
       WHERE id=$1 RETURNING *`,
      [id, b.workflow_id, b.chip_id, b.trace_label, b.framework, b.total_steps, b.total_latency_ms,
       b.total_tokens_in, b.total_tokens_out, b.kv_peak_gb, b.prompt_cache_hit_rate, b.notes]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM agent_traces WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
