#!/bin/sh
set -eu
: "${DATABASE_URL:?DATABASE_URL is required}"
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 <<'SQL'
DO $$ DECLARE missing TEXT; BEGIN
  SELECT string_agg(required.name,', ') INTO missing FROM (VALUES
    ('governance_events_immutable'),('release_versions_immutable'),('deployment_telemetry_immutable'),
    ('governed_release_update'),('governed_deployment_update'),('governed_release_retained'),
    ('governed_deployment_retained'),('decided_evaluation_immutable')
  ) required(name) LEFT JOIN pg_trigger trigger ON trigger.tgname=required.name AND NOT trigger.tgisinternal WHERE trigger.oid IS NULL;
  IF missing IS NOT NULL THEN RAISE EXCEPTION 'missing governance triggers: %',missing; END IF;
  IF NOT EXISTS(SELECT 1 FROM schema_migrations WHERE name='001_governed_deployments.sql') THEN RAISE EXCEPTION 'governance migration not recorded'; END IF;
END $$;
SQL
echo "governed deployment schema controls verified"
