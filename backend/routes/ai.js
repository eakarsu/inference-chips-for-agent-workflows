const router = require('express').Router();
const verifyToken = require("../middleware/auth");
const db = require('../db');

function aiUnavailable(res) {
  return res.status(503).json({ error: 'AI service unavailable. Set OPENROUTER_API_KEY in .env to enable AI features.' });
}

async function callAI(userPrompt, systemPrompt = '') {
  const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'http://localhost', 'X-Title': 'ChipProfiler' },
    body: JSON.stringify({ model: process.env.OPENROUTER_MODEL || 'anthropic/claude-haiku-4.5', messages: [...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []), { role: 'user', content: userPrompt }] })
  });
  return (await r.json()).choices?.[0]?.message?.content || 'AI unavailable';
}

function hasKey() {
  const k = process.env.OPENROUTER_API_KEY;
  return k && k.length > 0 && k !== 'your_openrouter_api_key_here';
}

async function logAudit(req, action, details) {
  try {
    await db.query(
      'INSERT INTO audit_log (user_id, user_email, action, details, created_at) VALUES ($1, $2, $3, $4, NOW())',
      [req.user?.id || null, req.user?.email || null, action, JSON.stringify(details || {})]
    );
  } catch (e) { /* swallow audit failures */ }
}

router.post('/chip-recommendation', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { workflow, requirements } = req.body;
  try {
    const result = await callAI(
      `Recommend the best inference chip for this agent workflow.\n\nWorkflow: ${JSON.stringify(workflow)}\nRequirements: ${JSON.stringify(requirements)}\n\nProvide:\n1. **Top Chip Recommendation** with specific model\n2. **Runner-Up Options** (2-3 alternatives)\n3. **Key Metrics** that drove the decision (latency, throughput, memory)\n4. **Architecture Rationale** - why this chip architecture fits\n5. **Cost-Performance Analysis** - ROI estimate`,
      'You are a GPU/AI chip architect specializing in LLM inference hardware selection for agentic AI systems.'
    );
    await logAudit(req, 'ai.chip-recommendation', { workflow_name: workflow?.name });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/bottleneck-analysis', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { workflow_steps } = req.body;
  try {
    const result = await callAI(
      `Analyze these workflow steps and identify hardware performance bottlenecks.\n\nWorkflow Steps: ${JSON.stringify(workflow_steps)}\n\nProvide:\n1. **Critical Bottleneck** - the single biggest performance limiter\n2. **Step-by-Step Analysis** - where time is spent\n3. **Memory Bandwidth vs Compute** - which is the binding constraint\n4. **Hardware Solutions** - specific chip features to address each bottleneck\n5. **Expected Speedup** - realistic improvement estimates`,
      'You are a computer architecture expert specializing in AI inference optimization.'
    );
    await logAudit(req, 'ai.bottleneck-analysis', { steps: workflow_steps?.length });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/performance-prediction', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { chip, workflow } = req.body;
  try {
    const result = await callAI(
      `Predict performance metrics for running this workflow on this chip.\n\nChip: ${JSON.stringify(chip)}\nWorkflow: ${JSON.stringify(workflow)}\n\nPredict:\n1. **Expected Latency** (p50, p95, p99)\n2. **Throughput** (requests/sec, tokens/sec)\n3. **Memory Utilization** (%)\n4. **Power Consumption** (W)\n5. **Bottleneck Prediction** - what will limit performance\n6. **Scaling Behavior** - how performance changes with batch size`,
      'You are an ML systems engineer with deep expertise in LLM serving infrastructure.'
    );
    await logAudit(req, 'ai.performance-prediction', { chip_name: chip?.name, workflow_name: workflow?.name });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

router.post('/architecture-design', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { use_case, scale } = req.body;
  try {
    const result = await callAI(
      `Design a custom chip architecture for this AI inference use case.\n\nUse Case: ${use_case}\nScale: ${scale}\n\nDesign:\n1. **Core Architecture** - compute units, memory hierarchy, interconnect\n2. **Specialized Features** - custom ops, accelerators needed\n3. **Memory Architecture** - HBM capacity, bandwidth requirements\n4. **Comparison to Existing Chips** - how it differs from H100, Groq LPU, etc.\n5. **Estimated Specs** - theoretical TOPS, bandwidth, power envelope\n6. **Development Timeline** - feasibility at different nodes (3nm, 5nm)`,
      'You are a chip architect specializing in custom silicon for AI inference workloads.'
    );
    await logAudit(req, 'ai.architecture-design', { use_case });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ===== NEW AI FEATURES (5) =====

// 1. Latency-vs-Cost Optimizer
router.post('/latency-cost-optimizer', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { workflow, candidate_chips, budget_usd, latency_target_ms } = req.body;
  try {
    const result = await callAI(
      `Find the optimal chip selection that balances latency and cost.\n\nWorkflow: ${JSON.stringify(workflow)}\nCandidate Chips: ${JSON.stringify(candidate_chips)}\nMonthly Budget (USD): ${budget_usd}\nLatency Target (ms): ${latency_target_ms}\n\nProvide:\n1. **Optimal Pick** - best chip and quantity for the budget/latency frontier\n2. **Pareto Frontier** - 3-4 alternative configurations trading latency vs cost\n3. **Cost Breakdown** - capex / opex / TCO over 3 years\n4. **Latency Margin** - how close to target each option lands\n5. **Risk Notes** - availability or vendor lock-in caveats`,
      'You are an FP&A engineer specializing in AI infrastructure cost-performance modeling.'
    );
    await logAudit(req, 'ai.latency-cost-optimizer', { budget_usd, latency_target_ms });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 2. Throughput Predictor
router.post('/throughput-predictor', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { chip, workflow, batch_sizes, concurrency } = req.body;
  try {
    const result = await callAI(
      `Predict sustained throughput across batch sizes and concurrency levels.\n\nChip: ${JSON.stringify(chip)}\nWorkflow: ${JSON.stringify(workflow)}\nBatch Sizes: ${JSON.stringify(batch_sizes)}\nConcurrency: ${concurrency}\n\nProvide:\n1. **Throughput Table** - tokens/sec and requests/sec per batch size\n2. **Saturation Point** - where throughput plateaus\n3. **Knee Analysis** - where efficiency starts to degrade\n4. **Memory Pressure** - KV-cache impact at each batch size\n5. **Recommended Operating Range** - sweet spot for production`,
      'You are an ML systems performance engineer modeling LLM serving throughput.'
    );
    await logAudit(req, 'ai.throughput-predictor', { chip_name: chip?.name });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 3. Energy-Efficiency Scorer
router.post('/energy-efficiency-scorer', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { chip, workflow, region } = req.body;
  try {
    const result = await callAI(
      `Score the energy efficiency of running this workload on this chip.\n\nChip: ${JSON.stringify(chip)}\nWorkflow: ${JSON.stringify(workflow)}\nDeployment Region: ${region}\n\nProvide:\n1. **Efficiency Score** (0-100) with rubric\n2. **Tokens per Watt** - estimated efficiency metric\n3. **Carbon Footprint** - kg CO2e per million inferences (use regional grid mix if known)\n4. **Comparison** - vs typical H100 baseline\n5. **Optimization Levers** - quantization, batching, voltage scaling impact\n6. **Sustainability Verdict** - is this a green choice?`,
      'You are a sustainable-AI engineer focused on power efficiency and carbon accounting for inference workloads.'
    );
    await logAudit(req, 'ai.energy-efficiency-scorer', { chip_name: chip?.name, region });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 4. Benchmark Comparison Narrator
router.post('/benchmark-narrator', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { benchmarks } = req.body;
  try {
    const result = await callAI(
      `Generate a narrative comparison of these benchmark results.\n\nBenchmarks: ${JSON.stringify(benchmarks)}\n\nProvide:\n1. **Headline Finding** - the single most important takeaway\n2. **Winners by Category** - latency leader, throughput leader, efficiency leader\n3. **Surprises** - unexpected results worth flagging\n4. **Apples-to-Apples Caveats** - methodology notes\n5. **Recommendation** - which chip wins for which workload class\n6. **Executive Summary** - 2 sentence takeaway`,
      'You are a benchmarking analyst writing for a CTO audience evaluating inference hardware.'
    );
    await logAudit(req, 'ai.benchmark-narrator', { benchmark_count: benchmarks?.length });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// 5. Vendor Risk Scorer
router.post('/vendor-risk-scorer', verifyToken, async (req, res) => {
  if (!hasKey()) return aiUnavailable(res);
  const { chip, deployment_horizon_years } = req.body;
  try {
    const result = await callAI(
      `Score the vendor and supply-chain risk of standardizing on this chip.\n\nChip: ${JSON.stringify(chip)}\nDeployment Horizon: ${deployment_horizon_years} years\n\nProvide:\n1. **Risk Score** (0-100, higher = riskier) with rubric\n2. **Supply Chain** - foundry, geopolitics, allocation pressure\n3. **Roadmap Risk** - vendor execution history, successor visibility\n4. **Lock-in Risk** - software ecosystem, portability, exit cost\n5. **Financial Risk** - vendor financial health, public/private status\n6. **Mitigations** - dual-source, abstraction layers, contract terms\n7. **Verdict** - safe / cautious / high-risk for the horizon`,
      'You are a procurement risk analyst specialized in AI silicon supply chains and vendor strategy.'
    );
    await logAudit(req, 'ai.vendor-risk-scorer', { chip_name: chip?.name, horizon: deployment_horizon_years });
    res.json({ result });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

module.exports = router;
