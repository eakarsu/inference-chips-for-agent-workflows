-- Seed data for ChipProfiler

INSERT INTO users (email, password, name) VALUES
('admin@demo.com', '$2b$10$e4dPQpe3XIDluCZCv3b3iu/H/3f816tgim6l5ly5k7pChHG235Dey', 'Chip Analyst')
ON CONFLICT (email) DO NOTHING;

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
