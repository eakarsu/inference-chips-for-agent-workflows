const router = require('express').Router();
const db = require('../db');
const verifyToken = require("../middleware/auth");

// Single JWT-protected endpoint that returns the KPI block plus a recent
// activity slice from audit_log. Each count is wrapped so a missing table
// (defensive) just returns 0 rather than 500-ing the whole dashboard.
async function safeCount(sql) {
  try {
    const r = await db.query(sql);
    return parseInt(r.rows[0].count, 10) || 0;
  } catch (_e) {
    return 0;
  }
}

router.get('/stats', verifyToken, async (_req, res) => {
  try {
    const [
      chips,
      workflows,
      benchmarks,
      deploymentsTotal,
      deploymentsActive,
      research,
      steps,
      auditTotal,
    ] = await Promise.all([
      safeCount('SELECT COUNT(*) FROM chips'),
      safeCount('SELECT COUNT(*) FROM workflows'),
      safeCount('SELECT COUNT(*) FROM benchmarks'),
      safeCount('SELECT COUNT(*) FROM deployments'),
      // "active" deployments — best-effort: try a status-like column, fall
      // back to total count if no such column exists.
      (async () => {
        try {
          const r = await db.query(
            "SELECT COUNT(*) FROM deployments WHERE status ILIKE 'active' OR status ILIKE 'production' OR status ILIKE 'live'"
          );
          return parseInt(r.rows[0].count, 10) || 0;
        } catch (_e) {
          return safeCount('SELECT COUNT(*) FROM deployments');
        }
      })(),
      safeCount('SELECT COUNT(*) FROM research'),
      safeCount('SELECT COUNT(*) FROM steps'),
      safeCount('SELECT COUNT(*) FROM audit_log'),
    ]);

    let recent = [];
    try {
      const r = await db.query(
        `SELECT id, user_email, action, details, created_at
         FROM audit_log
         ORDER BY created_at DESC
         LIMIT 10`
      );
      recent = r.rows;
    } catch (_e) {
      recent = [];
    }

    res.json({
      kpis: {
        chips_catalogued: chips,
        workflows_tracked: workflows,
        benchmarks_run: benchmarks,
        deployments_active: deploymentsActive,
        deployments_total: deploymentsTotal,
        research_papers: research,
        steps_profiled: steps,
        audit_events: auditTotal,
      },
      recent_activity: recent,
      generated_at: new Date().toISOString(),
    });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
