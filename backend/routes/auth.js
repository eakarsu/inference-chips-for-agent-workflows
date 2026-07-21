const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { getRuntimeConfig } = require('../lib/runtime-config');
const authenticate = require('../middleware/auth');

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (typeof email !== 'string' || typeof password !== 'string' || email.length > 255 || password.length > 200) return res.status(400).json({ error: 'Email and password are required' });
  try {
    const config = getRuntimeConfig();
    const result = await db.query('SELECT id,email,password,name,organization_id,role,token_version FROM users WHERE lower(email)=lower($1) AND is_active=TRUE', [email.trim()]);
    if (!result.rows.length) return res.status(401).json({ error: 'Invalid credentials' });
    const user = result.rows[0];
    if (!await bcrypt.compare(password, user.password)) return res.status(401).json({ error: 'Invalid credentials' });
    const token = jwt.sign({ tokenVersion: user.token_version }, config.jwtSecret, { algorithm: 'HS256', subject: String(user.id), issuer: config.issuer, audience: config.audience, expiresIn: '12h' });
    return res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, organizationId: user.organization_id } });
  } catch (error) {
    console.error('Login failed', error);
    return res.status(500).json({ error: 'Authentication service unavailable' });
  }
});

router.get('/me', authenticate, (req, res) => res.json({ user: req.user }));

module.exports = router;
