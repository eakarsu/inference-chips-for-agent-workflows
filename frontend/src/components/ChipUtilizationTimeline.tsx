import { useEffect, useState } from 'react';
import { apiFetch } from '../api';

type Pt = { date: string; utilization_pct: number; latency_ms: number | null };
type Series = { chip_id: number; chip_name: string; manufacturer: string | null; points: Pt[] };
type Resp = {
  view: string; dates: string[]; series: Series[];
  summary: { chip_count: number; date_count: number; avg_utilization_pct: number };
};

const COLORS = ['#22d3ee', '#a78bfa', '#f472b6', '#34d399', '#fbbf24', '#f87171', '#60a5fa', '#fb7185'];

export default function ChipUtilizationTimeline() {
  const [data, setData] = useState<Resp | null>(null);
  const [err, setErr] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch('/custom-views/chip-utilization-timeline')
      .then((d: Resp) => setData(d))
      .catch(e => setErr(e.message || 'error'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-400 text-sm">Loading utilization timeline...</div>;
  if (err) return <div className="text-red-400 text-sm">Error: {err}</div>;
  if (!data || data.series.length === 0) return <div className="text-gray-500 text-sm">No benchmark data yet.</div>;

  const W = 720, H = 260, pad = { l: 40, r: 16, t: 12, b: 28 };
  const xs = data.dates;
  const xStep = xs.length > 1 ? (W - pad.l - pad.r) / (xs.length - 1) : 0;
  const yMax = 100;
  const xOf = (i: number) => pad.l + i * xStep;
  const yOf = (v: number) => pad.t + (1 - v / yMax) * (H - pad.t - pad.b);

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-semibold">Chip Utilization Timeline</h3>
        <div className="text-xs text-gray-400">
          {data.summary.chip_count} chips · avg {data.summary.avg_utilization_pct}%
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-64 bg-gray-950 rounded">
        {[0, 25, 50, 75, 100].map(g => (
          <g key={g}>
            <line x1={pad.l} y1={yOf(g)} x2={W - pad.r} y2={yOf(g)} stroke="#1f2937" strokeWidth={1} />
            <text x={4} y={yOf(g) + 4} fill="#6b7280" fontSize={10}>{g}%</text>
          </g>
        ))}
        {data.series.map((s, idx) => {
          const color = COLORS[idx % COLORS.length];
          // map date -> x index
          const pts = s.points.map(p => {
            const i = xs.indexOf(p.date);
            return i < 0 ? null : `${xOf(i)},${yOf(p.utilization_pct)}`;
          }).filter(Boolean).join(' ');
          return (
            <g key={s.chip_id}>
              <polyline points={pts} fill="none" stroke={color} strokeWidth={2} />
              {s.points.map((p, i2) => {
                const i = xs.indexOf(p.date);
                if (i < 0) return null;
                return <circle key={i2} cx={xOf(i)} cy={yOf(p.utilization_pct)} r={3} fill={color} />;
              })}
            </g>
          );
        })}
        {xs.map((d, i) => (
          <text key={i} x={xOf(i)} y={H - 8} fill="#6b7280" fontSize={9} textAnchor="middle">
            {d.slice(5)}
          </text>
        ))}
      </svg>
      <div className="flex flex-wrap gap-3 mt-3">
        {data.series.map((s, idx) => (
          <div key={s.chip_id} className="flex items-center gap-2 text-xs text-gray-300">
            <span className="inline-block w-3 h-3 rounded-sm" style={{ background: COLORS[idx % COLORS.length] }} />
            {s.chip_name}
          </div>
        ))}
      </div>
    </div>
  );
}
