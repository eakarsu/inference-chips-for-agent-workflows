import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Cpu, Workflow, BarChart2, Globe, BookOpen, Sparkles, Database,
  Activity, RefreshCw, GitBranch, FileClock,
} from 'lucide-react';
import { apiFetch } from '../api';

interface DashboardStats {
  kpis: {
    chips_catalogued: number;
    workflows_tracked: number;
    benchmarks_run: number;
    deployments_active: number;
    deployments_total: number;
    research_papers: number;
    steps_profiled: number;
    audit_events: number;
  };
  recent_activity: {
    id: number;
    user_email: string | null;
    action: string;
    details: string | null;
    created_at: string;
  }[];
  generated_at: string;
}

interface KpiSpec {
  key: keyof DashboardStats['kpis'];
  label: string;
  Icon: typeof Cpu;
  iconBg: string;
  iconColor: string;
  hint?: string;
}

const KPIS: KpiSpec[] = [
  { key: 'chips_catalogued', label: 'Chips Catalogued', Icon: Cpu, iconBg: 'bg-cyan-900/40 border-cyan-800', iconColor: 'text-cyan-400' },
  { key: 'workflows_tracked', label: 'Workflows Tracked', Icon: Workflow, iconBg: 'bg-violet-900/40 border-violet-800', iconColor: 'text-violet-400' },
  { key: 'benchmarks_run', label: 'Benchmarks Run', Icon: BarChart2, iconBg: 'bg-emerald-900/40 border-emerald-800', iconColor: 'text-emerald-400' },
  { key: 'deployments_active', label: 'Deployments Active', Icon: Globe, iconBg: 'bg-sky-900/40 border-sky-800', iconColor: 'text-sky-400' },
  { key: 'research_papers', label: 'Research Papers', Icon: BookOpen, iconBg: 'bg-rose-900/40 border-rose-800', iconColor: 'text-rose-400' },
];

interface QuickAction {
  to: string;
  label: string;
  description: string;
  Icon: typeof Cpu;
  accent: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { to: '/ai', label: 'AI Center', description: 'Chip recommender, latency-cost optimizer, throughput predictor and 6 more.', Icon: Sparkles, accent: 'from-violet-600 to-fuchsia-600' },
  { to: '/chips', label: 'Chips', description: 'Catalogue of inference accelerators with TDP, bandwidth and KV cache.', Icon: Cpu, accent: 'from-cyan-600 to-sky-600' },
  { to: '/workflows', label: 'Workflows', description: 'Agent workflow profiles: RAG, ReAct, multi-agent, voice, long-context.', Icon: Workflow, accent: 'from-emerald-600 to-teal-600' },
  { to: '/sample-data', label: 'Sample Data', description: 'Seed realistic chips, benchmarks and deployments with one click.', Icon: Database, accent: 'from-amber-600 to-orange-600' },
];

function formatRelative(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return iso;
  const diff = Date.now() - t;
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const user = (() => { try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; } })();

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await apiFetch('/dashboard/stats');
      setStats(r);
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Welcome back{user?.name ? `, ${user.name}` : ''}. Here is the state of your inference fleet.
          </p>
        </div>
        <button
          onClick={load}
          className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg border border-gray-800"
          title="Refresh"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 rounded-lg border border-red-800 bg-red-900/30 text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-6">
        {KPIS.map(({ key, label, Icon, iconBg, iconColor }) => {
          const value = stats?.kpis?.[key];
          return (
            <div key={key} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-lg border flex items-center justify-center ${iconBg}`}>
                  <Icon className={`w-4 h-4 ${iconColor}`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-white tabular-nums">
                {loading && value === undefined ? '—' : (value ?? 0).toLocaleString()}
              </div>
              <div className="text-xs text-gray-500 mt-1">{label}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Quick actions */}
        <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Quick Actions</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {QUICK_ACTIONS.map(({ to, label, description, Icon, accent }) => (
              <Link
                key={to}
                to={to}
                className="group relative flex items-start gap-3 p-4 rounded-lg border border-gray-800 hover:border-gray-700 bg-gray-950/40 hover:bg-gray-950/80 transition-colors"
              >
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${accent} flex items-center justify-center flex-shrink-0`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <div className="text-white font-medium text-sm">{label}</div>
                  <div className="text-gray-400 text-xs mt-0.5 leading-snug">{description}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Secondary stats */}
          <div className="grid grid-cols-3 gap-3 mt-5 pt-5 border-t border-gray-800">
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <GitBranch className="w-3.5 h-3.5" /> Steps profiled
              </div>
              <div className="text-lg font-semibold text-white tabular-nums">
                {(stats?.kpis?.steps_profiled ?? 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <Globe className="w-3.5 h-3.5" /> Total deployments
              </div>
              <div className="text-lg font-semibold text-white tabular-nums">
                {(stats?.kpis?.deployments_total ?? 0).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <FileClock className="w-3.5 h-3.5" /> Audit events
              </div>
              <div className="text-lg font-semibold text-white tabular-nums">
                {(stats?.kpis?.audit_events ?? 0).toLocaleString()}
              </div>
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" /> Recent Activity
            </h2>
            <Link to="/audit" className="text-xs text-cyan-400 hover:text-cyan-300">View all</Link>
          </div>
          {(!stats || stats.recent_activity.length === 0) ? (
            <div className="text-center text-gray-500 text-sm py-8">
              {loading ? 'Loading…' : 'No activity yet. Run an AI feature or export a CSV to populate the audit log.'}
            </div>
          ) : (
            <ul className="space-y-2.5">
              {stats.recent_activity.map(ev => (
                <li key={ev.id} className="flex items-start gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 mt-2 flex-shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{ev.action}</span>
                      <span className="text-xs text-gray-600 flex-shrink-0">{formatRelative(ev.created_at)}</span>
                    </div>
                    <div className="text-xs text-gray-500 truncate">
                      {ev.user_email || 'system'}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {stats?.generated_at && (
        <div className="text-xs text-gray-600 mt-4 text-right">
          Updated {formatRelative(stats.generated_at)}
        </div>
      )}
    </div>
  );
}
