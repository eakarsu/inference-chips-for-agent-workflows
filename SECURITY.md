# Security and evidence model

## Identity and organization scope

JWTs use HS256 with a fixed issuer/audience and 12-hour expiry. Every request reloads the active user, organization, role, and token version from PostgreSQL, so role changes, deactivation, organization moves, and token rotation take effect without waiting for token expiry. All governed records are organization-scoped.

- `AUTHOR` creates/releases immutable workflow versions, starts canaries from approved placements, and may execute an emergency rollback.
- `PERFORMANCE` ingests authoritative hardware profiles, submits measured placement evidence, and appends typed runtime telemetry.
- `APPROVER` decides placement evidence and promotes a compliant canary.
- `ADMIN` has combined capabilities but remains subject to author/evaluator/approver separation.

## Fail-closed decisions

Profiles and benchmarks require source identifiers, idempotent event IDs, payload hashes, timestamps, and HTTPS evidence on allowlisted hosts. A changed replay is rejected. Placement rules cover verified-profile status, precision, context, memory, latency, throughput, power, error rate, and sample count. Failed rules cannot be ordinarily approved; an independent approver must reject or record the exact risk-acceptance attestation and a detailed reason.

Canary telemetry accepts only named metrics in canonical units with bounded values and timestamps. Promotion uses worst-case latency, throughput, power, and error readings plus total samples and observed duration. There is no runtime promotion override: blockers require more evidence, correction, or rollback. Rollback requires an exact attestation and substantive reason.

## Immutability and retention

Workflow-release versions, deployment telemetry, and organization audit events are append-only at the database layer. Release/deployment updates require exactly one optimistic-version increment. Decided placement evaluations cannot change. Releases/deployments retain evidence for seven years by default; retention cannot be shortened, legal holds cannot be released through ordinary writes, and retained records cannot be deleted. Organization audit events are serialized and linked with SHA-256.

Run `ORGANIZATION_ID=<id> npm --prefix backend run verify-audit` routinely and after restore or incident response.

## Operational security

The ignored local `.env` is not deployment configuration. Keep secrets in a manager, rotate anything exposed in source or shell history, terminate TLS at a trusted ingress, restrict PostgreSQL to application/migration networks, and add edge rate limiting. Evidence URLs establish provenance authority; the application does not download or validate document contents.

Production dependency audits for both applications reported zero vulnerabilities on 2026-07-20. CI rejects every dependency advisory, scans full Git history for secrets, and builds the image on every change.
