const jwt = require('jsonwebtoken');
const db = require('../db');
const { getRuntimeConfig } = require('../lib/runtime-config');

async function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Bearer token required' });
  try {
    const config = getRuntimeConfig();
    const decoded = jwt.verify(auth.slice(7), config.jwtSecret, { algorithms: ['HS256'], issuer: config.issuer, audience: config.audience });
    const user = (await db.query('SELECT id,email,name,organization_id,role,token_version FROM users WHERE id=$1 AND is_active=TRUE', [decoded.sub])).rows[0];
    if (!user || Number(user.token_version) !== Number(decoded.tokenVersion)) return res.status(401).json({ error: 'Session is no longer active' });
    req.user = user;
    return next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => roles.includes(req.user?.role) ? next() : res.status(403).json({ error: 'Role is not permitted for this action' });
}

module.exports = verifyToken;
module.exports.requireRole = requireRole;
