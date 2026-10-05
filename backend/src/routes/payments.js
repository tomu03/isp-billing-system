const express = require('express');
const db = require('../db');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function nextPaymentCode() {
  const prefix = (db.prepare('SELECT payment_prefix FROM company_settings WHERE id=1').get() || {}).payment_prefix || 'PAY';
  const row = db.prepare('SELECT payment_code FROM payments ORDER BY id DESC LIMIT 1').get();
  const n = row ? parseInt(row.payment_code.split('-')[1], 10) + 1 : 1;
  return `${prefix}-${String(n).padStart(6, '0')}`;
}

router.get('/', (req, res) => {
  const { search = '', method, page = 1, limit = 20, date_from, date_to } = req.query;
  const where = [];
  const params = {};
  if (search) {
    where.push(`(p.payment_code LIKE @search OR c.name LIKE @search OR c.customer_code LIKE @search OR p.transaction_id LIKE @search)`);
    params.search = `%${search}%`;
  }
  if (method) { where.push('p.payment_method = @method'); params.method = method; }
  if (date_from) { where.push('date(p.payment_date) >= date(@date_from)'); params.date_from = date_from; }
  if (date_to) { where.push('date(p.payment_date) <= date(@date_to)'); params.date_to = date_to; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) c FROM payments p JOIN customers c ON p.customer_id = c.id ${whereSql}`).get(params).c;
  const offset = (Number(page) - 1) * Number(limit);
  const rows = db.prepare(`
    SELECT p.*, c.name as customer_name, c.customer_code, i.invoice_number, u.name as collected_by_name
    FROM payments p JOIN customers c ON p.customer_id = c.id
    LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN users u ON p.collected_by = u.id
    ${whereSql} ORDER BY p.id DESC LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: Number(limit), offset });

  res.json({ payments: rows, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const payment = db.prepare(`SELECT p.*, c.name as customer_name, c.customer_code, c.address, i.invoice_number, u.name as collected_by_name
    FROM payments p JOIN customers c ON p.customer_id = c.id LEFT JOIN invoices i ON p.invoice_id = i.id
    LEFT JOIN users u ON p.collected_by = u.id WHERE p.id = ?`).get(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  const company = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  res.json({ payment, company });
});

// Record a payment; updates invoice + customer due automatically
router.post('/', authorize('admin', 'billing_manager'), (req, res) => {
  const { customer_id, invoice_id, amount, payment_method, transaction_id, notes } = req.body;
  if (!customer_id || !amount || !payment_method) return res.status(400).json({ error: 'customer_id, amount and payment_method are required' });

  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  let invoice = null;
  if (invoice_id) {
    invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(invoice_id);
  } else {
    // Apply to oldest unpaid/partially_paid/overdue invoice
    invoice = db.prepare(`SELECT * FROM invoices WHERE customer_id = ? AND status IN ('unpaid','partially_paid','overdue')
      ORDER BY id ASC LIMIT 1`).get(customer_id);
  }

  const code = nextPaymentCode();
  const info = db.prepare(`INSERT INTO payments (payment_code, customer_id, invoice_id, amount, payment_method, transaction_id, collected_by, notes)
    VALUES (?,?,?,?,?,?,?,?)`).run(code, customer_id, invoice ? invoice.id : null, amount, payment_method,
    transaction_id || null, req.user.id, notes || null);

  if (invoice) {
    const newPaid = invoice.paid_amount + Number(amount);
    const newDue = Math.max(invoice.total_amount - newPaid, 0);
    const status = newPaid >= invoice.total_amount ? 'paid' : (newPaid > 0 ? 'partially_paid' : 'unpaid');
    db.prepare('UPDATE invoices SET paid_amount=?, due_amount=?, status=?, updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .run(newPaid, newDue, status, invoice.id);
    db.prepare('UPDATE customers SET current_due = ? WHERE id = ?').run(newDue, customer_id);
  } else {
    // No invoice found — reduce customer's general due balance
    const newDue = Math.max((customer.current_due || 0) - Number(amount), 0);
    db.prepare('UPDATE customers SET current_due = ? WHERE id = ?').run(newDue, customer_id);
  }

  db.prepare(`INSERT INTO notifications (type, title, message, customer_id) VALUES ('payment_confirmation', 'Payment received', ?, ?)`)
    .run(`Payment of ${amount} received from ${customer.name} via ${payment_method}.`, customer_id);

  logAudit(req.user.id, 'PAYMENT_RECORDED', 'payment', info.lastInsertRowid, { amount, payment_method }, req.ip);
  res.status(201).json({ id: info.lastInsertRowid, payment_code: code });
});

module.exports = router;
