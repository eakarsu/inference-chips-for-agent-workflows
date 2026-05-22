import { useEffect, useState } from 'react';
import { apiFetch } from '../api';
import { FileDown } from 'lucide-react';

type Chip = { id: number; name: string; manufacturer: string | null };

export default function ChipSpecPdfDownloader() {
  const [chips, setChips] = useState<Chip[]>([]);
  const [chipId, setChipId] = useState<number | ''>('');
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    apiFetch('/chips').then((r: Chip[]) => {
      setChips(r);
      if (r.length && chipId === '') setChipId(r[0].id);
    }).catch(() => setChips([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const download = async () => {
    if (chipId === '') return;
    setBusy(true); setStatus('Generating PDF...');
    try {
      const token = localStorage.getItem('token') || '';
      const res = await fetch(`/api/custom-views/chip-spec-pdf?chip_id=${chipId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `chip-${chipId}-spec.pdf`;
      document.body.appendChild(a); a.click(); a.remove();
      URL.revokeObjectURL(url);
      setStatus(`Downloaded ${blob.size} bytes`);
    } catch (e: unknown) {
      setStatus('Error: ' + (e instanceof Error ? e.message : 'failed'));
    } finally { setBusy(false); }
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
      <h3 className="text-white font-semibold mb-3">Chip Spec PDF</h3>
      <p className="text-sm text-gray-400 mb-3">
        Generate a one-page PDF specification sheet for any chip in the catalog.
      </p>
      <div className="flex items-center gap-2">
        <select value={chipId} onChange={e => setChipId(e.target.value ? Number(e.target.value) : '')}
                className="bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm text-white flex-1">
          <option value="">Select chip...</option>
          {chips.map(c => (
            <option key={c.id} value={c.id}>
              {c.name}{c.manufacturer ? ` (${c.manufacturer})` : ''}
            </option>
          ))}
        </select>
        <button onClick={download} disabled={busy || chipId === ''}
                className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded">
          <FileDown className="w-4 h-4" />
          {busy ? 'Working...' : 'Download PDF'}
        </button>
      </div>
      {status && <div className="mt-2 text-xs text-gray-400">{status}</div>}
    </div>
  );
}
