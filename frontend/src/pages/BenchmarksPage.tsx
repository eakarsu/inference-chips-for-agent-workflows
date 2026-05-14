import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, BarChart2, X, Edit2, Trash2 } from 'lucide-react';

interface Bench {
  id: number; chip_id: number; chip_name: string; workflow_id: number; workflow_name: string;
  utilization_pct: number; speedup_factor: number; throughput_steps_per_sec: number;
  latency_ms: number; power_efficiency: number; benchmark_date: string; test_environment: string; notes: string;
}

function BenchForm({ bench, chips, workflows, onSave, onClose }: { bench?: Bench | null; chips: {id:number;name:string}[]; workflows: {id:number;name:string}[]; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    chip_id: bench?.chip_id || '', workflow_id: bench?.workflow_id || '',
    utilization_pct: bench?.utilization_pct || '', speedup_factor: bench?.speedup_factor || '',
    throughput_steps_per_sec: bench?.throughput_steps_per_sec || '', latency_ms: bench?.latency_ms || '',
    power_efficiency: bench?.power_efficiency || '', benchmark_date: bench?.benchmark_date?.split('T')[0] || '',
    test_environment: bench?.test_environment || '', notes: bench?.notes || '',
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (bench) await api.updateBenchmark(bench.id, form); else await api.createBenchmark(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{bench ? 'Edit Benchmark' : 'New Benchmark'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Chip *</label>
              <select required value={form.chip_id} onChange={e => setForm({...form,chip_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value="">Select chip...</option>{chips.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Workflow *</label>
              <select required value={form.workflow_id} onChange={e => setForm({...form,workflow_id:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                <option value="">Select workflow...</option>{workflows.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Utilization (%)</label>
              <input type="number" step="0.1" value={form.utilization_pct} onChange={e => setForm({...form,utilization_pct:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Speedup Factor</label>
              <input type="number" step="0.1" value={form.speedup_factor} onChange={e => setForm({...form,speedup_factor:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Throughput (steps/s)</label>
              <input type="number" step="0.01" value={form.throughput_steps_per_sec} onChange={e => setForm({...form,throughput_steps_per_sec:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Latency (ms)</label>
              <input type="number" value={form.latency_ms} onChange={e => setForm({...form,latency_ms:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Power Efficiency</label>
              <input type="number" step="0.01" value={form.power_efficiency} onChange={e => setForm({...form,power_efficiency:parseFloat(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Benchmark Date</label>
              <input type="date" value={form.benchmark_date} onChange={e => setForm({...form,benchmark_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Test Environment</label>
              <input value={form.test_environment} onChange={e => setForm({...form,test_environment:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Notes</label>
              <textarea rows={2} value={form.notes} onChange={e => setForm({...form,notes:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
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

export default function BenchmarksPage() {
  const [benchmarks, setBenchmarks] = useState<Bench[]>([]);
  const [chips, setChips] = useState<{id:number;name:string}[]>([]);
  const [workflows, setWorkflows] = useState<{id:number;name:string}[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Bench | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editBench, setEditBench] = useState<Bench | null>(null);

  const load = async () => {
    const [b, c, w] = await Promise.all([api.getBenchmarks(), api.getChips(), api.getWorkflows()]);
    setBenchmarks(b); setChips(c); setWorkflows(w);
  };
  useEffect(() => { load(); }, []);

  const filtered = benchmarks.filter(b => b.chip_name?.toLowerCase().includes(search.toLowerCase()) || b.workflow_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Benchmarks</h1>
          <p className="text-gray-400 text-sm mt-1">{benchmarks.length} benchmark runs</p>
        </div>
        <button onClick={() => { setEditBench(null); setShowForm(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Benchmark
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search benchmarks..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Chip','Workflow','Speedup','Latency','Throughput','Util%','Date'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(b => (
              <tr key={b.id} onClick={() => setSelected(b)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-2"><BarChart2 className="w-4 h-4 text-cyan-400" /><p className="text-white text-sm">{b.chip_name}</p></div></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{b.workflow_name}</td>
                <td className="px-4 py-3"><span className="text-green-400 font-bold text-sm">{b.speedup_factor}x</span></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{b.latency_ms}ms</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{Number(b.throughput_steps_per_sec).toFixed(1)}/s</td>
                <td className="px-4 py-3 text-gray-300 text-sm">{b.utilization_pct}%</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{b.benchmark_date?.split('T')[0]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No benchmarks found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg">{selected.chip_name}</h2><p className="text-gray-400 text-sm">{selected.workflow_name}</p></div>
            <div className="flex items-center gap-2">
              <button onClick={() => { setEditBench(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteBenchmark(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[['Speedup', `${selected.speedup_factor}x`],['Latency', `${selected.latency_ms}ms`],['Throughput', `${Number(selected.throughput_steps_per_sec).toFixed(2)}/s`],['Utilization', `${selected.utilization_pct}%`],['Power Efficiency', selected.power_efficiency],['Date', selected.benchmark_date?.split('T')[0]]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.test_environment && <div><p className="text-gray-500 text-xs mb-1">Environment</p><p className="text-gray-300 font-mono text-xs">{selected.test_environment}</p></div>}
            {selected.notes && <div><p className="text-gray-500 text-xs mb-1">Notes</p><p className="text-gray-300 text-sm">{selected.notes}</p></div>}
          </div>
        </div>
      )}
      {showForm && <BenchForm bench={editBench} chips={chips} workflows={workflows} onClose={() => { setShowForm(false); setEditBench(null); }} onSave={() => { setShowForm(false); setEditBench(null); setSelected(null); load(); }} />}
    </div>
  );
}
