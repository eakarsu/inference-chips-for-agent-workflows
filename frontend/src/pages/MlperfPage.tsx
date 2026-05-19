import { useEffect, useMemo, useState } from 'react';
import { Trophy, RefreshCcw, Filter, Zap } from 'lucide-react';
import { apiFetch } from '../api';

type Row = {
  id: number; round: string; division: string; chip_id: number; chip_name?: string; manufacturer?: string;
  system_name: string; num_accelerators: number; model_name: string; scenario: string;
  metric: string; result_value: number; perf_per_accelerator: number; latency_p99_ms: number;
  power_w: number; perf_per_watt: number; software_stack: string; submitter: string;
  published_date: string; price_usd?: number;
};
type Group = { model_name: string; scenario: string; entries: Row[] };

export default function MlperfPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState({ round: '', model_name: '', scenario: '' });

  async function load() {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (filter.round) qs.set('round', filter.round);
      if (filter.model_name) qs.set('model_name', filter.model_name);
      if (filter.scenario) qs.set('scenario', filter.scenario);
      const path = qs.toString() ? `/?${qs}` : '/';
      const [r, g] = await Promise.all([
        apiFetch('/feat-mlperf' + path),
        apiFetch('/feat-mlperf/leaderboard' + (qs.toString() ? `?${qs}` : ''))
      ]);
      setRows(r); setGroups(g.groups || []);
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const rounds = useMemo(() => Array.from(new Set(rows.map(r => r.round))).sort(), [rows]);
  const models = useMemo(() => Array.from(new Set(rows.map(r => r.model_name))).sort(), [rows]);
  const scenarios = useMemo(() => Array.from(new Set(rows.map(r => r.scenario))).sort(), [rows]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2"><Trophy className="w-6 h-6 text-amber-400" />MLPerf Inference</h1>
          <p className="text-gray-400 text-sm mt-1">Real MLPerf datacenter submissions — Server / Offline scenarios across rounds v4.0 to v5.0.</p>
        </div>
        <button onClick={load} disabled={loading} className="bg-amber-500 hover:bg-amber-400 text-gray-950 text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 disabled:opacity-50">
          {loading && <RefreshCcw className="w-3 h-3 animate-spin" />}Reload
        </button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <Filter className="w-4 h-4 text-amber-400" />
          <SelectField label="Round" value={filter.round} options={rounds} onChange={v => setFilter({ ...filter, round: v })} />
          <SelectField label="Model" value={filter.model_name} options={models} onChange={v => setFilter({ ...filter, model_name: v })} />
          <SelectField label="Scenario" value={filter.scenario} options={scenarios} onChange={v => setFilter({ ...filter, scenario: v })} />
          <button onClick={load} className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-3 py-1.5 rounded">Apply</button>
        </div>
      </div>

      {groups.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Leaderboards (top per accelerator)</h2>
          <div className="space-y-5">
            {groups.map(g => (
              <div key={`${g.model_name}_${g.scenario}`} className="border border-gray-800 rounded-lg p-3">
                <div className="text-amber-300 font-medium text-sm mb-2">{g.model_name} · {g.scenario}</div>
                <table className="w-full text-xs">
                  <thead><tr className="text-left text-gray-400 border-b border-gray-800">
                    <th className="py-1 pr-3">Rank</th><th className="py-1 pr-3">System</th>
                    <th className="py-1 pr-3">Chip</th><th className="py-1 pr-3 text-right"># Acc</th>
                    <th className="py-1 pr-3 text-right">Result</th><th className="py-1 pr-3 text-right">Per-Acc</th>
                    <th className="py-1 pr-3 text-right">tok/W</th><th className="py-1 pr-3">Stack</th>
                    <th className="py-1 pr-3 text-right">Round</th>
                  </tr></thead>
                  <tbody>{g.entries.slice(0, 6).map((e, i) => (
                    <tr key={e.id} className="border-b border-gray-800/60">
                      <td className="py-1 pr-3 text-white">{i + 1}</td>
                      <td className="py-1 pr-3 text-gray-300">{e.system_name}</td>
                      <td className="py-1 pr-3 text-cyan-300">{e.chip_name || '—'}</td>
                      <td className="py-1 pr-3 text-right text-gray-300">{e.num_accelerators}</td>
                      <td className="py-1 pr-3 text-right text-amber-300">{Number(e.result_value).toLocaleString()}</td>
                      <td className="py-1 pr-3 text-right text-gray-300">{Number(e.perf_per_accelerator || 0).toFixed(1)}</td>
                      <td className="py-1 pr-3 text-right text-green-400">{Number(e.perf_per_watt || 0).toFixed(2)}</td>
                      <td className="py-1 pr-3 text-gray-500 truncate max-w-[180px]">{e.software_stack}</td>
                      <td className="py-1 pr-3 text-right text-violet-300">{e.round}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-amber-400" />All submissions ({rows.length})</h2>
        <div className="overflow-x-auto max-h-[60vh]">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-gray-900"><tr className="text-left text-xs uppercase text-gray-400 border-b border-gray-800">
              <th className="py-2 pr-3">Round</th><th className="py-2 pr-3">Model</th><th className="py-2 pr-3">Scenario</th>
              <th className="py-2 pr-3">System</th><th className="py-2 pr-3 text-right">#Acc</th>
              <th className="py-2 pr-3 text-right">Result</th><th className="py-2 pr-3 text-right">Per-Acc</th>
              <th className="py-2 pr-3 text-right">p99 ms</th><th className="py-2 pr-3 text-right">Power W</th>
              <th className="py-2 pr-3">Stack</th><th className="py-2 pr-3">Submitter</th>
            </tr></thead>
            <tbody>{rows.map(r => (
              <tr key={r.id} className="border-b border-gray-800/60">
                <td className="py-2 pr-3 text-violet-300">{r.round}</td>
                <td className="py-2 pr-3 text-white">{r.model_name}</td>
                <td className="py-2 pr-3 text-amber-300">{r.scenario}</td>
                <td className="py-2 pr-3 text-gray-300">{r.system_name}</td>
                <td className="py-2 pr-3 text-right text-gray-300">{r.num_accelerators}</td>
                <td className="py-2 pr-3 text-right text-amber-300">{Number(r.result_value).toLocaleString()}</td>
                <td className="py-2 pr-3 text-right text-gray-300">{Number(r.perf_per_accelerator || 0).toFixed(1)}</td>
                <td className="py-2 pr-3 text-right text-gray-400">{r.latency_p99_ms ?? '—'}</td>
                <td className="py-2 pr-3 text-right text-gray-400">{r.power_w ?? '—'}</td>
                <td className="py-2 pr-3 text-gray-500 text-xs truncate max-w-[160px]">{r.software_stack}</td>
                <td className="py-2 pr-3 text-cyan-300 text-xs">{r.submitter}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SelectField({ label, value, options, onChange }: { label: string; value: string; options: string[]; onChange: (v: string) => void }) {
  return (<div>
    <label className="block text-xs text-gray-400 mb-1">{label}</label>
    <select value={value} onChange={e => onChange(e.target.value)} className="bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm min-w-[140px]">
      <option value="">(any)</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>);
}
