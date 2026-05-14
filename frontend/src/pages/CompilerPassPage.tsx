import { useEffect, useMemo, useState } from 'react';
import { Hammer, RefreshCcw, GitMerge } from 'lucide-react';
import { apiFetch } from '../api';

type Pass = {
  id: number; chip_id: number; chip_name?: string;
  stack: string; pass_name: string; category: string;
  baseline_tokens_per_sec: number; optimized_tokens_per_sec: number; speedup: number;
  baseline_latency_p99_ms: number; optimized_latency_p99_ms: number;
  memory_delta_pct: number; enabled_by_default: boolean;
  description: string; reference: string; recorded_at: string;
};
type StackAgg = { stack: string; pass_count: number; avg_speedup: number; max_speedup: number; avg_memory_delta: number; default_count: number };
type CategoryAgg = { category: string; pass_count: number; avg_speedup: number };
type Cumulative = {
  chip_id: number; stack: string; pass_count: number;
  final_cumulative_speedup: number; final_memory_delta_pct: number;
  timeline: (Pass & { cumulative_speedup: number; cumulative_memory_delta_pct: number })[];
};

const categoryColors: Record<string, string> = {
  memory: 'text-cyan-300', batching: 'text-amber-300', kernel: 'text-violet-300',
  quantization: 'text-pink-300', scheduling: 'text-green-300'
};

export default function CompilerPassPage() {
  const [rows, setRows] = useState<Pass[]>([]);
  const [byStack, setByStack] = useState<StackAgg[]>([]);
  const [categories, setCategories] = useState<CategoryAgg[]>([]);
  const [cumulative, setCumulative] = useState<Cumulative | null>(null);
  const [pick, setPick] = useState({ chip_id: 1, stack: 'vLLM' });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [r, s, cat] = await Promise.all([
        apiFetch('/feat-compiler-pass/'),
        apiFetch('/feat-compiler-pass/by-stack'),
        apiFetch('/feat-compiler-pass/categories')
      ]);
      setRows(r); setByStack(s); setCategories(cat);
    } finally { setLoading(false); }
  }
  async function loadCumulative() {
    try {
      const r = await apiFetch(`/feat-compiler-pass/cumulative?chip_id=${pick.chip_id}&stack=${encodeURIComponent(pick.stack)}`);
      setCumulative(r);
    } catch (e) { setCumulative(null); }
  }
  useEffect(() => { load(); }, []);
  useEffect(() => { loadCumulative(); }, [pick.chip_id, pick.stack]);

  const chipOptions = useMemo(() => Array.from(new Map(rows.map(r => [r.chip_id, r.chip_name])).entries()), [rows]);
  const stackOptions = useMemo(() => Array.from(new Set(rows.map(r => r.stack))), [rows]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Hammer className="w-6 h-6 text-pink-400" />Compiler Pass Lab</h1>
          <p className="text-gray-400 text-sm mt-1">vLLM, TensorRT-LLM, TGI, SGLang, MAX — pass-by-pass PPA on real chips.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-base font-semibold text-white mb-2">By stack</h2>
          <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
            <th className="py-1 pr-3">Stack</th><th className="py-1 pr-3 text-right">Passes</th>
            <th className="py-1 pr-3 text-right">Avg speedup</th><th className="py-1 pr-3 text-right">Best</th>
            <th className="py-1 pr-3 text-right">Mem Δ%</th><th className="py-1 pr-3 text-right">On-default</th>
          </tr></thead><tbody>{byStack.map(s => (
            <tr key={s.stack} className="border-b border-gray-800/60">
              <td className="py-1 pr-3 text-pink-300">{s.stack}</td>
              <td className="py-1 pr-3 text-right text-gray-300">{s.pass_count}</td>
              <td className="py-1 pr-3 text-right text-gray-300">{Number(s.avg_speedup || 1).toFixed(2)}×</td>
              <td className="py-1 pr-3 text-right text-amber-300">{Number(s.max_speedup || 1).toFixed(2)}×</td>
              <td className={`py-1 pr-3 text-right ${Number(s.avg_memory_delta) < 0 ? 'text-green-400' : 'text-gray-300'}`}>{Number(s.avg_memory_delta || 0).toFixed(1)}%</td>
              <td className="py-1 pr-3 text-right text-cyan-300">{s.default_count}</td>
            </tr>
          ))}</tbody></table>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <h2 className="text-base font-semibold text-white mb-2">By category</h2>
          <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
            <th className="py-1 pr-3">Category</th><th className="py-1 pr-3 text-right">Passes</th><th className="py-1 pr-3 text-right">Avg speedup</th>
          </tr></thead><tbody>{categories.map(c => (
            <tr key={c.category} className="border-b border-gray-800/60">
              <td className={`py-1 pr-3 ${categoryColors[c.category] || 'text-white'}`}>{c.category}</td>
              <td className="py-1 pr-3 text-right text-gray-300">{c.pass_count}</td>
              <td className="py-1 pr-3 text-right text-amber-300">{Number(c.avg_speedup || 1).toFixed(2)}×</td>
            </tr>
          ))}</tbody></table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <GitMerge className="w-4 h-4 text-pink-400" />
          <h2 className="text-lg font-semibold text-white">Cumulative pass pipeline</h2>
          <select value={pick.chip_id} onChange={e => setPick({ ...pick, chip_id: Number(e.target.value) })} className="ml-2 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            {chipOptions.map(([id, n]) => <option key={id} value={id}>{n || id}</option>)}
          </select>
          <select value={pick.stack} onChange={e => setPick({ ...pick, stack: e.target.value })} className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm">
            {stackOptions.map(s => <option key={s}>{s}</option>)}
          </select>
          {cumulative && (
            <span className="ml-auto text-xs text-gray-400">
              Final: <span className="text-amber-300 font-bold">{cumulative.final_cumulative_speedup}×</span>
              · Memory Δ: <span className={cumulative.final_memory_delta_pct < 0 ? 'text-green-400' : 'text-gray-300'}>{cumulative.final_memory_delta_pct}%</span>
            </span>
          )}
        </div>
        {cumulative && cumulative.timeline.length > 0 ? (
          <table className="w-full text-sm"><thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
            <th className="py-1 pr-3">#</th><th className="py-1 pr-3">Pass</th><th className="py-1 pr-3">Category</th>
            <th className="py-1 pr-3 text-right">Speedup</th><th className="py-1 pr-3 text-right">Cumulative</th>
            <th className="py-1 pr-3 text-right">Memory Δ</th><th className="py-1 pr-3 text-right">Recorded</th>
          </tr></thead><tbody>{cumulative.timeline.map((p, i) => (
            <tr key={p.id} className="border-b border-gray-800/60">
              <td className="py-1 pr-3 text-gray-400">{i + 1}</td>
              <td className="py-1 pr-3 text-white">{p.pass_name}</td>
              <td className={`py-1 pr-3 ${categoryColors[p.category] || 'text-gray-300'}`}>{p.category}</td>
              <td className="py-1 pr-3 text-right text-amber-300">{Number(p.speedup || 1).toFixed(2)}×</td>
              <td className="py-1 pr-3 text-right text-green-400 font-bold">{p.cumulative_speedup}×</td>
              <td className="py-1 pr-3 text-right text-gray-300">{p.cumulative_memory_delta_pct}%</td>
              <td className="py-1 pr-3 text-right text-gray-500 text-xs">{(p.recorded_at || '').slice(0, 10)}</td>
            </tr>
          ))}</tbody></table>
        ) : <p className="text-sm text-gray-500">No passes recorded for this chip × stack combination.</p>}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">All compiler passes ({rows.length})</h2>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900"><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-3">Chip</th><th className="py-2 pr-3">Stack</th><th className="py-2 pr-3">Pass</th>
              <th className="py-2 pr-3">Category</th><th className="py-2 pr-3 text-right">Speedup</th>
              <th className="py-2 pr-3 text-right">Mem Δ</th><th className="py-2 pr-3">Default?</th>
              <th className="py-2 pr-3">Reference</th>
            </tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id} className="border-b border-gray-800/60">
                <td className="py-2 pr-3 text-cyan-300">{r.chip_name}</td>
                <td className="py-2 pr-3 text-pink-300">{r.stack}</td>
                <td className="py-2 pr-3 text-white text-xs">{r.pass_name}</td>
                <td className={`py-2 pr-3 ${categoryColors[r.category] || 'text-gray-300'}`}>{r.category}</td>
                <td className="py-2 pr-3 text-right text-amber-300">{Number(r.speedup || 1).toFixed(2)}×</td>
                <td className={`py-2 pr-3 text-right ${Number(r.memory_delta_pct) < 0 ? 'text-green-400' : 'text-gray-300'}`}>{r.memory_delta_pct ?? 0}%</td>
                <td className="py-2 pr-3 text-xs">{r.enabled_by_default ? <span className="text-green-400">default</span> : <span className="text-gray-500">opt-in</span>}</td>
                <td className="py-2 pr-3 text-gray-500 text-xs truncate max-w-[200px]">{r.reference}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
