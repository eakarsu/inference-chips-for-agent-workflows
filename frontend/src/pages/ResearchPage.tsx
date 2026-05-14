import { useEffect, useState } from 'react';
import { api } from '../api';
import { Plus, Search, BookOpen, X, Edit2, Trash2, Star } from 'lucide-react';

interface Research {
  id: number; title: string; focus_area: string; findings: string;
  chip_mentioned: string; published_date: string; citations: number;
  journal: string; breakthrough: boolean;
}

const focusColors: Record<string, string> = {
  performance: 'bg-cyan-900 text-cyan-300', efficiency: 'bg-green-900 text-green-300',
  architecture: 'bg-purple-900 text-purple-300', inference: 'bg-blue-900 text-blue-300',
  training: 'bg-orange-900 text-orange-300', memory: 'bg-yellow-900 text-yellow-300',
  cooling: 'bg-teal-900 text-teal-300',
};

function ResearchForm({ paper, onSave, onClose }: { paper?: Research | null; onSave: () => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: paper?.title || '', focus_area: paper?.focus_area || 'performance',
    findings: paper?.findings || '', chip_mentioned: paper?.chip_mentioned || '',
    published_date: paper?.published_date?.split('T')[0] || '', citations: paper?.citations || 0,
    journal: paper?.journal || '', breakthrough: paper?.breakthrough || false,
  });
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (paper) await api.updateResearch(paper.id, form); else await api.createResearch(form);
      onSave();
    } catch (err) { console.error(err); }
  };
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-800 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-white font-semibold">{paper ? 'Edit Research' : 'New Research'}</h2>
          <button onClick={onClose}><X className="w-5 h-5 text-gray-400 hover:text-white" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Title *</label>
              <input required value={form.title} onChange={e => setForm({...form,title:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Focus Area</label>
              <select value={form.focus_area} onChange={e => setForm({...form,focus_area:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500">
                {['performance','efficiency','architecture','inference','training','memory','cooling'].map(f => <option key={f} value={f}>{f}</option>)}</select></div>
            <div><label className="block text-xs text-gray-400 mb-1">Chip Mentioned</label>
              <input value={form.chip_mentioned} onChange={e => setForm({...form,chip_mentioned:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Journal</label>
              <input value={form.journal} onChange={e => setForm({...form,journal:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Citations</label>
              <input type="number" value={form.citations} onChange={e => setForm({...form,citations:parseInt(e.target.value)})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div><label className="block text-xs text-gray-400 mb-1">Published Date</label>
              <input type="date" value={form.published_date} onChange={e => setForm({...form,published_date:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
            <div className="col-span-2 flex items-center gap-2">
              <input type="checkbox" id="bt" checked={form.breakthrough} onChange={e => setForm({...form,breakthrough:e.target.checked})} className="rounded bg-gray-800 border-gray-700" />
              <label htmlFor="bt" className="text-sm text-gray-300">Breakthrough Paper</label>
            </div>
            <div className="col-span-2"><label className="block text-xs text-gray-400 mb-1">Findings</label>
              <textarea rows={3} value={form.findings} onChange={e => setForm({...form,findings:e.target.value})} className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-cyan-500" /></div>
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

export default function ResearchPage() {
  const [papers, setPapers] = useState<Research[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Research | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editPaper, setEditPaper] = useState<Research | null>(null);

  const load = async () => { setPapers(await api.getResearch()); };
  useEffect(() => { load(); }, []);

  const filtered = papers.filter(p => p.title?.toLowerCase().includes(search.toLowerCase()) || p.chip_mentioned?.toLowerCase().includes(search.toLowerCase()) || p.focus_area?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Papers</h1>
          <p className="text-gray-400 text-sm mt-1">{papers.length} papers | {papers.filter(p => p.breakthrough).length} breakthroughs</p>
        </div>
        <button onClick={() => { setEditPaper(null); setShowForm(true); }} className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-4 py-2 rounded-lg text-sm font-medium">
          <Plus className="w-4 h-4" /> New Paper
        </button>
      </div>
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search papers..."
          className="w-full bg-gray-900 border border-gray-800 rounded-lg pl-10 pr-4 py-2.5 text-white text-sm focus:outline-none focus:border-cyan-500" />
      </div>
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <table className="w-full">
          <thead><tr className="border-b border-gray-800">{['Title','Focus Area','Chip Mentioned','Journal','Citations','Date','Flag'].map(h => <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody>
            {filtered.map(p => (
              <tr key={p.id} onClick={() => setSelected(p)} className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <p className="text-white text-sm line-clamp-1">{p.title}</p>
                  </div>
                </td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded text-xs font-medium ${focusColors[p.focus_area] || 'bg-gray-700 text-gray-300'}`}>{p.focus_area}</span></td>
                <td className="px-4 py-3 text-gray-300 text-sm">{p.chip_mentioned}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">{p.journal}</td>
                <td className="px-4 py-3 text-cyan-300 text-sm font-medium">{p.citations?.toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500 text-sm">{p.published_date?.split('T')[0]}</td>
                <td className="px-4 py-3">{p.breakthrough && <span className="flex items-center gap-0.5 text-yellow-400 text-xs"><Star className="w-3 h-3" />BT</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-12 text-gray-600">No papers found</div>}
      </div>
      {selected && !showForm && (
        <div className="fixed inset-y-0 right-0 w-1/2 bg-gray-900 border-l border-gray-800 z-40 overflow-y-auto">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <div><h2 className="text-white font-semibold text-lg leading-tight">{selected.title}</h2><p className="text-gray-400 text-sm mt-0.5">{selected.journal}</p></div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-4">
              <button onClick={() => { setEditPaper(selected); setShowForm(true); }} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><Edit2 className="w-4 h-4" /></button>
              <button onClick={async () => { if (!confirm('Delete?')) return; await api.deleteResearch(selected.id); setSelected(null); load(); }} className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              <button onClick={() => setSelected(null)} className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg"><X className="w-5 h-5" /></button>
            </div>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${focusColors[selected.focus_area] || 'bg-gray-700 text-gray-300'}`}>{selected.focus_area}</span>
              {selected.breakthrough && <span className="flex items-center gap-1 text-yellow-400 text-xs"><Star className="w-3 h-3" />Breakthrough</span>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[['Chip Mentioned', selected.chip_mentioned],['Citations', selected.citations?.toLocaleString()],['Published', selected.published_date?.split('T')[0]],['Journal', selected.journal]].map(([l, v]) => (
                <div key={String(l)} className="bg-gray-800 rounded-lg p-3"><p className="text-gray-500 text-xs">{l}</p><p className="text-white font-medium mt-1 text-sm">{v}</p></div>
              ))}
            </div>
            {selected.findings && <div><p className="text-gray-500 text-xs mb-1">Findings</p><p className="text-gray-300 text-sm leading-relaxed">{selected.findings}</p></div>}
          </div>
        </div>
      )}
      {showForm && <ResearchForm paper={editPaper} onClose={() => { setShowForm(false); setEditPaper(null); }} onSave={() => { setShowForm(false); setEditPaper(null); setSelected(null); load(); }} />}
    </div>
  );
}
