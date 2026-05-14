import { useEffect, useState } from 'react';
import { Database, Calculator, RefreshCcw, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { apiFetch } from '../api';

type Row = {
  id: number; chip_id: number; chip_name?: string; manufacturer?: string;
  model_name: string; model_params_b: number; hidden_size: number;
  num_layers: number; num_kv_heads: number; head_dim: number; dtype: string;
  context_length: number; concurrent_requests: number; reuse_across_steps: boolean;
  measured_kv_gb: number; prefill_tokens_per_sec: number; decode_tokens_per_sec: number;
  chip_hbm_gb?: number; memory_bandwidth_gbps?: number; notes?: string;
  computed?: { bytes_per_token_mb: number; total_kv_gb: number; effective_tokens: number; reuse_factor_applied: number };
};
type ByChip = {
  chip_id: number; chip_name: string; hbm_gb: number; allocation_count: number;
  avg_kv_gb: number; peak_kv_gb: number; avg_decode_tps: number; headroom_gb: number; utilization_pct: number;
};

const dtypes = ['fp32', 'bf16', 'fp16', 'fp8', 'int8', 'int4'];

export default function KvAllocationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [byChip, setByChip] = useState<ByChip[]>([]);
  const [loading, setLoading] = useState(false);
  const [sim, setSim] = useState({
    num_layers: 80, num_kv_heads: 8, head_dim: 128, dtype: 'fp16',
    context_length: 8192, concurrent_requests: 16, reuse_across_steps: false,
    model_params_b: 70, chip_id: 1
  });
  const [simResult, setSimResult] = useState<{ bytes_per_token_mb: number; total_kv_gb: number; bandwidth_bound_decode_tps: number | null; reuse_factor_applied: number } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [r, bc] = await Promise.all([apiFetch('/feat-kv-allocation/'), apiFetch('/feat-kv-allocation/by-chip')]);
      setRows(r); setByChip(bc);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function runSim() {
    try {
      const r = await apiFetch('/feat-kv-allocation/compute', { method: 'POST', body: JSON.stringify(sim) });
      setSimResult(r);
    } catch (e) { console.error(e); }
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Database className="w-6 h-6 text-cyan-400" />KV Cache Allocation</h1>
          <p className="text-gray-400 text-sm mt-1">Real per-token KV math by chip × model with HBM headroom checks.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Calculator className="w-4 h-4 text-violet-400" />
          <h2 className="text-lg font-semibold text-white">KV Math Calculator</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <NumField label="Layers" value={sim.num_layers} onChange={v => setSim({ ...sim, num_layers: v })} />
          <NumField label="KV heads (GQA)" value={sim.num_kv_heads} onChange={v => setSim({ ...sim, num_kv_heads: v })} />
          <NumField label="Head dim" value={sim.head_dim} onChange={v => setSim({ ...sim, head_dim: v })} />
          <div>
            <label className="block text-xs text-gray-400 mb-1">dtype</label>
            <select value={sim.dtype} onChange={e => setSim({ ...sim, dtype: e.target.value })} className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm">
              {dtypes.map(d => <option key={d}>{d}</option>)}
            </select>
          </div>
          <NumField label="Context (tokens)" value={sim.context_length} onChange={v => setSim({ ...sim, context_length: v })} />
          <NumField label="Concurrent reqs" value={sim.concurrent_requests} onChange={v => setSim({ ...sim, concurrent_requests: v })} />
          <NumField label="Model params (B)" value={sim.model_params_b} onChange={v => setSim({ ...sim, model_params_b: v })} step={0.1} />
          <NumField label="Chip ID (for BW bound)" value={sim.chip_id} onChange={v => setSim({ ...sim, chip_id: v })} />
        </div>
        <div className="flex items-center justify-between mt-3">
          <label className="flex items-center gap-2 text-sm text-gray-300">
            <input type="checkbox" checked={sim.reuse_across_steps} onChange={e => setSim({ ...sim, reuse_across_steps: e.target.checked })} />
            KV reused across agent tool calls (×0.4)
          </label>
          <button onClick={runSim} className="bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold px-4 py-1.5 rounded-lg">Compute</button>
        </div>
        {simResult && (
          <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
            <Stat label="Bytes / token" value={`${simResult.bytes_per_token_mb} MB`} />
            <Stat label="Total KV needed" value={`${simResult.total_kv_gb} GB`} />
            <Stat label="BW-bound decode" value={simResult.bandwidth_bound_decode_tps != null ? `${simResult.bandwidth_bound_decode_tps} tok/s` : '—'} />
          </div>
        )}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-white mb-3">HBM headroom by chip</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-4">Chip</th><th className="py-2 pr-4 text-right">HBM (GB)</th><th className="py-2 pr-4 text-right">Peak KV</th>
              <th className="py-2 pr-4 text-right">Headroom</th><th className="py-2 pr-4 text-right">Utilization</th><th className="py-2 pr-4 text-right">Configs</th>
            </tr></thead>
            <tbody>{byChip.map(c => (
              <tr key={c.chip_id} className="border-b border-gray-800/60">
                <td className="py-2 pr-4 text-white">{c.chip_name}</td>
                <td className="py-2 pr-4 text-right text-cyan-300">{Number(c.hbm_gb).toLocaleString()}</td>
                <td className="py-2 pr-4 text-right text-gray-300">{Number(c.peak_kv_gb).toFixed(1)}</td>
                <td className={`py-2 pr-4 text-right ${c.headroom_gb < 10 ? 'text-red-400' : 'text-green-400'}`}>{Number(c.headroom_gb).toFixed(1)}</td>
                <td className={`py-2 pr-4 text-right ${c.utilization_pct >= 90 ? 'text-red-400' : c.utilization_pct >= 70 ? 'text-yellow-400' : 'text-gray-300'}`}>{c.utilization_pct}%</td>
                <td className="py-2 pr-4 text-right text-gray-400">{c.allocation_count}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3">All KV allocations ({rows.length})</h2>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900"><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-3">Chip</th><th className="py-2 pr-3">Model</th><th className="py-2 pr-3">Shape</th>
              <th className="py-2 pr-3">dtype</th><th className="py-2 pr-3 text-right">Ctx×Batch</th>
              <th className="py-2 pr-3 text-right">Measured</th><th className="py-2 pr-3 text-right">Computed</th>
              <th className="py-2 pr-3">Fit</th><th className="py-2 pr-3 text-right">Decode tok/s</th>
            </tr></thead>
            <tbody>{rows.map(r => {
              const fits = r.chip_hbm_gb != null && r.computed != null && r.computed.total_kv_gb <= Number(r.chip_hbm_gb);
              return (
                <tr key={r.id} className="border-b border-gray-800/60">
                  <td className="py-2 pr-3 text-cyan-300">{r.chip_name || r.chip_id}</td>
                  <td className="py-2 pr-3 text-white">{r.model_name}</td>
                  <td className="py-2 pr-3 text-gray-400 text-xs">{r.num_layers}L · {r.num_kv_heads}h · {r.head_dim}d</td>
                  <td className="py-2 pr-3 text-violet-300">{r.dtype}</td>
                  <td className="py-2 pr-3 text-right text-gray-300">{r.context_length}×{r.concurrent_requests}{r.reuse_across_steps ? ' (reuse)' : ''}</td>
                  <td className="py-2 pr-3 text-right text-gray-300">{r.measured_kv_gb ? `${Number(r.measured_kv_gb).toFixed(1)} GB` : '—'}</td>
                  <td className="py-2 pr-3 text-right text-amber-300">{r.computed ? `${r.computed.total_kv_gb} GB` : '—'}</td>
                  <td className="py-2 pr-3">{fits ? <CheckCircle2 className="w-4 h-4 text-green-400" /> : <AlertTriangle className="w-4 h-4 text-red-400" />}</td>
                  <td className="py-2 pr-3 text-right text-gray-300">{r.decode_tokens_per_sec ? Number(r.decode_tokens_per_sec).toLocaleString() : '—'}</td>
                </tr>
              );
            })}</tbody>
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
function Stat({ label, value }: { label: string; value: string }) {
  return (<div className="bg-gray-800/60 rounded-lg p-3 border border-gray-700">
    <div className="text-xs text-gray-400 uppercase">{label}</div>
    <div className="text-lg text-white font-semibold mt-0.5">{value}</div>
  </div>);
}
