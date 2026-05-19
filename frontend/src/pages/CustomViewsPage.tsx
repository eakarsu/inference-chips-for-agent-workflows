import ChipUtilizationTimeline from '../components/ChipUtilizationTimeline';
import WorkloadPerformanceHeatmap from '../components/WorkloadPerformanceHeatmap';
import ChipSpecPdfDownloader from '../components/ChipSpecPdfDownloader';
import SchedulingRulesEditor from '../components/SchedulingRulesEditor';
import { LayoutGrid } from 'lucide-react';

export default function CustomViewsPage() {
  return (
    <div className="p-6 space-y-6">
      <header className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-cyan-900 border border-cyan-700 flex items-center justify-center">
          <LayoutGrid className="w-5 h-5 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white">Chip Views</h1>
          <p className="text-gray-400 text-sm">Custom views for inference-chip / agent-workflow analysis.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <ChipUtilizationTimeline />
        <WorkloadPerformanceHeatmap />
        <ChipSpecPdfDownloader />
        <SchedulingRulesEditor />
      </div>
    </div>
  );
}
