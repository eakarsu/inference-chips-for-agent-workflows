const { stableStringify, sha256 } = require('./governance-rules');

async function appendEvent(client, event) {
  await client.query('SELECT pg_advisory_xact_lock($1)', [Number(event.organizationId)]);
  const previous = (await client.query('SELECT event_hash FROM governance_events WHERE organization_id=$1 ORDER BY id DESC LIMIT 1', [event.organizationId])).rows[0]?.event_hash || null;
  const createdAt = new Date();
  const content = { organizationId: Number(event.organizationId), releaseId: event.releaseId == null ? null : Number(event.releaseId), deploymentId: event.deploymentId == null ? null : Number(event.deploymentId), actorId: event.actorId == null ? null : Number(event.actorId), action: event.action, payload: event.payload || {}, createdAt: createdAt.toISOString() };
  const hash = sha256(`${previous || ''}:${stableStringify(content)}`);
  return (await client.query(`INSERT INTO governance_events(organization_id,release_id,deployment_id,actor_id,action,payload,previous_hash,event_hash,created_at)
    VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`, [event.organizationId, event.releaseId || null, event.deploymentId || null, event.actorId || null, event.action, event.payload || {}, previous, hash, createdAt])).rows[0];
}

async function snapshotRelease(client, release, actorId, provenance) {
  const snapshot = (await client.query(`SELECT jsonb_build_object('release',to_jsonb(r),'evaluations',COALESCE((SELECT jsonb_agg(to_jsonb(e) ORDER BY e.id) FROM placement_evaluations e WHERE e.release_id=r.id),'[]'::jsonb)) AS value FROM governed_workflow_releases r WHERE r.id=$1`, [release.id])).rows[0].value;
  await client.query('INSERT INTO governed_workflow_release_versions(release_id,version,snapshot,provenance,created_by) VALUES($1,$2,$3,$4,$5)', [release.id, release.version, snapshot, provenance || {}, actorId]);
}

module.exports = { appendEvent, snapshotRelease };
