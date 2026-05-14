import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, Cpu, X, Edit2, Trash2, Zap, CheckCircle } from 'lucide-react';

interface Chip {
  id: number; name: string; manufacturer: string; architecture: string;
  context_switch_ns: number; kv_cache_gb: number; speculative_decode: boolean;
  tdp_watts: number; memory_bandwidth_gbps: number; compute_tops: number;
  process_node_nm: number; price_usd: number; availability: string; released_date: string;
}

const availColors: Record<string, string> = {
  available: 'bg-green-900 text-green-300', limited: 'bg-yellow-900 text-yellow-300',
  cloud_only: 'bg-blue-900 text-blue-300', upcoming: 'bg-purple-900 text-purple-300',
  internal: 'bg-gray-700 text-gray-400',
};

function ChipForm({ chip, onSave, onClose }: { chip?: Chip | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: chip?.name || '', manufacturer: chip?.manufacturer || '',
    architecture: chip?.architecture || '', context_switch_ns: chip?.context_switch_ns || '',
    kv_cache_gb: chip?.kv_cache_gb || '', speculative_decode: chip?.speculative_decode || false,
    tdp_watts: chip?.tdp_watts || '', memory_bandwidth_gbps: chip?.memory_bandwidth_gbps || '',
    compute_tops: chip?.compute_tops || '', process_node_nm: chip?.process_node_nm || '',
    price_usd: chip?.price_usd || 0, availability: chip?.availability || 'available',
    released_date: chip?.released_date?.split('T')[0] || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (chip) await api.updateChip(chip.id, form); else await api.createChip(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{chip ? 'Edit Chip' : 'New Chip'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Chip Name *</label>
              <input required value={form.name} onChange={e => setForm({...form,name:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Manufacturer</label>
              <input value={form.manufacturer} onChange={e => setForm({...form,manufacturer:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Architecture</label>
              <input value={form.architecture} onChange={e => setForm({...form,architecture:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Context Switch (ns)</label>
              <input type="number" value={form.context_switch_ns} onChange={e => setForm({...form,context_switch_ns:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">KV Cache (GB)</label>
              <input type="number" step="0.1" value={form.kv_cache_gb} onChange={e => setForm({...form,kv_cache_gb:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">TDP (W)</label>
              <input type="number" value={form.tdp_watts} onChange={e => setForm({...form,tdp_watts:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Mem BW (GB/s)</label>
              <input type="number" value={form.memory_bandwidth_gbps} onChange={e => setForm({...form,memory_bandwidth_gbps:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Compute (TOPS)</label>
              <input type="number" value={form.compute_tops} onChange={e => setForm({...form,compute_tops:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Process (nm)</label>
              <input type="number" value={form.process_node_nm} onChange={e => setForm({...form,process_node_nm:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Price (USD)</label>
              <input type="number" value={form.price_usd} onChange={e => setForm({...form,price_usd:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Availability</label>
              <select value={form.availability} onChange={e => setForm({...form,availability:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                {['available','limited','cloud_only','upcoming','internal'].map(a => <option key={a} value={a}>{a}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Release Date</label>
              <input type="date" value={form.released_date} onChange={e => setForm({...form,released_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="spec" checked={form.speculative_decode} onChange={e => setForm({...form,speculative_decode:e.target.checked})} className="rounded bg-gray-800 border-gray-700" />
              <label htmlFor="spec" className="text-sm text-gray-300">Speculative Decoding Support</label>
            </div>
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

export default function ChipsPage() {
  const [chips, setChips] = useState<Chip[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Chip | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editChip, setEditChip] = useState<Chip | null>(null);

  const load = async () => { setChips(await api.getChips()); };
  useEffect(() => { load(); }, []);

  const filtered = chips.filter(c => c.name?.toLowerCase().includes(search.toLowerCase()) || c.manufacturer?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Inference Chips</h1>
          <p className="text-gray-400 text-sm mt-1">{chips.length} chips | {chips.filter(c => c.speculative_decode).length} with speculative decode</p>
        </div>
        <button onClick={() => { setEditChip(null); setShowForm(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Chip
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search chips..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Chip','Arch','TOPS','BW (GB/s)','KV Cache','TDP','Availability'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(c => (
              <tr key={c.id} onClick={() => setSelected(c)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-cyan-400" />
                    <div>
                      <p className="text-white text-sm font-medium">{c.name}</p>
                      <p className="text-gray-500 text-xs">{c.manufacturer}</p>
                    </div>
                    {c.speculative_decode && <CheckCircle className="w-3 h-3 text-green-400 ml-1" />}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-300 text-xs">{c.architecture}</td>
                <td className="px-4 py-3 text-cyan-300 text-sm font-medium">{Number(c.compute_tops).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{Number(c.memory_bandwidth_gbps).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{c.kv_cache_gb} GB</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    <span className="text-gray-300 text-sm">{c.tdp_watts}W</span>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${availColors[c.availability] || 'bg-gray-700 text-gray-300'}`}>{c.availability}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No chips found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">{selected.name}</h2>
              <p className="text-gray-400 text-sm">{selected.manufacturer} · {selected.architecture}</p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditChip(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteChip(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 rounded text-xs font-medium ${availColors[selected.availability] || 'bg-gray-700 text-gray-300'}`}>{selected.availability}</span>
              {selected.speculative_decode && <span className="flex items-center gap-1 text-green-400 text-xs"><CheckCircle className="w-3 h-3" />Speculative Decode</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Compute', `${Number(selected.compute_tops).toLocaleString()} TOPS`],['Mem Bandwidth', `${Number(selected.memory_bandwidth_gbps).toLocaleString()} GB/s`],['KV Cache', `${selected.kv_cache_gb} GB`],['Context Switch', `${selected.context_switch_ns} ns`],['TDP', `${selected.tdp_watts}W`],['Process Node', `${selected.process_node_nm}nm`],['Price', selected.price_usd > 0 ? `$${Number(selected.price_usd).toLocaleString()}` : 'Cloud Only'],['Released', selected.released_date?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
          </div>
        </div>
      )}
      {showForm && <ChipForm chip={editChip} onClose={() => { setShowForm(false); setEditChip(null); }} onSave={() => { setShowForm(false); setEditChip(null); setSelected(null); load(); }} />}
    </div>
  );
}
