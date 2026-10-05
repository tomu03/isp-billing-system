const express = require('express');
const db = require('../db');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function nextInvoiceNumber(periodStart) {
  const prefix = (db.prepare('SELECT invoice_prefix FROM company_settings WHERE id=1').get() || {}).invoice_prefix || 'INV';
  const ym = periodStart.slice(0, 7).replace('-', '');
  const row = db.prepare(`SELECT invoice_number FROM invoices WHERE invoice_number LIKE ? ORDER BY id DESC LIMIT 1`)
    .get(`${prefix}-${ym}-%`);
  const n = row ? parseInt(row.invoice_number.split('-')[2], 10) + 1 : 1;
  return `${prefix}-${ym}-${String(n).padStart(5, '0')}`;
}

function recalcStatus(total, paid) {
  if (paid <= 0) return 'unpaid';
  if (paid >= total) return 'paid';
  return 'partially_paid';
}

// List invoices with filters
router.get('/', (req, res) => {
  const { search = '', status, customer_id, page = 1, limit = 20 } = req.query;
  const where = [];
  const params = {};
  if (search) {
    where.push(`(i.invoice_number LIKE @search OR c.name LIKE @search OR c.customer_code LIKE @search)`);
    params.search = `%${search}%`;
  }
  if (status) { where.push('i.status = @status'); params.status = status; }
  if (customer_id) { where.push('i.customer_id = @customer_id'); params.customer_id = customer_id; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) c FROM invoices i JOIN customers c ON i.customer_id = c.id ${whereSql}`).get(params).c;
  const offset = (Number(page) - 1) * Number(limit);
  const rows = db.prepare(`
    SELECT i.*, c.name as customer_name, c.customer_code, c.mobile, p.name as package_name
    FROM invoices i JOIN customers c ON i.customer_id = c.id LEFT JOIN packages p ON i.package_id = p.id
    ${whereSql} ORDER BY i.id DESC LIMIT @limit OFFSET @offset
  `).all({ ...params, limit: Number(limit), offset });

  res.json({ invoices: rows, total, page: Number(page), limit: Number(limit) });
});

router.get('/:id', (req, res) => {
  const invoice = db.prepare(`SELECT i.*, c.name as customer_name, c.customer_code, c.mobile, c.address, c.area,
    p.name as package_name, p.speed_mbps
    FROM invoices i JOIN customers c ON i.customer_id = c.id LEFT JOIN packages p ON i.package_id = p.id WHERE i.id = ?`).get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const payments = db.prepare('SELECT * FROM payments WHERE invoice_id = ? ORDER BY id DESC').all(req.params.id);
  const company = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  res.json({ invoice, payments, company });
});

// Generate an individual invoice for one customer
router.post('/generate', authorize('admin', 'billing_manager'), (req, res) => {
  const { customer_id, billing_period_start, billing_period_end, discount = 0, late_fee = 0, notes = '' } = req.body;
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customer_id);
  if (!customer) return res.status(404).json({ error: 'Customer not found' });

  const previousDue = customer.current_due || 0;
  const currentBill = customer.monthly_bill || 0;
  const total = previousDue + currentBill + Number(late_fee) - Number(discount);
  const dueDateStr = billing_period_start.slice(0, 8) + String(customer.due_date).padStart(2, '0');
  const invNumber = nextInvoiceNumber(billing_period_start);

  const info = db.prepare(`INSERT INTO invoices
    (invoice_number, customer_id, package_id, billing_period_start, billing_period_end, previous_due, current_bill,
     discount, late_fee, total_amount, paid_amount, due_amount, due_date, status, notes)
    VALUES (?,?,?,?,?,?,?,?,?,?,0,?,?, 'unpaid', ?)`).run(
    invNumber, customer_id, customer.package_id, billing_period_start, billing_period_end, previousDue, currentBill,
    discount, late_fee, total, total, dueDateStr, notes);

  db.prepare('UPDATE customers SET current_due = ? WHERE id = ?').run(total, customer_id);
  db.prepare(`INSERT INTO notifications (type, title, message, customer_id) VALUES ('bill_due', 'New bill generated', ?, ?)`)
    .run(`Invoice ${invNumber} generated for ${customer.name}, amount ${total}.`, customer_id);

  logAudit(req.user.id, 'INVOICE_GENERATED', 'invoice', info.lastInsertRowid, { invNumber, total }, req.ip);
  res.status(201).json({ id: info.lastInsertRowid, invoice_number: invNumber, total });
});

// Bulk-generate monthly bills for all active customers who don't yet have an invoice for this period
router.post('/generate-monthly', authorize('admin', 'billing_manager'), (req, res) => {
  const { billing_period_start, billing_period_end, late_fee_for_overdue = 30 } = req.body;
  if (!billing_period_start || !billing_period_end) return res.status(400).json({ error: 'billing_period_start and billing_period_end are required' });

  const customers = db.prepare("SELECT * FROM customers WHERE status != 'inactive'").all();
  let created = 0, skipped = 0;

  const tx = db.transaction(() => {
    for (const customer of customers) {
      const already = db.prepare('SELECT id FROM invoices WHERE customer_id = ? AND billing_period_start = ?')
        .get(customer.id, billing_period_start);
      if (already) { skipped++; continue; }

      const previousDue = customer.current_due || 0;
      const currentBill = customer.monthly_bill || 0;
      const lateFee = previousDue > 0 ? Number(late_fee_for_overdue) : 0;
      const total = previousDue + currentBill + lateFee;
      const dueDateStr = billing_period_start.slice(0, 8) + String(customer.due_date).padStart(2, '0');
      const invNumber = nextInvoiceNumber(billing_period_start);

      db.prepare(`INSERT INTO invoices
        (invoice_number, customer_id, package_id, billing_period_start, billing_period_end, previous_due, current_bill,
         discount, late_fee, total_amount, paid_amount, due_amount, due_date, status)
        VALUES (?,?,?,?,?,?,?,0,?,?,0,?,?, 'unpaid')`).run(
        invNumber, customer.id, customer.package_id, billing_period_start, billing_period_end, previousDue,
        currentBill, lateFee, total, total, dueDateStr);

      db.prepare('UPDATE customers SET current_due = ? WHERE id = ?').run(total, customer.id);
      created++;
    }
  });
  tx();

  logAudit(req.user.id, 'MONTHLY_BILLING_RUN', null, null, { billing_period_start, created, skipped }, req.ip);
  res.json({ created, skipped, message: `Generated ${created} invoices, skipped ${skipped} (already billed).` });
});

router.put('/:id', authorize('admin', 'billing_manager'), (req, res) => {
  const invoice = db.prepare('SELECT * FROM invoices WHERE id = ?').get(req.params.id);
  if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
  const { discount, late_fee, notes } = req.body;
  const newDiscount = discount !== undefined ? Number(discount) : invoice.discount;
  const newLateFee = late_fee !== undefined ? Number(late_fee) : invoice.late_fee;
  const total = invoice.previous_due + invoice.current_bill + newLateFee - newDiscount;
  const dueAmount = Math.max(total - invoice.paid_amount, 0);
  const status = invoice.paid_amount >= total ? 'paid' : recalcStatus(total, invoice.paid_amount);

  db.prepare(`UPDATE invoices SET discount=?, late_fee=?, total_amount=?, due_amount=?, status=?, notes=?, updated_at=CURRENT_TIMESTAMP WHERE id=?`)
    .run(newDiscount, newLateFee, total, dueAmount, status, notes ?? invoice.notes, req.params.id);
  db.prepare('UPDATE customers SET current_due = ? WHERE id = ?').run(dueAmount, invoice.customer_id);

  logAudit(req.user.id, 'INVOICE_UPDATED', 'invoice', req.params.id, { discount: newDiscount, late_fee: newLateFee }, req.ip);
  res.json({ success: true });
});

// Mark overdue: invoices past due date, still unpaid/partial
router.post('/mark-overdue', authorize('admin', 'billing_manager'), (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const info = db.prepare(`UPDATE invoices SET status = 'overdue', updated_at = CURRENT_TIMESTAMP
    WHERE due_date < ? AND status IN ('unpaid','partially_paid')`).run(today);
  res.json({ updated: info.changes });
});

module.exports = router;
