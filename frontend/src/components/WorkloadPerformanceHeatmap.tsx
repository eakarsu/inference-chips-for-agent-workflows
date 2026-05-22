import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

type Cell = {
  workload: string; chip_id: number; chip_name: string;
  speedup: number | null; throughput: number | null;
  utilization_pct: number | null; sample_count: number;
};
type Resp = {
  view: string;
  workloads: string[];
  chips: { chip_id: number; chip_name: string }[];
  cells: Cell[];
  summary: { workload_count: number; chip_count: number; cell_count: number; min_speedup: number; max_speedup: number };
};

function colorFor(v: number | null, min: number, max: number) {
  if (v == null) return '#111827';
  const r = max - min || 1;
  const t = Math.max(0, Math.min(1, (v - min) / r));
  // cool (cyan) -> warm (pink)
  const r1 = Math.round(34 + t * (244 - 34));
  const g1 = Math.round(211 + t * (114 - 211));
  const b1 = Math.round(238 + t * (182 - 238));
  return `rgb(${r1},${g1},${b1})`;
}

export default function WorkloadPerformanceHeatmap() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/custom-views/workload-performance-heatmap')
      .then(setData).catch(e => setErr(e.message || 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Loading heatmap...</div>;
  if (err) return <div className="text-red-400 text-sm">Error: {err}</div>;
  if (!data || data.cells.length === 0) return <div className="text-gray-500 text-sm">No benchmark data yet.</div>;

  const lookup = new Map<string, Cell>();
  data.cells.forEach(c => lookup.set(`${c.workload}::${c.chip_id}`, c));
  const { min_speedup, max_speedup } = data.summary;

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Workload Performance Heatmap</h3>
        <div className="text-xs text-gray-400">
          speedup range: {min_speedup}x – {max_speedup}x
        </div>
      </div>
      <div className="overflow-auto">
        <table className="text-xs border-collapse">
          <thead>
            <tr>
              <th className="text-left text-gray-400 px-2 py-1 sticky left-0 bg-gray-900">Workload \ Chip</th>
              {data.chips.map(c => (
                <th key={c.chip_id} className="text-gray-300 px-2 py-1 whitespace-nowrap">{c.chip_name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.workloads.map(w => (
              <tr key={w}>
                <td className="text-gray-200 px-2 py-1 whitespace-nowrap sticky left-0 bg-gray-900">{w}</td>
                {data.chips.map(c => {
                  const cell = lookup.get(`${w}::${c.chip_id}`);
                  const v = cell?.speedup ?? null;
                  const bg = colorFor(v, min_speedup, max_speedup);
                  return (
                    <td key={c.chip_id}
                        title={cell ? `speedup ${cell.speedup}x · util ${cell.utilization_pct ?? '-'}% · n=${cell.sample_count}` : 'no data'}
                        className="px-2 py-1 text-center font-medium" style={{ background: bg, color: '#0b0f19' }}>
                      {v == null ? '—' : `${v}x`}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-3 mt-3 text-xs text-gray-400">
        <span>Low</span>
        <div className="flex-1 h-2 rounded"
             style={{ background: 'linear-gradient(90deg, rgb(34,211,238), rgb(244,114,182))' }} />
        <span>High</span>
      </div>
    </div>
  );
}
