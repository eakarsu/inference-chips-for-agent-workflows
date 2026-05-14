const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");

// Cross-entity search + filter. Supports ?q=<text> and per-table ?availability= / ?complexity= / ?focus_area= filters.
router.get('/', verifyToken, async (req, res) => {
  const q = (req.query.q || '').trim();
  const like = `%${q}%`;
  const availability = req.query.availability;
  const complexity = req.query.complexity;
  const focusArea = req.query.focus_area;
  try {
    const out = {};

    // Chips
    {
      const params = [];
      const conds = [];
      if (q) { params.push(like, like, like); conds.push(`(name ILIKE $1 OR manufacturer ILIKE $2 OR architecture ILIKE $3)`); }
      if (availability) { params.push(availability); conds.push(`availability=$${params.length}`); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const r = await db.query(`SELECT id, name, manufacturer, architecture, availability, compute_tops FROM chips ${where} ORDER BY id LIMIT 100`, params);
      out.chips = r.rows;
    }

    // Workflows
    {
      const params = [];
      const conds = [];
      if (q) { params.push(like, like, like); conds.push(`(name ILIKE $1 OR description ILIKE $2 OR use_case ILIKE $3)`); }
      if (complexity) { params.push(complexity); conds.push(`complexity=$${params.length}`); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const r = await db.query(`SELECT id, name, description, agent_type, complexity, use_case FROM workflows ${where} ORDER BY id LIMIT 100`, params);
      out.workflows = r.rows;
    }

    // Steps
    {
      const params = [];
      const conds = [];
      if (q) { params.push(like, like); conds.push(`(step_name ILIKE $1 OR description ILIKE $2)`); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const r = await db.query(`SELECT id, step_name, step_type, avg_duration_ms, is_bottleneck, workflow_id FROM steps ${where} ORDER BY id LIMIT 100`, params);
      out.steps = r.rows;
    }

    // Deployments
    {
      const params = [];
      const conds = [];
      if (q) { params.push(like, like, like); conds.push(`(customer ILIKE $1 OR use_case ILIKE $2 OR region ILIKE $3)`); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const r = await db.query(`SELECT id, customer, use_case, region, status, performance_score FROM deployments ${where} ORDER BY id LIMIT 100`, params);
      out.deployments = r.rows;
    }

    // Research
    {
      const params = [];
      const conds = [];
      if (q) { params.push(like, like, like); conds.push(`(title ILIKE $1 OR findings ILIKE $2 OR chip_mentioned ILIKE $3)`); }
      if (focusArea) { params.push(focusArea); conds.push(`focus_area=$${params.length}`); }
      const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
      const r = await db.query(`SELECT id, title, focus_area, chip_mentioned, citations, breakthrough FROM research ${where} ORDER BY id LIMIT 100`, params);
      out.research = r.rows;
    }

    res.json(out);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
