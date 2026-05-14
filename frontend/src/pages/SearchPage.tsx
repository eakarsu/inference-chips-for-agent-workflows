import { useState } from 'react';
import { api } from '../api';
import { Search as SearchIcon, Filter } from 'lucide-react';

interface SearchResults {
  chips: Array<{id:number;name:string;manufacturer:string;architecture:string;availability:string;compute_tops:number}>;
  workflows: Array<{id:number;name:string;description:string;agent_type:string;complexity:string;use_case:string}>;
  steps: Array<{id:number;step_name:string;step_type:string;avg_duration_ms:number;is_bottleneck:boolean}>;
  deployments: Array<{id:number;customer:string;use_case:string;region:string;status:string;performance_score:number}>;
  research: Array<{id:number;title:string;focus_area:string;chip_mentioned:string;citations:number;breakthrough:boolean}>;
}

export default function SearchPage() {
  const [q, setQ] = useState('');
  const [availability, setAvailability] = useState('');
  const [complexity, setComplexity] = useState('');
  const [focusArea, setFocusArea] = useState('');
  const [results, setResults] = useState<SearchResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const run = async () => {
    setLoading(true);
    setError('');
    try {
      const r = await api.search({ q, availability, complexity, focus_area: focusArea });
      setResults(r);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  const counts = results ? {
    chips: results.chips.length,
    workflows: results.workflows.length,
    steps: results.steps.length,
    deployments: results.deployments.length,
    research: results.research.length,
  } : null;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Global Search &amp; Filter</h1>
        <p className="text-gray-400 text-sm mt-1">Search across chips, workflows, steps, deployments, and research</p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-4 space-y-4">
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') run(); }}
            placeholder="Search across all entities..."
            className="w-full bg-gray-800 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Filter className="w-3 h-3" />Chip Availability</label>
            <select value={availability} onChange={e => setAvailability(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
              <option value="">Any</option>
              {['available','limited','cloud_only','upcoming','internal'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Filter className="w-3 h-3" />Workflow Complexity</label>
            <select value={complexity} onChange={e => setComplexity(e.target.value)} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
              <option value="">Any</option>
              {['low','medium','high'].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1 flex items-center gap-1"><Filter className="w-3 h-3" />Research Focus Area</label>
            <input value={focusArea} onChange={e => setFocusArea(e.target.value)} placeholder="e.g. inference" className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" />
          </div>
        </div>

        <button onClick={run} disabled={loading} className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition-colors">
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>}

      {counts && (
        <div className="flex gap-2 mb-4 flex-wrap">
          {Object.entries(counts).map(([k, v]) => (
            <span key={k} className="px-3 py-1 bg-gray-800 border border-gray-700 rounded text-xs text-gray-300">
              <span className="text-cyan-400 font-medium">{v}</span> {k}
            </span>
          ))}
        </div>
      )}

      {results && (
        <div className="space-y-4">
          {results.chips.length > 0 && (
            <Section title="Chips">
              {results.chips.map(c => (
                <div key={c.id} className="flex items-center justify-between border-b border-gray-800 py-2">
                  <div>
                    <p className="text-white text-sm font-medium">{c.name}</p>
                    <p className="text-gray-500 text-xs">{c.manufacturer} · {c.architecture}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{Number(c.compute_tops).toLocaleString()} TOPS</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">{c.availability}</span>
                  </div>
                </div>
              ))}
            </Section>
          )}
          {results.workflows.length > 0 && (
            <Section title="Workflows">
              {results.workflows.map(w => (
                <div key={w.id} className="border-b border-gray-800 py-2">
                  <p className="text-white text-sm font-medium">{w.name} <span className="text-gray-500 text-xs">({w.agent_type} · {w.complexity})</span></p>
                  <p className="text-gray-400 text-xs mt-0.5">{w.description}</p>
                </div>
              ))}
            </Section>
          )}
          {results.steps.length > 0 && (
            <Section title="Steps">
              {results.steps.map(s => (
                <div key={s.id} className="flex items-center justify-between border-b border-gray-800 py-2">
                  <div>
                    <p className="text-white text-sm">{s.step_name}</p>
                    <p className="text-gray-500 text-xs">{s.step_type}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-400">{s.avg_duration_ms}ms</span>
                    {s.is_bottleneck && <span className="px-2 py-0.5 rounded text-xs bg-red-900/40 text-red-300">bottleneck</span>}
                  </div>
                </div>
              ))}
            </Section>
          )}
          {results.deployments.length > 0 && (
            <Section title="Deployments">
              {results.deployments.map(d => (
                <div key={d.id} className="flex items-center justify-between border-b border-gray-800 py-2">
                  <div>
                    <p className="text-white text-sm font-medium">{d.customer}</p>
                    <p className="text-gray-500 text-xs">{d.use_case} · {d.region}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300">{d.status}</span>
                </div>
              ))}
            </Section>
          )}
          {results.research.length > 0 && (
            <Section title="Research">
              {results.research.map(r => (
                <div key={r.id} className="border-b border-gray-800 py-2">
                  <p className="text-white text-sm font-medium">{r.title}</p>
                  <p className="text-gray-500 text-xs">{r.focus_area} · {r.chip_mentioned} · {r.citations} citations {r.breakthrough && '· breakthrough'}</p>
                </div>
              ))}
            </Section>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-white text-sm font-semibold mb-2">{title}</h3>
      {children}
    </div>
  );
}
