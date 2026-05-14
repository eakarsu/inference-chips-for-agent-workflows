import { useEffect, useState } from 'react';
import { api } from '../api';
import { Download, FileText } from 'lucide-react';

const TABLE_DESCRIPTIONS: Record<string, string> = {
  chips: 'Inference chip catalog with specs, prices, and availability',
  workflows: 'Agent workflow profiles with step counts and characteristics',
  steps: 'Individual workflow steps with timing and bottleneck flags',
  benchmarks: 'Chip-vs-workflow benchmark results',
  deployments: 'Production chip deployments at customers',
  research: 'Research findings and chip-relevant publications',
};

export default function ExportPage() {
  const [tables, setTables] = useState<string[]>([]);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.exportTables().then(d => setTables(d.tables)).catch(e => setError(String(e)));
  }, []);

  const download = async (table: string) => {
    setDownloading(table);
    setError('');
    try {
      const token = localStorage.getItem('token');
      const r = await fetch(api.exportCsvUrl(table), {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!r.ok) throw new Error('Export failed: ' + r.statusText);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${table}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(String(e));
    } finally {
      setDownloading(null);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">CSV Export</h1>
        <p className="text-gray-400 text-sm mt-1">Download any table as a CSV file for analysis or reporting</p>
      </div>

      {error && (
        <div className="bg-red-900/40 border border-red-700 rounded-lg p-3 mb-4 text-red-300 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tables.map(t => (
          <div key={t} className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-cyan-900/40 border border-cyan-800 flex items-center justify-center">
                <FileText className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <p className="text-white font-medium capitalize">{t}</p>
                <p className="text-gray-500 text-xs">{TABLE_DESCRIPTIONS[t] || ''}</p>
              </div>
            </div>
            <button
              onClick={() => download(t)}
              disabled={downloading === t}
              className="mt-auto flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Download className="w-4 h-4" />
              {downloading === t ? 'Downloading...' : 'Download CSV'}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
