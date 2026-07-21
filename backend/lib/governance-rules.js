const crypto = require('crypto');

const RELEASE_TRANSITIONS = Object.freeze({ DRAFT: ['RELEASED'], RELEASED: ['EVALUATED'], EVALUATED: [], RETIRED: [] });
const DEPLOYMENT_TRANSITIONS = Object.freeze({ CANARY: ['PRODUCTION','ROLLED_BACK'], PRODUCTION: ['ROLLED_BACK'], ROLLED_BACK: [] });
const TELEMETRY = Object.freeze({
  latency_p95_ms: { unit: 'ms', min: 0, max: 3600000 }, throughput_rps: { unit: 'rps', min: 0, max: 10000000 },
  power_w: { unit: 'W', min: 0, max: 1000000 }, error_rate_pct: { unit: '%', min: 0, max: 100 },
  sample_count: { unit: 'count', min: 1, max: 1000000000 },
});

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (value && typeof value === 'object') return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
  return JSON.stringify(value);
}
const sha256 = (value) => crypto.createHash('sha256').update(String(value)).digest('hex');

function evidenceUrl(value, hosts) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' && hosts.includes(url.hostname.toLowerCase()) ? null : 'Evidence URL must use HTTPS and an allowlisted host';
  } catch { return 'Evidence URL must be valid'; }
}

function validateDefinition(value) {
  if (!value || typeof value !== 'object' || !Array.isArray(value.steps) || value.steps.length < 1 || value.steps.length > 100) return 'definition.steps must contain 1-100 steps';
  if (!Number.isInteger(Number(value.contextTokens)) || Number(value.contextTokens) < 1 || Number(value.contextTokens) > 10000000) return 'definition.contextTokens is invalid';
  const ids = new Set();
  for (const step of value.steps) {
    if (typeof step.id !== 'string' || !/^[a-zA-Z0-9._-]{1,80}$/.test(step.id) || ids.has(step.id)) return 'Each step needs a unique stable id';
    ids.add(step.id);
    if (!['model_call','tool_call','memory','cpu'].includes(step.type)) return `Unsupported step type: ${step.type}`;
    if (!Number.isInteger(Number(step.timeoutMs)) || Number(step.timeoutMs) < 1 || Number(step.timeoutMs) > 3600000) return `Invalid timeout for step ${step.id}`;
  }
  return null;
}

function evaluatePlacement({ release, profile, benchmark }) {
  const rules = [];
  const add = (rule, passed, actual, limit) => rules.push({ rule, passed: Boolean(passed), actual, limit });
  const precision = String(release.required_precision || release.requiredPrecision).toLowerCase();
  const supported = profile.supported_precisions || profile.supportedPrecisions || [];
  add('profile_verified', profile.status === 'VERIFIED', profile.status, 'VERIFIED');
  add('precision_supported', supported.map((item) => String(item).toLowerCase()).includes(precision), supported, precision);
  add('context_capacity', Number(profile.max_context_tokens || profile.maxContextTokens) >= Number(release.context_tokens || release.contextTokens), Number(profile.max_context_tokens || profile.maxContextTokens), `>= ${release.context_tokens || release.contextTokens}`);
  add('memory_capacity', Number(profile.memory_gb || profile.memoryGb) >= Number(release.required_memory_gb || release.requiredMemoryGb) && Number(benchmark.peakMemoryGb) <= Number(profile.memory_gb || profile.memoryGb), { profile: Number(profile.memory_gb || profile.memoryGb), measured: Number(benchmark.peakMemoryGb) }, `>= ${release.required_memory_gb || release.requiredMemoryGb} GB and measured <= capacity`);
  add('latency_slo', Number(benchmark.latencyP95Ms) <= Number(release.max_p95_latency_ms || release.maxP95LatencyMs), Number(benchmark.latencyP95Ms), `<= ${release.max_p95_latency_ms || release.maxP95LatencyMs} ms`);
  add('throughput_slo', Number(benchmark.throughputRps) >= Number(release.min_throughput_rps || release.minThroughputRps), Number(benchmark.throughputRps), `>= ${release.min_throughput_rps || release.minThroughputRps} rps`);
  add('power_budget', Number(benchmark.powerW) <= Number(release.max_power_w || release.maxPowerW) && Number(benchmark.powerW) <= Number(profile.peak_power_w || profile.peakPowerW), Number(benchmark.powerW), `<= ${Math.min(Number(release.max_power_w || release.maxPowerW), Number(profile.peak_power_w || profile.peakPowerW))} W`);
  add('error_budget', Number(benchmark.errorRatePct) <= Number(release.max_error_rate_pct || release.maxErrorRatePct), Number(benchmark.errorRatePct), `<= ${release.max_error_rate_pct || release.maxErrorRatePct}%`);
  add('benchmark_samples', Number(benchmark.sampleCount) >= Number(release.canary_min_samples || release.canaryMinSamples), Number(benchmark.sampleCount), `>= ${release.canary_min_samples || release.canaryMinSamples}`);
  return { rules, blockers: rules.filter((rule) => !rule.passed).map((rule) => rule.rule) };
}

function validateTelemetry(event) {
  const rule = TELEMETRY[event.metric];
  const value = Number(event.value);
  if (!rule) return `Unsupported metric: ${event.metric}`;
  if (event.unit !== rule.unit) return `${event.metric} must use ${rule.unit}`;
  if (!Number.isFinite(value) || value < rule.min || value > rule.max) return `${event.metric} must be ${rule.min}-${rule.max} ${rule.unit}`;
  const captured = new Date(event.capturedAt);
  if (Number.isNaN(captured.getTime()) || captured.getTime() > Date.now() + 300000) return 'capturedAt must be valid and not future-dated';
  return null;
}

function evaluateCanary(release, telemetry, deployment = null) {
  const byMetric = (name) => telemetry.filter((item) => item.metric === name).map((item) => Number(item.numeric_value ?? item.value));
  const latency = byMetric('latency_p95_ms'); const throughput = byMetric('throughput_rps'); const power = byMetric('power_w'); const errors = byMetric('error_rate_pct'); const samples = byMetric('sample_count');
  const startedAt = deployment?.started_at ?? deployment?.startedAt;
  const minutes = startedAt ? Math.max(0, (Date.now() - new Date(startedAt).getTime()) / 60000) : 0;
  const rules = [];
  const add = (rule, passed, actual, limit) => rules.push({ rule, passed: Boolean(passed), actual, limit });
  add('runtime_metrics_complete', latency.length && throughput.length && power.length && errors.length && samples.length, { latency: latency.length, throughput: throughput.length, power: power.length, errors: errors.length, samples: samples.length }, 'all required metrics');
  add('runtime_latency_slo', latency.length && Math.max(...latency) <= Number(release.max_p95_latency_ms), latency.length ? Math.max(...latency) : null, `<= ${release.max_p95_latency_ms} ms`);
  add('runtime_throughput_slo', throughput.length && Math.min(...throughput) >= Number(release.min_throughput_rps), throughput.length ? Math.min(...throughput) : null, `>= ${release.min_throughput_rps} rps`);
  add('runtime_power_budget', power.length && Math.max(...power) <= Number(release.max_power_w), power.length ? Math.max(...power) : null, `<= ${release.max_power_w} W`);
  add('runtime_error_budget', errors.length && Math.max(...errors) <= Number(release.max_error_rate_pct), errors.length ? Math.max(...errors) : null, `<= ${release.max_error_rate_pct}%`);
  add('runtime_sample_floor', samples.reduce((sum, value) => sum + value, 0) >= Number(release.canary_min_samples), samples.reduce((sum, value) => sum + value, 0), `>= ${release.canary_min_samples}`);
  add('runtime_duration', minutes >= Number(release.canary_duration_minutes), minutes, `>= ${release.canary_duration_minutes} minutes`);
  return { rules, blockers: rules.filter((rule) => !rule.passed).map((rule) => rule.rule) };
}

function verifyChain(events) {
  let previous = null;
  for (const event of events) {
    const content = { organizationId: Number(event.organization_id), releaseId: event.release_id == null ? null : Number(event.release_id), deploymentId: event.deployment_id == null ? null : Number(event.deployment_id), actorId: event.actor_id == null ? null : Number(event.actor_id), action: event.action, payload: event.payload, createdAt: new Date(event.created_at).toISOString() };
    const expected = sha256(`${previous || ''}:${stableStringify(content)}`);
    if ((event.previous_hash || null) !== previous || event.event_hash !== expected) return false;
    previous = event.event_hash;
  }
  return true;
}

module.exports = { RELEASE_TRANSITIONS, DEPLOYMENT_TRANSITIONS, stableStringify, sha256, evidenceUrl, validateDefinition, evaluatePlacement, validateTelemetry, evaluateCanary, verifyChain };
