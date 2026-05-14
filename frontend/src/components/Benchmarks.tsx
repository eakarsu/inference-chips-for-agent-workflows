const benchmarks = [
  {
    metric: 'GPU Utilization',
    unit: '%',
    standard: 32,
    custom: 78,
    theoretical: 95,
    higherBetter: true,
  },
  {
    metric: 'Context Switch Time',
    unit: 'ns',
    standard: 150,
    custom: 45,
    theoretical: 12,
    higherBetter: false,
  },
  {
    metric: 'Memory Bandwidth',
    unit: 'GB/s',
    standard: 80,
    custom: 320,
    theoretical: 640,
    higherBetter: true,
  },
  {
    metric: 'Throughput',
    unit: 'steps/sec',
    standard: 14.2,
    custom: 38.7,
    theoretical: 89.4,
    higherBetter: true,
  },
  {
    metric: 'KV Cache Hit Rate',
    unit: '%',
    standard: 41,
    custom: 87,
    theoretical: 99,
    higherBetter: true,
  },
  {
    metric: 'Prefill Latency (32K)',
    unit: 'ms',
    standard: 1850,
    custom: 620,
    theoretical: 180,
    higherBetter: false,
  },
  {
    metric: 'Decode Latency',
    unit: 'ms/token',
    standard: 12.4,
    custom: 4.8,
    theoretical: 1.2,
    higherBetter: false,
  },
  {
    metric: 'Power Efficiency',
    unit: 'TFLOP/W',
    standard: 2.1,
    custom: 6.8,
    theoretical: 14.2,
    higherBetter: true,
  },
]

function ScoreBar({ value, max, color }: { value: number; max: number; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
        ></div>
      </div>
    </div>
  )
}

export default function Benchmarks() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Chip Benchmarks</h2>
        <p className="text-xs text-gray-400 mt-0.5">Standard GPU vs Custom Chip vs Theoretical Maximum</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-gray-500"></div>
            <span className="text-sm font-semibold text-gray-300">Standard GPU</span>
          </div>
          <div className="text-2xl font-bold text-white">Baseline</div>
          <div className="text-xs text-gray-500 mt-1">A100-class reference</div>
        </div>
        <div className="bg-gray-900 border border-cyan-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-cyan-500"></div>
            <span className="text-sm font-semibold text-cyan-300">Custom Chip</span>
          </div>
          <div className="text-2xl font-bold text-cyan-400">2.7x avg</div>
          <div className="text-xs text-gray-500 mt-1">Optimized for agent workloads</div>
        </div>
        <div className="bg-gray-900 border border-purple-800/40 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm font-semibold text-purple-300">Theoretical Max</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">6.3x avg</div>
          <div className="text-xs text-gray-500 mt-1">Physical limits only</div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-xs text-gray-500 uppercase tracking-wider">
              <th className="text-left px-5 py-3">Metric</th>
              <th className="text-center px-3 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
                  Standard GPU
                </div>
              </th>
              <th className="text-center px-3 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-cyan-500"></div>
                  Custom Chip
                </div>
              </th>
              <th className="text-center px-3 py-3">
                <div className="flex items-center justify-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                  Theoretical Max
                </div>
              </th>
              <th className="text-left px-5 py-3">Visual Comparison</th>
              <th className="text-right px-5 py-3">Improvement</th>
            </tr>
          </thead>
          <tbody>
            {benchmarks.map((b) => {
              const normMax = b.higherBetter ? b.theoretical : b.standard
              const normStandard = b.higherBetter ? b.standard : (b.standard / b.standard)
              const normCustom = b.higherBetter ? b.custom : (b.standard / b.custom)
              const normTheoretical = b.higherBetter ? b.theoretical : (b.standard / b.theoretical)

              const improvement = b.higherBetter
                ? `+${Math.round((b.custom / b.standard - 1) * 100)}%`
                : `-${Math.round((1 - b.custom / b.standard) * 100)}%`

              const improvementColor = b.higherBetter
                ? (b.custom > b.standard ? 'text-green-400' : 'text-red-400')
                : (b.custom < b.standard ? 'text-green-400' : 'text-red-400')

              return (
                <tr key={b.metric} className="border-b border-gray-800/60 hover:bg-gray-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <div className="font-medium text-gray-200">{b.metric}</div>
                    <div className="text-xs text-gray-600">{b.unit}</div>
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-gray-300">{b.standard}</td>
                  <td className="px-3 py-3 text-center font-mono text-cyan-300 font-semibold">{b.custom}</td>
                  <td className="px-3 py-3 text-center font-mono text-purple-300">{b.theoretical}</td>
                  <td className="px-5 py-3 w-52">
                    <div className="space-y-1">
                      <ScoreBar value={normStandard} max={normMax} color="bg-gray-500" />
                      <ScoreBar value={normCustom} max={normMax} color="bg-cyan-500" />
                      <ScoreBar value={normTheoretical} max={normMax} color="bg-purple-500" />
                    </div>
                  </td>
                  <td className={`px-5 py-3 text-right font-semibold ${improvementColor}`}>{improvement}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Notes */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <div className="text-xs text-gray-500">
          <span className="text-gray-400 font-medium">Note:</span> Custom chip benchmarks based on simulated workload profile from tracked workflows.
          Theoretical maximum assumes ideal memory hierarchy, zero context-switch overhead, and perfect speculative decode acceptance rate.
          Standard GPU baseline: A100-80GB with default inference settings.
        </div>
      </div>
    </div>
  )
}
