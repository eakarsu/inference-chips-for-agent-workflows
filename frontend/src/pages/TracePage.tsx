import { useEffect, useState } from 'react';
import { Activity, RefreshCcw, Layers, AlertTriangle } from 'lucide-react';
import { apiFetch } from '../api';

type Trace = {
  id: number; workflow_id: number; chip_id: number; workflow_name?: string; chip_name?: string;
  trace_label: string; framework: string; total_steps: number; total_latency_ms: number;
  total_tokens_in: number; total_tokens_out: number; kv_peak_gb: number;
  prompt_cache_hit_rate: number; recorded_at: string; recorded_step_count: number;
};
type Step = {
  id: number; trace_id: number; position: number; step_name: string; step_type: string;
  latency_ms: number; memory_mb: number; tokens_in: number; tokens_out: number;
  kv_delta_mb: number; cache_hit: boolean; is_bottleneck: boolean; notes?: string;
};
type TraceDetail = {
  trace: Trace;
  steps: Step[];
  type_breakdown: { type: string; count: number; total_latency_ms: number; total_kv_delta_mb: number; latency_pct: number }[];
  computed_total_latency_ms: number;
};

const typeColors: Record<string, string> = {
  model_call: 'text-amber-300', tool_use: 'text-cyan-300',
  memory_read: 'text-violet-300', cpu_compute: 'text-pink-300', io_wait: 'text-green-300'
};

export default function TracePage() {
  const [traces, setTraces] = useState<Trace[]>([]);
  const [selected, setSelected] = useState<TraceDetail | null>(null);
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const r = await apiFetch('/feat-trace/');
      setTraces(r);
      if (r.length && !selected) await loadDetail(r[0].id);
    } finally { setLoading(false); }
  }
  async function loadDetail(id: number) {
    try {
      const d = await apiFetch(`/feat-trace/${id}`);
      setSelected(d);
    } catch (e) { console.error(e); }
  }
  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Activity className="w-6 h-6 text-green-400" />Agent Loop Profiler</h1>
          <p className="text-gray-400 text-sm mt-1">Trace recordings from LangGraph / openai-agents / autogen — per-step latency, KV deltas, cache hits.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 lg:col-span-1">
          <h2 className="text-base font-semibold text-white mb-3 flex items-center gap-2"><Layers className="w-4 h-4 text-green-400" />Traces ({traces.length})</h2>
          <div className="space-y-1 max-h-[60vh] overflow-y-auto">
            {traces.map(t => (
              <button key={t.id} onClick={() => loadDetail(t.id)} className={`w-full text-left p-2 rounded-lg border transition-colors text-sm ${selected?.trace.id === t.id ? 'bg-green-900/30 border-green-700' : 'bg-gray-800/40 border-gray-800 hover:border-gray-700'}`}>
                <div className="font-medium text-white text-xs">{t.trace_label}</div>
                <div className="text-xs text-gray-400 mt-0.5">
                  <span className="text-cyan-300">{t.chip_name || '—'}</span>
                  <span className="mx-1">·</span>
                  <span>{t.framework}</span>
                  <span className="mx-1">·</span>
                  <span>{t.total_steps} steps · {Number(t.total_latency_ms).toLocaleString()}ms</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-4">
          {selected && (<>
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="text-white font-medium">{selected.trace.trace_label}</div>
                  <div className="text-xs text-gray-400">{selected.trace.workflow_name || '—'} · {selected.trace.chip_name || '—'} · {selected.trace.framework}</div>
                </div>
                <div className="text-right text-xs text-gray-400">
                  <div>Recorded {(selected.trace.recorded_at || '').slice(0, 10)}</div>
                  <div className="text-green-400">Cache hit {(Number(selected.trace.prompt_cache_hit_rate || 0) * 100).toFixed(0)}%</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-3">
                <Mini label="Total latency" value={`${Number(selected.computed_total_latency_ms).toLocaleString()} ms`} />
                <Mini label="Steps" value={String(selected.steps.length)} />
                <Mini label="Tokens in" value={Number(selected.trace.total_tokens_in || 0).toLocaleString()} />
                <Mini label="Tokens out" value={Number(selected.trace.total_tokens_out || 0).toLocaleString()} />
                <Mini label="KV peak" value={`${Number(selected.trace.kv_peak_gb || 0).toFixed(1)} GB`} />
              </div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Latency by step type</h3>
              <div className="space-y-1">{selected.type_breakdown.map(b => (
                <div key={b.type} className="flex items-center gap-2 text-xs">
                  <span className={`w-24 truncate ${typeColors[b.type] || 'text-gray-300'}`}>{b.type}</span>
                  <div className="flex-1 bg-gray-800 rounded-full h-3 overflow-hidden">
                    <div className="bg-green-500 h-3" style={{ width: `${Math.min(b.latency_pct, 100)}%` }} />
                  </div>
                  <span className="text-gray-300 w-20 text-right">{Number(b.total_latency_ms).toFixed(0)} ms</span>
                  <span className="text-gray-500 w-12 text-right">{b.latency_pct}%</span>
                </div>
              ))}</div>
            </div>

            <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-2">Steps ({selected.steps.length})</h3>
              <div className="overflow-x-auto max-h-[50vh]">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-gray-900"><tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="py-1 pr-2">#</th><th className="py-1 pr-2">Step</th><th className="py-1 pr-2">Type</th>
                    <th className="py-1 pr-2 text-right">Latency</th><th className="py-1 pr-2 text-right">tok in/out</th>
                    <th className="py-1 pr-2 text-right">+KV</th><th className="py-1 pr-2">Cache</th><th className="py-1 pr-2">Hot</th>
                  </tr></thead>
                  <tbody>{selected.steps.map(s => (
                    <tr key={s.id} className="border-b border-gray-800/60">
                      <td className="py-1 pr-2 text-gray-400">{s.position}</td>
                      <td className="py-1 pr-2 text-white">{s.step_name}</td>
                      <td className={`py-1 pr-2 ${typeColors[s.step_type] || 'text-gray-300'}`}>{s.step_type}</td>
                      <td className="py-1 pr-2 text-right text-amber-300">{Number(s.latency_ms || 0).toFixed(0)} ms</td>
                      <td className="py-1 pr-2 text-right text-gray-300 text-[10px]">{s.tokens_in || 0} / {s.tokens_out || 0}</td>
                      <td className="py-1 pr-2 text-right text-violet-300">{s.kv_delta_mb ? `${s.kv_delta_mb} MB` : '—'}</td>
                      <td className="py-1 pr-2 text-green-400 text-[10px]">{s.cache_hit ? 'HIT' : ''}</td>
                      <td className="py-1 pr-2">{s.is_bottleneck ? <AlertTriangle className="w-3 h-3 text-red-400" /> : ''}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (<div className="bg-gray-800/60 rounded p-2 border border-gray-700">
    <div className="text-[10px] text-gray-400 uppercase">{label}</div>
    <div className="text-sm text-white font-semibold">{value}</div>
  </div>);
}
