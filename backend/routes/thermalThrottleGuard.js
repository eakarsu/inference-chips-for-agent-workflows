const express = require('express');
const router = express.Router();

router.post('/score', (req, res) => {
  const watts = Number(req.body?.watts ?? 620);
  const tempC = Number(req.body?.temp_c ?? 84);
  const ambientC = Number(req.body?.ambient_c ?? 31);
  const utilization = Number(req.body?.utilization ?? 0.92);
  const hbmGb = Number(req.body?.hbm_gb ?? 128);
  const score = Math.min(100, Math.round((tempC - 65) * 2.2 + (ambientC - 22) * 1.4 + utilization * 25 + watts / 35 + hbmGb / 16));
  res.json({
    score,
    tier: score >= 80 ? 'throttle_imminent' : score >= 55 ? 'cooling_margin_low' : 'stable',
    recommendedClock: score >= 80 ? 'Reduce accelerator clock by 12% and rebalance KV cache shards.' : score >= 55 ? 'Shift bursty agent loops to cooler chips.' : 'No thermal action needed.',
    telemetry: { watts, tempC, ambientC, utilization, hbmGb },
  });
});

module.exports = router;
