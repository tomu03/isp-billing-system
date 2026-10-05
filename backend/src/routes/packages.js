const express = require('express');
const db = require('../db');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const packages = db.prepare(`SELECT p.*,
    (SELECT COUNT(*) FROM customers c WHERE c.package_id = p.id) as customer_count
    FROM packages p ORDER BY p.speed_mbps ASC`).all();
  res.json({ packages });
});

router.get('/:id', (req, res) => {
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id);
  if (!pkg) return res.status(404).json({ error: 'Package not found' });
  res.json({ package: pkg });
});

router.post('/', authorize('admin'), (req, res) => {
  const b = req.body;
  if (!b.name || !b.speed_mbps || !b.monthly_price) return res.status(400).json({ error: 'Name, speed and price are required' });
  const info = db.prepare(`INSERT INTO packages (name, speed_mbps, monthly_price, installation_fee, connection_type, description, status)
    VALUES (?,?,?,?,?,?,?)`).run(b.name, b.speed_mbps, b.monthly_price, b.installation_fee || 0,
    b.connection_type || 'Fiber', b.description || null, b.status || 'active');
  logAudit(req.user.id, 'PACKAGE_CREATED', 'package', info.lastInsertRowid, { name: b.name }, req.ip);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', authorize('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM packages WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Package not found' });
  const b = req.body;
  db.prepare(`UPDATE packages SET name=?, speed_mbps=?, monthly_price=?, installation_fee=?, connection_type=?, description=?, status=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?`).run(
    b.name ?? existing.name, b.speed_mbps ?? existing.speed_mbps, b.monthly_price ?? existing.monthly_price,
    b.installation_fee ?? existing.installation_fee, b.connection_type ?? existing.connection_type,
    b.description ?? existing.description, b.status ?? existing.status, req.params.id);
  logAudit(req.user.id, 'PACKAGE_UPDATED', 'package', req.params.id, null, req.ip);
  res.json({ success: true });
});

router.put('/:id/status', authorize('admin'), (req, res) => {
  const { status } = req.body;
  if (!['active', 'disabled'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE packages SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  res.json({ success: true });
});

router.delete('/:id', authorize('admin'), (req, res) => {
  const inUse = db.prepare('SELECT COUNT(*) c FROM customers WHERE package_id = ?').get(req.params.id).c;
  if (inUse > 0) return res.status(400).json({ error: `Cannot delete: ${inUse} customers are using this package` });
  db.prepare('DELETE FROM packages WHERE id = ?').run(req.params.id);
  logAudit(req.user.id, 'PACKAGE_DELETED', 'package', req.params.id, null, req.ip);
  res.json({ success: true });
});

module.exports = router;
