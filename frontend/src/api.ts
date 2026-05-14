const BASE = '/api';
function getToken() { return localStorage.getItem('token'); }

export async function apiFetch(path: string, options: RequestInit = {}) {
  const token = getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json', ...(options.headers as Record<string, string> || {}) };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE}${path}`, { ...options, headers });
  if (!res.ok) { const err = await res.json().catch(() => ({ error: res.statusText })); throw new Error(err.error || res.statusText); }
  return res.json();
}

export const api = {
  login: (email: string, password: string) => apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getChips: () => apiFetch('/chips'), getChip: (id: number) => apiFetch(`/chips/${id}`),
  createChip: (d: unknown) => apiFetch('/chips', { method: 'POST', body: JSON.stringify(d) }),
  updateChip: (id: number, d: unknown) => apiFetch(`/chips/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteChip: (id: number) => apiFetch(`/chips/${id}`, { method: 'DELETE' }),
  getWorkflows: () => apiFetch('/workflows'), getWorkflow: (id: number) => apiFetch(`/workflows/${id}`),
  createWorkflow: (d: unknown) => apiFetch('/workflows', { method: 'POST', body: JSON.stringify(d) }),
  updateWorkflow: (id: number, d: unknown) => apiFetch(`/workflows/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteWorkflow: (id: number) => apiFetch(`/workflows/${id}`, { method: 'DELETE' }),
  getSteps: () => apiFetch('/steps'), getStep: (id: number) => apiFetch(`/steps/${id}`),
  createStep: (d: unknown) => apiFetch('/steps', { method: 'POST', body: JSON.stringify(d) }),
  updateStep: (id: number, d: unknown) => apiFetch(`/steps/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteStep: (id: number) => apiFetch(`/steps/${id}`, { method: 'DELETE' }),
  getBenchmarks: () => apiFetch('/benchmarks'), getBenchmark: (id: number) => apiFetch(`/benchmarks/${id}`),
  createBenchmark: (d: unknown) => apiFetch('/benchmarks', { method: 'POST', body: JSON.stringify(d) }),
  updateBenchmark: (id: number, d: unknown) => apiFetch(`/benchmarks/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteBenchmark: (id: number) => apiFetch(`/benchmarks/${id}`, { method: 'DELETE' }),
  getDeployments: () => apiFetch('/deployments'), getDeployment: (id: number) => apiFetch(`/deployments/${id}`),
  createDeployment: (d: unknown) => apiFetch('/deployments', { method: 'POST', body: JSON.stringify(d) }),
  updateDeployment: (id: number, d: unknown) => apiFetch(`/deployments/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteDeployment: (id: number) => apiFetch(`/deployments/${id}`, { method: 'DELETE' }),
  getResearch: () => apiFetch('/research'), getResearchItem: (id: number) => apiFetch(`/research/${id}`),
  createResearch: (d: unknown) => apiFetch('/research', { method: 'POST', body: JSON.stringify(d) }),
  updateResearch: (id: number, d: unknown) => apiFetch(`/research/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
  deleteResearch: (id: number) => apiFetch(`/research/${id}`, { method: 'DELETE' }),
  aiChipRecommendation: (d: unknown) => apiFetch('/ai/chip-recommendation', { method: 'POST', body: JSON.stringify(d) }),
  aiBottleneckAnalysis: (d: unknown) => apiFetch('/ai/bottleneck-analysis', { method: 'POST', body: JSON.stringify(d) }),
  aiPerformancePrediction: (d: unknown) => apiFetch('/ai/performance-prediction', { method: 'POST', body: JSON.stringify(d) }),
  aiArchitectureDesign: (d: unknown) => apiFetch('/ai/architecture-design', { method: 'POST', body: JSON.stringify(d) }),
  // New AI features
  aiLatencyCostOptimizer: (d: unknown) => apiFetch('/ai/latency-cost-optimizer', { method: 'POST', body: JSON.stringify(d) }),
  aiThroughputPredictor: (d: unknown) => apiFetch('/ai/throughput-predictor', { method: 'POST', body: JSON.stringify(d) }),
  aiEnergyEfficiencyScorer: (d: unknown) => apiFetch('/ai/energy-efficiency-scorer', { method: 'POST', body: JSON.stringify(d) }),
  aiBenchmarkNarrator: (d: unknown) => apiFetch('/ai/benchmark-narrator', { method: 'POST', body: JSON.stringify(d) }),
  aiVendorRiskScorer: (d: unknown) => apiFetch('/ai/vendor-risk-scorer', { method: 'POST', body: JSON.stringify(d) }),
  // Utilities
  exportTables: () => apiFetch('/export'),
  exportCsvUrl: (table: string) => `/api/export/${table}`,
  getAuditLog: (params?: { action?: string; limit?: number }) => {
    const qs = new URLSearchParams();
    if (params?.action) qs.set('action', params.action);
    if (params?.limit) qs.set('limit', String(params.limit));
    const s = qs.toString();
    return apiFetch('/audit' + (s ? `?${s}` : ''));
  },
  clearAuditLog: () => apiFetch('/audit', { method: 'DELETE' }),
  search: (params: { q?: string; availability?: string; complexity?: string; focus_area?: string }) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set('q', params.q);
    if (params.availability) qs.set('availability', params.availability);
    if (params.complexity) qs.set('complexity', params.complexity);
    if (params.focus_area) qs.set('focus_area', params.focus_area);
    const s = qs.toString();
    return apiFetch('/search' + (s ? `?${s}` : ''));
  },
};
