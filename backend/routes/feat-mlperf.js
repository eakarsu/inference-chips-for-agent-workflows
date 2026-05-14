// MLPerf inference results — real MLPerf-style server/offline scenario data.
//
// Endpoints:
//   GET  /api/feat-mlperf/                        list with filters (round, model_name, scenario, chip_id)
//   GET  /api/feat-mlperf/leaderboard             per-(model, scenario) leaderboard
//   GET  /api/feat-mlperf/efficiency              perf-per-watt and perf-per-accelerator rankings
//   GET  /api/feat-mlperf/round/:round            grouped by round
//   GET  /api/feat-mlperf/chip/:chip_id           all results for a chip
//   POST /api/feat-mlperf/                        create
//   PUT  /api/feat-mlperf/:id                     update
//   DELETE /api/feat-mlperf/:id                   remove

const express = require('express');
const router = express.Router();
const verifyToken = require("../middleware/auth");
const pool = require('../db');

router.use(verifyToken);

router.get('/', async (req, res) => {
  try {
    const { round, model_name, scenario, chip_id, division } = req.query;
    const params = []; const where = [];
    if (round)      { params.push(round);            where.push(`m.round = $${params.length}`); }
    if (model_name) { params.push(model_name);       where.push(`m.model_name = $${params.length}`); }
    if (scenario)   { params.push(scenario);         where.push(`m.scenario = $${params.length}`); }
    if (chip_id)    { params.push(chip_id);          where.push(`m.chip_id = $${params.length}`); }
    if (division)   { params.push(division);         where.push(`m.division = $${params.length}`); }
    const sql = `
      SELECT m.*, c.name AS chip_name, c.manufacturer, c.price_usd
      FROM mlperf_results m
      LEFT JOIN chips c ON c.id = m.chip_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY m.published_date DESC, m.model_name, m.scenario
    `;
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/leaderboard', async (req, res) => {
  try {
    const { model_name, scenario, round } = req.query;
    const params = []; const where = [];
    if (model_name) { params.push(model_name); where.push(`m.model_name = $${params.length}`); }
    if (scenario)   { params.push(scenario);   where.push(`m.scenario = $${params.length}`); }
    if (round)      { params.push(round);      where.push(`m.round = $${params.length}`); }
    const sql = `
      SELECT m.id, m.model_name, m.scenario, m.round, m.system_name, m.num_accelerators,
             m.result_value, m.perf_per_accelerator, m.latency_p99_ms, m.power_w, m.perf_per_watt,
             m.software_stack, m.submitter, m.published_date,
             c.id AS chip_id, c.name AS chip_name, c.manufacturer
      FROM mlperf_results m
      LEFT JOIN chips c ON c.id = m.chip_id
      ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
      ORDER BY m.model_name, m.scenario, m.perf_per_accelerator DESC NULLS LAST
    `;
    const r = await pool.query(sql, params);
    // Group leaderboard by (model_name, scenario)
    const groups = {};
    r.rows.forEach(row => {
      const key = `${row.model_name}__${row.scenario}`;
      groups[key] = groups[key] || { model_name: row.model_name, scenario: row.scenario, entries: [] };
      groups[key].entries.push(row);
    });
    res.json({ groups: Object.values(groups) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/efficiency', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT m.model_name, m.scenario, m.round,
             c.id AS chip_id, c.name AS chip_name, c.manufacturer, c.price_usd,
             m.result_value, m.perf_per_accelerator, m.perf_per_watt,
             m.power_w, m.num_accelerators,
             CASE WHEN c.price_usd IS NOT NULL AND c.price_usd > 0 AND m.perf_per_accelerator IS NOT NULL
                  THEN (m.perf_per_accelerator / c.price_usd) ELSE NULL END AS perf_per_dollar
      FROM mlperf_results m
      LEFT JOIN chips c ON c.id = m.chip_id
      WHERE m.perf_per_accelerator IS NOT NULL
      ORDER BY m.model_name, m.scenario, perf_per_dollar DESC NULLS LAST
    `);
    // Bucket into model/scenario buckets and rank.
    const buckets = {};
    r.rows.forEach(row => {
      const key = `${row.model_name}__${row.scenario}`;
      buckets[key] = buckets[key] || [];
      buckets[key].push(row);
    });
    const ranked = Object.entries(buckets).map(([key, list]) => ({
      bucket: key,
      model_name: list[0].model_name,
      scenario: list[0].scenario,
      ranked_by_perf_per_watt: [...list].sort((a, b) => Number(b.perf_per_watt) - Number(a.perf_per_watt)),
      ranked_by_perf_per_dollar: [...list].sort((a, b) => Number(b.perf_per_dollar) - Number(a.perf_per_dollar))
    }));
    res.json(ranked);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/round/:round', async (req, res) => {
  try {
    const round = req.params.round;
    const r = await pool.query(`
      SELECT m.*, c.name AS chip_name, c.manufacturer
      FROM mlperf_results m
      LEFT JOIN chips c ON c.id = m.chip_id
      WHERE m.round = $1
      ORDER BY m.model_name, m.scenario, m.perf_per_accelerator DESC NULLS LAST
    `, [round]);
    res.json({ round, count: r.rows.length, results: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/chip/:chip_id', async (req, res) => {
  try {
    const id = Number(req.params.chip_id);
    const r = await pool.query(`
      SELECT m.*, c.name AS chip_name
      FROM mlperf_results m
      LEFT JOIN chips c ON c.id = m.chip_id
      WHERE m.chip_id = $1
      ORDER BY m.published_date DESC
    `, [id]);
    res.json({ chip_id: id, count: r.rows.length, results: r.rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const b = req.body || {};
    if (!b.model_name || !b.scenario) return res.status(400).json({ error: 'model_name and scenario required' });
    // Derive perf_per_accelerator if not provided
    const perfPerAcc = b.perf_per_accelerator ?? (b.result_value && b.num_accelerators ? Number(b.result_value) / Number(b.num_accelerators) : null);
    const perfPerWatt = b.perf_per_watt ?? (b.result_value && b.power_w ? Number(b.result_value) / Number(b.power_w) : null);
    const r = await pool.query(
      `INSERT INTO mlperf_results
       (submission_id, round, division, category, chip_id, system_name, num_accelerators, model_name,
        scenario, metric, result_value, perf_per_accelerator, latency_p99_ms, power_w, perf_per_watt,
        software_stack, submitter, published_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING *`,
      [b.submission_id, b.round, b.division || 'closed', b.category || 'datacenter', b.chip_id,
       b.system_name, b.num_accelerators, b.model_name, b.scenario, b.metric,
       b.result_value, perfPerAcc, b.latency_p99_ms, b.power_w, perfPerWatt,
       b.software_stack, b.submitter, b.published_date || new Date().toISOString().slice(0,10)]
    );
    res.status(201).json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const b = req.body || {};
    const r = await pool.query(
      `UPDATE mlperf_results SET
         submission_id=COALESCE($2, submission_id), round=COALESCE($3, round),
         division=COALESCE($4, division), category=COALESCE($5, category),
         chip_id=COALESCE($6, chip_id), system_name=COALESCE($7, system_name),
         num_accelerators=COALESCE($8, num_accelerators), model_name=COALESCE($9, model_name),
         scenario=COALESCE($10, scenario), metric=COALESCE($11, metric),
         result_value=COALESCE($12, result_value), perf_per_accelerator=COALESCE($13, perf_per_accelerator),
         latency_p99_ms=COALESCE($14, latency_p99_ms), power_w=COALESCE($15, power_w),
         perf_per_watt=COALESCE($16, perf_per_watt), software_stack=COALESCE($17, software_stack),
         submitter=COALESCE($18, submitter), published_date=COALESCE($19, published_date)
       WHERE id=$1 RETURNING *`,
      [id, b.submission_id, b.round, b.division, b.category, b.chip_id, b.system_name,
       b.num_accelerators, b.model_name, b.scenario, b.metric, b.result_value,
       b.perf_per_accelerator, b.latency_p99_ms, b.power_w, b.perf_per_watt,
       b.software_stack, b.submitter, b.published_date]
    );
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json(r.rows[0]);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    const r = await pool.query('DELETE FROM mlperf_results WHERE id=$1 RETURNING id', [req.params.id]);
    if (!r.rows[0]) return res.status(404).json({ error: 'not found' });
    res.json({ deleted: r.rows[0].id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
