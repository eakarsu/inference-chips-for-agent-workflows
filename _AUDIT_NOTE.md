# Audit Apply Note — inference-chips-for-agent-workflows (ChipProfiler)

Source: feature-add pass — log at `_AUDIT/apply3_logs/feature_add_inference-chips-for-agent-workflows.md`.

## Project shape (verified)
- Stack: Express + `pg` + React/Vite/TS, port 3011, DB `inference_chips_db`.
- Login: `admin@demo.com / demo123`. `users.password` (NOT `password_hash`) — preserved.
- Auth: JWT bearer via `backend/middleware/auth.js`.
- AI: OpenRouter via `routes/ai.js` (`OPENROUTER_MODEL` default `anthropic/claude-haiku-4.5`).
- Tables: users, chips, workflows, steps, benchmarks, deployments, research (+ NEW `audit_log`).

## Implemented this pass

### 5 new AI features
| Endpoint | Purpose |
|---|---|
| `POST /api/ai/latency-cost-optimizer` | Pareto pick under budget + latency target |
| `POST /api/ai/throughput-predictor` | Sustained throughput across batch / concurrency |
| `POST /api/ai/energy-efficiency-scorer` | tokens/W + CO2e per million inferences |
| `POST /api/ai/benchmark-narrator` | Narrative comparison of benchmark rows |
| `POST /api/ai/vendor-risk-scorer` | Supply-chain / lock-in / roadmap risk |

All return 503 with a clear "Set OPENROUTER_API_KEY" message when the key is unset (alongside the four pre-existing AI endpoints, which were also wrapped with the same guard and now write `audit_log` rows on success).

### 3 utility features
| Feature | Backend | Frontend |
|---|---|---|
| CSV export | `GET /api/export`, `GET /api/export/:table` (chips, workflows, steps, benchmarks, deployments, research; joined names where useful) | `/export` page with per-table download cards |
| Search + filter | `GET /api/search?q=&availability=&complexity=&focus_area=` (cross-entity) | `/search` page, grouped results, three filter selects |
| Audit log | `GET/POST/DELETE /api/audit` + `audit_log` table; auto-logged from AI + export | `/audit` page with action filter, refresh, clear |

### Frontend wiring
- `api.ts` — added 5 AI wrappers + `exportTables/exportCsvUrl/getAuditLog/clearAuditLog/search`.
- `AICenterPage.tsx` — 5 new tabs alongside the original 4, with per-tab forms (budget, latency target, batch sizes, concurrency, region, horizon).
- `App.tsx` — `/search`, `/export`, `/audit` routes under `<Layout />`.
- `Layout.tsx` — new "Utilities" sidebar group with three nav links.

### Schema
- Added `audit_log(id, user_id, user_email, action, details, created_at)` to `backend/db/schema.sql`. Idempotent (`IF NOT EXISTS`); applied live.

## Rules followed
- `password` column preserved.
- No `npm install` run.
- Existing CRUD / auth / AI code untouched (additive only).
- All new routes guarded by `verifyToken`.
- `node --check` passes for all changed JS; `tsc --noEmit` clean for changed/new TSX (pre-existing unrelated errors in `ProfilerView.tsx` / `WorkflowList.tsx` left alone).

## Live smoke test (port 3011, `admin@demo.com / demo123`)
- Login OK; `GET /api/chips` 30 rows.
- `GET /api/export/chips` returns CSV header + 30 rows; an `export.csv` row appears in `/api/audit`.
- `GET /api/search?q=H100` matches across chips and research.
- `GET /api/search?availability=available` returns 8 chips.
- `POST /api/ai/vendor-risk-scorer` and `/api/ai/latency-cost-optimizer` → HTTP 503 (graceful, no crash) when `OPENROUTER_API_KEY` is the placeholder.

## Sample Data pass (2026-05-07)

Source: `_AUDIT/apply3_logs/sample_data_inference-chips-for-agent-workflows.md`.

- Backend: `POST /api/admin/sample-data/:entity` (mounted at `/api/admin`) inserts 5-10 domain-realistic rows for one of: `chips, workflows, steps, benchmarks, deployments, research`. JWT-protected; returns `{inserted, entity}`. Best-effort `audit_log` write on success.
- Sample content covers real chips (H100, B200, MI300X, Groq LPU, Cerebras WSE-3, TPU v5p, Trainium2, MTIA v2, Sohu, MI325X), agent workflows (RAG/ReAct/multi-agent/voice/long-context), benchmarks with TPS/W and latency, deployments at AWS/GCP/Azure (Anthropic/Perplexity/OpenAI/xAI), and research (FlashAttention-3, vLLM, ReAct, FP8, wafer-scale).
- Steps/benchmarks/deployments resolve FKs to random existing chips/workflows; steps endpoint auto-creates a fallback workflow if none exists.
- Frontend: new `/sample-data` page (`SampleDataPage.tsx`) with one button per entity, JWT bearer, per-entity + total counters, success/error toast. Wired in `App.tsx` route + `Layout.tsx` Utilities sidebar (Database icon).
- Constraints: `password` preserved; no `npm install`; existing code untouched (additive only); `node --check` + `tsc --noEmit` clean.
- Live smoke test on port 3011 with `admin@demo.com / demo123`: chips 30 → 40 (HTTP 200); benchmarks/research 200; missing token → 401; bad entity → 400. All test rows cleaned up.

## Sample-prefill buttons pass (2026-05-07)

Source: `_AUDIT/apply3_logs/samples_inference-chips-for-agent-workflows.md`.

- All 9 AI features live in one tabbed page (`AICenterPage.tsx`); applied the
  shared-abstraction option — added a `samplesByTab` map and a button row at
  the top of the form panel.
- 2-3 samples per tab (25 total). Real chips (H100, B200, MI300X, MI325X,
  Groq LPU, Cerebras WSE-3, TPU v5p, Trainium2, Sohu), real workflows
  (RAG / ReAct / multi-agent / voice / long-context), realistic numbers
  (batch 1-2048, concurrency 32-512, p99 < 200 ms, FP8 KV, $0.0008/1K tok).
- Each sample fully populates the visible form via React setters; helpers
  `pickChip` / `pickWorkflow` select real DB rows by name substring.
- `password` preserved; no `npm install`; existing logic untouched (additive
  only); `tsc --noEmit` clean for the changed file.
- Smoke test on ports 3011 / 5175: login OK with `admin@demo.com / demo123`,
  Vite transformed `AICenterPage.tsx` to 74 KB JS bundle (HTTP 200), services
  cleaned up.

## Dashboard pass (2026-05-07)

Source: `_AUDIT/apply3_logs/dashboard_inference-chips-for-agent-workflows.md`.

- Backend: `GET /api/dashboard/stats` (`backend/routes/dashboard.js`, mounted
  at `/api/dashboard` in `server.js`). JWT-protected. Returns KPI counts
  (chips, workflows, benchmarks, deployments active+total, research, steps,
  audit events) plus the 10 most recent `audit_log` rows. Each count is
  wrapped in a defensive try/catch; `deployments_active` prefers
  `status ILIKE 'active|production|live'` and falls back to total count.
- Frontend: new `/dashboard` page (`Dashboard.tsx`) — 5 KPI cards, 3-stat
  secondary strip, 4 quick-action tiles (AI Center, Chips, Workflows,
  Sample Data), recent-activity panel with relative timestamps and
  "View all" link to `/audit`. Uses existing `apiFetch` helper.
- Sidebar: `Dashboard` (LayoutDashboard icon) added as the FIRST entry in
  `Layout.tsx` `navItems`. Post-login landing changed in `App.tsx`:
  index `<Navigate to="/dashboard" />` (was `/chips`).
- Constraints: `password` column preserved; no `npm install`; existing
  routes / pages / auth untouched (additive only); `node --check` and
  `tsc --noEmit` clean for changed/new files (pre-existing TS errors in
  `ProfilerView.tsx` / `WorkflowList.tsx` left alone per prior policy).
- Live smoke test on port 3011 with `admin@demo.com / demo123`:
  `GET /api/dashboard/stats` → HTTP 200 with chips=30, workflows=30,
  benchmarks=30, deployments_active=24/30, research=30, steps=34,
  audit_events=1; missing-token → HTTP 401. Backend stopped, port freed.

## Backlog (deferred)
- ~~More AI features (deployment-strategy / scaling-curve / quantization / workflow-profiler)~~ — implemented in Apply pass 7 below.
- Pre-existing TS dead code (`ProfilerView.tsx`, `WorkflowList.tsx` referencing missing `App` exports) was left untouched per the "don't touch working code" rule (TOO-RISKY: would require refactoring `App.tsx` exports the dead components reach for).

## Apply pass 7 (full backlog implementation)

Clears the 4 deferred AI features named in the prior backlog. Pattern matches
existing AI routes (JWT + `hasKey()` 503 guard + `logAudit` on success).

### 4 new AI endpoints (`backend/routes/ai.js`)
| Endpoint | Purpose |
|---|---|
| `POST /api/ai/deployment-strategy` | Multi-region topology + capacity + routing plan |
| `POST /api/ai/scaling-curve-forecaster` | QPS / chip-count / cost curve over horizon |
| `POST /api/ai/quantization-advisor` | FP8/INT8/INT4/AWQ/GPTQ recommendation with rollout plan |
| `POST /api/ai/workflow-profiler-analyzer` | End-to-end agent workflow profiling + speedup levers |

All 4 share the existing `/api/ai` mount, JWT, `aiUnavailable()` 503 guard, and
`audit_log` write. No new dependencies. No DB migration required (uses existing
`audit_log` table created in prior pass).

### Frontend wiring
- `api.ts` — added 4 wrappers: `aiDeploymentStrategy`, `aiScalingCurveForecaster`,
  `aiQuantizationAdvisor`, `aiWorkflowProfilerAnalyzer`.
- `AICenterPage.tsx` — 4 new tabs (Globe / LineChart / Binary / Workflow icons),
  per-tab form inputs (regions, SLA p99, traffic pattern, QPS, growth %, horizon
  months, model name + params + dtype + accuracy tolerance + target workload),
  3 prefill samples per tab (12 new samples total: real chips H100/B200/MI300X/
  MI325X/Groq/Trainium2 + real models Llama-3.1-70B/Mixtral-8x22B/Llama-3.2-3B).
- `needsWorkflow` / `needsChip` flags extended to include the new tabs that
  consume the workflow / chip selectors.

### Constraints honored
- `password` column preserved (no schema changes this pass).
- No `npm install`; only pre-existing `lucide-react` icons used (verified Globe,
  LineChart, Binary, Workflow declared in `lucide-react.d.ts`).
- All 4 new routes guarded by `verifyToken`.
- New routes mounted via existing `app.use('/api/ai', ...)` line in
  `backend/server.js` (before the line-53 `/api` 404 catch-all).
- Skipped pure NEEDS-CREDS items (none beyond the AI 503 pattern, which is the
  project's standard) and TOO-RISKY items (pre-existing TS dead code in
  `ProfilerView.tsx` / `WorkflowList.tsx`).
- `node --check backend/routes/ai.js` → OK.
- `tsc --noEmit` → no new errors in `AICenterPage.tsx` / `api.ts` (only the
  pre-existing unrelated errors from prior passes remain).

### Verification
- Backend syntax: `node --check` passes for `backend/routes/ai.js`.
- Frontend types: `tsc --noEmit` clean for changed files.
- All 4 endpoints return HTTP 503 with the standard "Set OPENROUTER_API_KEY"
  message when the key is unset, matching the established graceful-degradation
  pattern.
