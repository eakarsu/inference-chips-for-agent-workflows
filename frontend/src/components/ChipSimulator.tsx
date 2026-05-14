import { useState } from 'react'

type SimResult = {
  speedupMultiplier: number
  newUtilization: number
  timeSavedPer1000: number
  bottleneckImprovements: Array<{ name: string; before: number; after: number }>
}

function simulate(contextSwitchNs: number, kvCacheGb: number, speculativeDecode: boolean): SimResult {
  const baseContextSwitch = 150
  const baseKvCache = 4
  const baseUtil = 32

  const contextFactor = baseContextSwitch / contextSwitchNs
  const cacheFactor = kvCacheGb / baseKvCache
  const speculativeFactor = speculativeDecode ? 1.35 : 1.0

  const speedupMultiplier = parseFloat((contextFactor * 0.4 + cacheFactor * 0.45 + speculativeFactor * 0.15 + 0.85).toFixed(2))
  const newUtilization = Math.min(98, Math.round(baseUtil * speedupMultiplier * 0.82))
  const timeSavedPer1000 = Math.round((1 - 1 / speedupMultiplier) * 4820)

  return {
    speedupMultiplier,
    newUtilization,
    timeSavedPer1000,
    bottleneckImprovements: [
      { name: 'Context Switch Overhead', before: 420, after: Math.round(420 / contextFactor) },
      { name: 'KV Cache Miss Latency', before: 1850, after: Math.round(1850 / cacheFactor) },
      { name: 'Prefill Time', before: 890, after: Math.round(890 / (speculativeFactor * 0.7 + 0.3)) },
      { name: 'Memory Read (cold)', before: 640, after: Math.round(640 / (cacheFactor * 0.6 + 0.4)) },
    ],
  }
}

export default function ChipSimulator() {
  const [contextSwitchNs, setContextSwitchNs] = useState(80)
  const [kvCacheGb, setKvCacheGb] = useState(16)
  const [speculativeDecode, setSpeculativeDecode] = useState(false)
  const [result, setResult] = useState<SimResult | null>(null)
  const [simulating, setSimulating] = useState(false)

  const handleSimulate = () => {
    setSimulating(true)
    setTimeout(() => {
      setResult(simulate(contextSwitchNs, kvCacheGb, speculativeDecode))
      setSimulating(false)
    }, 600)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-white">Custom Chip Simulator</h2>
        <p className="text-xs text-gray-400 mt-0.5">Configure a custom inference chip and simulate performance impact on tracked workflows</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Config panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-6">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider">Chip Configuration</h3>

          {/* Context switch ns */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-200">Context Switch Latency</label>
              <span className="text-cyan-400 font-mono font-bold">{contextSwitchNs} ns</span>
            </div>
            <input
              type="range"
              min={10}
              max={300}
              value={contextSwitchNs}
              onChange={(e) => setContextSwitchNs(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>10 ns (fast)</span>
              <span className="text-gray-500">Baseline: 150 ns</span>
              <span>300 ns (slow)</span>
            </div>
          </div>

          {/* KV Cache */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-gray-200">KV Cache Size</label>
              <span className="text-cyan-400 font-mono font-bold">{kvCacheGb} GB</span>
            </div>
            <input
              type="range"
              min={2}
              max={64}
              step={2}
              value={kvCacheGb}
              onChange={(e) => setKvCacheGb(Number(e.target.value))}
              className="w-full accent-cyan-500"
            />
            <div className="flex justify-between text-xs text-gray-600 mt-1">
              <span>2 GB</span>
              <span className="text-gray-500">Baseline: 4 GB</span>
              <span>64 GB</span>
            </div>
          </div>

          {/* Speculative decode toggle */}
          <div className="flex items-center justify-between bg-gray-800 rounded-lg p-4">
            <div>
              <div className="text-sm font-medium text-gray-200">Speculative Decoding</div>
              <div className="text-xs text-gray-500 mt-0.5">Draft model acceleration</div>
            </div>
            <button
              onClick={() => setSpeculativeDecode(!speculativeDecode)}
              className={`relative w-12 h-6 rounded-full transition-colors ${speculativeDecode ? 'bg-cyan-500' : 'bg-gray-600'}`}
            >
              <div className={`absolute w-5 h-5 rounded-full bg-white top-0.5 transition-transform ${speculativeDecode ? 'translate-x-6' : 'translate-x-0.5'}`}></div>
            </button>
          </div>

          <button
            onClick={handleSimulate}
            disabled={simulating}
            className="w-full bg-cyan-500 hover:bg-cyan-600 disabled:bg-cyan-800 text-black font-bold py-3 rounded-lg text-sm transition-colors"
          >
            {simulating ? 'Simulating...' : 'Run Simulation'}
          </button>
        </div>

        {/* Results panel */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Simulation Results</h3>

          {result ? (
            <div className="space-y-4">
              {/* Key metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className={`text-2xl font-bold ${result.speedupMultiplier >= 2 ? 'text-cyan-400' : result.speedupMultiplier >= 1.5 ? 'text-green-400' : 'text-yellow-400'}`}>
                    {result.speedupMultiplier}x
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Speedup</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">{result.newUtilization}%</div>
                  <div className="text-xs text-gray-500 mt-1">Utilization</div>
                </div>
                <div className="bg-gray-800 rounded-lg p-3 text-center">
                  <div className="text-lg font-bold text-amber-400">
                    {(result.timeSavedPer1000 / 1000).toFixed(1)}s
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Saved/1K runs</div>
                </div>
              </div>

              {/* Bottleneck improvements */}
              <div>
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">Bottleneck Improvements</div>
                <div className="space-y-2">
                  {result.bottleneckImprovements.map((b, idx) => {
                    const improvement = Math.round((1 - b.after / b.before) * 100)
                    return (
                      <div key={idx}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-300">{b.name}</span>
                          <span className="text-green-400">-{improvement}% ({b.before}→{b.after}ms)</span>
                        </div>
                        <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${100 - improvement}%` }}></div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-800 rounded-lg p-3">
                Configuration: {contextSwitchNs}ns ctx switch • {kvCacheGb}GB KV cache {speculativeDecode ? '• speculative decoding' : ''}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-gray-600">
              <div className="text-center">
                <div className="text-3xl mb-2">⚙️</div>
                <p className="text-sm">Configure chip and run simulation</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
