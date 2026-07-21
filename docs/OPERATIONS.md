# Release, canary, and rollback operations

## Normal lifecycle

1. Performance engineering records a versioned hardware profile from an authoritative registry with evidence URL, timestamp, and supported precision/context/memory/power limits.
2. An author creates a workflow release containing stable typed step IDs/timeouts, context size, precision/memory requirements, and placement/canary SLOs. The exact canonical definition hash is stored in version 1.
3. The author attests to release constraints. Performance engineering submits measured benchmark evidence. Deterministic rules store every pass/block result.
4. An independent approver approves a clean placement, rejects it, or documents an exceptional placement risk. An author may then start a maximum-10% canary.
5. Runtime telemetry is append-only and idempotent; observations delayed more than five minutes are marked late. Promotion requires complete compliant evidence and a separate approver.
6. A canary or production deployment can be rolled back immediately with a reason. Traffic becomes zero while all prior evidence remains queryable.

## Disruption and recovery

Conflicting event replays fail without partial writes. Failed validation and stale versions leave release/deployment state unchanged. If telemetry is incomplete, unit-invalid, late, or outside SLOs, do not manufacture missing evidence; collect a new event or roll back. A placement override does not waive runtime canary rules.

Apply migrations as a deployment job after backup, then run `scripts/verify-schema-controls.sh`; application startup must remain non-mutating. For disaster recovery, restore PostgreSQL 16 to isolation, apply later migrations, verify all organization audit chains, compare external event/source IDs with the authoritative registries, and obtain security plus release-owner approval before traffic is restored.

## Remaining launch validation

Before production, integrate organization-selected chip-spec, benchmark, scheduler, deployment-controller, and telemetry services; validate evidence contents/signatures rather than host provenance alone; calibrate workload-specific SLOs; and exercise concurrent event replay, provider outage, clock skew, benchmark revocation, partial regional rollout, rollback-controller failure, data export, backup/restore, legal hold, and load with platform, performance, SRE, security, and records stakeholders.
