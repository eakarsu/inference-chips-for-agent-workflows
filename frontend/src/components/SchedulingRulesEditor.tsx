import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { Plus, Trash2, Save, X } from 'lucide-react';

type Rule = {
  id: number; name: string; priority: number;
  match_workload: string; target_chip_arch: string;
  min_kv_cache_gb: number; max_latency_ms: number;
  enabled: boolean; notes: string;
};

const EMPTY: Omit<Rule, 'id'> = {
  name: '', priority: 5, match_workload: 'any', target_chip_arch: 'any',
  min_kv_cache_gb: 0, max_latency_ms: 200, enabled: true, notes: ''
};

export default function SchedulingRulesEditor() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [editing, setEditing] = useState<Rule | null>(null);
  const [creating, setCreating] = useState<typeof EMPTY | null>(null);
  const [err, setErr] = useState('');

  const load = () => {
    apiFetch('/custom-views/scheduling-rules')
      .then((r: { rules: Rule[] }) => setRules(r.rules))
      .catch(e => setErr(e.message || 'error'));
  };
  useEffect(load, []);

  const create = async () => {
    if (!creating) return;
    try {
      await apiFetch('/custom-views/scheduling-rules',
        { method: 'POST', body: JSON.stringify(creating) });
      setCreating(null); load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'create failed'); }
  };

  const update = async () => {
    if (!editing) return;
    try {
      await apiFetch(`/custom-views/scheduling-rules/${editing.id}`,
        { method: 'PUT', body: JSON.stringify(editing) });
      setEditing(null); load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'update failed'); }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/custom-views/scheduling-rules/${id}`, { method: 'DELETE' });
      load();
    } catch (e) { setErr(e instanceof Error ? e.message : 'delete failed'); }
  };

  const Field = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <label className="block text-xs text-gray-400">{label}<div className="mt-1">{children}</div></label>
  );

  const renderForm = (
    val: Omit<Rule, 'id'>,
    setVal: (v: Omit<Rule, 'id'>) => void,
    onSave: () => void,
    onCancel: () => void
  ) => (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 mb-3 grid grid-cols-2 gap-3">
      <Field label="Name">
        <input value={val.name} onChange={e => setVal({ ...val, name: e.target.value })}
               className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
      </Field>
      <Field label="Priority">
        <input type="number" value={val.priority}
               onChange={e => setVal({ ...val, priority: +e.target.value })}
               className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
      </Field>
      <Field label="Match workload">
        <input value={val.match_workload}
               onChange={e => setVal({ ...val, match_workload: e.target.value })}
               className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
      </Field>
      <Field label="Target chip arch">
        <input value={val.target_chip_arch}
               onChange={e => setVal({ ...val, target_chip_arch: e.target.value })}
               className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
      </Field>
      <Field label="Min KV cache (GB)">
        <input type="number" value={val.min_kv_cache_gb}
               onChange={e => setVal({ ...val, min_kv_cache_gb: +e.target.value })}
               className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
      </Field>
      <Field label="Max latency (ms)">
        <input type="number" value={val.max_latency_ms}
               onChange={e => setVal({ ...val, max_latency_ms: +e.target.value })}
               className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
      </Field>
      <Field label="Enabled">
        <select value={val.enabled ? 'yes' : 'no'}
                onChange={e => setVal({ ...val, enabled: e.target.value === 'yes' })}
                className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white">
          <option value="yes">Enabled</option>
          <option value="no">Disabled</option>
        </select>
      </Field>
      <div />
      <div className="col-span-2">
        <Field label="Notes">
          <textarea value={val.notes} onChange={e => setVal({ ...val, notes: e.target.value })}
                    rows={2}
                    className="w-full bg-gray-900 border border-gray-700 rounded px-2 py-1 text-sm text-white" />
        </Field>
      </div>
      <div className="col-span-2 flex gap-2">
        <button onClick={onSave}
                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 py-1.5 rounded">
          <Save className="w-3 h-3" /> Save
        </button>
        <button onClick={onCancel}
                className="inline-flex items-center gap-1 bg-gray-700 hover:bg-gray-600 text-white text-xs px-3 py-1.5 rounded">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-white font-semibold">Scheduling Rules</h3>
        <button onClick={() => setCreating(EMPTY)}
                className="inline-flex items-center gap-1 bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-medium px-3 py-1.5 rounded">
          <Plus className="w-3 h-3" /> New Rule
        </button>
      </div>
      {err && <div className="text-red-400 text-xs mb-2">{err}</div>}
      {creating && renderForm(creating, setCreating, create, () => setCreating(null))}
      {editing && renderForm(editing, (v) => setEditing({ ...editing, ...v }), update, () => setEditing(null))}
      <div className="space-y-2">
        {rules.map(r => (
          <div key={r.id} className="bg-gray-800 border border-gray-700 rounded p-3 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white font-medium text-sm truncate">{r.name}</span>
                <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-cyan-900 text-cyan-300">
                  pri {r.priority}
                </span>
                <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded ${r.enabled ? 'bg-emerald-900 text-emerald-300' : 'bg-gray-700 text-gray-400'}`}>
                  {r.enabled ? 'on' : 'off'}
                </span>
              </div>
              <div className="text-xs text-gray-400 mt-1">
                workload: <span className="text-gray-200">{r.match_workload}</span> ·
                arch: <span className="text-gray-200"> {r.target_chip_arch}</span> ·
                minKV: <span className="text-gray-200">{r.min_kv_cache_gb}GB</span> ·
                maxLat: <span className="text-gray-200">{r.max_latency_ms}ms</span>
              </div>
              {r.notes && <div className="text-xs text-gray-500 mt-1 italic">{r.notes}</div>}
            </div>
            <div className="flex gap-1 shrink-0">
              <button onClick={() => setEditing(r)}
                      className="text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600 text-white">Edit</button>
              <button onClick={() => remove(r.id)}
                      className="text-xs px-2 py-1 rounded bg-red-700 hover:bg-red-600 text-white inline-flex items-center gap-1">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
        {!rules.length && <div className="text-gray-500 text-sm">No rules yet. Create one above.</div>}
      </div>
    </div>
  );
}
