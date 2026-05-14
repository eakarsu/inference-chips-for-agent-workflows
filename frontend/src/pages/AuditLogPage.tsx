import { useEffect, useState } from 'react';
import { api } from '../api';
import { Activity, Trash2, RefreshCw } from 'lucide-react';

interface AuditEntry {
  id: number;
  user_id: number | null;
  user_email: string | null;
  action: string;
  details: string | null;
  created_at: string;
}

export default function AuditLogPage() {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.getAuditLog({ action: filter || undefined, limit: 200 });
      setEntries(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const clearAll = async () => {
    if (!confirm('Clear the entire audit log?')) return;
    try {
      await api.clearAuditLog();
      load();
    } catch (e) { setError(String(e)); }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Audit Log</h1>
          <p className="text-gray-400 text-sm mt-1">{entries.length} most recent events</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg" title="Refresh">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={clearAll} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg" title="Clear all">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4">
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') load(); }}
          placeholder="Filter by action (e.g. ai., export.)"
          className="flex-1 bg-gray-900 border border-gray-800 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500"
        />
        <button onClick={load} className="bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">Filter</button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}

      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              {['Time','User','Action','Details'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {entries.map(e => (
              <tr key={e.id} className="border-b border-gray-800 hover:bg-gray-800/40">
                <td className="px-4 py-2 text-gray-400 text-xs whitespace-nowrap">{new Date(e.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 text-gray-300 text-xs">{e.user_email || '—'}</td>
                <td className="px-4 py-2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-violet-900/40 text-violet-300 border border-violet-800">
                    <Activity className="w-3 h-3" />{e.action}
                  </span>
                </td>
                <td className="px-4 py-2 text-gray-400 text-xs font-mono truncate max-w-md">{e.details}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && <div className="text-center py-12 text-gray-600">No audit events yet</div>}
      </div>
    </div>
  );
}
