// Compiler pass lab — track production compiler passes per chip+stack and their PPA impact.
//
// Endpoints:
//   GET  /api/feat-compiler-pass/                       list (filter chip_id, stack, category)
//   GET  /api/feat-compiler-pass/by-stack               grouped by stack (vLLM, TRT-LLM, etc.)
//   GET  /api/feat-compiler-pass/cumulative             apply passes in order and compute compounded speedup
//   GET  /api/feat-compiler-pass/categories             distinct categories with counts
//   GET  /api/feat-compiler-pass/:id
//   POST /api/feat-compiler-pass/                       create
//   PUT  /api/feat-compiler-pass/:id                    update
//   DELETE /api/feat-compiler-pass/:id                  remove

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { chip_id, stack, category, enabled_by_default } = req.query;
    const params = []; const where = [];
    if (chip_id)  { params.push(chip_id);  where.push(`p.chip_id = $${params.length}`); }
    if (stack)    { params.push(stack);    where.push(`p.stack = $${params.length}`); }
    if (category) { params.push(category); where.push(`p.category = $${params.length}`); }
    if (enabled_by_default != null) {
      params.push(enabled_by_default === 'true' || enabled_by_default === true);
      where.push(`p.enabled_by_default = $${params.length}`);
    }
    const sql = `
      SELECT p.*, c.name AS chip_name, c.manufacturer
      FROM compiler_passes p
      LEFT JOIN chips c ON c.id = p.chip_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY p.chip_id, p.stack, p.recorded_at
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/by-stack', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT stack, COUNT(*) AS pass_count,
             AVG(speedup) AS avg_speedup, MAX(speedup) AS max_speedup,
             AVG(memory_delta_pct) AS avg_memory_delta,
             COUNT(*) FILTER (WHERE enabled_by_default) AS default_count
      FROM compiler_passes
      GROUP BY stack
      ORDER BY avg_speedup DESC NULLS LAST
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/categories', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT category, COUNT(*) AS pass_count, AVG(speedup) AS avg_speedup
      FROM compiler_passes
      GROUP BY category
      ORDER BY avg_speedup DESC NULLS LAST
    `);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Cumulative pipeline: order passes by recorded_at within (chip,stack) and compound speedups.
// query: chip_id, stack — both required.
router.get('/cumulative', async (req, res) => {
  try {
    const chip_id = Number(req.query.chip_id || 0);
    const stack = String(req.query.stack || '');
    if (!chip_id || !stack) return res.status(400).json({ error: 'chip_id and stack query params required' });
    const r = await pool.query(`
      SELECT p.*, c.name AS chip_name
      FROM compiler_passes p
      LEFT JOIN chips c ON c.id = p.chip_id
      WHERE p.chip_id = $1 AND p.stack = $2
      ORDER BY p.recorded_at ASC
    `, [chip_id, stack]);
    let cumulative = 1.0;
    let memDelta = 0;
    const timeline = r.rows.map(row => {
      const sp = Number(row.speedup) || 1.0;
      cumulative *= sp;
      memDelta += Number(row.memory_delta_pct || 0);
      return {
        ...row,
        cumulative_speedup: +cumulative.toFixed(2),
        cumulative_memory_delta_pct: +memDelta.toFixed(1)
      };
    });
    res.json({
      chip_id, stack, pass_count: r.rows.length,
      final_cumulative_speedup: +cumulative.toFixed(2),
      final_memory_delta_pct: +memDelta.toFixed(1),
      timeline
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/:id', async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT p.*, c.name AS chip_name FROM compiler_passes p
      LEFT JOIN chips c ON c.id = p.chip_id WHERE p.id = $1
    `, [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.pass_name || !b.stack) return res.status(400).json({ error: 'pass_name and stack required' });
    let speedup = b.speedup;
    if (speedup == null && b.baseline_tokens_per_sec && b.optimized_tokens_per_sec) {
      speedup = +(Number(b.optimized_tokens_per_sec) / Number(b.baseline_tokens_per_sec)).toFixed(2);
    }
    const r = await pool.query(
      `INSERT INTO compiler_passes
       (chip_id, stack, pass_name, category, baseline_tokens_per_sec, optimized_tokens_per_sec, speedup,
        baseline_latency_p99_ms, optimized_latency_p99_ms, memory_delta_pct, enabled_by_default,
        description, reference, recorded_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14) RETURNING *`,
      [b.chip_id, b.stack, b.pass_name, b.category, b.baseline_tokens_per_sec, b.optimized_tokens_per_sec,
       speedup, b.baseline_latency_p99_ms, b.optimized_latency_p99_ms, b.memory_delta_pct,
       !!b.enabled_by_default, b.description, b.reference,
       b.recorded_at || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE compiler_passes SET
         chip_id=COALESCE($2, chip_id), stack=COALESCE($3, stack), pass_name=COALESCE($4, pass_name),
         category=COALESCE($5, category), baseline_tokens_per_sec=COALESCE($6, baseline_tokens_per_sec),
         optimized_tokens_per_sec=COALESCE($7, optimized_tokens_per_sec), speedup=COALESCE($8, speedup),
         baseline_latency_p99_ms=COALESCE($9, baseline_latency_p99_ms),
         optimized_latency_p99_ms=COALESCE($10, optimized_latency_p99_ms),
         memory_delta_pct=COALESCE($11, memory_delta_pct), enabled_by_default=COALESCE($12, enabled_by_default),
         description=COALESCE($13, description), reference=COALESCE($14, reference)
       WHERE id=$1 RETURNING *`,
      [id, b.chip_id, b.stack, b.pass_name, b.category, b.baseline_tokens_per_sec,
       b.optimized_tokens_per_sec, b.speedup, b.baseline_latency_p99_ms, b.optimized_latency_p99_ms,
       b.memory_delta_pct, b.enabled_by_default, b.description, b.reference]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM compiler_passes WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
