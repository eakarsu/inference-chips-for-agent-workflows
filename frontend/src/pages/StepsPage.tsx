import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, GitBranch, AlertTriangle, X, Edit2, Trash2 } from 'lucide-react';

interface Step {
  id: number; workflow_id: number; workflow_name: string; step_name: string;
  step_type: string; avg_duration_ms: number; memory_mb: number;
  is_bottleneck: boolean; is_io_bound: boolean; description: string; position: number;
}

interface WF { id: number; name: string; }

const typeColors: Record<string, string> = {
  model_call: 'bg-cyan-900 text-cyan-300', tool_use: 'bg-purple-900 text-purple-300',
  memory_read: 'bg-blue-900 text-blue-300', cpu_compute: 'bg-orange-900 text-orange-300',
  vector_search: 'bg-yellow-900 text-yellow-300', api_call: 'bg-green-900 text-green-300',
  orchestration: 'bg-gray-700 text-gray-300',
};

function StepForm({ step, workflows, onSave, onClose }: { step?: Step | null; workflows: WF[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    workflow_id: step?.workflow_id || '', step_name: step?.step_name || '',
    step_type: step?.step_type || 'model_call', avg_duration_ms: step?.avg_duration_ms || '',
    memory_mb: step?.memory_mb || '', is_bottleneck: step?.is_bottleneck || false,
    is_io_bound: step?.is_io_bound || false, description: step?.description || '',
    position: step?.position || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (step) await api.updateStep(step.id, form); else await api.createStep(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{step ? 'Edit Step' : 'New Step'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Workflow *</label>
              <select required value={form.workflow_id} onChange={e => setForm({...form,workflow_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value="">Select workflow...</option>{workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Step Name *</label>
              <input required value={form.step_name} onChange={e => setForm({...form,step_name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Type</label>
              <select value={form.step_type} onChange={e => setForm({...form,step_type:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                {['model_call','tool_use','memory_read','cpu_compute','vector_search','api_call','orchestration'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Position</label>
              <input type="number" value={form.position} onChange={e => setForm({...form,position:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Avg Duration (ms)</label>
              <input type="number" value={form.avg_duration_ms} onChange={e => setForm({...form,avg_duration_ms:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Memory (MB)</label>
              <input type="number" value={form.memory_mb} onChange={e => setForm({...form,memory_mb:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="bn" checked={form.is_bottleneck} onChange={e => setForm({...form,is_bottleneck:e.target.checked})} className="rounded bg-gray-800 border-gray-700" />
              <label htmlFor="bn" className="text-sm text-gray-300">Is Bottleneck</label>
            </div>
            <div className="flex items-center gap-2 pt-4">
              <input type="checkbox" id="io" checked={form.is_io_bound} onChange={e => setForm({...form,is_io_bound:e.target.checked})} className="rounded bg-gray-800 border-gray-700" />
              <label htmlFor="io" className="text-sm text-gray-300">IO Bound</label>
            </div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Description</label>
              <textarea rows={2} value={form.description} onChange={e => setForm({...form,description:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg text-sm font-medium">Save</button>
            <button type="button" onClick={onClose} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2 rounded-lg text-sm">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function StepsPage() {
  const [steps, setSteps] = useState<Step[]>([]);
  const [workflows, setWorkflows] = useState<WF[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Step | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editStep, setEditStep] = useState<Step | null>(null);

  const load = async () => { const [s, w] = await Promise.all([api.getSteps(), api.getWorkflows()]); setSteps(s); setWorkflows(w); };
  useEffect(() => { load(); }, []);

  const filtered = steps.filter(s => s.step_name?.toLowerCase().includes(search.toLowerCase()) || s.workflow_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Workflow Steps</h1>
          <p className="text-gray-400 text-sm mt-1">{steps.length} steps | {steps.filter(s => s.is_bottleneck).length} bottlenecks identified</p>
        </div>
        <button onClick={() => { setEditStep(null); setShowForm(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Step
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search steps..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Step','Workflow','Type','Duration','Memory','Flags'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(s => (
              <tr key={s.id} onClick={() => setSelected(s)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs">#{s.position}</span>
                    <GitBranch className="w-4 h-4 text-cyan-400" />
                    <p className="text-white text-sm">{s.step_name}</p>
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 text-sm">{s.workflow_name}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[s.step_type] || 'bg-gray-700 text-gray-300'}`}>{s.step_type?.replace('_', ' ')}</span></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{s.avg_duration_ms}ms</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{s.memory_mb} MB</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    {s.is_bottleneck && <span className="flex items-center gap-0.5 text-red-400 text-xs"><AlertTriangle className="w-3 h-3" />BN</span>}
                    {s.is_io_bound && <span className="text-blue-400 text-xs">I/O</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No steps found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.step_name}</h2><p className="text-gray-400 text-sm">{selected.workflow_name}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditStep(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteStep(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[selected.step_type] || 'bg-gray-700 text-gray-300'}`}>{selected.step_type?.replace('_', ' ')}</span>
              {selected.is_bottleneck && <span className="flex items-center gap-1 text-red-400 text-xs"><AlertTriangle className="w-3 h-3" />Bottleneck</span>}
              {selected.is_io_bound && <span className="text-blue-400 text-xs">I/O Bound</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Position', `#${selected.position}`],['Duration', `${selected.avg_duration_ms}ms`],['Memory', `${selected.memory_mb} MB`],['Workflow', selected.workflow_name]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.description && <div><p className="text-gray-500 text-xs mb-1">Description</p><p className="text-gray-300 text-sm">{selected.description}</p></div>}
          </div>
        </div>
      )}
      {showForm && <StepForm step={editStep} workflows={workflows} onClose={() => { setShowForm(false); setEditStep(null); }} onSave={() => { setShowForm(false); setEditStep(null); setSelected(null); load(); }} />}
    </div>
  );
}
