const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const db = require('../db');

async function main() {
  const client = await db.connect();
  try {
    await client.query('CREATE TABLE IF NOT EXISTS schema_migrations(name TEXT PRIMARY KEY,checksum CHAR(64) NOT NULL,applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
    for (const file of fs.readdirSync(path.join(__dirname, '../db/migrations')).filter((name) => name.endsWith('.sql')).sort()) {
      const sql = fs.readFileSync(path.join(__dirname, '../db/migrations', file), 'utf8');
      const checksum = crypto.createHash('sha256').update(sql).digest('hex');
      const old = (await client.query('SELECT checksum FROM schema_migrations WHERE name=$1', [file])).rows[0];
      if (old) {
        if (old.checksum !== checksum) throw new Error(`Applied migration checksum changed: ${file}`);
        console.log(`already applied ${file}`); continue;
      }
      await client.query('BEGIN');
      try {
        await client.query(sql);
        await client.query('INSERT INTO schema_migrations(name,checksum) VALUES($1,$2)', [file, checksum]);
        await client.query('COMMIT'); console.log(`applied ${file}`);
      } catch (error) { await client.query('ROLLBACK'); throw error; }
    }
  } finally { client.release(); await db.end(); }
}
main().catch((error) => { console.error(error.message); process.exitCode = 1; });
