const bcrypt = require('bcrypt');
const db = require('../db');

async function main() {
  const email = String(process.env.PROVISION_EMAIL || process.env.PROVISION_ADMIN_EMAIL || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.PROVISION_PASSWORD || process.env.PROVISION_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD || '');
  const name = String(process.env.PROVISION_NAME || process.env.PROVISION_ADMIN_NAME || process.env.BOOTSTRAP_ADMIN_NAME || '').trim();
  const role = String(process.env.PROVISION_ROLE || (process.env.ALLOW_DISPOSABLE_SEED === 'YES' ? 'ADMIN' : '')).toUpperCase();
  const organization = String(process.env.PROVISION_ORGANIZATION || process.env.BOOTSTRAP_TENANT_SLUG || process.env.BOOTSTRAP_TENANT_NAME || '').trim();
  if (!email.includes('@') || password.length < 12 || !name || !organization || !['AUTHOR','PERFORMANCE','APPROVER','ADMIN'].includes(role)) throw new Error('Valid PROVISION_EMAIL, password (12+), name, organization, and role are required');
  const client = await db.connect();
  try {
    await client.query('BEGIN');
    const org = (await client.query('INSERT INTO organizations(name) VALUES($1) ON CONFLICT(name) DO UPDATE SET name=EXCLUDED.name RETURNING id', [organization])).rows[0];
    const hash = await bcrypt.hash(password, 12);
    const user = (await client.query(`INSERT INTO users(email,password,name,organization_id,role,is_active) VALUES($1,$2,$3,$4,$5,TRUE)
      ON CONFLICT(email) DO UPDATE SET password=EXCLUDED.password,name=EXCLUDED.name,organization_id=EXCLUDED.organization_id,role=EXCLUDED.role,is_active=TRUE,token_version=users.token_version+1,updated_at=NOW()
      RETURNING email,role`, [email, hash, name, org.id, role])).rows[0];
    await client.query('COMMIT'); console.log(`provisioned ${user.email} as ${user.role}`);
  } catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); await db.end(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
