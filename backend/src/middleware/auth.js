const jwt = require('jsonwebtoken');
const db = require('../db');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret_in_production';

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const user = db.prepare(`SELECT u.id, u.name, u.email, u.status, r.name as role
      FROM users u JOIN roles r ON u.role_id = r.id WHERE u.id = ?`).get(payload.id);
    if (!user || user.status !== 'active') return res.status(401).json({ error: 'Invalid or disabled user' });
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Only allow specific roles; super_admin always allowed
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ error: 'Unauthenticated' });
    if (req.user.role === 'super_admin' || roles.includes(req.user.role)) return next();
    return res.status(403).json({ error: 'You do not have permission to perform this action' });
  };
}

function logAudit(userId, action, entityType, entityId, details, ip) {
  db.prepare(`INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address)
    VALUES (?,?,?,?,?,?)`).run(userId, action, entityType || null, entityId || null,
    details ? JSON.stringify(details) : null, ip || null);
}

module.exports = { authenticate, authorize, logAudit, JWT_SECRET };
