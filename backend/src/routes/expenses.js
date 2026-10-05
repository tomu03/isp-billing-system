const express = require('express');
const db = require('../db');
const { authenticate, authorize, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { category, date_from, date_to, page = 1, limit = 20 } = req.query;
  const where = [];
  const params = {};
  if (category) { where.push('category = @category'); params.category = category; }
  if (date_from) { where.push('expense_date >= @date_from'); params.date_from = date_from; }
  if (date_to) { where.push('expense_date <= @date_to'); params.date_to = date_to; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const total = db.prepare(`SELECT COUNT(*) c FROM expenses ${whereSql}`).get(params).c;
  const totalAmount = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM expenses ${whereSql}`).get(params).s;
  const offset = (Number(page) - 1) * Number(limit);
  const rows = db.prepare(`SELECT e.*, u.name as created_by_name FROM expenses e LEFT JOIN users u ON e.created_by = u.id
    ${whereSql} ORDER BY e.expense_date DESC, e.id DESC LIMIT @limit OFFSET @offset`).all({ ...params, limit: Number(limit), offset });

  const byCategory = db.prepare(`SELECT category, SUM(amount) as total FROM expenses ${whereSql} GROUP BY category ORDER BY total DESC`).all(params);

  res.json({ expenses: rows, total, totalAmount, byCategory, page: Number(page), limit: Number(limit) });
});

router.post('/', authorize('admin', 'billing_manager'), (req, res) => {
  const b = req.body;
  if (!b.title || !b.category || !b.amount || !b.expense_date) return res.status(400).json({ error: 'title, category, amount and expense_date are required' });
  const info = db.prepare(`INSERT INTO expenses (title, category, amount, expense_date, paid_by, description, attachment_path, created_by)
    VALUES (?,?,?,?,?,?,?,?)`).run(b.title, b.category, b.amount, b.expense_date, b.paid_by || null, b.description || null,
    b.attachment_path || null, req.user.id);
  logAudit(req.user.id, 'EXPENSE_CREATED', 'expense', info.lastInsertRowid, { title: b.title, amount: b.amount }, req.ip);
  res.status(201).json({ id: info.lastInsertRowid });
});

router.put('/:id', authorize('admin', 'billing_manager'), (req, res) => {
  const existing = db.prepare('SELECT * FROM expenses WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Expense not found' });
  const b = req.body;
  db.prepare(`UPDATE expenses SET title=?, category=?, amount=?, expense_date=?, paid_by=?, description=? WHERE id=?`).run(
    b.title ?? existing.title, b.category ?? existing.category, b.amount ?? existing.amount,
    b.expense_date ?? existing.expense_date, b.paid_by ?? existing.paid_by, b.description ?? existing.description, req.params.id);
  logAudit(req.user.id, 'EXPENSE_UPDATED', 'expense', req.params.id, null, req.ip);
  res.json({ success: true });
});

router.delete('/:id', authorize('admin'), (req, res) => {
  db.prepare('DELETE FROM expenses WHERE id = ?').run(req.params.id);
  logAudit(req.user.id, 'EXPENSE_DELETED', 'expense', req.params.id, null, req.ip);
  res.json({ success: true });
});

module.exports = router;
