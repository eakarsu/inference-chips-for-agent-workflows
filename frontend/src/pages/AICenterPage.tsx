import { useEffect, useState } from 'react';
import { api } from '../api';
import AIResponse from '../components/AIResponse';
import { Cpu, GitBranch, TrendingUp, Layers, DollarSign, Activity, Leaf, FileBarChart2, ShieldAlert } from 'lucide-react';

const tabs = [
  { key: 'chip-recommendation', label: 'Chip Recommendation', icon: Cpu },
  { key: 'bottleneck-analysis', label: 'Bottleneck Analysis', icon: GitBranch },
  { key: 'performance-prediction', label: 'Performance Prediction', icon: TrendingUp },
  { key: 'architecture-design', label: 'Architecture Design', icon: Layers },
  { key: 'latency-cost-optimizer', label: 'Latency vs Cost', icon: DollarSign },
  { key: 'throughput-predictor', label: 'Throughput Predictor', icon: Activity },
  { key: 'energy-efficiency-scorer', label: 'Energy Efficiency', icon: Leaf },
  { key: 'benchmark-narrator', label: 'Benchmark Narrator', icon: FileBarChart2 },
  { key: 'vendor-risk-scorer', label: 'Vendor Risk', icon: ShieldAlert },
];

export default function AICenterPage() {
  const [activeTab, setActiveTab] = useState('chip-recommendation');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [timestamp, setTimestamp] = useState('');
  const [chips, setChips] = useState<{id:number;name:string;architecture:string;compute_tops:number;memory_bandwidth_gbps:number;kv_cache_gb:number}[]>([]);
  const [workflows, setWorkflows] = useState<{id:number;name:string;agent_type:string;total_steps:number;model_call_pct:number;avg_duration_ms:number}[]>([]);
  const [steps, setSteps] = useState<{id:number;step_name:string;step_type:string;avg_duration_ms:number;memory_mb:number;is_bottleneck:boolean;workflow_name:string}[]>([]);
  const [benchmarks, setBenchmarks] = useState<unknown[]>([]);

  // Form state
  const [selectedChipId, setSelectedChipId] = useState('');
  const [selectedWorkflowId, setSelectedWorkflowId] = useState('');
  const [requirements, setRequirements] = useState('Low latency, high throughput, cost-efficient');
  const [useCase, setUseCase] = useState('Real-time LLM inference for agentic workflows');
  const [scale, setScale] = useState('100M requests/day, 10ms p99 latency requirement');
  // New tab inputs
  const [budgetUsd, setBudgetUsd] = useState('250000');
  const [latencyTargetMs, setLatencyTargetMs] = useState('100');
  const [batchSizes, setBatchSizes] = useState('1,4,16,64,256');
  const [concurrency, setConcurrency] = useState('32');
  const [region, setRegion] = useState('us-west-2');
  const [horizonYears, setHorizonYears] = useState('3');

  useEffect(() => {
    Promise.all([api.getChips(), api.getWorkflows(), api.getSteps(), api.getBenchmarks()]).then(([c, w, s, b]) => {
      setChips(c); setWorkflows(w); setSteps(s); setBenchmarks(b);
      if (c.length) setSelectedChipId(String(c[0].id));
      if (w.length) setSelectedWorkflowId(String(w[0].id));
    });
  }, []);

  const selectedChip = chips.find(c => String(c.id) === selectedChipId);
  const selectedWorkflow = workflows.find(w => String(w.id) === selectedWorkflowId);
  const workflowSteps = steps.filter(s => selectedWorkflow && s.workflow_name === selectedWorkflow.name);

  // Sample prefill helpers: try to match a real chip/workflow by name substring
  const pickChip = (needle: string) => {
    const n = needle.toLowerCase();
    const hit = chips.find(c => c.name.toLowerCase().includes(n));
    if (hit) setSelectedChipId(String(hit.id));
  };
  const pickWorkflow = (needle: string) => {
    const n = needle.toLowerCase();
    const hit = workflows.find(w => w.name.toLowerCase().includes(n) || w.agent_type.toLowerCase().includes(n));
    if (hit) setSelectedWorkflowId(String(hit.id));
  };

  type Sample = { label: string; apply: () => void };
  const samplesByTab: Record<string, Sample[]> = {
    'chip-recommendation': [
      { label: 'RAG on H100', apply: () => { pickChip('H100'); pickWorkflow('rag'); setRequirements('Sub-150ms p99, 8K context, FP8 KV-cache, $0.0008/1K tok target'); } },
      { label: 'Multi-agent on B200', apply: () => { pickChip('B200'); pickWorkflow('multi-agent'); setRequirements('5 concurrent agents, 32K context, NVLink fabric, 2.4x perf/W vs Hopper'); } },
      { label: 'Voice on Groq LPU', apply: () => { pickChip('Groq'); pickWorkflow('voice'); setRequirements('Streaming TTFT < 80ms, 500 TPS sustained, deterministic latency'); } },
    ],
    'bottleneck-analysis': [
      { label: 'ReAct loop', apply: () => { pickWorkflow('react'); } },
      { label: 'Long-context RAG', apply: () => { pickWorkflow('long-context'); } },
      { label: 'Multi-agent', apply: () => { pickWorkflow('multi-agent'); } },
    ],
    'performance-prediction': [
      { label: 'H100 + RAG', apply: () => { pickChip('H100'); pickWorkflow('rag'); } },
      { label: 'MI300X + ReAct', apply: () => { pickChip('MI300X'); pickWorkflow('react'); } },
      { label: 'TPU v5p + multi-agent', apply: () => { pickChip('TPU v5p'); pickWorkflow('multi-agent'); } },
    ],
    'architecture-design': [
      { label: 'Realtime RAG', apply: () => { setUseCase('Real-time RAG with 70B model and 32K context for enterprise copilots'); setScale('50M req/day, p99 < 200ms, $400K/mo budget, multi-region us-west-2 + eu-west-1'); } },
      { label: 'Voice agent fleet', apply: () => { setUseCase('Voice agent serving via Groq LPU + Cerebras WSE-3 backup for spike traffic'); setScale('200K concurrent calls, TTFT < 100ms, 99.95% SLA'); } },
      { label: 'Long-context multi-agent', apply: () => { setUseCase('1M-token long-context multi-agent orchestration on B200/MI325X mixed fleet'); setScale('5M agent runs/day, 1M ctx tokens, p95 < 30s end-to-end'); } },
    ],
    'latency-cost-optimizer': [
      { label: 'RAG / $250K / 100ms', apply: () => { pickWorkflow('rag'); setBudgetUsd('250000'); setLatencyTargetMs('100'); } },
      { label: 'Voice / $80K / 50ms', apply: () => { pickWorkflow('voice'); setBudgetUsd('80000'); setLatencyTargetMs('50'); } },
      { label: 'Multi-agent / $500K / 250ms', apply: () => { pickWorkflow('multi-agent'); setBudgetUsd('500000'); setLatencyTargetMs('250'); } },
    ],
    'throughput-predictor': [
      { label: 'H100 batch sweep', apply: () => { pickChip('H100'); pickWorkflow('rag'); setBatchSizes('1,4,16,64,256'); setConcurrency('32'); } },
      { label: 'B200 large batch', apply: () => { pickChip('B200'); pickWorkflow('multi-agent'); setBatchSizes('8,32,128,512,2048'); setConcurrency('128'); } },
      { label: 'Groq LPU streaming', apply: () => { pickChip('Groq'); pickWorkflow('voice'); setBatchSizes('1,2,4,8,16'); setConcurrency('512'); } },
    ],
    'energy-efficiency-scorer': [
      { label: 'H100 us-west-2', apply: () => { pickChip('H100'); pickWorkflow('rag'); setRegion('us-west-2'); } },
      { label: 'MI300X eu-west-1', apply: () => { pickChip('MI300X'); pickWorkflow('react'); setRegion('eu-west-1'); } },
      { label: 'Trainium2 us-east-1', apply: () => { pickChip('Trainium2'); pickWorkflow('long-context'); setRegion('us-east-1'); } },
    ],
    'benchmark-narrator': [
      { label: 'Top 12 rows', apply: () => { /* uses first 12 by default */ } },
    ],
    'vendor-risk-scorer': [
      { label: 'NVIDIA / 3yr', apply: () => { pickChip('H100'); setHorizonYears('3'); } },
      { label: 'AMD MI325X / 5yr', apply: () => { pickChip('MI325X'); setHorizonYears('5'); } },
      { label: 'Sohu (Etched) / 2yr', apply: () => { pickChip('Sohu'); setHorizonYears('2'); } },
    ],
  };
  const currentSamples = samplesByTab[activeTab] || [];

  const run = async () => {
    setLoading(true); setResult('');
    try {
      let res: {result: string};
      if (activeTab === 'chip-recommendation') {
        res = await api.aiChipRecommendation({ workflow: selectedWorkflow, requirements });
      } else if (activeTab === 'bottleneck-analysis') {
        res = await api.aiBottleneckAnalysis({ workflow_steps: workflowSteps.length ? workflowSteps : steps.slice(0, 8) });
      } else if (activeTab === 'performance-prediction') {
        res = await api.aiPerformancePrediction({ chip: selectedChip, workflow: selectedWorkflow });
      } else if (activeTab === 'architecture-design') {
        res = await api.aiArchitectureDesign({ use_case: useCase, scale });
      } else if (activeTab === 'latency-cost-optimizer') {
        res = await api.aiLatencyCostOptimizer({
          workflow: selectedWorkflow,
          candidate_chips: chips.slice(0, 6),
          budget_usd: Number(budgetUsd),
          latency_target_ms: Number(latencyTargetMs),
        });
      } else if (activeTab === 'throughput-predictor') {
        res = await api.aiThroughputPredictor({
          chip: selectedChip,
          workflow: selectedWorkflow,
          batch_sizes: batchSizes.split(',').map(s => parseInt(s.trim())).filter(n => !isNaN(n)),
          concurrency: Number(concurrency),
        });
      } else if (activeTab === 'energy-efficiency-scorer') {
        res = await api.aiEnergyEfficiencyScorer({ chip: selectedChip, workflow: selectedWorkflow, region });
      } else if (activeTab === 'benchmark-narrator') {
        res = await api.aiBenchmarkNarrator({ benchmarks: benchmarks.slice(0, 12) });
      } else {
        res = await api.aiVendorRiskScorer({ chip: selectedChip, deployment_horizon_years: Number(horizonYears) });
      }
      setResult(res.result);
      setTimestamp(new Date().toLocaleTimeString());
    } catch (e) {
      const msg = String(e);
      if (msg.includes('AI service unavailable')) {
        setResult('AI is unavailable. Set OPENROUTER_API_KEY in .env and restart the backend.');
      } else {
        setResult('Error: ' + msg);
      }
    }
    finally { setLoading(false); }
  };

  const needsWorkflow = ['chip-recommendation','performance-prediction','bottleneck-analysis','latency-cost-optimizer','throughput-predictor','energy-efficiency-scorer'].includes(activeTab);
  const needsChip = ['performance-prediction','throughput-predictor','energy-efficiency-scorer','vendor-risk-scorer'].includes(activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">AI Intelligence Center</h1>
        <p className="text-gray-400 text-sm mt-1">AI-powered chip selection, optimization, efficiency, and risk analysis</p>
      </div>

      <div className="flex gap-2 mb-6 flex-wrap">
        {tabs.map(t => {
          const Icon = t.icon;
          return (
            <button key={t.key} onClick={() => { setActiveTab(t.key); setResult(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === t.key ? 'bg-cyan-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-white hover:bg-gray-700'}`}>
              <Icon className="w-4 h-4" />{t.label}
            </button>
          );
        })}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 space-y-4">
        {currentSamples.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Samples</span>
            {currentSamples.map(s => (
              <button key={s.label} type="button" onClick={s.apply}
                className="px-2.5 py-1 rounded-md bg-gray-800 hover:bg-cyan-700 text-gray-300 hover:text-white text-xs font-medium border border-gray-700 hover:border-cyan-600 transition-colors">
                {s.label}
              </button>
            ))}
          </div>
        )}
        {needsWorkflow && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Workflow</label>
            <select value={selectedWorkflowId} onChange={e => setSelectedWorkflowId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
              {workflows.map(w => <option key={w.id} value={w.id}>{w.name} ({w.agent_type})</option>)}
            </select>
          </div>
        )}
        {needsChip && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Chip</label>
            <select value={selectedChipId} onChange={e => setSelectedChipId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
              {chips.map(c => <option key={c.id} value={c.id}>{c.name} ({c.architecture})</option>)}
            </select>
          </div>
        )}
        {activeTab === 'chip-recommendation' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Requirements</label>
            <input value={requirements} onChange={e => setRequirements(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
        )}
        {activeTab === 'bottleneck-analysis' && workflowSteps.length > 0 && (
          <p className="text-gray-500 text-xs">{workflowSteps.length} steps found · {workflowSteps.filter(s => s.is_bottleneck).length} bottlenecks flagged</p>
        )}
        {activeTab === 'architecture-design' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Use Case</label>
              <input value={useCase} onChange={e => setUseCase(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Scale &amp; Requirements</label>
              <input value={scale} onChange={e => setScale(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
            </div>
          </>
        )}
        {activeTab === 'latency-cost-optimizer' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Monthly Budget (USD)</label>
              <input type="number" value={budgetUsd} onChange={e => setBudgetUsd(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Latency Target (ms)</label>
              <input type="number" value={latencyTargetMs} onChange={e => setLatencyTargetMs(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
        )}
        {activeTab === 'throughput-predictor' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Batch Sizes (comma-sep)</label>
              <input value={batchSizes} onChange={e => setBatchSizes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Concurrency</label>
              <input type="number" value={concurrency} onChange={e => setConcurrency(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
            </div>
          </div>
        )}
        {activeTab === 'energy-efficiency-scorer' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Region</label>
            <input value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
        )}
        {activeTab === 'benchmark-narrator' && (
          <p className="text-gray-500 text-xs">Will analyze first {Math.min(12, benchmarks.length)} benchmark records.</p>
        )}
        {activeTab === 'vendor-risk-scorer' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Deployment Horizon (years)</label>
            <input type="number" value={horizonYears} onChange={e => setHorizonYears(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
        )}
        <button onClick={run} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      <AIResponse content={result} loading={loading} timestamp={timestamp} />
    </div>
  );
}
