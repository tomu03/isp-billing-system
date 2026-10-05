const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { authenticate, authorize, logAudit, JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  const user = db.prepare(`SELECT u.*, r.name as role, r.permissions FROM users u
    JOIN roles r ON u.role_id = r.id WHERE u.email = ?`).get(email.toLowerCase().trim());

  if (!user || user.status !== 'active') return res.status(401).json({ error: 'Invalid credentials' });

  const ok = bcrypt.compareSync(password, user.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });

  db.prepare('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?').run(user.id);
  logAudit(user.id, 'LOGIN', 'user', user.id, null, req.ip);

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '12h' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, permissions: JSON.parse(user.permissions || '[]') }
  });
});

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

// ---- Users management (super_admin, admin only) ----
router.get('/users', authenticate, authorize('admin'), (req, res) => {
  const users = db.prepare(`SELECT u.id, u.name, u.email, u.phone, u.status, u.last_login, u.created_at, r.name as role
    FROM users u JOIN roles r ON u.role_id = r.id ORDER BY u.id DESC`).all();
  res.json({ users });
});

router.get('/roles', authenticate, (req, res) => {
  const roles = db.prepare('SELECT * FROM roles').all().map(r => ({ ...r, permissions: JSON.parse(r.permissions || '[]') }));
  res.json({ roles });
});

router.post('/users', authenticate, authorize('admin'), (req, res) => {
  const { name, email, phone, password, role } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ error: 'Missing required fields' });
  const roleRow = db.prepare('SELECT id FROM roles WHERE name = ?').get(role);
  if (!roleRow) return res.status(400).json({ error: 'Invalid role' });
  try {
    const hash = bcrypt.hashSync(password, 10);
    const info = db.prepare(`INSERT INTO users (name, email, phone, password_hash, role_id, status)
      VALUES (?,?,?,?,?, 'active')`).run(name, email.toLowerCase().trim(), phone || null, hash, roleRow.id);
    logAudit(req.user.id, 'USER_CREATED', 'user', info.lastInsertRowid, { email }, req.ip);
    res.status(201).json({ id: info.lastInsertRowid });
  } catch (err) {
    if (String(err.message).includes('UNIQUE')) return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.put('/users/:id/status', authenticate, authorize('admin'), (req, res) => {
  const { status } = req.body;
  if (!['active', 'disabled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE users SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  logAudit(req.user.id, 'USER_STATUS_CHANGED', 'user', req.params.id, { status }, req.ip);
  res.json({ success: true });
});

module.exports = router;
