import { Workflow, workflows } from '../App'

type Props = {
  selectedWorkflow: Workflow
  onSelect: (wf: Workflow) => void
}

const stepTypeColors: Record<string, string> = {
  model_call: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  tool_use: 'bg-green-500/20 text-green-300 border-green-500/30',
  memory_read: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  cpu_compute: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
}

const workflowDetails: Record<string, { description: string; tags: string[] }> = {
  'wf-1': { description: 'Multi-step web research with fact extraction and synthesis', tags: ['model_call', 'tool_use'] },
  'wf-2': { description: 'Static analysis + LLM-powered code review pipeline', tags: ['tool_use', 'cpu_compute'] },
  'wf-3': { description: 'Intent classification, retrieval, and response generation', tags: ['memory_read', 'model_call'] },
  'wf-4': { description: 'Data ingestion, transformation, statistical analysis', tags: ['cpu_compute', 'tool_use'] },
}

export default function WorkflowList({ selectedWorkflow, onSelect }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Tracked Workflows</h2>
        <div className="text-xs text-gray-500">{workflows.length} active workflows</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {workflows.map((wf) => {
          const detail = workflowDetails[wf.id]
          const isSelected = wf.id === selectedWorkflow.id
          return (
            <div
              key={wf.id}
              onClick={() => onSelect(wf)}
              className={`bg-gray-900 border rounded-xl p-5 cursor-pointer transition-all ${
                isSelected ? 'border-cyan-500/60 shadow-[0_0_20px_rgba(6,182,212,0.1)]' : 'border-gray-800 hover:border-cyan-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-white">{wf.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{detail.description}</p>
                </div>
                {isSelected && (
                  <span className="text-xs bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded-full">Selected</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {detail.tags.map((tag) => (
                  <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${stepTypeColors[tag]}`}>
                    {tag.replace('_', ' ')}
                  </span>
                ))}
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-gray-800 rounded-lg py-2">
                  <div className="text-lg font-bold text-white">{wf.stepCount}</div>
                  <div className="text-xs text-gray-500">Steps</div>
                </div>
                <div className="bg-gray-800 rounded-lg py-2">
                  <div className="text-lg font-bold text-cyan-400">{wf.totalDuration.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">ms total</div>
                </div>
                <div className="bg-gray-800 rounded-lg py-2">
                  <div className="text-xs font-medium text-white mt-1">{wf.dominantStepType.replace('_', '\n')}</div>
                  <div className="text-xs text-gray-500">dominant</div>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-800 flex justify-between items-center">
                <span className="text-xs text-gray-500">Last profiled: {wf.lastProfiled}</span>
                <button
                  onClick={(e) => { e.stopPropagation(); onSelect(wf); }}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  View Profile →
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
