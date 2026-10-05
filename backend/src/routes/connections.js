const express = require('express');
const db = require('../db');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { status, search = '', page = 1, limit = 20 } = req.query;
  const where = [];
  const params = {};
  if (status) { where.push('conn.status = @status'); params.status = status; }
  if (search) {
    where.push(`(c.name LIKE @search OR conn.username LIKE @search OR conn.ip_address LIKE @search OR conn.mac_address LIKE @search)`);
    params.search = `%${search}%`;
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) c FROM connections conn JOIN customers c ON conn.customer_id = c.id ${whereSql}`).get(params).c;
  const offset = (Number(page) - 1) * Number(limit);
  const rows = db.prepare(`
    SELECT conn.*, c.name as customer_name, c.customer_code, p.name as package_name
    FROM connections conn JOIN customers c ON conn.customer_id = c.id LEFT JOIN packages p ON conn.package_id = p.id
    ${whereSql} ORDER BY conn.id DESC LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: Number(limit), offset });
  res.json({ connections: rows, total, page: Number(page), limit: Number(limit) });
});

router.put('/:id', authorize('admin', 'support_staff'), (req, res) => {
  const existing = db.prepare('SELECT * FROM connections WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Connection not found' });
  const b = req.body;
  db.prepare(`UPDATE connections SET username=?, ip_address=?, mac_address=?, router_onu=?, connection_type=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`).run(
    b.username ?? existing.username, b.ip_address ?? existing.ip_address, b.mac_address ?? existing.mac_address,
    b.router_onu ?? existing.router_onu, b.connection_type ?? existing.connection_type, b.status ?? existing.status, req.params.id);
  logAudit(req.user.id, 'CONNECTION_UPDATED', 'connection', req.params.id, null, req.ip);
  res.json({ success: true });
});

module.exports = router;
