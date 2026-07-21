# Completeness Review: inference-chips-for-agent-workflows

**Review date:** 2026-07-18

## Assessment basis

Static inspection of project-owned source and configuration only; no dependency installation, build, database migration, external-service call, or runtime launch was performed. The scan considered 109 project files (92 source files), 3 manifest(s), 0 test-like file(s), and 0 CI workflow(s), excluding dependency/generated directories.

## Classification

**Prototype-demo**

This is a prototype/demo for industrial/supply-chain. Generated gap/demo patterns are present: it contains 92 source files and visible routes/pages in `frontend/`, `backend/`, but those surfaces are not evidence of durable domain execution, verified integrations, or operational completion.

## Why it is not complete

- Generated gap/visualization routes describe missing capabilities or simulate recommendations; they do not implement the underlying domain operation.
- Generic LLM calls are used as product behavior without enough typed tools, grounded evidence, deterministic rules, or output evaluation.
- Mock, demo, sample, fixture, or placeholder behavior remains in executable/product paths.
- No recognizable project-owned automated tests were found for the main workflow.
- No checked-in CI workflow proves builds, tests, migrations, and security checks on every change.

## Needed features

1. Connect authoritative BOM, supplier, inventory, quality, schedule, telemetry, and work-order data sources.
2. Implement traceable state transitions for parts, lots, inspections, exceptions, approvals, and change orders.
3. Add constraint-aware planning with human override, uncertainty reporting, and deterministic safety/business rules.
4. Test disrupted supply, late telemetry, unit mismatches, duplicate events, and rollback/replanning scenarios.
5. Add risk-based unit, integration, and end-to-end tests in CI, including migration and failure-path coverage.

## Risks or launch blockers

- Credential/configuration exposure: environment files are present in the repository tree and must be checked against Git history and rotated if real.
- Automation contains destructive process, filesystem, or database operations; do not run it on a shared machine without review.
- Startup appears coupled to seed/migration behavior, risking data mutation or non-repeatable launches.
- AI-provider availability, cost, privacy, prompt injection, and unvalidated output are launch risks until bounded and evaluated.

## Evidence inspected

- `frontend/src/App.tsx:23`
- `frontend/src/components/Layout.tsx:107`
- `backend/server.js`
- `backend/middleware/auth.js`
- `requirements.txt`
- `start.sh`

## Recommended next action

Stop adding generated pages; prove one industrial/supply-chain workflow against real services and persistent state, with tests and measurable acceptance criteria.

## Implementation progress (2026-07-20)

- Replaced the executable prototype with one domain-specific, persistent path: immutable agent-workflow release, authoritative inference-chip profile ingestion, measured placement evaluation, independent approval/rejection or documented placement override, restricted canary deployment, typed runtime telemetry, and evidence-based promotion or rollback. Legacy CRUD, generated-gap, and AI endpoints now fail closed with `410 Gone`.
- Added organization-scoped RBAC (`AUTHOR`, `PERFORMANCE`, `APPROVER`, `ADMIN`), active-user and token-version checks, separation of duties, exact attestations, optimistic versions, deterministic placement/canary rules, trusted evidence-host controls, unit and bound validation, late-event marking, tenant-aware idempotency, conflicting-replay rejection, and source/provenance identifiers. Placement exceptions are explicit and audited; runtime SLO failures cannot be overridden into production.
- Added PostgreSQL governance state with checksum migrations, immutable/versioned release evidence, append-only telemetry and hash-chained governance events, seven-year deletion guards, legal holds, and database triggers enforcing transition/version constraints. Startup no longer seeds or migrates data; provisioning, migration, schema-control, and audit-chain verification are explicit operational commands.
- Reduced the UI to the supported governed deployment console, removed demo-login behavior, added secure runtime configuration and HTTP controls, an unprivileged multi-stage container, CI, operations/security documentation, and unit plus real HTTP/PostgreSQL integration coverage for tenant isolation, duplicate/conflicting events, unit mismatch, late telemetry, stale writes, separation of duties, deterministic blockers, exception approval, promotion, rollback, and retention/immutability.
- Validation on a fresh disposable PostgreSQL database: baseline and seed loaded; migration applied and repeated without drift; 23 public tables, 1 recorded migration, and all 8 governance triggers present; all 8 tests passed; a representative 18-event organization audit chain verified; the Vite 8 production build completed; both production dependency audits reported 0 vulnerabilities; production smoke returned health/root `200`, retired API `410`, unauthenticated governance `401`, and disallowed-origin `403`. Independent verification repeated the migration, tests, build, audits, startup guard, and HTTP boundaries on PostgreSQL 17; source/full-history Gitleaks scans passed after CI and integration-test signing material was changed to random per-run secrets, and CI now rejects every dependency advisory. Local image execution remains environment-blocked because the configured Docker daemon is unavailable; CI performs the image build.
- The local `.env` files remain ignored and untouched; no tracked environment file or matching Git history was found. Before launch, replace example connectors with authenticated chip-spec, benchmark-lab, scheduler/deployment-controller, and telemetry integrations; verify evidence contents/signatures rather than hostnames alone; calibrate SLOs; and complete concurrent replay, outage, clock-skew, rollback-failure, backup/restore, legal-hold/export, load, and organization acceptance exercises.

## Runtime verification (2026-07-20)

- Verified `start.sh` with disposable PostgreSQL `55661`, the governed deployment API on `127.0.0.1:6130`, and reserved UI port `6131`; all three ports were released afterward.
- The first and only attempt applied the disposable base schema and governed deployment migration, provisioned an environment-supplied organization administrator, logged in through `/api/auth/login`, and verified `/api/auth/me`: `API_VERIFIED startup_login_session_api`.
- Non-production startup supplies only local CORS and example evidence-host allowlists when absent. Production continues to require explicit HTTPS-facing configuration, and startup does not migrate or seed persistent data.
- Migration replay reported `already applied`; all 6 governance-rule tests and both PostgreSQL/HTTP integration workflows passed with the HTTP listener pinned to `6130`. The Vite production build also passed.
