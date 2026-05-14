import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, Server, X, Edit2, Trash2 } from 'lucide-react';

interface Deployment {
  id: number; chip_id: number; chip_name: string; customer: string; use_case: string;
  deployed_at: string; performance_score: number; cost_savings_pct: number;
  status: string; region: string; scale_units: number;
}

const statusColors: Record<string, string> = {
  active: 'bg-green-900 text-green-300', deprecated: 'bg-gray-700 text-gray-400',
  evaluation: 'bg-yellow-900 text-yellow-300', cancelled: 'bg-red-900 text-red-300',
};

function DeployForm({ dep, chips, onSave, onClose }: { dep?: Deployment | null; chips: {id:number;name:string}[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    chip_id: dep?.chip_id || '', customer: dep?.customer || '', use_case: dep?.use_case || '',
    deployed_at: dep?.deployed_at?.split('T')[0] || '', performance_score: dep?.performance_score || '',
    cost_savings_pct: dep?.cost_savings_pct || '', status: dep?.status || 'active',
    region: dep?.region || '', scale_units: dep?.scale_units || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (dep) await api.updateDeployment(dep.id, form); else await api.createDeployment(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{dep ? 'Edit Deployment' : 'New Deployment'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Chip *</label>
              <select required value={form.chip_id} onChange={e => setForm({...form,chip_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value="">Select chip...</option>{chips.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Customer *</label>
              <input required value={form.customer} onChange={e => setForm({...form,customer:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Use Case</label>
              <input value={form.use_case} onChange={e => setForm({...form,use_case:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({...form,status:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                {['active','evaluation','deprecated','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Region</label>
              <input value={form.region} onChange={e => setForm({...form,region:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Performance Score</label>
              <input type="number" step="0.01" value={form.performance_score} onChange={e => setForm({...form,performance_score:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Cost Savings (%)</label>
              <input type="number" value={form.cost_savings_pct} onChange={e => setForm({...form,cost_savings_pct:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Scale Units</label>
              <input type="number" value={form.scale_units} onChange={e => setForm({...form,scale_units:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Deployed At</label>
              <input type="date" value={form.deployed_at} onChange={e => setForm({...form,deployed_at:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
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

export default function DeploymentsPage() {
  const [deployments, setDeployments] = useState<Deployment[]>([]);
  const [chips, setChips] = useState<{id:number;name:string}[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Deployment | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editDep, setEditDep] = useState<Deployment | null>(null);

  const load = async () => {
    const [d, c] = await Promise.all([api.getDeployments(), api.getChips()]);
    setDeployments(d); setChips(c);
  };
  useEffect(() => { load(); }, []);

  const filtered = deployments.filter(d => d.customer?.toLowerCase().includes(search.toLowerCase()) || d.chip_name?.toLowerCase().includes(search.toLowerCase()) || d.use_case?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Deployments</h1>
          <p className="text-gray-400 text-sm mt-1">{deployments.length} deployments | {deployments.filter(d => d.status === 'active').length} active</p>
        </div>
        <button onClick={() => { setEditDep(null); setShowForm(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Deployment
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search deployments..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Customer','Chip','Use Case','Status','Perf Score','Cost Savings','Region','Scale'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id} onClick={() => setSelected(d)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><Server className="w-4 h-4 text-cyan-400" /><p className="text-white text-sm">{d.customer}</p></div></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{d.chip_name}</td>
                <td className="px-4 py-3 text-gray-400 text-xs max-w-[160px] truncate">{d.use_case}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColors[d.status] || 'bg-gray-700 text-gray-300'}`}>{d.status}</span></td>
                <td className="px-4 py-3 text-cyan-300 text-sm font-medium">{Number(d.performance_score).toFixed(2)}</td>
                <td className="px-4 py-3 text-green-400 text-sm">{d.cost_savings_pct}%</td>
                <td className="px-4 py-3 text-gray-400 text-sm">{d.region}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{d.scale_units?.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No deployments found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.customer}</h2><p className="text-gray-400 text-sm">{selected.chip_name} · {selected.region}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditDep(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteDeployment(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <span className={`px-2 py-1 rounded text-xs font-medium ${statusColors[selected.status] || 'bg-gray-700 text-gray-300'}`}>{selected.status}</span>
            <div className="grid grid-cols-2 gap-3">
              {[['Chip', selected.chip_name],['Region', selected.region],['Performance Score', Number(selected.performance_score).toFixed(2)],['Cost Savings', `${selected.cost_savings_pct}%`],['Scale Units', selected.scale_units?.toLocaleString()],['Deployed', selected.deployed_at?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.use_case && <div><p className="text-gray-500 text-xs mb-1">Use Case</p><p className="text-gray-300 text-sm">{selected.use_case}</p></div>}
          </div>
        </div>
      )}
      {showForm && <DeployForm dep={editDep} chips={chips} onClose={() => { setShowForm(false); setEditDep(null); }} onSave={() => { setShowForm(false); setEditDep(null); setSelected(null); load(); }} />}
    </div>
  );
}
