import { useState } from 'react';
import { Cpu, Workflow, GitBranch, BarChart2, Globe, BookOpen, Database, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';

type Entity = 'chips' | 'workflows' | 'steps' | 'benchmarks' | 'deployments' | 'research';

type Card = { entity: Entity; label: string; description: string; Icon: typeof Cpu; iconBg: string; iconColor: string };

const CARDS: Card[] = [
  { entity: 'chips', label: 'Chips', description: 'Real inference chips: H100, B200, MI300X, Groq LPU, Cerebras WSE-3, TPU v5p, Trainium2.', Icon: Cpu, iconBg: 'bg-cyan-900/40 border-cyan-800', iconColor: 'text-cyan-400' },
  { entity: 'workflows', label: 'Workflows', description: 'Agent workflow profiles: RAG, ReAct, multi-agent, tool-use, voice, long-context.', Icon: Workflow, iconBg: 'bg-violet-900/40 border-violet-800', iconColor: 'text-violet-400' },
  { entity: 'steps', label: 'Steps', description: 'Per-workflow steps with bottleneck and I/O flags (embed, retrieve, decode, tool call).', Icon: GitBranch, iconBg: 'bg-amber-900/40 border-amber-800', iconColor: 'text-amber-400' },
  { entity: 'benchmarks', label: 'Benchmarks', description: 'Chip-vs-workflow runs with TPS, latency, utilization and tokens/W.', Icon: BarChart2, iconBg: 'bg-emerald-900/40 border-emerald-800', iconColor: 'text-emerald-400' },
  { entity: 'deployments', label: 'Deployments', description: 'Production deployments at AWS, GCP, Azure (Anthropic, Perplexity, OpenAI, Meta).', Icon: Globe, iconBg: 'bg-sky-900/40 border-sky-800', iconColor: 'text-sky-400' },
  { entity: 'research', label: 'Research', description: 'Papers on FlashAttention, vLLM, ReAct, FP8, wafer-scale, transformer ASICs.', Icon: BookOpen, iconBg: 'bg-rose-900/40 border-rose-800', iconColor: 'text-rose-400' },
];

type Toast = { kind: 'ok' | 'err'; msg: string } | null;

export default function SampleDataPage() {
  const [busy, setBusy] = useState<Entity | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [toast, setToast] = useState<Toast>(null);

  const insert = async (entity: Entity) => {
    setBusy(entity);
    setToast(null);
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(`/api/admin/sample-data/${entity}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || r.statusText);
      setCounts(c => ({ ...c, [entity]: (c[entity] || 0) + (data.inserted || 0) }));
      setToast({ kind: 'ok', msg: `Inserted ${data.inserted} ${entity} rows` });
    } catch (e) {
      setToast({ kind: 'err', msg: String((e as Error).message || e) });
    } finally {
      setBusy(null);
      setTimeout(() => setToast(null), 4000);
    }
  };

  const totalInserted = Object.values(counts).reduce((a, b) => a + b, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-cyan-900/40 border border-cyan-800 flex items-center justify-center">
            <Database className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sample Data</h1>
            <p className="text-gray-400 text-sm mt-0.5">Seed each main entity with 5-10 domain-realistic rows for quick demos.</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-gray-500 text-xs uppercase tracking-wider">Total inserted (this session)</p>
          <p className="text-cyan-300 text-2xl font-bold">{totalInserted}</p>
        </div>
      </div>

      {toast && (
        <div className={`mb-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-sm ${
          toast.kind === 'ok'
            ? 'bg-emerald-900/30 border-emerald-700 text-emerald-200'
            : 'bg-red-900/30 border-red-700 text-red-200'
        }`}>
          {toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{toast.msg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {CARDS.map(({ entity, label, description, Icon, iconBg, iconColor }) => (
          <div key={entity} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg border flex items-center justify-center ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <div className="flex-1">
                <p className="text-white font-medium">{label}</p>
                <p className="text-gray-500 text-xs">{description}</p>
              </div>
              {counts[entity] > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded text-xs font-medium bg-gray-800 text-cyan-300">
                  +{counts[entity]}
                </span>
              )}
            </div>
            <button
              onClick={() => insert(entity)}
              disabled={busy === entity}
              className="mt-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {busy === entity ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
              {busy === entity ? 'Inserting...' : `Insert sample ${label.toLowerCase()}`}
            </button>
          </div>
        ))}
      </div>

      <p className="text-gray-600 text-xs mt-6">
        Note: each click inserts a fresh batch (5-10 rows) — repeat clicks add more sample rows. Steps/benchmarks/deployments link to existing chips/workflows when present.
      </p>
    </div>
  );
}
