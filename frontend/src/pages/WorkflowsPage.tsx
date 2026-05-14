import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, Workflow, X, Edit2, Trash2 } from 'lucide-react';

interface WF {
  id: number; name: string; description: string; agent_type: string;
  total_steps: number; avg_duration_ms: number; model_call_pct: number;
  tool_use_pct: number; memory_read_pct: number; cpu_compute_pct: number;
  complexity: string; use_case: string;
}

const complexityColors: Record<string, string> = {
  low: 'bg-green-900 text-green-300', medium: 'bg-yellow-900 text-yellow-300', high: 'bg-red-900 text-red-300'
};

function WFForm({ wf, onSave, onClose }: { wf?: WF | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: wf?.name || '', description: wf?.description || '', agent_type: wf?.agent_type || 'research',
    total_steps: wf?.total_steps || '', avg_duration_ms: wf?.avg_duration_ms || '',
    model_call_pct: wf?.model_call_pct || '', tool_use_pct: wf?.tool_use_pct || '',
    memory_read_pct: wf?.memory_read_pct || '', cpu_compute_pct: wf?.cpu_compute_pct || '',
    complexity: wf?.complexity || 'medium', use_case: wf?.use_case || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (wf) await api.updateWorkflow(wf.id, form); else await api.createWorkflow(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{wf ? 'Edit Workflow' : 'New Workflow'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Agent Type</label>
              <select value={form.agent_type} onChange={e => setForm({...form,agent_type:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                {['research','coding','customer_support','data_analysis','writing','planning'].map(t => <option key={t} value={t}>{t}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Complexity</label>
              <select value={form.complexity} onChange={e => setForm({...form,complexity:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                {['low','medium','high'].map(c => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Total Steps</label>
              <input type="number" value={form.total_steps} onChange={e => setForm({...form,total_steps:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Avg Duration (ms)</label>
              <input type="number" value={form.avg_duration_ms} onChange={e => setForm({...form,avg_duration_ms:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Model Call %</label>
              <input type="number" value={form.model_call_pct} onChange={e => setForm({...form,model_call_pct:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Tool Use %</label>
              <input type="number" value={form.tool_use_pct} onChange={e => setForm({...form,tool_use_pct:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Memory Read %</label>
              <input type="number" value={form.memory_read_pct} onChange={e => setForm({...form,memory_read_pct:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">CPU Compute %</label>
              <input type="number" value={form.cpu_compute_pct} onChange={e => setForm({...form,cpu_compute_pct:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Use Case</label>
              <input value={form.use_case} onChange={e => setForm({...form,use_case:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
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

export default function WorkflowsPage() {
  const [workflows, setWorkflows] = useState<WF[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<WF | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editWF, setEditWF] = useState<WF | null>(null);

  const load = async () => { setWorkflows(await api.getWorkflows()); };
  useEffect(() => { load(); }, []);

  const filtered = workflows.filter(w => w.name?.toLowerCase().includes(search.toLowerCase()) || w.agent_type?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Agent Workflows</h1>
          <p className="text-gray-400 text-sm mt-1">{workflows.length} workflows defined</p>
        </div>
        <button onClick={() => { setEditWF(null); setShowForm(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Workflow
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workflows..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(w => (
          <div key={w.id} onClick={() => setSelected(w)} className="bg-gray-900 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-cyan-600 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Workflow className="w-4 h-4 text-cyan-400" />
                <p className="text-white font-medium text-sm">{w.name}</p>
              </div>
              <span className={`px-2 py-0.5 rounded text-xs font-medium ${complexityColors[w.complexity] || 'bg-gray-700 text-gray-300'}`}>{w.complexity}</span>
            </div>
            <p className="text-gray-500 text-xs mb-3 capitalize">{w.agent_type?.replace('_', ' ')} · {w.use_case}</p>
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="bg-gray-800 rounded p-1.5"><p className="text-white font-bold text-xs">{w.total_steps}</p><p className="text-gray-600 text-xs">Steps</p></div>
              <div className="bg-gray-800 rounded p-1.5"><p className="text-cyan-300 font-bold text-xs">{w.model_call_pct}%</p><p className="text-gray-600 text-xs">Model</p></div>
              <div className="bg-gray-800 rounded p-1.5"><p className="text-white font-bold text-xs">{(w.avg_duration_ms/1000).toFixed(1)}s</p><p className="text-gray-600 text-xs">Avg</p></div>
            </div>
          </div>
        ))}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.name}</h2><p className="text-gray-400 text-sm capitalize">{selected.agent_type?.replace('_', ' ')}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditWF(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteWorkflow(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${complexityColors[selected.complexity] || 'bg-gray-700 text-gray-300'}`}>{selected.complexity}</span>
            <div className="grid grid-cols-2 gap-3">
              {[['Steps', selected.total_steps],['Avg Duration', `${(selected.avg_duration_ms/1000).toFixed(1)}s`],['Model Calls', `${selected.model_call_pct}%`],['Tool Use', `${selected.tool_use_pct}%`],['Memory Read', `${selected.memory_read_pct}%`],['CPU Compute', `${selected.cpu_compute_pct}%`]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            <div><p className="text-gray-500 text-xs mb-1">Use Case</p><p className="text-gray-300 text-sm">{selected.use_case}</p></div>
            {selected.description && <div><p className="text-gray-500 text-xs mb-1">Description</p><p className="text-gray-300 text-sm">{selected.description}</p></div>}
          </div>
        </div>
      )}
      {showForm && <WFForm wf={editWF} onClose={() => { setShowForm(false); setEditWF(null); }} onSave={() => { setShowForm(false); setEditWF(null); setSelected(null); load(); }} />}
    </div>
  );
}
