const express = require('express');
const db = require('../db');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const settings = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  res.json({ settings });
});

router.put('/', authorize('admin'), (req, res) => {
  const existing = db.prepare('SELECT * FROM company_settings WHERE id = 1').get();
  const b = req.body;
  const fields = ['company_name', 'logo_url', 'address', 'phone', 'email', 'website', 'invoice_prefix',
    'payment_prefix', 'late_fee_flat', 'late_fee_percent', 'billing_cycle_day', 'currency'];
  const updates = {};
  fields.forEach(f => { updates[f] = b[f] !== undefined ? b[f] : existing[f]; });

  db.prepare(`UPDATE company_settings SET
    company_name=@company_name, logo_url=@logo_url, address=@address, phone=@phone, email=@email, website=@website,
    invoice_prefix=@invoice_prefix, payment_prefix=@payment_prefix, late_fee_flat=@late_fee_flat,
    late_fee_percent=@late_fee_percent, billing_cycle_day=@billing_cycle_day, currency=@currency, updated_at=CURRENT_TIMESTAMP
    WHERE id = 1`).run(updates);

  logAudit(req.user.id, 'SETTINGS_UPDATED', 'company_settings', 1, null, req.ip);
  res.json({ success: true });
});

// Audit logs (super_admin/admin)
router.get('/audit-logs', authorize('admin'), (req, res) => {
  const rows = db.prepare(`SELECT a.*, u.name as user_name FROM audit_logs a LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.id DESC LIMIT 200`).all();
  res.json({ logs: rows });
});

module.exports = router;
