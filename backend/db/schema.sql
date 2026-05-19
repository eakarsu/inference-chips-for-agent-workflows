-- ChipProfiler Schema

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chips (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  manufacturer VARCHAR(255),
  architecture VARCHAR(100),
  context_switch_ns INTEGER,
  kv_cache_gb DECIMAL,
  speculative_decode BOOLEAN DEFAULT FALSE,
  tdp_watts DECIMAL,
  memory_bandwidth_gbps DECIMAL,
  compute_tops DECIMAL,
  process_node_nm INTEGER,
  price_usd DECIMAL,
  availability VARCHAR(30),
  released_date DATE
);

CREATE TABLE IF NOT EXISTS workflows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  agent_type VARCHAR(50),
  total_steps INTEGER,
  avg_duration_ms INTEGER,
  model_call_pct INTEGER,
  tool_use_pct INTEGER,
  memory_read_pct INTEGER,
  cpu_compute_pct INTEGER,
  complexity VARCHAR(20),
  use_case VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS steps (
  id SERIAL PRIMARY KEY,
  workflow_id INT REFERENCES workflows(id),
  step_name VARCHAR(255),
  step_type VARCHAR(50),
  avg_duration_ms INTEGER,
  memory_mb INTEGER,
  is_bottleneck BOOLEAN DEFAULT FALSE,
  is_io_bound BOOLEAN DEFAULT FALSE,
  description TEXT,
  position INTEGER
);

CREATE TABLE IF NOT EXISTS benchmarks (
  id SERIAL PRIMARY KEY,
  chip_id INT REFERENCES chips(id),
  workflow_id INT REFERENCES workflows(id),
  utilization_pct DECIMAL,
  speedup_factor DECIMAL,
  throughput_steps_per_sec DECIMAL,
  latency_ms INTEGER,
  power_efficiency DECIMAL,
  benchmark_date DATE,
  test_environment TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS deployments (
  id SERIAL PRIMARY KEY,
  chip_id INT REFERENCES chips(id),
  customer VARCHAR(255),
  use_case TEXT,
  deployed_at DATE,
  performance_score DECIMAL,
  cost_savings_pct INTEGER,
  status VARCHAR(30),
  region VARCHAR(100),
  scale_units INTEGER
);

CREATE TABLE IF NOT EXISTS research (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  focus_area VARCHAR(100),
  findings TEXT,
  chip_mentioned VARCHAR(255),
  published_date DATE,
  citations INTEGER DEFAULT 0,
  journal VARCHAR(255),
  breakthrough BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS audit_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  user_email VARCHAR(255),
  action VARCHAR(100),
  details TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- Deep feature 1: KV cache allocation tracker
-- KV cache per (chip, model). Captures what an agent's persistent context costs.
-- ============================================================================
CREATE TABLE IF NOT EXISTS kv_allocations (
  id SERIAL PRIMARY KEY,
  chip_id INT REFERENCES chips(id) ON DELETE CASCADE,
  model_name VARCHAR(120) NOT NULL,
  model_params_b DECIMAL,                  -- e.g. 70 for Llama-3-70B
  hidden_size INTEGER,                     -- 8192 for Llama-3-70B
  num_layers INTEGER,                      -- 80 for Llama-3-70B
  num_kv_heads INTEGER,                    -- GQA factor (8 for Llama-3-70B)
  head_dim INTEGER,                        -- 128
  dtype VARCHAR(20),                       -- fp16 / bf16 / fp8 / int4
  context_length INTEGER,                  -- tokens reserved per request
  concurrent_requests INTEGER,             -- batch size
  reuse_across_steps BOOLEAN DEFAULT FALSE,-- agent KV reuse across tool calls
  measured_kv_gb DECIMAL,                  -- observed / reported in lab
  prefill_tokens_per_sec DECIMAL,
  decode_tokens_per_sec DECIMAL,
  notes TEXT,
  recorded_at DATE
);
CREATE INDEX IF NOT EXISTS idx_kv_chip ON kv_allocations(chip_id);
CREATE INDEX IF NOT EXISTS idx_kv_model ON kv_allocations(model_name);

-- ============================================================================
-- Deep feature 2: MLPerf inference results (server + offline scenarios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS mlperf_results (
  id SERIAL PRIMARY KEY,
  submission_id VARCHAR(60),               -- e.g. v4.1-0042
  round VARCHAR(20),                       -- e.g. v4.0 / v4.1 / v5.0
  division VARCHAR(20),                    -- closed / open
  category VARCHAR(20),                    -- datacenter / edge
  chip_id INT REFERENCES chips(id) ON DELETE SET NULL,
  system_name VARCHAR(200),                -- DGX H100, Supermicro AS-8125GS-TNHR, etc.
  num_accelerators INTEGER,
  model_name VARCHAR(120),                 -- llama2-70b, gptj-6b, stable-diffusion-xl, dlrm-v2
  scenario VARCHAR(30),                    -- Server / Offline / SingleStream / MultiStream
  metric VARCHAR(60),                      -- tokens/sec, samples/sec, queries/sec
  result_value DECIMAL,
  perf_per_accelerator DECIMAL,
  latency_p99_ms DECIMAL,
  power_w DECIMAL,
  perf_per_watt DECIMAL,
  software_stack VARCHAR(160),             -- TensorRT-LLM 0.10 / vLLM 0.5.0 / SGLang
  submitter VARCHAR(120),
  published_date DATE
);
CREATE INDEX IF NOT EXISTS idx_mlperf_chip ON mlperf_results(chip_id);
CREATE INDEX IF NOT EXISTS idx_mlperf_model_scen ON mlperf_results(model_name, scenario);
CREATE INDEX IF NOT EXISTS idx_mlperf_round ON mlperf_results(round);

-- ============================================================================
-- Deep feature 3: speculative decoding configurations + outcomes
-- ============================================================================
CREATE TABLE IF NOT EXISTS spec_decode_configs (
  id SERIAL PRIMARY KEY,
  chip_id INT REFERENCES chips(id) ON DELETE CASCADE,
  target_model VARCHAR(120),               -- e.g. Llama-3.1-70B-Instruct
  draft_model VARCHAR(120),                -- e.g. Llama-3.2-1B / EAGLE-3 / Medusa
  draft_params_b DECIMAL,
  num_draft_tokens INTEGER,                -- gamma (typical 4-8)
  acceptance_rate DECIMAL,                 -- 0-1, e.g. 0.74
  baseline_tokens_per_sec DECIMAL,
  spec_tokens_per_sec DECIMAL,
  speedup DECIMAL,                         -- spec_tps / baseline_tps
  extra_kv_mb DECIMAL,                     -- KV overhead for draft model
  prompt_caching_hit_rate DECIMAL,         -- when prompt-caching also active
  workload VARCHAR(100),                   -- chat / code / agent_loop / json_mode
  observed_at DATE,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_spec_chip ON spec_decode_configs(chip_id);
CREATE INDEX IF NOT EXISTS idx_spec_target ON spec_decode_configs(target_model);

-- ============================================================================
-- Deep feature 4: compiler pass lab — TensorRT-LLM / vLLM / TGI / SGLang
-- ============================================================================
CREATE TABLE IF NOT EXISTS compiler_passes (
  id SERIAL PRIMARY KEY,
  chip_id INT REFERENCES chips(id) ON DELETE CASCADE,
  stack VARCHAR(60),                       -- TensorRT-LLM / vLLM / TGI / SGLang / MAX / Tenstorrent Metalium
  pass_name VARCHAR(140),                  -- continuous_batching, paged_attention, fused_rmsnorm...
  category VARCHAR(40),                    -- batching / memory / kernel / quantization / scheduling
  baseline_tokens_per_sec DECIMAL,
  optimized_tokens_per_sec DECIMAL,
  speedup DECIMAL,
  baseline_latency_p99_ms DECIMAL,
  optimized_latency_p99_ms DECIMAL,
  memory_delta_pct DECIMAL,                -- negative = saved memory
  enabled_by_default BOOLEAN DEFAULT FALSE,
  description TEXT,
  reference TEXT,
  recorded_at DATE
);
CREATE INDEX IF NOT EXISTS idx_passes_chip_stack ON compiler_passes(chip_id, stack);

-- ============================================================================
-- Deep feature 5: agent loop traces — per-step latency / memory / KV usage
-- ============================================================================
CREATE TABLE IF NOT EXISTS agent_traces (
  id SERIAL PRIMARY KEY,
  workflow_id INT REFERENCES workflows(id) ON DELETE CASCADE,
  chip_id INT REFERENCES chips(id) ON DELETE SET NULL,
  trace_label VARCHAR(160),
  framework VARCHAR(40),                   -- langgraph / openai-agents / anthropic-mcp / autogen / custom
  total_steps INTEGER,
  total_latency_ms DECIMAL,
  total_tokens_in INTEGER,
  total_tokens_out INTEGER,
  kv_peak_gb DECIMAL,
  prompt_cache_hit_rate DECIMAL,
  notes TEXT,
  recorded_at DATE
);
CREATE INDEX IF NOT EXISTS idx_traces_workflow ON agent_traces(workflow_id);
CREATE INDEX IF NOT EXISTS idx_traces_chip ON agent_traces(chip_id);

CREATE TABLE IF NOT EXISTS agent_trace_steps (
  id SERIAL PRIMARY KEY,
  trace_id INT REFERENCES agent_traces(id) ON DELETE CASCADE,
  position INTEGER,
  step_name VARCHAR(160),
  step_type VARCHAR(40),                   -- model_call / tool_use / memory_read / cpu_compute / io_wait
  latency_ms DECIMAL,
  memory_mb DECIMAL,
  tokens_in INTEGER,
  tokens_out INTEGER,
  kv_delta_mb DECIMAL,
  cache_hit BOOLEAN DEFAULT FALSE,
  is_bottleneck BOOLEAN DEFAULT FALSE,
  notes TEXT
);
CREATE INDEX IF NOT EXISTS idx_steps_trace ON agent_trace_steps(trace_id);
