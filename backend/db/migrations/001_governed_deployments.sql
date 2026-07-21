CREATE TABLE IF NOT EXISTS organizations (
  id SERIAL PRIMARY KEY, name VARCHAR(160) NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
INSERT INTO organizations(name) VALUES('Default Organization') ON CONFLICT(name) DO NOTHING;

ALTER TABLE users ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);
UPDATE users SET organization_id=(SELECT id FROM organizations WHERE name='Default Organization') WHERE organization_id IS NULL;
ALTER TABLE users ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS role VARCHAR(20) NOT NULL DEFAULT 'AUTHOR';
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INTEGER NOT NULL DEFAULT 1;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
UPDATE users SET role='ADMIN' WHERE email='admin@demo.com';
DO $$ BEGIN IF NOT EXISTS(SELECT 1 FROM pg_constraint WHERE conname='governed_users_role_check') THEN
  ALTER TABLE users ADD CONSTRAINT governed_users_role_check CHECK(role IN ('AUTHOR','PERFORMANCE','APPROVER','ADMIN'));
END IF; END $$;

CREATE TABLE IF NOT EXISTS governed_hardware_profiles (
  id BIGSERIAL PRIMARY KEY, organization_id INTEGER NOT NULL REFERENCES organizations(id), profile_code VARCHAR(80) NOT NULL,
  chip_name VARCHAR(160) NOT NULL, manufacturer VARCHAR(160) NOT NULL, accelerator_count INTEGER NOT NULL CHECK(accelerator_count>0),
  memory_gb NUMERIC(12,3) NOT NULL CHECK(memory_gb>0), peak_power_w NUMERIC(12,3) NOT NULL CHECK(peak_power_w>0),
  max_context_tokens INTEGER NOT NULL CHECK(max_context_tokens>0), supported_precisions TEXT[] NOT NULL,
  source_system VARCHAR(100) NOT NULL, source_record_id VARCHAR(140) NOT NULL, external_event_id VARCHAR(140) NOT NULL UNIQUE,
  evidence_url TEXT NOT NULL, published_at TIMESTAMPTZ NOT NULL, payload_hash CHAR(64) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'VERIFIED' CHECK(status IN ('VERIFIED','REVOKED')), version INTEGER NOT NULL DEFAULT 1,
  retention_until TIMESTAMPTZ NOT NULL DEFAULT(NOW()+INTERVAL '7 years'), created_by INTEGER NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,profile_code), UNIQUE(organization_id,source_system,source_record_id)
);

CREATE TABLE IF NOT EXISTS governed_workflow_releases (
  id BIGSERIAL PRIMARY KEY, organization_id INTEGER NOT NULL REFERENCES organizations(id), release_code VARCHAR(100) NOT NULL,
  workflow_name VARCHAR(180) NOT NULL, version_label VARCHAR(60) NOT NULL, definition JSONB NOT NULL, definition_hash CHAR(64) NOT NULL,
  required_precision VARCHAR(20) NOT NULL, context_tokens INTEGER NOT NULL CHECK(context_tokens>0), required_memory_gb NUMERIC(12,3) NOT NULL CHECK(required_memory_gb>0),
  max_p95_latency_ms NUMERIC(14,3) NOT NULL CHECK(max_p95_latency_ms>0), min_throughput_rps NUMERIC(14,3) NOT NULL CHECK(min_throughput_rps>0),
  max_power_w NUMERIC(14,3) NOT NULL CHECK(max_power_w>0), max_error_rate_pct NUMERIC(7,4) NOT NULL CHECK(max_error_rate_pct>=0 AND max_error_rate_pct<=100),
  canary_min_samples INTEGER NOT NULL CHECK(canary_min_samples>0), canary_duration_minutes INTEGER NOT NULL CHECK(canary_duration_minutes>=0),
  status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK(status IN ('DRAFT','RELEASED','EVALUATED','RETIRED')), version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER NOT NULL REFERENCES users(id), retention_until TIMESTAMPTZ NOT NULL DEFAULT(NOW()+INTERVAL '7 years'), legal_hold BOOLEAN NOT NULL DEFAULT FALSE,
  legal_hold_reason TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,release_code), UNIQUE(organization_id,workflow_name,version_label),
  CHECK((NOT legal_hold AND legal_hold_reason IS NULL) OR (legal_hold AND length(legal_hold_reason)>=20))
);

CREATE TABLE IF NOT EXISTS placement_evaluations (
  id BIGSERIAL PRIMARY KEY, release_id BIGINT NOT NULL REFERENCES governed_workflow_releases(id), hardware_profile_id BIGINT NOT NULL REFERENCES governed_hardware_profiles(id),
  external_event_id VARCHAR(140) NOT NULL UNIQUE, source_system VARCHAR(100) NOT NULL, source_record_id VARCHAR(140) NOT NULL,
  evidence_url TEXT NOT NULL, observed_at TIMESTAMPTZ NOT NULL, payload_hash CHAR(64) NOT NULL,
  latency_p95_ms NUMERIC(14,3) NOT NULL, throughput_rps NUMERIC(14,3) NOT NULL, power_w NUMERIC(14,3) NOT NULL,
  peak_memory_gb NUMERIC(12,3) NOT NULL, error_rate_pct NUMERIC(7,4) NOT NULL, sample_count INTEGER NOT NULL,
  rules JSONB NOT NULL, blockers TEXT[] NOT NULL DEFAULT '{}', status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK(status IN ('PENDING','APPROVED','OVERRIDDEN','REJECTED')),
  submitted_by INTEGER NOT NULL REFERENCES users(id), submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), decision_reason TEXT,
  decided_by INTEGER REFERENCES users(id), decided_at TIMESTAMPTZ, UNIQUE(release_id,hardware_profile_id,source_record_id)
);

CREATE TABLE IF NOT EXISTS governed_deployments (
  id BIGSERIAL PRIMARY KEY, organization_id INTEGER NOT NULL REFERENCES organizations(id), deployment_code VARCHAR(100) NOT NULL,
  release_id BIGINT NOT NULL REFERENCES governed_workflow_releases(id), evaluation_id BIGINT NOT NULL REFERENCES placement_evaluations(id),
  environment VARCHAR(80) NOT NULL, region VARCHAR(100) NOT NULL, traffic_pct NUMERIC(6,3) NOT NULL CHECK(traffic_pct>=0 AND traffic_pct<=100),
  status VARCHAR(20) NOT NULL DEFAULT 'CANARY' CHECK(status IN ('CANARY','PRODUCTION','ROLLED_BACK')), version INTEGER NOT NULL DEFAULT 1,
  created_by INTEGER NOT NULL REFERENCES users(id), promoted_by INTEGER REFERENCES users(id), rollback_reason TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), promoted_at TIMESTAMPTZ, rolled_back_at TIMESTAMPTZ,
  retention_until TIMESTAMPTZ NOT NULL DEFAULT(NOW()+INTERVAL '7 years'), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id,deployment_code)
);

CREATE TABLE IF NOT EXISTS deployment_telemetry_events (
  id BIGSERIAL PRIMARY KEY, deployment_id BIGINT NOT NULL REFERENCES governed_deployments(id), external_event_id VARCHAR(140) NOT NULL UNIQUE,
  source_system VARCHAR(100) NOT NULL, metric VARCHAR(60) NOT NULL, numeric_value NUMERIC(20,6) NOT NULL, unit VARCHAR(20) NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL, received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), is_late BOOLEAN NOT NULL DEFAULT FALSE,
  payload_hash CHAR(64) NOT NULL, recorded_by INTEGER NOT NULL REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS governance_events (
  id BIGSERIAL PRIMARY KEY, organization_id INTEGER NOT NULL REFERENCES organizations(id), release_id BIGINT REFERENCES governed_workflow_releases(id),
  deployment_id BIGINT REFERENCES governed_deployments(id), actor_id INTEGER REFERENCES users(id), action VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}', previous_hash CHAR(64), event_hash CHAR(64) NOT NULL UNIQUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS governance_events_org_idx ON governance_events(organization_id,id);
CREATE INDEX IF NOT EXISTS deployment_telemetry_idx ON deployment_telemetry_events(deployment_id,captured_at,id);

CREATE TABLE IF NOT EXISTS governed_workflow_release_versions (
  id BIGSERIAL PRIMARY KEY, release_id BIGINT NOT NULL REFERENCES governed_workflow_releases(id), version INTEGER NOT NULL,
  snapshot JSONB NOT NULL, provenance JSONB NOT NULL, created_by INTEGER NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(release_id,version)
);

CREATE OR REPLACE FUNCTION reject_governance_evidence_mutation() RETURNS trigger AS $$ BEGIN
  RAISE EXCEPTION '% is append-only',TG_TABLE_NAME;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS governance_events_immutable ON governance_events;
CREATE TRIGGER governance_events_immutable BEFORE UPDATE OR DELETE ON governance_events FOR EACH ROW EXECUTE FUNCTION reject_governance_evidence_mutation();
DROP TRIGGER IF EXISTS release_versions_immutable ON governed_workflow_release_versions;
CREATE TRIGGER release_versions_immutable BEFORE UPDATE OR DELETE ON governed_workflow_release_versions FOR EACH ROW EXECUTE FUNCTION reject_governance_evidence_mutation();
DROP TRIGGER IF EXISTS deployment_telemetry_immutable ON deployment_telemetry_events;
CREATE TRIGGER deployment_telemetry_immutable BEFORE UPDATE OR DELETE ON deployment_telemetry_events FOR EACH ROW EXECUTE FUNCTION reject_governance_evidence_mutation();

CREATE OR REPLACE FUNCTION govern_release_update() RETURNS trigger AS $$ BEGIN
  IF NEW.retention_until<OLD.retention_until THEN RAISE EXCEPTION 'retention cannot be shortened'; END IF;
  IF OLD.legal_hold AND NOT NEW.legal_hold THEN RAISE EXCEPTION 'legal hold release requires privileged external procedure'; END IF;
  IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'release version must increment exactly once'; END IF;
  NEW.updated_at:=NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS governed_release_update ON governed_workflow_releases;
CREATE TRIGGER governed_release_update BEFORE UPDATE ON governed_workflow_releases FOR EACH ROW EXECUTE FUNCTION govern_release_update();

CREATE OR REPLACE FUNCTION govern_deployment_update() RETURNS trigger AS $$ BEGIN
  IF NEW.retention_until<OLD.retention_until THEN RAISE EXCEPTION 'retention cannot be shortened'; END IF;
  IF NEW.version<>OLD.version+1 THEN RAISE EXCEPTION 'deployment version must increment exactly once'; END IF;
  NEW.updated_at:=NOW(); RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS governed_deployment_update ON governed_deployments;
CREATE TRIGGER governed_deployment_update BEFORE UPDATE ON governed_deployments FOR EACH ROW EXECUTE FUNCTION govern_deployment_update();

CREATE OR REPLACE FUNCTION reject_retained_governance_delete() RETURNS trigger AS $$ BEGIN
  IF OLD.retention_until>NOW() OR COALESCE((to_jsonb(OLD)->>'legal_hold')::boolean,FALSE) THEN RAISE EXCEPTION 'record is retained or on legal hold'; END IF;
  RETURN OLD;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS governed_release_retained ON governed_workflow_releases;
CREATE TRIGGER governed_release_retained BEFORE DELETE ON governed_workflow_releases FOR EACH ROW EXECUTE FUNCTION reject_retained_governance_delete();
DROP TRIGGER IF EXISTS governed_deployment_retained ON governed_deployments;
CREATE TRIGGER governed_deployment_retained BEFORE DELETE ON governed_deployments FOR EACH ROW EXECUTE FUNCTION reject_retained_governance_delete();

CREATE OR REPLACE FUNCTION protect_decided_evaluation() RETURNS trigger AS $$ BEGIN
  IF TG_OP='DELETE' THEN RAISE EXCEPTION 'placement evaluations cannot be deleted'; END IF;
  IF OLD.decided_at IS NOT NULL THEN RAISE EXCEPTION 'decided evaluation is immutable'; END IF;
  RETURN NEW;
END; $$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS decided_evaluation_immutable ON placement_evaluations;
CREATE TRIGGER decided_evaluation_immutable BEFORE UPDATE OR DELETE ON placement_evaluations FOR EACH ROW EXECUTE FUNCTION protect_decided_evaluation();
