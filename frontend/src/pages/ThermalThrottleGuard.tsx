import { useState } from 'react';
import { apiFetch } from '../api';

export default function ThermalThrottleGuard() {
  const [payload, setPayload] = useState(JSON.stringify({ watts: 620, temp_c: 84, ambient_c: 31, utilization: 0.92, hbm_gb: 128 }, null, 2));
  const [result, setResult] = useState<any>(null);
  const run = async () => setResult(await apiFetch('/thermal-throttle/score', { method: 'POST', body: JSON.stringify(JSON.parse(payload)) }));
  return (
    <div className="p-8 text-white space-y-5">
      <div><h1 className="text-2xl font-bold">Thermal Throttle Guard</h1><p className="text-gray-400">Score chip thermal risk for long-running agent workflow bursts.</p></div>
      <textarea className="w-full h-64 bg-gray-900 border border-gray-800 rounded-lg p-3 font-mono text-sm" value={payload} onChange={(event) => setPayload(event.target.value)} />
      <button className="px-4 py-2 rounded-lg bg-cyan-600" onClick={run}>Score Thermal Risk</button>
      {result && <div className="bg-gray-900 border border-gray-800 rounded-lg p-5"><h2 className="text-xl">{result.tier} · {result.score}</h2><p className="text-gray-300">{result.recommendedClock}</p></div>}
    </div>
  );
}
