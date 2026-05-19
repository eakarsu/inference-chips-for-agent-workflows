// Custom Views — 4 endpoints for the "Chip Views" page
//   GET  /api/custom-views/chip-utilization-timeline   (VIZ)
//   GET  /api/custom-views/workload-performance-heatmap (VIZ)
//   GET  /api/custom-views/chip-spec-pdf?chip_id=...   (NON-VIZ, application/pdf)
//   GET/POST/PUT/DELETE /api/custom-views/scheduling-rules  (NON-VIZ CRUD)

const express = require('express');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const pool = require('../db');

router.use(verifyToken);

// ---- in-memory scheduling rules store (no schema mods) ----
let SCHED_RULES = [
  { id: 1, name: 'Prefer high KV cache for long-context loops', priority: 10,
    match_workload: 'long_context', target_chip_arch: 'TPU', min_kv_cache_gb: 32,
    max_latency_ms: 250, enabled: true,
    notes: 'Route agent loops with >8k context to high-KV chips' },
  { id: 2, name: 'Speculative decode for branchy tool calls', priority: 8,
    match_workload: 'tool_use', target_chip_arch: 'GPU', min_kv_cache_gb: 8,
    max_latency_ms: 120, enabled: true,
    notes: 'Use spec-decode chips when workflow has many short tool steps' },
  { id: 3, name: 'Low-TDP route for orchestration steps', priority: 5,
    match_workload: 'orchestration', target_chip_arch: 'CPU', min_kv_cache_gb: 0,
    max_latency_ms: 50, enabled: true,
    notes: 'CPU-bound orchestration shouldn\'t burn GPU power' }
];
let NEXT_RULE_ID = 4;

// ---------- 1) VIZ: chip utilization timeline ----------
// Returns per-chip series of utilization% across benchmark dates.
router.get('/chip-utilization-timeline', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT b.benchmark_date::text AS date,
             c.id AS chip_id, c.name AS chip_name, c.manufacturer,
             AVG(b.utilization_pct)::float AS utilization_pct,
             AVG(b.latency_ms)::float AS latency_ms
      FROM benchmarks b
      JOIN chips c ON c.id = b.chip_id
      WHERE b.benchmark_date IS NOT NULL AND b.utilization_pct IS NOT NULL
      GROUP BY b.benchmark_date, c.id, c.name, c.manufacturer
      ORDER BY b.benchmark_date ASC, c.name ASC
    `);
    const rows = r.rows;
    // pivot into per-chip series
    const seriesMap = new Map();
    const dateSet = new Set();
    rows.forEach(row => {
      dateSet.add(row.date);
      if (!seriesMap.has(row.chip_id)) {
        seriesMap.set(row.chip_id, {
          chip_id: row.chip_id, chip_name: row.chip_name,
          manufacturer: row.manufacturer, points: []
        });
      }
      seriesMap.get(row.chip_id).points.push({
        date: row.date,
        utilization_pct: +Number(row.utilization_pct).toFixed(2),
        latency_ms: row.latency_ms == null ? null : +Number(row.latency_ms).toFixed(1)
      });
    });
    const dates = Array.from(dateSet).sort();
    const series = Array.from(seriesMap.values());
    const avg_util = series.length
      ? +(series.reduce((a, s) => a + s.points.reduce((x, p) => x + p.utilization_pct, 0) / Math.max(s.points.length, 1), 0) / series.length).toFixed(2)
      : 0;
    res.json({
      view: 'chip-utilization-timeline',
      dates, series,
      summary: { chip_count: series.length, date_count: dates.length, avg_utilization_pct: avg_util }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- 2) VIZ: workload performance heatmap ----------
// Rows = workloads (workflow.focus_area or name), Cols = chips, value = avg speedup.
router.get('/workload-performance-heatmap', async (_req, res) => {
  try {
    const r = await pool.query(`
      SELECT COALESCE(w.use_case, w.agent_type, w.name, 'unknown') AS workload,
             c.id AS chip_id, c.name AS chip_name,
             AVG(b.speedup_factor)::float AS speedup,
             AVG(b.throughput_steps_per_sec)::float AS throughput,
             AVG(b.utilization_pct)::float AS utilization_pct,
             COUNT(*) AS sample_count
      FROM benchmarks b
      JOIN chips c ON c.id = b.chip_id
      JOIN workflows w ON w.id = b.workflow_id
      GROUP BY workload, c.id, c.name
      ORDER BY workload ASC, c.name ASC
    `);
    const workloads = Array.from(new Set(r.rows.map(x => x.workload))).sort();
    const chipMap = new Map();
    r.rows.forEach(x => { if (!chipMap.has(x.chip_id)) chipMap.set(x.chip_id, x.chip_name); });
    const chips = Array.from(chipMap.entries()).map(([id, name]) => ({ chip_id: id, chip_name: name }));
    const cells = r.rows.map(x => ({
      workload: x.workload, chip_id: x.chip_id, chip_name: x.chip_name,
      speedup: x.speedup == null ? null : +Number(x.speedup).toFixed(2),
      throughput: x.throughput == null ? null : +Number(x.throughput).toFixed(2),
      utilization_pct: x.utilization_pct == null ? null : +Number(x.utilization_pct).toFixed(2),
      sample_count: Number(x.sample_count)
    }));
    const speedups = cells.map(c => c.speedup).filter(v => v != null);
    res.json({
      view: 'workload-performance-heatmap',
      workloads, chips, cells,
      summary: {
        workload_count: workloads.length, chip_count: chips.length,
        cell_count: cells.length,
        min_speedup: speedups.length ? +Math.min(...speedups).toFixed(2) : 0,
        max_speedup: speedups.length ? +Math.max(...speedups).toFixed(2) : 0
      }
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- 3) NON-VIZ: chip spec PDF ----------
// Lightweight PDF (no pdfkit dep) — hand-rolled minimal PDF document.
router.get('/chip-spec-pdf', async (req, res) => {
  try {
    const chip_id = req.query.chip_id ? Number(req.query.chip_id) : null;
    let chip = null;
    if (chip_id) {
      const cr = await pool.query('SELECT * FROM chips WHERE id=$1', [chip_id]);
      chip = cr.rows[0] || null;
    }
    if (!chip) {
      const cr = await pool.query('SELECT * FROM chips ORDER BY id ASC LIMIT 1');
      chip = cr.rows[0] || null;
    }
    if (!chip) return res.status(404).json({ error: 'no chips available' });

    const lines = [
      'Chip Specification Sheet',
      '',
      `Name: ${chip.name || '-'}`,
      `Manufacturer: ${chip.manufacturer || '-'}`,
      `Architecture: ${chip.architecture || '-'}`,
      `Context switch (ns): ${chip.context_switch_ns ?? '-'}`,
      `KV cache (GB): ${chip.kv_cache_gb ?? '-'}`,
      `Speculative decode: ${chip.speculative_decode ? 'yes' : 'no'}`,
      `TDP (W): ${chip.tdp_watts ?? '-'}`,
      `Memory bandwidth (GB/s): ${chip.memory_bandwidth_gbps ?? '-'}`,
      `Compute (TOPS): ${chip.compute_tops ?? '-'}`,
      `Process node (nm): ${chip.process_node_nm ?? '-'}`,
      `Price (USD): ${chip.price_usd ?? '-'}`,
      `Availability: ${chip.availability || '-'}`,
      `Released: ${chip.released_date ? String(chip.released_date).slice(0,10) : '-'}`,
      '',
      'Generated by ChipProfiler Custom Views'
    ];

    // Build a minimal single-page PDF (Helvetica, 12pt).
    const escapeText = s => String(s).replace(/\\/g,'\\\\').replace(/\(/g,'\\(').replace(/\)/g,'\\)');
    let textBlock = 'BT /F1 12 Tf 50 760 Td 14 TL\n';
    lines.forEach((ln, i) => {
      textBlock += (i === 0 ? '' : 'T*\n') + `(${escapeText(ln)}) Tj\n`;
    });
    textBlock += 'ET';
    const contentStream = textBlock;
    const contentObj = `<< /Length ${Buffer.byteLength(contentStream, 'utf8')} >>\nstream\n${contentStream}\nendstream`;

    const objs = [
      '<< /Type /Catalog /Pages 2 0 R >>',
      '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
      '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
      contentObj,
      '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>'
    ];

    let pdf = '%PDF-1.4\n';
    const offsets = [];
    objs.forEach((o, i) => {
      offsets.push(Buffer.byteLength(pdf, 'utf8'));
      pdf += `${i+1} 0 obj\n${o}\nendobj\n`;
    });
    const xrefStart = Buffer.byteLength(pdf, 'utf8');
    pdf += `xref\n0 ${objs.length+1}\n0000000000 65535 f \n`;
    offsets.forEach(off => { pdf += String(off).padStart(10, '0') + ' 00000 n \n'; });
    pdf += `trailer\n<< /Size ${objs.length+1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="chip-${chip.id}-spec.pdf"`);
    res.send(Buffer.from(pdf, 'utf8'));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ---------- 4) NON-VIZ: scheduling rules CRUD ----------
router.get('/scheduling-rules', (_req, res) => {
  res.json({
    rules: SCHED_RULES.slice().sort((a, b) => b.priority - a.priority),
    count: SCHED_RULES.length
  });
});

router.post('/scheduling-rules', (req, res) => {
  const b = req.body || {};
  if (!b.name) return res.status(400).json({ error: 'name required' });
  const rule = {
    id: NEXT_RULE_ID++,
    name: String(b.name),
    priority: Number.isFinite(+b.priority) ? +b.priority : 5,
    match_workload: b.match_workload || 'any',
    target_chip_arch: b.target_chip_arch || 'any',
    min_kv_cache_gb: Number.isFinite(+b.min_kv_cache_gb) ? +b.min_kv_cache_gb : 0,
    max_latency_ms: Number.isFinite(+b.max_latency_ms) ? +b.max_latency_ms : 1000,
    enabled: b.enabled !== false,
    notes: b.notes || ''
  };
  SCHED_RULES.push(rule);
  res.status(201).json(rule);
});

router.put('/scheduling-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const rule = SCHED_RULES.find(r => r.id === id);
  if (!rule) return res.status(404).json({ error: 'not found' });
  const b = req.body || {};
  if (b.name !== undefined) rule.name = String(b.name);
  if (b.priority !== undefined) rule.priority = +b.priority;
  if (b.match_workload !== undefined) rule.match_workload = b.match_workload;
  if (b.target_chip_arch !== undefined) rule.target_chip_arch = b.target_chip_arch;
  if (b.min_kv_cache_gb !== undefined) rule.min_kv_cache_gb = +b.min_kv_cache_gb;
  if (b.max_latency_ms !== undefined) rule.max_latency_ms = +b.max_latency_ms;
  if (b.enabled !== undefined) rule.enabled = !!b.enabled;
  if (b.notes !== undefined) rule.notes = b.notes;
  res.json(rule);
});

router.delete('/scheduling-rules/:id', (req, res) => {
  const id = Number(req.params.id);
  const idx = SCHED_RULES.findIndex(r => r.id === id);
  if (idx === -1) return res.status(404).json({ error: 'not found' });
  const [removed] = SCHED_RULES.splice(idx, 1);
  res.json({ deleted: removed.id });
});

module.exports = router;
