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
