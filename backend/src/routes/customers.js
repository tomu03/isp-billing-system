const express = require('express');
const db = require('../db');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function nextCustomerCode() {
  const row = db.prepare("SELECT customer_code FROM customers ORDER BY id DESC LIMIT 1").get();
  const n = row ? parseInt(row.customer_code.split('-')[1], 10) + 1 : 1;
  return `CUS-${String(n).padStart(5, '0')}`;
}

// List with search/filter/pagination
router.get('/', (req, res) => {
  const { search = '', status, area, package_id, page = 1, limit = 20 } = req.query;
  const where = [];
  const params = {};
  if (search) {
    where.push(`(c.name LIKE @search OR c.mobile LIKE @search OR c.customer_code LIKE @search OR c.ip_address LIKE @search OR c.mac_address LIKE @search)`);
    params.search = `%${search}%`;
  }
  if (status) { where.push('c.status = @status'); params.status = status; }
  if (area) { where.push('c.area = @area'); params.area = area; }
  if (package_id) { where.push('c.package_id = @package_id'); params.package_id = package_id; }

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const total = db.prepare(`SELECT COUNT(*) c FROM customers c ${whereSql}`).get(params).c;

  const offset = (Number(page) - 1) * Number(limit);
  const rows = db.prepare(`
    SELECT c.*, p.name as package_name, p.speed_mbps
    FROM customers c LEFT JOIN packages p ON c.package_id = p.id
    ${whereSql}
    ORDER BY c.id DESC
    LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: Number(limit), offset });

  res.json({ customers: rows, total, page: Number(page), limit: Number(limit) });
});

router.get('/areas', (req, res) => {
  const rows = db.prepare('SELECT DISTINCT area FROM customers WHERE area IS NOT NULL ORDER BY area').all();
  res.json({ areas: rows.map(r => r.area) });
});

router.get('/:id', (req, res) => {
  const customer = db.prepare(`SELECT c.*, p.name as package_name, p.speed_mbps, p.monthly_price as package_price
    FROM customers c LEFT JOIN packages p ON c.package_id = p.id WHERE c.id = ?`).get(req.params.id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const invoices = db.prepare('SELECT * FROM invoices WHERE customer_id = ? ORDER BY id DESC').all(req.params.id);
  const payments = db.prepare('SELECT * FROM payments WHERE customer_id = ? ORDER BY id DESC').all(req.params.id);
  const connection = db.prepare('SELECT * FROM connections WHERE customer_id = ? ORDER BY id DESC LIMIT 1').get(req.params.id);

  res.json({ customer, invoices, payments, connection });
});

router.post('/', authorize('admin', 'billing_manager', 'support_staff'), (req, res) => {
  const b = req.body;
  if (!b.name || !b.mobile) return res.status(400).json({ error: 'Name and mobile are required' });

  let monthlyBill = b.monthly_bill;
  if (b.package_id && !monthlyBill) {
    const pkg = db.prepare('SELECT monthly_price FROM packages WHERE id = ?').get(b.package_id);
    if (pkg) monthlyBill = pkg.monthly_price;
  }

  const code = nextCustomerCode();
  const info = db.prepare(`INSERT INTO customers
    (customer_code, name, guardian_name, mobile, alt_mobile, email, nid_number, address, area, connection_type,
     package_id, monthly_bill, ip_address, mac_address, router_info, connection_date, billing_date, due_date, status, notes, current_due, created_by)
    VALUES (@customer_code,@name,@guardian_name,@mobile,@alt_mobile,@email,@nid_number,@address,@area,@connection_type,
     @package_id,@monthly_bill,@ip_address,@mac_address,@router_info,@connection_date,@billing_date,@due_date,@status,@notes,0,@created_by)`).run({
    customer_code: code, name: b.name, guardian_name: b.guardian_name || null, mobile: b.mobile,
    alt_mobile: b.alt_mobile || null, email: b.email || null, nid_number: b.nid_number || null,
    address: b.address || null, area: b.area || null, connection_type: b.connection_type || 'Fiber',
    package_id: b.package_id || null, monthly_bill: monthlyBill || 0, ip_address: b.ip_address || null,
    mac_address: b.mac_address || null, router_info: b.router_info || null,
    connection_date: b.connection_date || null, billing_date: b.billing_date || 1, due_date: b.due_date || 10,
    status: b.status || 'active', notes: b.notes || null, created_by: req.user.id
  });

  db.prepare(`INSERT INTO connections (customer_id, username, ip_address, mac_address, router_onu, connection_type, installation_date, package_id, status)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(info.lastInsertRowid, code.toLowerCase(), b.ip_address || null, b.mac_address || null,
    b.router_info || null, b.connection_type || 'Fiber', b.connection_date || null, b.package_id || null,
    b.status === 'active' ? 'active' : 'pending');

  db.prepare(`INSERT INTO notifications (type, title, message, customer_id) VALUES ('new_customer', 'New customer registered', ?, ?)`)
    .run(`${b.name} (${code}) has been added.`, info.lastInsertRowid);

  logAudit(req.user.id, 'CUSTOMER_CREATED', 'customer', info.lastInsertRowid, { name: b.name }, req.ip);
  res.status(201).json({ id: info.lastInsertRowid, customer_code: code });
});

router.put('/:id', authorize('admin', 'billing_manager', 'support_staff'), (req, res) => {
  const existing = db.prepare('SELECT * FROM customers WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Customer not found' });
  const b = req.body;

  const fields = ['name', 'guardian_name', 'mobile', 'alt_mobile', 'email', 'nid_number', 'address', 'area',
    'connection_type', 'package_id', 'monthly_bill', 'ip_address', 'mac_address', 'router_info', 'connection_date',
    'billing_date', 'due_date', 'status', 'notes'];
  const updates = {};
  fields.forEach(f => { updates[f] = b[f] !== undefined ? b[f] : existing[f]; });

  db.prepare(`UPDATE customers SET
    name=@name, guardian_name=@guardian_name, mobile=@mobile, alt_mobile=@alt_mobile, email=@email,
    nid_number=@nid_number, address=@address, area=@area, connection_type=@connection_type, package_id=@package_id,
    monthly_bill=@monthly_bill, ip_address=@ip_address, mac_address=@mac_address, router_info=@router_info,
    connection_date=@connection_date, billing_date=@billing_date, due_date=@due_date, status=@status, notes=@notes,
    updated_at=CURRENT_TIMESTAMP
    WHERE id=@id`).run({ ...updates, id: req.params.id });

  logAudit(req.user.id, 'CUSTOMER_UPDATED', 'customer', req.params.id, { fields: Object.keys(b) }, req.ip);
  res.json({ success: true });
});

router.put('/:id/status', authorize('admin', 'billing_manager', 'support_staff'), (req, res) => {
  const { status } = req.body; // active, inactive, suspended
  if (!['active', 'inactive', 'suspended'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
  db.prepare('UPDATE customers SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(status, req.params.id);
  db.prepare(`UPDATE connections SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE customer_id = ?`)
    .run(status === 'active' ? 'active' : status === 'suspended' ? 'suspended' : 'disconnected', req.params.id);

  if (status === 'suspended') {
    const c = db.prepare('SELECT name FROM customers WHERE id = ?').get(req.params.id);
    db.prepare(`INSERT INTO notifications (type, title, message, customer_id) VALUES ('suspension', 'Connection suspended', ?, ?)`)
      .run(`${c.name}'s connection has been suspended.`, req.params.id);
  }
  logAudit(req.user.id, 'CUSTOMER_STATUS_CHANGED', 'customer', req.params.id, { status }, req.ip);
  res.json({ success: true });
});

router.delete('/:id', authorize('admin'), (req, res) => {
  db.prepare('DELETE FROM customers WHERE id = ?').run(req.params.id);
  logAudit(req.user.id, 'CUSTOMER_DELETED', 'customer', req.params.id, null, req.ip);
  res.json({ success: true });
});

module.exports = router;
