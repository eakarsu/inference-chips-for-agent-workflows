require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/chips', require('./routes/chips'));
app.use('/api/workflows', require('./routes/workflows'));
app.use('/api/steps', require('./routes/steps'));
app.use('/api/benchmarks', require('./routes/benchmarks'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/research', require('./routes/research'));
app.use('/api/export', require('./routes/export'));
app.use('/api/audit', require('./routes/audit'));
app.use('/api/search', require('./routes/search'));
app.use('/api/admin', require('./routes/sample_data'));
app.use('/api/dashboard', require('./routes/dashboard'));

const PORT = process.env.PORT || 3011;
app.listen(PORT, () => console.log(`ChipProfiler API running on port ${PORT}`));
app.use('/api/gap-ai-kv-cache-sizer', require('./routes/gap-ai-kv-cache-sizer'));
app.use('/api/gap-ai-speculative-decoding-tuner', require('./routes/gap-ai-speculative-decoding-tuner'));
app.use('/api/gap-ai-context-switch-cost', require('./routes/gap-ai-context-switch-cost'));
app.use('/api/gap-ai-compiler-pass-recommender', require('./routes/gap-ai-compiler-pass-recommender'));
app.use('/api/gap-ai-workflow-replay-sim', require('./routes/gap-ai-workflow-replay-sim'));
app.use('/api/gap-nonai-chip-trace-ingest', require('./routes/gap-nonai-chip-trace-ingest'));
app.use('/api/gap-nonai-hdl-linkage', require('./routes/gap-nonai-hdl-linkage'));
app.use('/api/gap-nonai-ppa-sweep-store', require('./routes/gap-nonai-ppa-sweep-store'));
app.use('/api/gap-nonai-hbm-allocation', require('./routes/gap-nonai-hbm-allocation'));
app.use('/api/gap-nonai-mlperf-connector', require('./routes/gap-nonai-mlperf-connector'));
app.use('/api/cf-agent-loop-profiler', require('./routes/cf-agent-loop-profiler'));
app.use('/api/cf-auto-rtl-stubs', require('./routes/cf-auto-rtl-stubs'));
app.use('/api/cf-kvcache-simulator', require('./routes/cf-kvcache-simulator'));
app.use('/api/cf-compiler-pass-search', require('./routes/cf-compiler-pass-search'));
app.use('/api/cf-energy-economics', require('./routes/cf-energy-economics'));

// Deep features (audit batch 2026-05-14)
app.use('/api/feat-kv-allocation', require('./routes/feat-kv-allocation'));
app.use('/api/feat-mlperf', require('./routes/feat-mlperf'));
app.use('/api/feat-spec-decode', require('./routes/feat-spec-decode'));
app.use('/api/feat-compiler-pass', require('./routes/feat-compiler-pass'));
app.use('/api/feat-trace', require('./routes/feat-trace'));

// Health + Custom Views (mounted BEFORE 404 catch-all)
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'chipprofiler-backend' }));
app.use('/api/custom-views', require('./routes/customViews'));
app.use('/api/thermal-throttle', require('./routes/thermalThrottleGuard'));

// 404 catch-all for unknown /api routes
app.use('/api', (_req, res) => res.status(404).json({ error: 'not found' }));
