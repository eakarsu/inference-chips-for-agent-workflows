-- Seed data for ChipProfiler

-- Chips
INSERT INTO chips (name, manufacturer, architecture, context_switch_ns, kv_cache_gb, speculative_decode, tdp_watts, memory_bandwidth_gbps, compute_tops, process_node_nm, price_usd, availability, released_date) VALUES
('H100 SXM5', 'NVIDIA', 'Hopper GH100', 1200, 80.0, TRUE, 700, 3350, 1979, 4, 30000, 'limited', '2022-09-20'),
('H200 SXM5', 'NVIDIA', 'Hopper GH200', 1100, 141.0, TRUE, 700, 4800, 1979, 4, 40000, 'limited', '2023-11-13'),
('LPU-1 Groq', 'Groq', 'LPU Tensor Streaming', 15, 230.0, FALSE, 300, 80000, 750, 14, 45000, 'limited', '2023-02-14'),
('TPU v5e', 'Google', 'TPU Matrix Unit', 850, 16.0, FALSE, 170, 819, 197, 5, 0, 'cloud_only', '2023-08-29'),
('TPU v6 Trillium', 'Google', 'Trillium MXU', 700, 32.0, TRUE, 220, 1638, 918, 4, 0, 'cloud_only', '2024-05-14'),
('MI300X', 'AMD', 'CDNA3', 950, 192.0, TRUE, 750, 5300, 1307, 5, 15000, 'available', '2023-12-07'),
('Trainium2', 'AWS/Annapurna', 'NeuronCore-v2', 1800, 96.0, FALSE, 440, 1600, 3840, 5, 0, 'cloud_only', '2024-03-15'),
('Gaudi3', 'Intel', 'Gaudi Matrix Engine', 1400, 128.0, FALSE, 900, 3700, 1835, 5, 12000, 'available', '2024-04-09'),
('A100 SXM4 80GB', 'NVIDIA', 'Ampere GA100', 2100, 80.0, FALSE, 400, 2000, 312, 7, 15000, 'available', '2021-05-14'),
('Inferentia3', 'AWS', 'NeuronCore-v3', 900, 32.0, TRUE, 200, 1600, 3500, 4, 0, 'cloud_only', '2024-06-01'),
('C3D Custom', 'Cerebras', 'Wafer Scale Engine 3', 50, 44.0, FALSE, 2600, 20000, 125000, 5, 3000000, 'limited', '2023-10-12'),
('MTIA v2', 'Meta', 'MTIA Inference', 600, 64.0, TRUE, 200, 614, 216, 5, 0, 'internal', '2024-04-24'),
('BlackwellB200', 'NVIDIA', 'Blackwell GB200', 800, 192.0, TRUE, 1000, 8000, 4500, 4, 50000, 'upcoming', '2024-03-18'),
('Maverick M3', 'Apple', 'Apple Silicon M3', 300, 96.0, FALSE, 22, 300, 35, 3, 6000, 'available', '2023-10-30'),
('Andes AI-100', 'Rebellions', 'REBEL Architecture', 500, 48.0, TRUE, 150, 2000, 450, 5, 8000, 'limited', '2024-01-20')
ON CONFLICT DO NOTHING;

-- Workflows
INSERT INTO workflows (name, description, agent_type, total_steps, avg_duration_ms, model_call_pct, tool_use_pct, memory_read_pct, cpu_compute_pct, complexity, use_case) VALUES
('Deep Research Agent', 'Multi-step web research with synthesis and fact checking', 'research', 45, 8500, 60, 20, 15, 5, 'high', 'Academic and market research'),
('Code Review Pipeline', 'Automated code analysis, security scanning, and PR generation', 'coding', 28, 4200, 45, 30, 15, 10, 'medium', 'Software development'),
('Customer Support Resolver', 'Multi-turn conversation with KB lookup and CRM integration', 'customer_support', 12, 1800, 70, 15, 10, 5, 'low', 'Enterprise customer service'),
('Financial Data Analyzer', 'Real-time market data analysis and report generation', 'data_analysis', 35, 6200, 40, 25, 25, 10, 'high', 'Investment and trading'),
('Long-Form Content Writer', 'SEO research, outline, draft, and editing pipeline', 'writing', 20, 12000, 75, 10, 10, 5, 'medium', 'Content marketing'),
('Software Architecture Planner', 'Requirements analysis and system design generation', 'planning', 40, 15000, 65, 15, 15, 5, 'high', 'Enterprise software design'),
('SQL Query Optimizer', 'Natural language to SQL with performance optimization', 'coding', 8, 950, 55, 30, 10, 5, 'low', 'Database management'),
('Legal Document Analyzer', 'Contract clause extraction and risk identification', 'data_analysis', 25, 9800, 80, 5, 10, 5, 'high', 'Legal tech and compliance'),
('Email Auto-Responder', 'Context-aware email drafting with tone matching', 'customer_support', 6, 800, 85, 5, 5, 5, 'low', 'Business productivity'),
('Bug Triage Agent', 'Issue categorization, reproduction, and fix suggestion', 'coding', 18, 3500, 50, 35, 10, 5, 'medium', 'DevOps and QA'),
('Competitive Intelligence', 'Web scraping, data synthesis, and insight generation', 'research', 55, 18000, 55, 30, 10, 5, 'high', 'Business strategy'),
('Video Script Generator', 'Research, outline, scripting, and SEO optimization', 'writing', 15, 7500, 70, 15, 10, 5, 'medium', 'Content creation'),
('RAG Knowledge Assistant', 'Vector search + re-ranking + generation pipeline', 'data_analysis', 10, 1200, 50, 0, 40, 10, 'medium', 'Enterprise knowledge management'),
('Medical Literature Reviewer', 'PubMed search, extraction, and clinical summary', 'research', 30, 22000, 65, 20, 10, 5, 'high', 'Healthcare and pharma'),
('Real-Time News Summarizer', 'Breaking news aggregation and summary generation', 'writing', 8, 2100, 80, 15, 0, 5, 'low', 'Media and publishing')
ON CONFLICT DO NOTHING;

-- Steps
INSERT INTO steps (workflow_id, step_name, step_type, avg_duration_ms, memory_mb, is_bottleneck, is_io_bound, description, position) VALUES
(1, 'Query Decomposition', 'model_call', 850, 2048, FALSE, FALSE, 'Break research query into sub-tasks', 1),
(1, 'Web Search Execution', 'tool_use', 2200, 512, TRUE, TRUE, 'Parallel web searches via Serper API', 2),
(1, 'Content Extraction', 'api_call', 1800, 1024, FALSE, TRUE, 'Extract text from web pages', 3),
(1, 'Synthesis & Analysis', 'model_call', 3200, 4096, TRUE, FALSE, 'Multi-doc synthesis with citations', 4),
(2, 'Code Context Loading', 'memory_read', 450, 8192, FALSE, FALSE, 'Load relevant code files into context', 1),
(2, 'Static Analysis', 'cpu_compute', 680, 2048, FALSE, FALSE, 'Run ESLint/Pylint analysis', 2),
(2, 'AI Code Review', 'model_call', 2800, 4096, TRUE, FALSE, 'Deep code quality analysis', 3),
(3, 'Intent Classification', 'model_call', 180, 1024, FALSE, FALSE, 'Classify customer intent', 1),
(3, 'KB Vector Search', 'vector_search', 120, 4096, FALSE, FALSE, 'Retrieve relevant KB articles', 2),
(3, 'Response Generation', 'model_call', 950, 2048, FALSE, FALSE, 'Generate contextual response', 3),
(4, 'Data Ingestion', 'api_call', 800, 1024, FALSE, TRUE, 'Fetch market data from APIs', 1),
(4, 'Feature Engineering', 'cpu_compute', 1200, 4096, TRUE, FALSE, 'Compute derived financial metrics', 2),
(4, 'LLM Analysis', 'model_call', 3500, 8192, FALSE, FALSE, 'Generate insights from data', 3),
(13, 'Query Embedding', 'model_call', 120, 512, FALSE, FALSE, 'Embed user query for vector search', 1),
(13, 'Vector Database Search', 'vector_search', 85, 16384, FALSE, FALSE, 'ANN search in Pinecone/Weaviate', 2),
(13, 'Context Reranking', 'model_call', 350, 2048, FALSE, FALSE, 'Cross-encoder reranking of results', 3),
(13, 'Response Generation', 'model_call', 620, 4096, TRUE, FALSE, 'Generate grounded response', 4)
ON CONFLICT DO NOTHING;

-- Benchmarks
INSERT INTO benchmarks (chip_id, workflow_id, utilization_pct, speedup_factor, throughput_steps_per_sec, latency_ms, power_efficiency, benchmark_date, test_environment, notes) VALUES
(1, 1, 87.5, 8.2, 5.3, 1035, 2.84, '2024-01-15', 'CUDA 12.1, vLLM 0.2.7', 'Best performance on memory-heavy workloads'),
(3, 1, 95.2, 24.5, 15.8, 347, 52.7, '2024-02-01', 'Groq SDK 0.8.0', 'Exceptional throughput, limited KV cache'),
(6, 1, 82.3, 6.9, 4.4, 1930, 5.9, '2024-01-20', 'ROCm 6.0', 'Competitive with H100 at lower cost'),
(1, 2, 76.4, 5.8, 6.7, 725, 9.6, '2024-02-10', 'CUDA 12.1', 'Good code generation performance'),
(5, 3, 45.2, 12.4, 16.7, 145, 56.4, '2024-03-01', 'TPU Research Cloud', 'Low latency for short sequences'),
(9, 3, 68.3, 4.1, 5.6, 439, 14.0, '2024-01-10', 'CUDA 11.8', 'Reliable baseline performance'),
(4, 4, 78.9, 9.2, 5.7, 674, 33.6, '2024-02-15', 'Google Cloud TPU v5e', 'Efficient data analytics workloads'),
(1, 5, 91.2, 7.5, 1.67, 5985, 2.53, '2024-01-25', 'CUDA 12.1', 'High quality long-form generation'),
(13, 5, 89.4, 18.3, 4.07, 2950, 4.5, '2024-04-01', 'Blackwell preview SDK', 'Next-gen performance preview'),
(3, 7, 98.1, 45.2, 47.6, 21, 150.7, '2024-02-28', 'Groq SDK 0.8.0', 'LPU excels at simple fast queries'),
(6, 8, 88.7, 7.2, 2.55, 3922, 4.8, '2024-03-15', 'ROCm 6.0', 'Long context handled well by 192GB HBM'),
(1, 13, 79.5, 9.8, 8.33, 1201, 14.0, '2024-03-20', 'CUDA 12.2', 'RAG pipeline well-suited for H100'),
(11, 1, 99.8, 12.5, 8.1, 1049, 4.8, '2024-04-05', 'Cerebras SDK 2.0', 'Near-perfect utilization on wafer scale'),
(2, 1, 88.2, 11.5, 7.4, 738, 10.5, '2024-04-10', 'CUDA 12.3', 'H200 dominates with 141GB capacity'),
(6, 2, 74.8, 5.4, 6.2, 780, 8.3, '2024-03-25', 'ROCm 6.1', 'MI300X strong for multi-model batching')
ON CONFLICT DO NOTHING;

-- Deployments
INSERT INTO deployments (chip_id, customer, use_case, deployed_at, performance_score, cost_savings_pct, status, region, scale_units) VALUES
(1, 'OpenAI', 'GPT-4 inference serving', '2023-03-15', 9.4, 0, 'active', 'us-east-1', 4096),
(3, 'AI21 Labs', 'Jurassic model serving', '2023-06-20', 8.8, 45, 'active', 'us-west-2', 128),
(9, 'Hugging Face', 'Open model hosting', '2022-09-01', 7.2, 0, 'deprecated', 'eu-west-1', 512),
(6, 'Microsoft Azure', 'Azure AI inference endpoints', '2024-01-10', 8.7, 28, 'active', 'global', 2048),
(4, 'Google Cloud', 'Vertex AI prediction', '2023-09-15', 8.9, 35, 'active', 'us-central1', 8192),
(1, 'Anthropic', 'Claude inference production', '2023-01-10', 9.7, 0, 'active', 'aws-us-east', 3200),
(7, 'Amazon Bedrock', 'Titan model inference', '2024-02-01', 8.5, 42, 'active', 'aws-global', 1024),
(2, 'CoreWeave', 'GPU cloud rental', '2024-01-25', 9.2, 0, 'active', 'us-east-1', 1000),
(11, 'Total Protein', 'AlphaFold protein structure', '2023-11-15', 9.8, 60, 'active', 'us-west-2', 4),
(6, 'Oracle Cloud', 'OCI Generative AI', '2024-02-10', 8.3, 25, 'active', 'us-phoenix-1', 256),
(3, 'Character.ai', 'Real-time character chat', '2023-08-20', 9.1, 55, 'active', 'us-west-2', 200),
(5, 'Google DeepMind', 'Gemini inference research', '2024-05-01', 9.5, 40, 'evaluation', 'us-central1', 64),
(8, 'AWS GovCloud', 'Classified AI inference', '2024-03-15', 7.9, 20, 'active', 'us-gov-west-1', 128),
(1, 'Perplexity AI', 'Search and synthesis', '2023-04-15', 9.3, 0, 'active', 'us-east-1', 800),
(13, 'NVIDIA DGX Cloud', 'Blackwell preview deployment', '2024-05-15', 9.9, 15, 'evaluation', 'global', 32)
ON CONFLICT DO NOTHING;

-- Research
INSERT INTO research (title, focus_area, findings, chip_mentioned, published_date, citations, journal, breakthrough) VALUES
('Speculative Decoding at Scale: 3x Throughput on H100 Clusters', 'speculative_decoding', 'Demonstrated 3.2x average throughput improvement using speculative decoding with draft models on H100 clusters across various LLM sizes from 7B to 70B parameters.', 'H100 SXM5', '2023-11-15', 342, 'NeurIPS 2023', TRUE),
('LPU vs GPU: Latency Analysis for Real-Time Agent Workloads', 'latency_comparison', 'Groq LPU achieves 10-50x lower latency for token generation vs NVIDIA GPUs, with tradeoffs in context length and batch efficiency.', 'LPU-1 Groq', '2024-01-08', 187, 'arXiv', FALSE),
('KV Cache Optimization for Long-Context Inference', 'memory_architecture', 'Novel KV cache eviction strategies reduce memory footprint by 40% with <2% quality degradation on standard benchmarks.', 'H200 SXM5', '2024-02-20', 94, 'ICML 2024', FALSE),
('Wafer-Scale Integration for AI: A New Paradigm', 'chip_architecture', 'Cerebras WSE-3 achieves unprecedented 125,000 TOPS by eliminating inter-chip communication bottlenecks, enabling new model training approaches.', 'C3D Custom', '2023-10-05', 567, 'IEEE Micro', TRUE),
('TPU v5 Architecture Deep Dive', 'custom_silicon', 'Google TPU v5 matrix units achieve 40% better FLOPS/watt vs v4 through architectural improvements and advanced 5nm process node.', 'TPU v5e', '2023-09-30', 234, 'ISCA 2024', FALSE),
('AMD CDNA3 vs NVIDIA Hopper: An Inference Benchmark Study', 'competitive_analysis', 'MI300X 192GB HBM3 capacity enables longer context at competitive performance, particularly advantageous for MoE models and RAG pipelines.', 'MI300X', '2024-01-25', 156, 'MLSys 2024', FALSE),
('Agent Workflow Patterns and Hardware Implications', 'agent_hardware', 'Analysis of 500 production agent workflows reveals 65% are model-call-heavy, suggesting specialized low-latency inference hardware as primary bottleneck.', 'H100 SXM5', '2024-03-10', 289, 'arXiv', FALSE),
('Disaggregated Prefill-Decode for Improved LLM Serving', 'serving_architecture', 'Separating prefill and decode phases across heterogeneous hardware achieves 2.2x throughput improvement in high-load serving scenarios.', 'H100 SXM5', '2024-02-28', 178, 'OSDI 2024', TRUE),
('Power-Efficient Inference: From Edge to Cloud', 'power_efficiency', 'Apple M3 achieves 45 TOPS/watt vs H100 at 2.8 TOPS/watt, highlighting the massive efficiency gap between mobile and datacenter silicon.', 'Maverick M3', '2024-01-15', 123, 'IEEE Spectrum', FALSE),
('Blackwell Architecture: What the GB200 Means for Inference', 'next_gen_chips', 'NVIDIA Blackwell GB200 NVL72 delivers 30x inference performance vs Hopper, with transformational implications for real-time large model deployment.', 'BlackwellB200', '2024-03-25', 445, 'IEEE Hot Chips', TRUE),
('Vector Database Acceleration: GPU Memory Bandwidth as the Key Metric', 'vector_search', 'Memory bandwidth, not compute, determines vector search performance. AMD MI300X and H200 lead for RAG pipeline deployments.', 'MI300X', '2024-02-05', 98, 'VLDB 2024', FALSE),
('The Economics of LLM Inference: TCO Analysis Across Hardware', 'economics', 'At scale, custom silicon (Trainium2, TPU) reduces inference TCO by 40-60% vs comparable GPU configurations for major cloud providers.', 'Trainium2', '2024-04-01', 312, 'ACM SIGCOMM', FALSE),
('Continuous Batching and Dynamic Scheduling for Agent Workloads', 'serving_systems', 'vLLM-style continuous batching reduces average latency by 40% and improves GPU utilization from 60% to 88% in multi-tenant agent serving.', 'H100 SXM5', '2023-12-15', 401, 'arXiv', FALSE),
('Memory Wall in LLM Inference: HBM Capacity vs Bandwidth Tradeoffs', 'memory_systems', 'For models >70B parameters, HBM capacity becomes the binding constraint; for smaller models, bandwidth dominates. Chip selection should be model-size-aware.', 'H200 SXM5', '2024-03-18', 267, 'ASPLOS 2024', FALSE),
('Gaudi3 Performance Analysis for Open Source LLMs', 'benchmarking', 'Intel Gaudi3 achieves competitive performance at 35% lower cost vs H100 for Llama 3 and Mistral model families, with strong Habana SDK ecosystem.', 'Gaudi3', '2024-05-10', 67, 'arXiv', FALSE)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- KV allocation rows (real shapes for Llama-3-70B, 8B, Mixtral, etc.)
-- Per-token KV bytes = 2 * num_layers * num_kv_heads * head_dim * dtype_bytes
-- Llama-3-70B fp16 ≈ 2*80*8*128*2 = 327,680 bytes/token ≈ 0.31 MB/token (GQA)
-- ============================================================================
INSERT INTO kv_allocations (chip_id, model_name, model_params_b, hidden_size, num_layers, num_kv_heads, head_dim, dtype, context_length, concurrent_requests, reuse_across_steps, measured_kv_gb, prefill_tokens_per_sec, decode_tokens_per_sec, notes, recorded_at) VALUES
(1, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'fp16', 8192, 16, FALSE, 41.0, 4200, 1979, 'H100 80GB SXM5; vLLM 0.5.0 paged-attention block_size=16', '2024-08-10'),
(1, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'fp8', 8192, 32, FALSE, 21.0, 7800, 3120, 'H100 with FP8 KV cache via TensorRT-LLM 0.10', '2024-09-04'),
(2, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'fp16', 32768, 32, TRUE, 83.0, 5100, 2450, 'H200 141GB fits 32K context + agent KV reuse across tool calls', '2024-10-15'),
(2, 'Llama-3.1-405B-Instruct', 405, 16384, 126, 8, 128, 'fp8', 8192, 8, FALSE, 64.0, 1850, 285, 'H200 8-way tensor parallel; 4.8TB/s HBM3e bandwidth-bound', '2024-11-02'),
(13, 'Llama-3.1-405B-Instruct', 405, 16384, 126, 8, 128, 'fp8', 32768, 16, FALSE, 142.0, 9200, 1840, 'B200 with 192GB HBM3e per chip; 8TB/s bandwidth', '2025-01-18'),
(13, 'Mixtral-8x22B', 141, 6144, 56, 8, 128, 'fp8', 16384, 24, TRUE, 38.0, 12400, 4600, 'B200 expert-parallel; MoE active-params KV math', '2025-02-09'),
(6, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'fp16', 32768, 24, FALSE, 79.0, 3800, 1640, 'MI300X 192GB HBM3, ROCm 6.2 vLLM upstream', '2024-08-22'),
(6, 'DeepSeek-V3', 671, 7168, 61, 128, 128, 'fp8', 16384, 8, FALSE, 152.0, 2200, 720, 'MI300X 8-way, MoE 37B active; full model fits in 1.5TB cluster', '2025-01-30'),
(3, 'Llama-3.1-8B-Instruct', 8, 4096, 32, 8, 128, 'fp16', 8192, 64, FALSE, 8.4, 18000, 750, 'Groq LPU on-die SRAM 230MB/chip; deterministic latency', '2024-07-12'),
(3, 'Mixtral-8x7B', 47, 4096, 32, 8, 128, 'fp16', 8192, 32, FALSE, 8.4, 12500, 580, 'Groq LPU pod (576 chips) — MoE expert sharding across chips', '2024-09-01'),
(11, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'fp16', 32768, 64, TRUE, 41.0, 25000, 1850, 'Cerebras WSE-3 44GB on-die SRAM; 21PB/s bandwidth eliminates memory stalls', '2024-10-04'),
(11, 'Llama-3.1-405B-Instruct', 405, 16384, 126, 8, 128, 'fp16', 16384, 16, FALSE, 124.0, 8200, 969, 'Cerebras CS-3 cluster (4 wafers) MoE-style weight streaming', '2025-02-20'),
(5, 'Gemini-Nano-3B', 3, 3072, 28, 4, 96, 'int8', 8192, 32, FALSE, 0.8, 9200, 320, 'TPU v6 Trillium; Pathways runtime int8 KV', '2024-11-22'),
(5, 'Gemma-2-27B', 27, 4608, 46, 8, 128, 'bf16', 8192, 16, TRUE, 18.2, 5400, 920, 'TPU v6 with prompt caching for agent system prompts', '2024-12-15'),
(7, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'bf16', 8192, 16, FALSE, 41.0, 3100, 1280, 'AWS Trainium2 trn2.48xlarge, NeuronCore-v2 SDK 2.18', '2024-10-09'),
(10, 'Llama-3.1-8B-Instruct', 8, 4096, 32, 8, 128, 'bf16', 8192, 48, TRUE, 6.3, 14500, 620, 'AWS Inferentia3 inf3.24xlarge with prompt caching for agent system prompts', '2025-01-12'),
(8, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'fp16', 8192, 16, FALSE, 41.0, 4900, 1620, 'Intel Gaudi3 PCIe; Habana SynapseAI 1.18', '2024-09-19'),
(12, 'Llama-3-70B', 70, 8192, 80, 8, 128, 'fp16', 8192, 8, FALSE, 20.5, 2200, 720, 'Meta MTIA v2 in-house cluster for Reels ranking + LLM serving', '2024-12-02'),
(14, 'Phi-3.5-Mini-3.8B', 3.8, 3072, 32, 32, 96, 'int4', 8192, 4, FALSE, 0.6, 3200, 145, 'Apple M3 with Core ML / MLX; int4 KV via group-quant', '2024-10-30'),
(15, 'Llama-3.1-8B-Instruct', 8, 4096, 32, 8, 128, 'fp16', 8192, 16, FALSE, 8.4, 7400, 520, 'Rebellions ATOM/Andes AI-100; REBEL compiler v0.9', '2025-01-05'),
(4, 'Gemma-2-9B', 9, 3584, 42, 8, 128, 'bf16', 8192, 16, FALSE, 9.1, 4100, 980, 'TPU v5e g2-standard; 16GB HBM tight for KV+weights', '2024-08-30'),
(9, 'Llama-3.1-70B-Instruct', 70, 8192, 80, 8, 128, 'fp16', 4096, 8, FALSE, 20.5, 2400, 980, 'A100 80GB SXM4; 4K context only — HBM2e capacity limit', '2024-07-04')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- MLPerf inference results (real models, scenarios, software stacks)
-- Models: llama2-70b, gptj-6b, stable-diffusion-xl, dlrm-v2, mixtral-8x7b
-- Scenarios: Server (latency-bound) / Offline (throughput-bound)
-- ============================================================================
INSERT INTO mlperf_results (submission_id, round, division, category, chip_id, system_name, num_accelerators, model_name, scenario, metric, result_value, perf_per_accelerator, latency_p99_ms, power_w, perf_per_watt, software_stack, submitter, published_date) VALUES
('v4.0-0001', 'v4.0', 'closed', 'datacenter', 1, 'DGX H100', 8, 'llama2-70b', 'Server', 'tokens/sec', 21806, 2725.7, 2000, 5600, 3.89, 'TensorRT-LLM 0.7.1 + vLLM', 'NVIDIA', '2024-03-27'),
('v4.0-0001', 'v4.0', 'closed', 'datacenter', 1, 'DGX H100', 8, 'llama2-70b', 'Offline', 'tokens/sec', 24525, 3065.6, NULL, 5600, 4.38, 'TensorRT-LLM 0.7.1', 'NVIDIA', '2024-03-27'),
('v4.1-0042', 'v4.1', 'closed', 'datacenter', 2, 'H200 SXM5 8-GPU', 8, 'llama2-70b', 'Server', 'tokens/sec', 31712, 3964, 2000, 5600, 5.66, 'TensorRT-LLM 0.10', 'Supermicro', '2024-08-28'),
('v4.1-0042', 'v4.1', 'closed', 'datacenter', 2, 'H200 SXM5 8-GPU', 8, 'llama2-70b', 'Offline', 'tokens/sec', 34864, 4358, NULL, 5600, 6.22, 'TensorRT-LLM 0.10', 'Supermicro', '2024-08-28'),
('v4.1-0050', 'v4.1', 'closed', 'datacenter', 6, 'AMD MI300X 8-GPU', 8, 'llama2-70b', 'Server', 'tokens/sec', 24112, 3014, 2000, 6000, 4.02, 'vLLM 0.5.4 ROCm 6.1', 'AMD', '2024-08-28'),
('v4.1-0050', 'v4.1', 'closed', 'datacenter', 6, 'AMD MI300X 8-GPU', 8, 'llama2-70b', 'Offline', 'tokens/sec', 28336, 3542, NULL, 6000, 4.72, 'vLLM 0.5.4 ROCm 6.1', 'AMD', '2024-08-28'),
('v5.0-0008', 'v5.0', 'closed', 'datacenter', 13, 'DGX B200', 8, 'llama2-70b', 'Server', 'tokens/sec', 98443, 12305, 2000, 8000, 12.31, 'TensorRT-LLM 0.13 + FP4', 'NVIDIA', '2025-03-26'),
('v5.0-0008', 'v5.0', 'closed', 'datacenter', 13, 'DGX B200', 8, 'llama2-70b', 'Offline', 'tokens/sec', 116000, 14500, NULL, 8000, 14.5, 'TensorRT-LLM 0.13 + FP4', 'NVIDIA', '2025-03-26'),
('v4.1-0070', 'v4.1', 'closed', 'datacenter', 8, 'Gaudi3 8-card', 8, 'llama2-70b', 'Server', 'tokens/sec', 17152, 2144, 2000, 7200, 2.38, 'SynapseAI 1.18 + vLLM', 'Intel', '2024-08-28'),
('v4.1-0070', 'v4.1', 'closed', 'datacenter', 8, 'Gaudi3 8-card', 8, 'llama2-70b', 'Offline', 'tokens/sec', 22208, 2776, NULL, 7200, 3.08, 'SynapseAI 1.18 + vLLM', 'Intel', '2024-08-28'),
('v4.1-0090', 'v4.1', 'closed', 'datacenter', 7, 'trn2.48xlarge', 16, 'llama2-70b', 'Server', 'tokens/sec', 19200, 1200, 2000, 7040, 2.73, 'NeuronX SDK 2.18 + vLLM', 'AWS', '2024-08-28'),
('v4.1-0090', 'v4.1', 'closed', 'datacenter', 7, 'trn2.48xlarge', 16, 'llama2-70b', 'Offline', 'tokens/sec', 23040, 1440, NULL, 7040, 3.27, 'NeuronX SDK 2.18', 'AWS', '2024-08-28'),
('v4.0-0030', 'v4.0', 'closed', 'datacenter', 1, 'DGX H100', 8, 'gptj-6b', 'Server', 'samples/sec', 16632, 2079, 20, 5600, 2.97, 'TensorRT-LLM 0.7.1', 'NVIDIA', '2024-03-27'),
('v4.1-0044', 'v4.1', 'closed', 'datacenter', 2, 'H200 8-GPU', 8, 'gptj-6b', 'Server', 'samples/sec', 22660, 2832, 20, 5600, 4.04, 'TensorRT-LLM 0.10', 'NVIDIA', '2024-08-28'),
('v4.1-0061', 'v4.1', 'closed', 'datacenter', 6, 'MI300X 8-GPU', 8, 'gptj-6b', 'Server', 'samples/sec', 13280, 1660, 20, 6000, 2.21, 'vLLM 0.5.4 ROCm 6.1', 'AMD', '2024-08-28'),
('v4.0-0080', 'v4.0', 'closed', 'datacenter', 1, 'DGX H100', 8, 'stable-diffusion-xl', 'Server', 'samples/sec', 13.7, 1.7, 20000, 5600, 0.00245, 'TensorRT 9.2', 'NVIDIA', '2024-03-27'),
('v4.1-0048', 'v4.1', 'closed', 'datacenter', 2, 'H200 8-GPU', 8, 'stable-diffusion-xl', 'Server', 'samples/sec', 18.4, 2.3, 20000, 5600, 0.00329, 'TensorRT 10.0', 'NVIDIA', '2024-08-28'),
('v5.0-0012', 'v5.0', 'closed', 'datacenter', 13, 'DGX B200', 8, 'stable-diffusion-xl', 'Server', 'samples/sec', 67.2, 8.4, 20000, 8000, 0.0084, 'TensorRT 10.3 + FP4', 'NVIDIA', '2025-03-26'),
('v4.0-0120', 'v4.0', 'closed', 'datacenter', 1, 'DGX H100', 8, 'dlrm-v2', 'Offline', 'queries/sec', 660000, 82500, NULL, 5600, 117.86, 'TensorRT 9.2', 'NVIDIA', '2024-03-27'),
('v4.1-0150', 'v4.1', 'closed', 'datacenter', 6, 'MI300X 8-GPU', 8, 'mixtral-8x7b', 'Server', 'tokens/sec', 14856, 1857, 2000, 6000, 2.48, 'vLLM 0.5.4 ROCm 6.1 expert-parallel', 'AMD', '2024-08-28'),
('v5.0-0021', 'v5.0', 'closed', 'datacenter', 13, 'DGX B200', 8, 'mixtral-8x7b', 'Server', 'tokens/sec', 59328, 7416, 2000, 8000, 7.42, 'TensorRT-LLM 0.13 + expert-parallel', 'NVIDIA', '2025-03-26'),
('v4.1-0200', 'v4.1', 'open', 'datacenter', 11, 'CS-3 wafer', 1, 'llama2-70b', 'Server', 'tokens/sec', 31200, 31200, 1000, 2600, 12.0, 'Cerebras SDK 2.2', 'Cerebras', '2024-08-28'),
('v4.1-0210', 'v4.1', 'open', 'datacenter', 3, 'Groq LPU pod-576', 576, 'llama2-70b', 'Server', 'tokens/sec', 75600, 131.25, 250, 172800, 0.44, 'Groq SDK 0.9 + custom compiler', 'Groq', '2024-08-28'),
('v4.1-0220', 'v4.1', 'open', 'datacenter', 12, 'MTIA-v2 32-card', 32, 'llama2-70b', 'Offline', 'tokens/sec', 14080, 440, NULL, 6400, 2.2, 'Meta inhouse stack + PyTorch', 'Meta', '2024-08-28')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Speculative decoding configs
-- ============================================================================
INSERT INTO spec_decode_configs (chip_id, target_model, draft_model, draft_params_b, num_draft_tokens, acceptance_rate, baseline_tokens_per_sec, spec_tokens_per_sec, speedup, extra_kv_mb, prompt_caching_hit_rate, workload, observed_at, notes) VALUES
(1, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 5, 0.74, 38, 92, 2.42, 380, 0.0, 'chat', '2024-09-04', 'Standard draft-model speculation; H100 fp16 single-stream'),
(1, 'Llama-3.1-70B-Instruct', 'EAGLE-3 head', 0.4, 4, 0.82, 38, 124, 3.26, 145, 0.0, 'chat', '2024-12-10', 'EAGLE-3 hidden-state speculation outperforms separate draft model'),
(1, 'Llama-3.1-70B-Instruct', 'Medusa heads', 0.6, 4, 0.68, 38, 86, 2.26, 210, 0.0, 'chat', '2024-08-20', 'Medusa multi-head; lower accept rate but cheap draft'),
(2, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 6, 0.78, 51, 138, 2.71, 380, 0.0, 'chat', '2024-11-15', 'H200 — more headroom for draft KV'),
(2, 'Llama-3.1-405B-Instruct', 'Llama-3.2-3B-Instruct', 3.0, 4, 0.66, 7.2, 18.4, 2.56, 1140, 0.0, 'chat', '2025-01-08', '405B target; 3B draft gives best tradeoff vs 1B draft (0.51 accept)'),
(2, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 6, 0.81, 51, 152, 2.98, 380, 0.92, 'agent_loop', '2025-02-04', 'Anthropic prompt-caching style for agent system prompts; KV reuse 92%'),
(13, 'Llama-3.1-405B-Instruct', 'Llama-3.2-3B-Instruct', 3.0, 8, 0.71, 14.5, 48.2, 3.32, 1140, 0.0, 'chat', '2025-03-18', 'B200 enables higher gamma due to memory bandwidth'),
(13, 'Llama-3.1-70B-Instruct', 'EAGLE-3 head', 0.4, 8, 0.84, 68, 240, 3.53, 145, 0.0, 'code', '2025-04-02', 'Code workload benefits most — high repetition allows EAGLE accept >0.8'),
(13, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 6, 0.79, 68, 198, 2.91, 380, 0.95, 'agent_loop', '2025-04-22', 'Best-case agent loop: prompt cache + spec decode stack'),
(6, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 5, 0.71, 32, 73, 2.28, 380, 0.0, 'chat', '2024-10-01', 'MI300X — ROCm 6.2 speculative-decoding support landed in vLLM 0.6'),
(6, 'DeepSeek-V3', 'DeepSeek-V3-MTP-head', 1.2, 2, 0.85, 14, 42, 3.0, 280, 0.0, 'code', '2025-02-19', 'DeepSeek-V3 ships native multi-token-prediction head'),
(3, 'Llama-3.1-8B-Instruct', 'NONE', 0, 0, 0, 750, 750, 1.0, 0, 0.0, 'chat', '2024-08-15', 'Groq LPU — speculative decoding offers <5% gain; chip already memory-saturated'),
(7, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 4, 0.68, 28, 58, 2.07, 380, 0.0, 'chat', '2024-11-25', 'Trainium2 — speculative decoding via NeuronX 2.20'),
(8, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 4, 0.70, 32, 67, 2.09, 380, 0.0, 'chat', '2024-10-30', 'Gaudi3 + vLLM speculative-decoding plugin'),
(11, 'Llama-3.1-70B-Instruct', 'NONE', 0, 0, 0, 1850, 1850, 1.0, 0, 0.0, 'chat', '2024-10-04', 'Cerebras WSE-3 — no spec decode needed; deterministic memory streaming'),
(2, 'Llama-3.1-70B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 4, 0.60, 51, 92, 1.80, 380, 0.0, 'json_mode', '2025-01-20', 'Structured JSON output — lower accept due to schema constraints'),
(13, 'Llama-3.1-70B-Instruct', 'EAGLE-3 head', 0.4, 6, 0.79, 68, 215, 3.16, 145, 0.88, 'agent_loop', '2025-05-09', 'B200 agent-loop config: EAGLE-3 + prompt cache + KV reuse across tool calls'),
(1, 'Llama-3.1-405B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 4, 0.51, 3.8, 5.2, 1.37, 380, 0.0, 'chat', '2024-09-12', '1B draft for 405B target — accept rate too low to overcome verification cost'),
(2, 'Mixtral-8x22B', 'Mixtral-8x7B', 47, 4, 0.62, 38, 71, 1.87, 4200, 0.0, 'chat', '2024-12-20', 'MoE-to-MoE draft; high extra KV but acceptable speedup'),
(15, 'Llama-3.1-8B-Instruct', 'Llama-3.2-1B-Instruct', 1.0, 4, 0.69, 520, 940, 1.81, 380, 0.0, 'chat', '2025-03-01', 'Rebellions ATOM with REBEL compiler v1.0 speculative-decoding pass')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Compiler passes — real production stacks and pass names
-- ============================================================================
INSERT INTO compiler_passes (chip_id, stack, pass_name, category, baseline_tokens_per_sec, optimized_tokens_per_sec, speedup, baseline_latency_p99_ms, optimized_latency_p99_ms, memory_delta_pct, enabled_by_default, description, reference, recorded_at) VALUES
(1, 'vLLM', 'paged_attention', 'memory', 850, 2400, 2.82, 4200, 1550, -45, TRUE, 'Block-based KV cache eliminates fragmentation; vLLM headline pass', 'Kwon et al. SOSP 2023', '2023-09-15'),
(1, 'vLLM', 'continuous_batching', 'batching', 2400, 4100, 1.71, 1550, 980, 0, TRUE, 'Per-step batch reformulation replaces static batching; raises GPU util 60%->88%', 'Yu et al. OSDI 2022 (Orca)', '2023-10-20'),
(1, 'vLLM', 'chunked_prefill', 'scheduling', 4100, 5300, 1.29, 980, 720, 5, TRUE, 'Chunk large prefill to overlap with decode; reduces TTFT tail', 'Agrawal et al. 2024', '2024-04-12'),
(1, 'vLLM', 'prefix_caching', 'memory', 5300, 7800, 1.47, 720, 410, -8, FALSE, 'Hash-based prefix KV reuse across requests sharing system prompt', 'vLLM PR #2762', '2024-06-08'),
(1, 'TensorRT-LLM', 'in_flight_batching', 'batching', 2200, 3650, 1.66, 1700, 1100, 0, TRUE, 'TRT-LLM equivalent of continuous batching with FT2 scheduling', 'NVIDIA TRT-LLM docs', '2024-01-15'),
(1, 'TensorRT-LLM', 'fp8_kv_cache', 'quantization', 3650, 5200, 1.42, 1100, 820, -50, FALSE, 'FP8 KV cache halves memory at <1% quality loss on Llama-3-70B', 'NVIDIA blog 2024-07', '2024-07-22'),
(1, 'TensorRT-LLM', 'flash_attention_3', 'kernel', 5200, 6900, 1.33, 820, 640, 0, TRUE, 'FA3 with async warp specialization on Hopper TMA', 'Shah et al. 2024', '2024-07-12'),
(2, 'TensorRT-LLM', 'fp8_kv_cache', 'quantization', 4900, 7400, 1.51, 950, 690, -50, FALSE, 'FP8 KV cache on H200; 141GB capacity lets us go larger batch', 'NVIDIA blog 2024-09', '2024-09-01'),
(13, 'TensorRT-LLM', 'fp4_quantization', 'quantization', 14500, 21800, 1.50, 380, 260, -55, TRUE, 'Blackwell FP4 with second-gen Transformer Engine', 'NVIDIA Blackwell whitepaper', '2025-01-28'),
(13, 'TensorRT-LLM', 'mxfp4_kv_cache', 'quantization', 21800, 28300, 1.30, 260, 210, -25, FALSE, 'Micro-scaling FP4 KV cache; preserves long-context quality', 'OCP MX spec 1.0', '2025-03-15'),
(6, 'vLLM', 'paged_attention', 'memory', 720, 1850, 2.57, 4800, 1900, -42, TRUE, 'ROCm 6.1 ports paged-attention to MI300X', 'ROCm/vllm-rocm PR #84', '2024-04-10'),
(6, 'vLLM', 'triton_attention_rocm', 'kernel', 1850, 2350, 1.27, 1900, 1500, 0, FALSE, 'AMD-optimized Triton attention kernel for CDNA3', 'ROCm 6.2 release notes', '2024-08-15'),
(6, 'SGLang', 'radix_attention', 'memory', 2350, 3600, 1.53, 1500, 1020, -15, FALSE, 'Tree-structured KV cache reuse across branching agent calls', 'Zheng et al. 2024', '2024-10-22'),
(3, 'Groq SDK', 'tensor_streaming', 'kernel', 0, 750, 0, 0, 250, 0, TRUE, 'Groq compile-time scheduling of all SRAM accesses; LPU foundation', 'Groq architecture whitepaper', '2023-02-14'),
(3, 'Groq SDK', 'multi_chip_routing', 'scheduling', 750, 1850, 2.47, 250, 95, 0, TRUE, 'Pod-576 deterministic chip-to-chip routing for 70B model', 'Groq Cloud GA 2024', '2024-08-05'),
(11, 'Cerebras SDK', 'weight_streaming', 'memory', 1200, 1850, 1.54, 1450, 980, 0, TRUE, 'Stream weights from MemoryX through wafer SRAM', 'Cerebras CS-3 paper', '2024-03-15'),
(7, 'NeuronX SDK', 'continuous_batching', 'batching', 940, 1480, 1.57, 2900, 1850, 0, TRUE, 'Trainium2 continuous batching landed in NeuronX 2.18', 'AWS Re:Invent 2024 keynote', '2024-12-03'),
(8, 'vLLM', 'fused_rmsnorm_silu', 'kernel', 1620, 1980, 1.22, 1200, 940, 0, TRUE, 'Habana Graph Compiler fuses RMSNorm + SiLU', 'SynapseAI 1.18 release', '2024-09-19'),
(8, 'TGI', 'hpu_paged_attention', 'memory', 1980, 2640, 1.33, 940, 720, -28, FALSE, 'Habana port of paged attention to TGI 2.4', 'TGI 2.4 release', '2024-11-08'),
(5, 'JAX/XLA', 'tpu_block_scaled_attention', 'kernel', 1350, 1840, 1.36, 850, 650, 0, TRUE, 'Trillium MXU block-scaled attention kernel', 'Google Cloud blog', '2024-09-10'),
(13, 'vLLM', 'paged_attention_v3', 'memory', 12000, 18400, 1.53, 320, 215, -38, TRUE, 'PA v3 with Blackwell tensor memory accelerator', 'vLLM 0.7 release', '2025-04-01'),
(13, 'TensorRT-LLM', 'speculative_decoding_eagle3', 'scheduling', 18400, 56000, 3.04, 215, 90, 8, FALSE, 'EAGLE-3 spec decoding integrated into TRT-LLM runtime', 'NVIDIA NIM GA 2025', '2025-05-02'),
(6, 'MAX', 'mojo_kernel_fusion', 'kernel', 1850, 2580, 1.39, 1900, 1380, 0, FALSE, 'Modular MAX with Mojo-generated fused kernels', 'Modular MAX 0.25 release', '2024-12-12'),
(15, 'REBEL Compiler', 'pipeline_partition_v2', 'scheduling', 380, 520, 1.37, 1850, 1380, 0, TRUE, 'Rebellions REBEL Compiler v1.0 pipeline-parallel partition pass', 'Rebellions whitepaper 2025', '2025-02-28'),
(1, 'SGLang', 'jump_forward_decoding', 'scheduling', 6900, 9200, 1.33, 640, 470, 0, FALSE, 'Skip-token decoding for structured output / JSON mode', 'SGLang paper 2024', '2024-08-30'),
(2, 'vLLM', 'multi_lora', 'memory', 4900, 6100, 1.24, 950, 780, 12, FALSE, 'Punica-style multi-LoRA serving for adapter fleets', 'vLLM 0.4 release', '2024-04-18'),
(13, 'TensorRT-LLM', 'p2p_kv_offload', 'memory', 14500, 17400, 1.20, 380, 320, -22, FALSE, 'Cross-GPU NVLink KV cache offload — extends effective KV capacity', 'NVIDIA GTC 2025', '2025-03-20')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- Agent traces (per-trace header + per-step rows)
-- ============================================================================
INSERT INTO agent_traces (workflow_id, chip_id, trace_label, framework, total_steps, total_latency_ms, total_tokens_in, total_tokens_out, kv_peak_gb, prompt_cache_hit_rate, notes, recorded_at) VALUES
(1, 2, 'DeepResearch on H200 — climate paper review', 'langgraph', 11, 18420, 24800, 4200, 38.2, 0.86, 'Anthropic prompt-cache hits on system prompt and tool defs; KV reused across tool calls', '2024-12-10'),
(1, 13, 'DeepResearch on B200 — same query rerun', 'langgraph', 11, 9180, 24800, 4200, 38.2, 0.92, 'B200 + EAGLE-3 spec decode + prompt cache; 2x faster than H200', '2025-04-04'),
(1, 3, 'DeepResearch on Groq pod-576', 'langgraph', 11, 6520, 24800, 4200, 14.0, 0.0, 'Groq cold-start TTFT 250ms then 750 tok/s sustained; no KV reuse', '2024-08-19'),
(2, 1, 'Code review pipeline — H100 + vLLM', 'openai-agents', 7, 4200, 18200, 3100, 24.0, 0.74, 'Coding workload, EAGLE accept >0.82', '2024-09-22'),
(2, 13, 'Code review pipeline — B200 + TRT-LLM', 'openai-agents', 7, 1880, 18200, 3100, 24.0, 0.89, 'FP4 + EAGLE-3 + prefix cache stack', '2025-05-01'),
(3, 3, 'Customer support resolver — Groq LPU', 'custom', 3, 410, 1800, 320, 8.4, 0.0, 'Sub-second total latency; Groq excels at simple short loops', '2024-09-08'),
(3, 10, 'Customer support resolver — Inferentia3', 'custom', 3, 1200, 1800, 320, 6.3, 0.91, 'Prompt caching for system prompt + KB; KV reuse hits high', '2025-02-14'),
(4, 1, 'Financial analyzer — H100', 'autogen', 8, 6800, 22400, 5800, 31.0, 0.68, 'Bottleneck: feature_engineering CPU step (1.2s)', '2024-10-04'),
(4, 6, 'Financial analyzer — MI300X', 'autogen', 8, 7200, 22400, 5800, 31.0, 0.70, 'MI300X comparable to H100; larger KV gives bigger batch', '2024-10-29'),
(11, 13, 'Competitive intelligence — B200 8-way', 'langgraph', 18, 22400, 84200, 12400, 96.4, 0.81, 'Largest agent workflow tested; B200 cluster sustains 14k tok/s aggregate', '2025-05-07'),
(13, 2, 'RAG knowledge assistant — H200', 'custom', 4, 1180, 4200, 680, 18.2, 0.95, 'RAG pipeline dominated by vector search (85ms) + decode', '2024-11-30'),
(7, 3, 'SQL optimizer — Groq', 'custom', 3, 95, 820, 180, 4.2, 0.0, 'Groq best-in-class for short-turn high-throughput loops', '2024-09-15'),
(8, 11, 'Legal document analyzer — Cerebras WSE-3', 'custom', 7, 14800, 96400, 8200, 41.0, 0.0, 'Full doc context fits on WSE-3 SRAM; no KV thrashing', '2024-12-22'),
(5, 2, 'Long-form content writer — H200', 'langgraph', 6, 11200, 22400, 8400, 56.0, 0.74, 'Prompt cache for outline template; 3 model_call steps dominate', '2024-10-28'),
(6, 1, 'Software arch planner — H100', 'autogen', 12, 16400, 38200, 11200, 38.0, 0.62, 'Iterative refinement with prefix cache reuse', '2024-09-30'),
(10, 13, 'Bug triage agent — B200', 'openai-agents', 9, 4800, 14200, 2800, 26.0, 0.83, 'EAGLE-3 + FP4 + prompt cache stack', '2025-04-15'),
(14, 11, 'Medical lit reviewer — WSE-3', 'langgraph', 8, 18200, 124800, 9800, 41.0, 0.0, 'Full PubMed abstract corpus fits on-die SRAM', '2025-01-22'),
(15, 3, 'Real-time news summarizer — Groq pod-576', 'custom', 4, 280, 4200, 380, 14.0, 0.0, 'Sub-300ms total — Groq best-in-class for short throughput loops', '2024-12-08'),
(2, 2, 'Code review pipeline — H200 with prompt cache', 'openai-agents', 7, 3200, 18200, 3100, 24.0, 0.86, 'Anthropic-style prompt cache for system prompt + tool defs', '2025-02-26'),
(3, 13, 'Customer support resolver — B200 fp4', 'custom', 3, 220, 1800, 320, 8.0, 0.91, 'B200 FP4 + prompt cache → 50% lower latency vs H200', '2025-03-12'),
(12, 5, 'Video script generator — TPU Trillium', 'custom', 6, 8200, 18200, 3800, 18.2, 0.72, 'Prompt cache for show-bible template; TPU v6 efficient bf16 path', '2024-11-26')
ON CONFLICT DO NOTHING;

INSERT INTO agent_trace_steps (trace_id, position, step_name, step_type, latency_ms, memory_mb, tokens_in, tokens_out, kv_delta_mb, cache_hit, is_bottleneck, notes) VALUES
(1, 1, 'system_prompt_load', 'model_call', 180, 4200, 3200, 0, 980, TRUE, FALSE, 'Anthropic prompt cache HIT — 90% discount applied'),
(1, 2, 'query_decomposition', 'model_call', 920, 4400, 4100, 380, 1180, FALSE, FALSE, NULL),
(1, 3, 'serper_search_1', 'tool_use', 2100, 512, 0, 0, 0, FALSE, TRUE, 'External Serper API I/O-bound — biggest single step'),
(1, 4, 'serper_search_2', 'tool_use', 1980, 512, 0, 0, 0, FALSE, FALSE, NULL),
(1, 5, 'content_extract', 'tool_use', 1850, 1024, 0, 0, 0, FALSE, FALSE, NULL),
(1, 6, 'synthesis_pass_1', 'model_call', 3200, 5800, 8400, 1200, 2400, FALSE, TRUE, 'Largest synthesis step; KV grows 2.4GB'),
(1, 7, 'citation_check', 'model_call', 2400, 5400, 6800, 980, 1980, TRUE, FALSE, 'Prompt cache reuse across citation queries'),
(1, 8, 'fact_verify', 'tool_use', 1200, 256, 0, 0, 0, FALSE, FALSE, NULL),
(1, 9, 'final_synthesis', 'model_call', 2400, 5200, 1900, 1100, 720, TRUE, FALSE, 'KV reuse from synthesis_pass_1'),
(1, 10, 'format_output', 'cpu_compute', 80, 64, 0, 0, 0, FALSE, FALSE, NULL),
(1, 11, 'return_response', 'io_wait', 110, 32, 0, 540, 0, FALSE, FALSE, NULL),
(2, 1, 'system_prompt_load', 'model_call', 90, 4200, 3200, 0, 980, TRUE, FALSE, 'B200 FP4 path'),
(2, 2, 'query_decomposition', 'model_call', 380, 4400, 4100, 380, 1180, FALSE, FALSE, 'EAGLE-3 spec decode kicks in'),
(2, 3, 'serper_search_1', 'tool_use', 2080, 512, 0, 0, 0, FALSE, TRUE, 'Network bound — same as H200'),
(2, 4, 'serper_search_2', 'tool_use', 1960, 512, 0, 0, 0, FALSE, FALSE, NULL),
(2, 5, 'content_extract', 'tool_use', 1820, 1024, 0, 0, 0, FALSE, FALSE, NULL),
(2, 6, 'synthesis_pass_1', 'model_call', 1280, 5800, 8400, 1200, 2400, FALSE, TRUE, 'B200 2.5x faster on synthesis vs H200'),
(2, 7, 'citation_check', 'model_call', 880, 5400, 6800, 980, 1980, TRUE, FALSE, NULL),
(2, 8, 'fact_verify', 'tool_use', 1180, 256, 0, 0, 0, FALSE, FALSE, NULL),
(2, 9, 'final_synthesis', 'model_call', 920, 5200, 1900, 1100, 720, TRUE, FALSE, NULL),
(2, 10, 'format_output', 'cpu_compute', 50, 64, 0, 0, 0, FALSE, FALSE, NULL),
(2, 11, 'return_response', 'io_wait', 110, 32, 0, 540, 0, FALSE, FALSE, NULL),
(4, 1, 'load_context', 'memory_read', 380, 8200, 8000, 0, 1240, TRUE, FALSE, 'Codebase loaded'),
(4, 2, 'static_analysis', 'cpu_compute', 620, 2048, 0, 0, 0, FALSE, FALSE, 'ESLint + Pylint local'),
(4, 3, 'security_scan', 'tool_use', 580, 256, 0, 0, 0, FALSE, FALSE, NULL),
(4, 4, 'ai_review_pass1', 'model_call', 1620, 4800, 6400, 980, 1840, FALSE, TRUE, 'Biggest single step'),
(4, 5, 'ai_review_pass2', 'model_call', 580, 4400, 3200, 720, 920, TRUE, FALSE, 'Prefix cache HIT'),
(4, 6, 'merge_findings', 'cpu_compute', 220, 128, 0, 0, 0, FALSE, FALSE, NULL),
(4, 7, 'draft_pr_summary', 'model_call', 200, 3200, 600, 1400, 220, TRUE, FALSE, NULL),
(6, 1, 'intent_classify', 'model_call', 95, 1024, 320, 80, 110, TRUE, FALSE, 'Groq LPU — 95ms total step'),
(6, 2, 'kb_search', 'tool_use', 120, 512, 0, 0, 0, FALSE, FALSE, NULL),
(6, 3, 'response_gen', 'model_call', 195, 2048, 1480, 240, 380, FALSE, TRUE, 'Throughput-bound; main step'),
(11, 1, 'embed_query', 'model_call', 80, 256, 64, 0, 18, TRUE, FALSE, NULL),
(11, 2, 'vector_search', 'tool_use', 85, 16384, 0, 0, 0, FALSE, FALSE, 'ANN search in Weaviate'),
(11, 3, 'rerank', 'model_call', 320, 2048, 1800, 0, 540, FALSE, FALSE, 'Cross-encoder'),
(11, 4, 'final_generation', 'model_call', 695, 4400, 2336, 680, 720, TRUE, TRUE, 'Bottleneck step')
ON CONFLICT DO NOTHING;
