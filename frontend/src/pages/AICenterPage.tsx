
import FullAIExamples, { useFullAIExamples } from "../components/FullAIExamples";
import { useEffect, useState } from 'react';
import { api } from '../api';
import AIResponse from '../components/AIResponse';
import { Cpu, GitBranch, TrendingUp, Layers, DollarSign, Activity, Leaf, FileBarChart2, ShieldAlert, Globe, LineChart, Binary, Workflow } from 'lucide-react';

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
  // Apply pass 7 backlog tabs
  { key: 'deployment-strategy', label: 'Deployment Strategy', icon: Globe },
  { key: 'scaling-curve-forecaster', label: 'Scaling Forecaster', icon: LineChart },
  { key: 'quantization-advisor', label: 'Quantization Advisor', icon: Binary },
  { key: 'workflow-profiler-analyzer', label: 'Workflow Profiler', icon: Workflow },
];

export default function AICenterPage() {
  const fullAIExamples = useFullAIExamples();

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
  // Apply pass 7 backlog inputs
  const [regionsList, setRegionsList] = useState('us-west-2,us-east-1,eu-west-1');
  const [slaP99Ms, setSlaP99Ms] = useState('150');
  const [trafficPattern, setTrafficPattern] = useState('diurnal, 3x peak vs trough, weekend dip');
  const [currentQps, setCurrentQps] = useState('250');
  const [growthRatePct, setGrowthRatePct] = useState('15');
  const [horizonMonths, setHorizonMonths] = useState('12');
  const [modelName, setModelName] = useState('Llama-3.1-70B-Instruct');
  const [modelParamsB, setModelParamsB] = useState('70');
  const [currentDtype, setCurrentDtype] = useState('fp16');
  const [accuracyTolerancePct, setAccuracyTolerancePct] = useState('1.5');
  const [targetWorkload, setTargetWorkload] = useState('agent loop with ReAct + tool use');

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

  const run = async () => {
    if (needsWorkflow && !selectedWorkflow) { setResult('Select an existing workflow before running this analysis.'); return; }
    if (needsChip && !selectedChip) { setResult('Select an existing chip before running this analysis.'); return; }
    if (activeTab === 'benchmark-narrator' && !benchmarks.length) { setResult('Add real benchmark records before running this analysis.'); return; }
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
      } else if (activeTab === 'vendor-risk-scorer') {
        res = await api.aiVendorRiskScorer({ chip: selectedChip, deployment_horizon_years: Number(horizonYears) });
      } else if (activeTab === 'deployment-strategy') {
        res = await api.aiDeploymentStrategy({
          workflow: selectedWorkflow,
          chip: selectedChip,
          regions: regionsList.split(',').map(s => s.trim()).filter(Boolean),
          sla_p99_ms: Number(slaP99Ms),
          traffic_pattern: trafficPattern,
        });
      } else if (activeTab === 'scaling-curve-forecaster') {
        res = await api.aiScalingCurveForecaster({
          chip: selectedChip,
          workflow: selectedWorkflow,
          current_qps: Number(currentQps),
          growth_rate_pct_monthly: Number(growthRatePct),
          horizon_months: Number(horizonMonths),
        });
      } else if (activeTab === 'quantization-advisor') {
        res = await api.aiQuantizationAdvisor({
          chip: selectedChip,
          model_name: modelName,
          model_params_b: Number(modelParamsB),
          current_dtype: currentDtype,
          accuracy_tolerance_pct: Number(accuracyTolerancePct),
          target_workload: targetWorkload,
        });
      } else {
        res = await api.aiWorkflowProfilerAnalyzer({
          workflow: selectedWorkflow,
          steps: workflowSteps.length ? workflowSteps : steps.slice(0, 12),
          chip: selectedChip,
        });
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

  const needsWorkflow = ['chip-recommendation','performance-prediction','bottleneck-analysis','latency-cost-optimizer','throughput-predictor','energy-efficiency-scorer','deployment-strategy','scaling-curve-forecaster','workflow-profiler-analyzer'].includes(activeTab);
  const needsChip = ['performance-prediction','throughput-predictor','energy-efficiency-scorer','vendor-risk-scorer','deployment-strategy','scaling-curve-forecaster','quantization-advisor','workflow-profiler-analyzer'].includes(activeTab);

  return (
    <div className="p-6 max-w-4xl mx-auto" data-full-ai-workspace="AICenterPage"><FullAIExamples controller={fullAIExamples} disabled={Boolean(loading)} />
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
        {needsWorkflow && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Workflow</label>
            <select value={selectedWorkflowId} onChange={e => setSelectedWorkflowId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: selectedWorkflowId, change: e => setSelectedWorkflowId(e.target.value), label: "selectedWorkflowId", manual: false, json: false, sample: '' }, "p1-17002", undefined)}>
              {workflows.map(w => <option key={w.id} value={w.id}>{w.name} ({w.agent_type})</option>)}
            </select>
          </div>
        )}
        {needsChip && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Chip</label>
            <select value={selectedChipId} onChange={e => setSelectedChipId(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: selectedChipId, change: e => setSelectedChipId(e.target.value), label: "selectedChipId", manual: false, json: false, sample: '' }, "p1-17509", undefined)}>
              {chips.map(c => <option key={c.id} value={c.id}>{c.name} ({c.architecture})</option>)}
            </select>
          </div>
        )}
        {activeTab === 'chip-recommendation' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Requirements</label>
            <input value={requirements} onChange={e => setRequirements(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: requirements, change: e => setRequirements(e.target.value), label: "requirements", manual: false, json: false, sample: 'Low latency, high throughput, cost-efficient' }, "p1-18040", undefined)} />
          </div>
        )}
        {activeTab === 'bottleneck-analysis' && workflowSteps.length > 0 && (
          <p className="text-gray-500 text-xs">{workflowSteps.length} steps found · {workflowSteps.filter(s => s.is_bottleneck).length} bottlenecks flagged</p>
        )}
        {activeTab === 'architecture-design' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Use Case</label>
              <input value={useCase} onChange={e => setUseCase(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: useCase, change: e => setUseCase(e.target.value), label: "useCase", manual: false, json: false, sample: 'Real-time LLM inference for agentic workflows' }, "p1-18709", undefined)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Scale &amp; Requirements</label>
              <input value={scale} onChange={e => setScale(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: scale, change: e => setScale(e.target.value), label: "scale", manual: false, json: false, sample: '100M requests/day, 10ms p99 latency requirement' }, "p1-19063", undefined)} />
            </div>
          </>
        )}
        {activeTab === 'latency-cost-optimizer' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Monthly Budget (USD)</label>
              <input type="number" value={budgetUsd} onChange={e => setBudgetUsd(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: budgetUsd, change: e => setBudgetUsd(e.target.value), label: "budgetUsd", manual: false, json: false, sample: '250000' }, "p1-19538", undefined)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Latency Target (ms)</label>
              <input type="number" value={latencyTargetMs} onChange={e => setLatencyTargetMs(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: latencyTargetMs, change: e => setLatencyTargetMs(e.target.value), label: "latencyTargetMs", manual: false, json: false, sample: '100' }, "p1-19905", undefined)} />
            </div>
          </div>
        )}
        {activeTab === 'throughput-predictor' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Batch Sizes (comma-sep)</label>
              <input value={batchSizes} onChange={e => setBatchSizes(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: batchSizes, change: e => setBatchSizes(e.target.value), label: "batchSizes", manual: false, json: false, sample: '1,4,16,64,256' }, "p1-20418", undefined)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Concurrency</label>
              <input type="number" value={concurrency} onChange={e => setConcurrency(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: concurrency, change: e => setConcurrency(e.target.value), label: "concurrency", manual: false, json: false, sample: '32' }, "p1-20765", undefined)} />
            </div>
          </div>
        )}
        {activeTab === 'energy-efficiency-scorer' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Region</label>
            <input value={region} onChange={e => setRegion(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: region, change: e => setRegion(e.target.value), label: "region", manual: false, json: false, sample: 'us-west-2' }, "p1-21200", undefined)} />
          </div>
        )}
        {activeTab === 'benchmark-narrator' && (
          <p className="text-gray-500 text-xs">Will analyze first {Math.min(12, benchmarks.length)} benchmark records.</p>
        )}
        {activeTab === 'vendor-risk-scorer' && (
          <div>
            <label className="block text-xs text-gray-400 mb-1">Deployment Horizon (years)</label>
            <input type="number" value={horizonYears} onChange={e => setHorizonYears(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: horizonYears, change: e => setHorizonYears(e.target.value), label: "horizonYears", manual: false, json: false, sample: '3' }, "p1-21789", undefined)} />
          </div>
        )}
        {activeTab === 'deployment-strategy' && (
          <>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Target Regions (comma-sep)</label>
              <input value={regionsList} onChange={e => setRegionsList(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: regionsList, change: e => setRegionsList(e.target.value), label: "regionsList", manual: false, json: false, sample: 'us-west-2,us-east-1,eu-west-1' }, "p1-22241", undefined)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">SLA p99 (ms)</label>
                <input type="number" value={slaP99Ms} onChange={e => setSlaP99Ms(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: slaP99Ms, change: e => setSlaP99Ms(e.target.value), label: "slaP99Ms", manual: false, json: false, sample: '150' }, "p1-22650", undefined)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Traffic Pattern</label>
                <input value={trafficPattern} onChange={e => setTrafficPattern(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: trafficPattern, change: e => setTrafficPattern(e.target.value), label: "trafficPattern", manual: false, json: false, sample: 'diurnal, 3x peak vs trough, weekend dip' }, "p1-23019", undefined)} />
              </div>
            </div>
          </>
        )}
        {activeTab === 'scaling-curve-forecaster' && (
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Current QPS</label>
              <input type="number" value={currentQps} onChange={e => setCurrentQps(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: currentQps, change: e => setCurrentQps(e.target.value), label: "currentQps", manual: false, json: false, sample: '250' }, "p1-23526", undefined)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Growth % / month</label>
              <input type="number" value={growthRatePct} onChange={e => setGrowthRatePct(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: growthRatePct, change: e => setGrowthRatePct(e.target.value), label: "growthRatePct", manual: false, json: false, sample: '15' }, "p1-23892", undefined)} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Horizon (months)</label>
              <input type="number" value={horizonMonths} onChange={e => setHorizonMonths(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: horizonMonths, change: e => setHorizonMonths(e.target.value), label: "horizonMonths", manual: false, json: false, sample: '12' }, "p1-24264", undefined)} />
            </div>
          </div>
        )}
        {activeTab === 'quantization-advisor' && (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Model Name</label>
                <input value={modelName} onChange={e => setModelName(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: modelName, change: e => setModelName(e.target.value), label: "modelName", manual: false, json: false, sample: 'Llama-3.1-70B-Instruct' }, "p1-24781", undefined)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Params (B)</label>
                <input type="number" value={modelParamsB} onChange={e => setModelParamsB(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: modelParamsB, change: e => setModelParamsB(e.target.value), label: "modelParamsB", manual: false, json: false, sample: '70' }, "p1-25133", undefined)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Current dtype</label>
                <input value={currentDtype} onChange={e => setCurrentDtype(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: currentDtype, change: e => setCurrentDtype(e.target.value), label: "currentDtype", manual: false, json: false, sample: 'fp16' }, "p1-25580", undefined)} />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Accuracy tolerance (% drop)</label>
                <input type="number" value={accuracyTolerancePct} onChange={e => setAccuracyTolerancePct(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: accuracyTolerancePct, change: e => setAccuracyTolerancePct(e.target.value), label: "accuracyTolerancePct", manual: false, json: false, sample: '1.5' }, "p1-25955", undefined)} />
              </div>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Target Workload</label>
              <input value={targetWorkload} onChange={e => setTargetWorkload(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" data-full-ai-field={fullAIExamples.bind({ current: targetWorkload, change: e => setTargetWorkload(e.target.value), label: "targetWorkload", manual: false, json: false, sample: 'agent loop with ReAct + tool use' }, "p1-26361", undefined)} />
            </div>
          </>
        )}
        {activeTab === 'workflow-profiler-analyzer' && workflowSteps.length > 0 && (
          <p className="text-gray-500 text-xs">{workflowSteps.length} steps loaded for selected workflow.</p>
        )}
        {((needsWorkflow && !selectedWorkflow) || (needsChip && !selectedChip) || (activeTab === 'benchmark-narrator' && !benchmarks.length)) && <p role="status" className="text-amber-300 text-xs">This analysis needs {needsWorkflow && !selectedWorkflow ? 'an existing workflow' : needsChip && !selectedChip ? 'an existing chip' : 'real benchmark records'} before generation.</p>}
        <button type="button" onClick={run} disabled={loading || (needsWorkflow && !selectedWorkflow) || (needsChip && !selectedChip) || (activeTab === 'benchmark-narrator' && !benchmarks.length)} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {loading ? 'Analyzing...' : 'Run AI Analysis'}
        </button>
      </div>

      <AIResponse content={result} loading={loading} timestamp={timestamp} />
    </div>
  );
}
