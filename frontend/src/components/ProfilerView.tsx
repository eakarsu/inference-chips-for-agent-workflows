import { Workflow } from '../App'

type Step = {
  name: string
  type: 'model_call' | 'tool_use' | 'memory_read' | 'cpu_compute'
  duration: number
  bottleneck: boolean
  hint?: string
}

type Props = {
  workflow: Workflow
}

const workflowSteps: Record<string, Step[]> = {
  'wf-1': [
    { name: 'Query decomposition', type: 'model_call', duration: 420, bottleneck: false },
    { name: 'Web search (×3)', type: 'tool_use', duration: 1240, bottleneck: true, hint: 'Network I/O dominates; consider parallel fetch' },
    { name: 'Content extraction', type: 'cpu_compute', duration: 380, bottleneck: false },
    { name: 'Memory context fetch', type: 'memory_read', duration: 95, bottleneck: false },
    { name: 'Synthesis call (32K ctx)', type: 'model_call', duration: 1850, bottleneck: true, hint: 'KV cache miss; 32K context exceeds L2 cache capacity' },
    { name: 'Fact verification', type: 'model_call', duration: 520, bottleneck: false },
    { name: 'Citation extraction', type: 'tool_use', duration: 145, bottleneck: false },
    { name: 'Format output', type: 'cpu_compute', duration: 80, bottleneck: false },
    { name: 'Memory write', type: 'memory_read', duration: 90, bottleneck: false },
  ],
  'wf-2': [
    { name: 'Repo clone + parse', type: 'tool_use', duration: 580, bottleneck: true, hint: 'Disk I/O bottleneck during AST parsing' },
    { name: 'Static lint pass', type: 'cpu_compute', duration: 420, bottleneck: false },
    { name: 'Diff extraction', type: 'cpu_compute', duration: 95, bottleneck: false },
    { name: 'LLM review (diff context)', type: 'model_call', duration: 890, bottleneck: true, hint: 'Large diff context inflates prefill time' },
    { name: 'Issue classification', type: 'model_call', duration: 185, bottleneck: false },
    { name: 'Comment generation', type: 'model_call', duration: 170, bottleneck: false },
  ],
  'wf-3': [
    { name: 'Intent classification', type: 'model_call', duration: 210, bottleneck: false },
    { name: 'Entity extraction', type: 'model_call', duration: 180, bottleneck: false },
    { name: 'Memory vector search', type: 'memory_read', duration: 640, bottleneck: true, hint: 'Vector index not loaded in GPU memory; cold read latency' },
    { name: 'Context assembly', type: 'cpu_compute', duration: 75, bottleneck: false },
    { name: 'Response generation', type: 'model_call', duration: 785, bottleneck: false },
  ],
  'wf-4': [
    { name: 'Data ingestion', type: 'tool_use', duration: 920, bottleneck: true, hint: 'Unparallelized I/O reading 12 CSV files sequentially' },
    { name: 'Schema validation', type: 'cpu_compute', duration: 340, bottleneck: false },
    { name: 'Feature engineering', type: 'cpu_compute', duration: 870, bottleneck: true, hint: 'Single-threaded numpy; GPU offload could give 8x speedup' },
    { name: 'Statistical analysis', type: 'cpu_compute', duration: 1520, bottleneck: true, hint: 'Matrix ops on CPU; BLAS not tuned for this hardware' },
    { name: 'Memory context fetch', type: 'memory_read', duration: 120, bottleneck: false },
    { name: 'LLM interpretation', type: 'model_call', duration: 1640, bottleneck: false },
    { name: 'Chart generation', type: 'cpu_compute', duration: 480, bottleneck: false },
    { name: 'Narrative synthesis', type: 'model_call', duration: 820, bottleneck: false },
  ],
}

const typeColors: Record<string, { bar: string; label: string; badge: string }> = {
  model_call: { bar: 'bg-blue-500', label: 'text-blue-300', badge: 'bg-blue-500/20 text-blue-300' },
  tool_use: { bar: 'bg-green-500', label: 'text-green-300', badge: 'bg-green-500/20 text-green-300' },
  memory_read: { bar: 'bg-purple-500', label: 'text-purple-300', badge: 'bg-purple-500/20 text-purple-300' },
  cpu_compute: { bar: 'bg-orange-500', label: 'text-orange-300', badge: 'bg-orange-500/20 text-orange-300' },
}

export default function ProfilerView({ workflow }: Props) {
  const steps = workflowSteps[workflow.id] || []
  const maxDuration = Math.max(...steps.map(s => s.duration))
  const bottlenecks = steps.filter(s => s.bottleneck)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">{workflow.name}</h2>
          <p className="text-xs text-gray-400 mt-0.5">{steps.length} steps • {workflow.totalDuration.toLocaleString()}ms total • Last profiled {workflow.lastProfiled}</p>
        </div>
        <div className="flex gap-3">
          {Object.entries(typeColors).map(([type, c]) => (
            <div key={type} className="flex items-center gap-1.5 text-xs">
              <div className={`w-2.5 h-2.5 rounded-sm ${c.bar}`}></div>
              <span className="text-gray-400">{type.replace('_', ' ')}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Horizontal bar chart */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4">Step Duration Profile</h3>
        <div className="space-y-3">
          {steps.map((step, idx) => {
            const c = typeColors[step.type]
            const pct = (step.duration / maxDuration) * 100
            return (
              <div key={idx} className="flex items-center gap-3">
                <div className="w-48 text-xs text-gray-300 shrink-0 text-right">{step.name}</div>
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex-1 h-6 bg-gray-800 rounded overflow-hidden relative">
                    <div
                      className={`h-full rounded ${c.bar} ${step.bottleneck ? 'opacity-100' : 'opacity-70'} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                    {step.bottleneck && (
                      <div className="absolute right-1 top-0.5 text-xs text-red-400 font-bold">!</div>
                    )}
                  </div>
                  <div className="w-16 text-right text-xs font-mono text-gray-300">{step.duration}ms</div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* GPU utilization gauge */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-3">GPU Utilization</div>
          <div className="relative w-24 h-24 mx-auto">
            <svg viewBox="0 0 36 36" className="w-24 h-24 -rotate-90">
              <circle cx="18" cy="18" r="15" fill="none" stroke="#1f2937" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15" fill="none" stroke="#06b6d4" strokeWidth="3"
                strokeDasharray={`${32 * 0.942} ${100 * 0.942}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-bold text-cyan-400">32%</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2">Baseline (no optimization)</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Avg Step Duration</div>
          <div className="text-3xl font-bold text-white mt-4">
            {Math.round(workflow.totalDuration / workflow.stepCount)}
            <span className="text-sm text-gray-400 ml-1">ms</span>
          </div>
          <div className="text-xs text-gray-500 mt-2">per step</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Bottlenecks</div>
          <div className="text-3xl font-bold text-red-400 mt-4">{bottlenecks.length}</div>
          <div className="text-xs text-gray-500 mt-2">flagged steps</div>
        </div>
      </div>

      {/* Bottleneck list */}
      {bottlenecks.length > 0 && (
        <div className="bg-gray-900 border border-red-900/40 rounded-xl p-5">
          <h3 className="text-xs text-red-400 uppercase tracking-wider mb-4 font-semibold">Bottleneck Analysis</h3>
          <div className="space-y-3">
            {bottlenecks.map((step, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-gray-800/50 rounded-lg p-3">
                <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{idx + 1}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-white">{step.name}</span>
                    <span className={`text-xs px-1.5 py-0.5 rounded ${typeColors[step.type].badge}`}>{step.type}</span>
                    <span className="text-xs font-mono text-red-400">{step.duration}ms</span>
                  </div>
                  <p className="text-xs text-gray-400">{step.hint}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
