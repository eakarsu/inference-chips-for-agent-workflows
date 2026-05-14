const router = require('express').Router();
const db = require('../db');
const { verifyToken } = require('../middleware/auth');

// Domain-realistic sample rows for inference chips & agent workflows.
// All inserts are JWT-protected. Returns { inserted, entity }.

const SAMPLES = {
  chips: [
    // [name, manufacturer, architecture, context_switch_ns, kv_cache_gb, speculative_decode, tdp_watts, memory_bandwidth_gbps, compute_tops, process_node_nm, price_usd, availability, released_date]
    ['H100 SXM5', 'NVIDIA', 'Hopper', 350, 80, true, 700, 3350, 1979, 4, 30000, 'available', '2022-09-20'],
    ['B200', 'NVIDIA', 'Blackwell', 280, 192, true, 1000, 8000, 4500, 4, 40000, 'limited', '2024-10-15'],
    ['MI300X', 'AMD', 'CDNA3', 420, 192, true, 750, 5300, 1307, 5, 15000, 'available', '2023-12-06'],
    ['LPU v2', 'Groq', 'Tensor Streaming Processor', 50, 0.23, false, 240, 80, 750, 14, 0, 'cloud_only', '2024-02-19'],
    ['WSE-3', 'Cerebras', 'Wafer-Scale Engine', 12, 44, false, 23000, 21000, 125000, 5, 0, 'cloud_only', '2024-03-13'],
    ['TPU v5p', 'Google', 'Systolic Array', 200, 95, false, 525, 2765, 459, 5, 0, 'cloud_only', '2023-12-06'],
    ['Trainium2', 'AWS', 'NeuronCore-v3', 310, 96, true, 500, 2900, 1300, 5, 0, 'cloud_only', '2024-12-03'],
    ['MTIA v2', 'Meta', 'Custom RISC-V', 290, 128, false, 90, 1024, 354, 5, 0, 'internal', '2024-04-10'],
    ['Sohu', 'Etched', 'Transformer ASIC', 80, 144, true, 450, 4500, 2000, 4, 0, 'upcoming', '2025-06-01'],
    ['MI325X', 'AMD', 'CDNA3', 400, 256, true, 1000, 6000, 1307, 5, 18000, 'available', '2024-10-10'],
  ],

  workflows: [
    // [name, description, agent_type, total_steps, avg_duration_ms, model_call_pct, tool_use_pct, memory_read_pct, cpu_compute_pct, complexity, use_case]
    ['RAG over technical docs', 'Retrieve-augmented Q&A on a 10M-token corpus with hybrid BM25+vector search', 'rag', 6, 1850, 55, 25, 15, 5, 'medium', 'support'],
    ['ReAct browser agent', 'ReAct-style web research agent with self-reflection', 'react', 14, 7400, 60, 30, 5, 5, 'high', 'research'],
    ['Multi-agent code review', 'Planner+critic+coder triad reviewing PRs with tool calls', 'multi-agent', 22, 12500, 70, 18, 8, 4, 'high', 'engineering'],
    ['Customer triage chain', 'Classify, route, and respond to inbound tickets', 'chain', 4, 950, 75, 5, 15, 5, 'low', 'support'],
    ['SQL analyst agent', 'NL-to-SQL with schema retrieval and result validation', 'react', 9, 3200, 50, 35, 10, 5, 'medium', 'analytics'],
    ['Tool-calling shopping agent', 'Multi-step e-commerce assistant calling pricing/inventory APIs', 'tool-use', 11, 4100, 45, 40, 10, 5, 'medium', 'commerce'],
    ['Long-context summarizer', 'Hierarchical map-reduce summarization of 200k-token transcripts', 'chain', 5, 5600, 88, 0, 10, 2, 'medium', 'productivity'],
    ['Voice agent (real-time)', 'Speech-in/speech-out conversational agent with streaming TTS', 'streaming', 8, 280, 60, 20, 10, 10, 'high', 'voice'],
    ['Autonomous research crew', 'Goal-directed multi-agent crew with planner/researcher/writer', 'multi-agent', 30, 28000, 65, 25, 7, 3, 'high', 'research'],
    ['Function-calling extractor', 'Structured-data extraction with JSON-schema validation', 'tool-use', 3, 620, 80, 12, 5, 3, 'low', 'etl'],
  ],

  steps: [
    // [workflow_id (resolved later), step_name, step_type, avg_duration_ms, memory_mb, is_bottleneck, is_io_bound, description, position]
    [null, 'Embed query', 'embedding', 45, 256, false, false, 'Compute query embedding via small encoder', 1],
    [null, 'Vector retrieve', 'retrieval', 120, 512, false, true, 'Top-50 ANN over FAISS index', 2],
    [null, 'Rerank passages', 'rerank', 220, 1024, false, false, 'Cross-encoder rerank', 3],
    [null, 'Decode answer', 'model_call', 1400, 24576, true, false, 'Long-context generation, primary bottleneck', 4],
    [null, 'Plan next action', 'model_call', 600, 12288, false, false, 'ReAct planner step', 5],
    [null, 'Browser tool call', 'tool_use', 1800, 128, true, true, 'Headless browser fetch + parse', 6],
    [null, 'Memory read', 'memory_read', 35, 64, false, true, 'Read scratchpad from Redis', 7],
    [null, 'Self-critique', 'model_call', 950, 18432, false, false, 'Critique-then-revise loop', 8],
    [null, 'Validate JSON', 'cpu_compute', 8, 8, false, false, 'Schema-check tool output', 9],
    [null, 'Stream TTS', 'tool_use', 60, 32, false, true, 'Real-time speech synthesis chunking', 10],
  ],

  benchmarks: [
    // [chip_id, workflow_id, utilization_pct, speedup_factor, throughput_steps_per_sec, latency_ms, power_efficiency, benchmark_date, test_environment, notes]
    [null, null, 78.5, 1.0, 142.3, 320, 0.203, '2024-09-15', 'DGX H100 8x, vLLM 0.5.2, fp8', 'Baseline H100 reference TPS/W'],
    [null, null, 82.1, 2.6, 369.7, 145, 0.370, '2024-11-20', 'B200 HGX node, TensorRT-LLM 0.13', 'Blackwell vs Hopper on Llama-70B'],
    [null, null, 91.0, 1.4, 198.4, 240, 0.265, '2024-08-02', 'MI300X 8x, ROCm 6.1, vLLM-fork', 'Strong on long-context KV cache'],
    [null, null, 95.4, 4.8, 682.1, 38, 2.842, '2024-10-08', 'Groq cloud, batch=1, Llama-8B', 'Per-token latency leadership'],
    [null, null, 88.7, 6.2, 850.0, 22, 0.037, '2024-07-19', 'Cerebras CS-3, single-wafer', 'Massive throughput, high TDP'],
    [null, null, 73.2, 1.1, 156.0, 290, 0.297, '2024-06-11', 'TPU v5p pod-32, JAX/Pallas', 'XLA-compiled ReAct loop'],
    [null, null, 80.0, 1.3, 175.6, 260, 0.351, '2024-12-10', 'Trn2 trn2.48xlarge, Neuron SDK 2.20', 'Cost-efficient on AWS'],
    [null, null, 68.9, 1.2, 88.4, 410, 0.982, '2024-05-22', 'MTIA v2 internal cluster', 'Specialized for ranking workloads'],
    [null, null, 84.5, 3.1, 412.0, 95, 0.916, '2025-01-14', 'Sohu eval rig (sim)', 'Transformer-only ASIC projection'],
    [null, null, 86.2, 1.6, 215.3, 210, 0.215, '2024-11-30', 'MI325X 8x, ROCm 6.2', '256GB HBM3E enables larger models'],
  ],

  deployments: [
    // [chip_id, customer, use_case, deployed_at, performance_score, cost_savings_pct, status, region, scale_units]
    [null, 'Anthropic (AWS)', 'Claude inference fleet on Trainium2', '2024-12-15', 9.1, 38, 'production', 'us-east-1', 4096],
    [null, 'Perplexity', 'Search-grounded RAG on Groq LPU', '2024-04-22', 9.4, 55, 'production', 'us-west-2', 512],
    [null, 'Mistral', 'Mixtral serving on H100', '2024-02-10', 8.7, 0, 'production', 'eu-west-3', 1024],
    [null, 'Meta Internal', 'Ads ranking on MTIA v2', '2024-06-30', 8.2, 42, 'production', 'us-central1', 8192],
    [null, 'OpenAI (Azure)', 'GPT-class training+serving on H100', '2023-11-01', 9.0, 0, 'production', 'eastus2', 25000],
    [null, 'Character.AI', 'Custom serving stack on H100', '2024-03-18', 8.6, 33, 'production', 'us-west-2', 768],
    [null, 'Cohere', 'Enterprise RAG on MI300X (GCP)', '2024-09-04', 8.4, 28, 'pilot', 'us-central1', 256],
    [null, 'xAI', 'Grok training on H100/B200 hybrid', '2024-10-28', 9.2, 0, 'production', 'us-east-1', 100000],
    [null, 'Snowflake Cortex', 'Inline LLM functions on H100', '2024-05-12', 8.3, 25, 'production', 'us-west-2', 384],
    [null, 'Box AI', 'Document understanding on TPU v5p', '2024-08-19', 8.0, 31, 'production', 'us-central1', 192],
  ],

  research: [
    // [title, focus_area, findings, chip_mentioned, published_date, citations, journal, breakthrough]
    ['FlashAttention-3: Async on Hopper', 'attention', 'Up to 2x faster attention via warp-specialization on H100 Tensor Cores', 'NVIDIA H100', '2024-07-12', 218, 'arXiv', true],
    ['vLLM PagedAttention', 'serving', 'KV cache paging cuts memory waste by 4x for high-concurrency serving', 'NVIDIA H100', '2023-09-12', 1140, 'SOSP', true],
    ['Speculative Decoding: A Survey', 'decoding', '2-3x token-rate gains across mainstream inference chips with draft+verify', 'NVIDIA B200', '2024-04-30', 96, 'arXiv', false],
    ['Groq LPU Architecture Note', 'hardware', 'Deterministic single-core compiler-scheduled execution beats batch=1 latency', 'Groq LPU', '2024-02-19', 47, 'Groq Whitepapers', true],
    ['Wafer-Scale Inference', 'hardware', 'Single-wafer integration removes inter-chip comm bottleneck for 70B+ models', 'Cerebras WSE-3', '2024-03-25', 33, 'IEEE Micro', true],
    ['ReAct: Reasoning + Acting', 'agent-workflow', 'Interleaving thought and action improves tool-use task accuracy by 34%', 'NVIDIA A100', '2022-10-06', 3210, 'ICLR', true],
    ['Multi-Agent Debate', 'agent-workflow', 'Debate among LLM agents improves factuality and reasoning', 'NVIDIA H100', '2023-05-23', 612, 'arXiv', false],
    ['FP8 for LLM Inference', 'quantization', 'FP8 on Hopper preserves quality with ~2x throughput vs BF16', 'NVIDIA H100', '2024-01-10', 184, 'MLSys', false],
    ['MI300X Long-Context Study', 'hardware', '192GB HBM3 yields 2.4x larger context windows without sharding', 'AMD MI300X', '2024-06-04', 58, 'arXiv', false],
    ['Transformer ASIC Economics', 'hardware', 'Fixed-function transformer chips offer 5-8x perf/$ over GPUs at scale', 'Etched Sohu', '2024-08-15', 21, 'arXiv', false],
  ],
};

const ENTITIES = Object.keys(SAMPLES);

async function getRandomId(table) {
  const r = await db.query(`SELECT id FROM ${table} ORDER BY RANDOM() LIMIT 1`);
  return r.rows.length ? r.rows[0].id : null;
}

router.post('/sample-data/:entity', verifyToken, async (req, res) => {
  const entity = req.params.entity;
  if (!ENTITIES.includes(entity)) {
    return res.status(400).json({ error: `Unknown entity '${entity}'. Valid: ${ENTITIES.join(', ')}` });
  }
  const rows = SAMPLES[entity];

  try {
    let inserted = 0;

    if (entity === 'chips') {
      for (const r of rows) {
        await db.query(
          `INSERT INTO chips (name,manufacturer,architecture,context_switch_ns,kv_cache_gb,speculative_decode,tdp_watts,memory_bandwidth_gbps,compute_tops,process_node_nm,price_usd,availability,released_date)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)`,
          r
        );
        inserted++;
      }
    } else if (entity === 'workflows') {
      for (const r of rows) {
        await db.query(
          `INSERT INTO workflows (name,description,agent_type,total_steps,avg_duration_ms,model_call_pct,tool_use_pct,memory_read_pct,cpu_compute_pct,complexity,use_case)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
          r
        );
        inserted++;
      }
    } else if (entity === 'steps') {
      // Ensure at least one workflow exists; if none, create a fallback.
      let wfId = await getRandomId('workflows');
      if (!wfId) {
        const wf = await db.query(
          `INSERT INTO workflows (name,description,agent_type,total_steps,avg_duration_ms,model_call_pct,tool_use_pct,memory_read_pct,cpu_compute_pct,complexity,use_case)
           VALUES ('Sample RAG workflow','Auto-created for sample steps','rag',10,2000,60,20,15,5,'medium','support') RETURNING id`
        );
        wfId = wf.rows[0].id;
      }
      for (const r of rows) {
        const targetWf = await getRandomId('workflows');
        await db.query(
          `INSERT INTO steps (workflow_id,step_name,step_type,avg_duration_ms,memory_mb,is_bottleneck,is_io_bound,description,position)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [targetWf || wfId, r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]]
        );
        inserted++;
      }
    } else if (entity === 'benchmarks') {
      const chipId = await getRandomId('chips');
      const wfId = await getRandomId('workflows');
      if (!chipId || !wfId) {
        return res.status(400).json({ error: 'benchmarks require existing chips and workflows. Insert those first.' });
      }
      for (const r of rows) {
        const c = await getRandomId('chips');
        const w = await getRandomId('workflows');
        await db.query(
          `INSERT INTO benchmarks (chip_id,workflow_id,utilization_pct,speedup_factor,throughput_steps_per_sec,latency_ms,power_efficiency,benchmark_date,test_environment,notes)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
          [c || chipId, w || wfId, r[2], r[3], r[4], r[5], r[6], r[7], r[8], r[9]]
        );
        inserted++;
      }
    } else if (entity === 'deployments') {
      const chipId = await getRandomId('chips');
      if (!chipId) {
        return res.status(400).json({ error: 'deployments require an existing chip. Insert chips first.' });
      }
      for (const r of rows) {
        const c = await getRandomId('chips');
        await db.query(
          `INSERT INTO deployments (chip_id,customer,use_case,deployed_at,performance_score,cost_savings_pct,status,region,scale_units)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
          [c || chipId, r[1], r[2], r[3], r[4], r[5], r[6], r[7], r[8]]
        );
        inserted++;
      }
    } else if (entity === 'research') {
      for (const r of rows) {
        await db.query(
          `INSERT INTO research (title,focus_area,findings,chip_mentioned,published_date,citations,journal,breakthrough)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
          r
        );
        inserted++;
      }
    }

    // Audit log (best-effort, non-fatal).
    try {
      await db.query(
        `INSERT INTO audit_log (user_id,user_email,action,details,created_at) VALUES ($1,$2,$3,$4,NOW())`,
        [req.user?.id || null, req.user?.email || null, 'sample_data.insert', JSON.stringify({ entity, inserted })]
      );
    } catch (_) { /* audit_log may not exist on older DBs */ }

    res.json({ inserted, entity });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get('/sample-data/entities', verifyToken, (req, res) => {
  res.json({ entities: ENTITIES });
});

module.exports = router;
