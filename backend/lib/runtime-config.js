const WEAK = /^(secret|changeme|change-me|demo|development|dev|password|jwt[_-]?secret)$/i;

function list(value, name) {
  const items = String(value || '').split(',').map((item) => item.trim()).filter(Boolean);
  if (!items.length || items.includes('*')) throw new Error(`${name} requires an explicit allowlist`);
  return items;
}

function getRuntimeConfig() {
  const jwtSecret = String(process.env.JWT_SECRET || '');
  if (jwtSecret.length < 32 || WEAK.test(jwtSecret)) throw new Error('JWT_SECRET must be a non-placeholder value of at least 32 characters');
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
  const corsOrigins = list(process.env.CORS_ALLOWED_ORIGINS, 'CORS_ALLOWED_ORIGINS');
  const evidenceHosts = list(process.env.EVIDENCE_ALLOWED_HOSTS, 'EVIDENCE_ALLOWED_HOSTS').map((host) => host.toLowerCase());
  if (process.env.NODE_ENV === 'production' && corsOrigins.some((origin) => !origin.startsWith('https://'))) throw new Error('Production CORS origins must use HTTPS');
  return { jwtSecret, corsOrigins, evidenceHosts, issuer: 'chipprofiler', audience: 'chipprofiler-api' };
}

module.exports = { getRuntimeConfig };
