# ChipProfiler governed workflow deployment

The supported journey is an immutable agent-workflow release → authoritative hardware profile → measured placement evaluation → independent approval/override → bounded canary → runtime telemetry → independent production promotion or immediate rollback. Deterministic memory, context, precision, latency, throughput, power, error, sample, and canary-duration rules—not generic LLM output—control the lifecycle.

Historical generic CRUD, sample, generated AI/gap, and visualization APIs are intentionally unmounted. Calls outside `/api/auth`, `/api/health`, and `/api/governance` return HTTP 410. Archived source is not a production capability claim.

## Setup

Use Node.js 22 and PostgreSQL 16. Copy `.env.example` into your secret manager, not source control. `JWT_SECRET` must be non-placeholder and at least 32 characters; browser and evidence-source allowlists cannot contain wildcards.

```sh
npm --prefix backend ci
npm --prefix frontend ci
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/schema.sql
# Optional only on a fresh evaluation database:
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/db/seed.sql
npm --prefix backend run migrate
```

Provision organization-scoped `AUTHOR`, `PERFORMANCE`, `APPROVER`, or `ADMIN` identities explicitly:

```sh
PROVISION_EMAIL=author@example.test \
PROVISION_PASSWORD='replace-with-a-long-unique-password' \
PROVISION_NAME='Release Author' \
PROVISION_ORGANIZATION='Example AI Platform' \
PROVISION_ROLE=AUTHOR \
npm --prefix backend run provision-user
```

Application startup only executes `node backend/server.js`; it never creates a database, installs packages, migrates, seeds, kills processes, or exposes a shared demo account.

## Verification

```sh
npm --prefix backend test
npm --prefix frontend run build
./scripts/verify-schema-controls.sh
npm --prefix backend audit --omit=dev --audit-level=low
npm --prefix frontend audit --omit=dev --audit-level=low
ORGANIZATION_ID=1 npm --prefix backend run verify-audit
```

The integration suite uses real PostgreSQL and distinct author, performance, approver, and outside-organization accounts. It covers evidence replay/conflict, tenant isolation, invalid unit rejection, placement blockers and override, late/duplicate runtime telemetry, separation of duties, canary SLO promotion, stale-version conflict, rollback, hash-chain tampering, append-only evidence, and retained deletion.

The multi-stage Node 22 image serves the compiled console and API as an unprivileged user on port 3011 and expects a separately migrated external PostgreSQL service.

See `SECURITY.md` and `docs/OPERATIONS.md` before deployment.
