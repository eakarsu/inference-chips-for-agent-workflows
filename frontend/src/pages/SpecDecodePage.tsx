import { useEffect, useState } from 'react';
import { Sparkles, RefreshCcw, Sliders } from 'lucide-react';
import { apiFetch } from '../api';

type Config = {
  id: number; chip_id: number; chip_name?: string;
  target_model: string; draft_model: string; draft_params_b: number;
  num_draft_tokens: number; acceptance_rate: number; baseline_tokens_per_sec: number;
  spec_tokens_per_sec: number; speedup: number; extra_kv_mb: number;
  prompt_caching_hit_rate: number; workload: string; observed_at: string; notes?: string;
};
type ByChip = { chip_id: number; chip_name: string; config_count: number; avg_speedup: number; best_speedup: number; avg_acceptance: number };
type SimResult = {
  alpha: number; gamma: number; draft_cost_ratio: number;
  expected_tokens_per_verify: number; cost_per_step: number; cache_multiplier: number;
  speedup: number; projected_tokens_per_sec: number | null;
};

export default function SpecDecodePage() {
  const [rows, setRows] = useState<Config[]>([]);
  const [byChip, setByChip] = useState<ByChip[]>([]);
  const [loading, setLoading] = useState(false);
  const [sim, setSim] = useState({
    acceptance_rate: 0.74, num_draft_tokens: 5, draft_cost_ratio: 0.014,
    baseline_tokens_per_sec: 38, prompt_caching_hit_rate: 0.0
  });
  const [simResult, setSimResult] = useState<SimResult | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [r, bc] = await Promise.all([apiFetch('/feat-spec-decode/'), apiFetch('/feat-spec-decode/by-chip')]);
      setRows(r); setByChip(bc);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function runSim() {
    try {
      const r = await apiFetch('/feat-spec-decode/simulate', { method: 'POST', body: JSON.stringify(sim) });
      setSimResult(r);
    } catch (e) { console.error(e); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Sparkles className="w-6 h-6 text-violet-400" />Speculative Decoding Tuner</h1>
          <p className="text-gray-400 text-sm mt-1">Leviathan et al. acceptance math + production speedup measurements.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Sliders className="w-4 h-4 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">Acceptance-rate simulator</h2>
          <span className="text-xs text-gray-500 ml-2">E[tokens] = (1 - α^(γ+1)) / (1 - α)</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <NumField label="Acceptance α" step={0.01} value={sim.acceptance_rate} onChange={v => setSim({ ...sim, acceptance_rate: v })} />
          <NumField label="Draft tokens γ" value={sim.num_draft_tokens} onChange={v => setSim({ ...sim, num_draft_tokens: v })} />
          <NumField label="Draft cost ratio" step={0.001} value={sim.draft_cost_ratio} onChange={v => setSim({ ...sim, draft_cost_ratio: v })} />
          <NumField label="Baseline tok/s" value={sim.baseline_tokens_per_sec} onChange={v => setSim({ ...sim, baseline_tokens_per_sec: v })} />
          <NumField label="Prompt-cache hit %" step={0.01} value={sim.prompt_caching_hit_rate} onChange={v => setSim({ ...sim, prompt_caching_hit_rate: v })} />
        </div>
        <button onClick={runSim} className="mt-3 bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg">Compute speedup</button>
        {simResult && (
          <div className="mt-4 grid grid-cols-3 md:grid-cols-5 gap-3 text-sm">
            <Stat label="E[tokens / verify]" value={String(simResult.expected_tokens_per_verify)} />
            <Stat label="Cost / step" value={String(simResult.cost_per_step)} />
            <Stat label="Cache multiplier" value={String(simResult.cache_multiplier)} />
            <Stat label="Speedup" value={`${simResult.speedup}×`} highlight />
            <Stat label="Projected tok/s" value={simResult.projected_tokens_per_sec != null ? String(simResult.projected_tokens_per_sec) : '—'} />
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">Best speedup per chip</h2>
        <table className="w-full text-sm">
          <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
            <th className="py-2 pr-3">Chip</th><th className="py-2 pr-3 text-right">Configs</th>
            <th className="py-2 pr-3 text-right">Avg speedup</th><th className="py-2 pr-3 text-right">Best</th>
            <th className="py-2 pr-3 text-right">Avg accept</th>
          </tr></thead>
          <tbody>{byChip.map(c => (
            <tr key={c.chip_id} className="border-b border-gray-800/60">
              <td className="py-2 pr-3 text-cyan-300">{c.chip_name}</td>
              <td className="py-2 pr-3 text-right text-gray-300">{c.config_count}</td>
              <td className="py-2 pr-3 text-right text-gray-300">{Number(c.avg_speedup || 1).toFixed(2)}×</td>
              <td className="py-2 pr-3 text-right text-amber-300">{Number(c.best_speedup || 1).toFixed(2)}×</td>
              <td className="py-2 pr-3 text-right text-violet-300">{(Number(c.avg_acceptance || 0) * 100).toFixed(0)}%</td>
            </tr>
          ))}</tbody>
        </table>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">All configs ({rows.length})</h2>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900"><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-3">Chip</th><th className="py-2 pr-3">Target</th><th className="py-2 pr-3">Draft</th>
              <th className="py-2 pr-3 text-right">γ</th><th className="py-2 pr-3 text-right">α</th>
              <th className="py-2 pr-3 text-right">Baseline</th><th className="py-2 pr-3 text-right">Spec</th>
              <th className="py-2 pr-3 text-right">Speedup</th><th className="py-2 pr-3 text-right">+KV (MB)</th>
              <th className="py-2 pr-3 text-right">Cache hit</th><th className="py-2 pr-3">Workload</th>
            </tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id} className="border-b border-gray-800/60">
                <td className="py-2 pr-3 text-cyan-300">{r.chip_name}</td>
                <td className="py-2 pr-3 text-white">{r.target_model}</td>
                <td className="py-2 pr-3 text-gray-300 text-xs">{r.draft_model}</td>
                <td className="py-2 pr-3 text-right text-gray-300">{r.num_draft_tokens}</td>
                <td className="py-2 pr-3 text-right text-violet-300">{(Number(r.acceptance_rate || 0) * 100).toFixed(0)}%</td>
                <td className="py-2 pr-3 text-right text-gray-300">{r.baseline_tokens_per_sec}</td>
                <td className="py-2 pr-3 text-right text-amber-300">{r.spec_tokens_per_sec}</td>
                <td className={`py-2 pr-3 text-right font-bold ${Number(r.speedup) >= 2.5 ? 'text-green-400' : Number(r.speedup) >= 1.5 ? 'text-amber-300' : 'text-gray-400'}`}>{Number(r.speedup || 1).toFixed(2)}×</td>
                <td className="py-2 pr-3 text-right text-gray-400">{r.extra_kv_mb ?? 0}</td>
                <td className="py-2 pr-3 text-right text-gray-300">{r.prompt_caching_hit_rate ? `${(Number(r.prompt_caching_hit_rate) * 100).toFixed(0)}%` : '—'}</td>
                <td className="py-2 pr-3 text-gray-400">{r.workload}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function NumField({ label, value, onChange, step }: { label: string; value: number; onChange: (v: number) => void; step?: number }) {
  return (<div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <input type="number" step={step || 1} value={value} onChange={e => onChange(parseFloat(e.target.value) || 0)} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm" />
  </div>);
}
function Stat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (<div className={`rounded-lg p-3 border ${highlight ? 'bg-violet-900/30 border-violet-700' : 'bg-gray-800/60 border-gray-700'}`}>
    <div className="text-xs text-gray-400 uppercase">{label}</div>
    <div className={`text-lg font-semibold mt-0.5 ${highlight ? 'text-violet-200' : 'text-white'}`}>{value}</div>
  </div>);
}
