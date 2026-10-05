const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Collection report: payments in a date range
router.get('/collection', (req, res) => {
  const { date_from, date_to } = req.query;
  const where = [];
  const params = {};
  if (date_from) { where.push('date(p.payment_date) >= date(@date_from)'); params.date_from = date_from; }
  if (date_to) { where.push('date(p.payment_date) <= date(@date_to)'); params.date_to = date_to; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

  const rows = db.prepare(`SELECT p.*, c.name as customer_name, c.customer_code, i.invoice_number
    FROM payments p JOIN customers c ON p.customer_id = c.id LEFT JOIN invoices i ON p.invoice_id = i.id
    ${whereSql} ORDER BY p.payment_date DESC`).all(params);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  const byMethod = db.prepare(`SELECT payment_method, SUM(amount) as total, COUNT(*) as count FROM payments p ${whereSql} GROUP BY payment_method`).all(params);
  res.json({ rows, total, byMethod });
});

// Due / Overdue report
router.get('/due', (req, res) => {
  const { area, package_id, status } = req.query;
  const where = ["c.current_due > 0"];
  const params = {};
  if (area) { where.push('c.area = @area'); params.area = area; }
  if (package_id) { where.push('c.package_id = @package_id'); params.package_id = package_id; }
  if (status) { where.push('c.status = @status'); params.status = status; }
  const whereSql = `WHERE ${where.join(' AND ')}`;

  const rows = db.prepare(`SELECT c.id, c.customer_code, c.name, c.mobile, c.area, c.status, c.current_due, p.name as package_name
    FROM customers c LEFT JOIN packages p ON c.package_id = p.id ${whereSql} ORDER BY c.current_due DESC`).all(params);
  const total = rows.reduce((s, r) => s + r.current_due, 0);

  const byArea = db.prepare(`SELECT area, SUM(current_due) as total FROM customers WHERE current_due > 0 GROUP BY area ORDER BY total DESC`).all();
  const byPackage = db.prepare(`SELECT p.name, SUM(c.current_due) as total FROM customers c JOIN packages p ON c.package_id = p.id
    WHERE c.current_due > 0 GROUP BY p.id ORDER BY total DESC`).all();

  res.json({ rows, total, byArea, byPackage });
});

// Customer report (new / suspended / all)
router.get('/customers', (req, res) => {
  const { status, date_from, date_to } = req.query;
  const where = [];
  const params = {};
  if (status) { where.push('status = @status'); params.status = status; }
  if (date_from) { where.push('date(created_at) >= date(@date_from)'); params.date_from = date_from; }
  if (date_to) { where.push('date(created_at) <= date(@date_to)'); params.date_to = date_to; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM customers ${whereSql} ORDER BY created_at DESC`).all(params);
  res.json({ rows, total: rows.length });
});

// Expense report
router.get('/expenses', (req, res) => {
  const { date_from, date_to, category } = req.query;
  const where = [];
  const params = {};
  if (date_from) { where.push('expense_date >= @date_from'); params.date_from = date_from; }
  if (date_to) { where.push('expense_date <= @date_to'); params.date_to = date_to; }
  if (category) { where.push('category = @category'); params.category = category; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM expenses ${whereSql} ORDER BY expense_date DESC`).all(params);
  const total = rows.reduce((s, r) => s + r.amount, 0);
  res.json({ rows, total });
});

// Revenue report (invoices)
router.get('/revenue', (req, res) => {
  const { date_from, date_to } = req.query;
  const where = [];
  const params = {};
  if (date_from) { where.push('billing_period_start >= @date_from'); params.date_from = date_from; }
  if (date_to) { where.push('billing_period_start <= @date_to'); params.date_to = date_to; }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT i.*, c.name as customer_name, c.customer_code FROM invoices i JOIN customers c ON i.customer_id = c.id
    ${whereSql} ORDER BY i.billing_period_start DESC`).all(params);
  const totalBilled = rows.reduce((s, r) => s + r.total_amount, 0);
  const totalCollected = rows.reduce((s, r) => s + r.paid_amount, 0);
  res.json({ rows, totalBilled, totalCollected, totalOutstanding: totalBilled - totalCollected });
});

// Package report
router.get('/packages', (req, res) => {
  const rows = db.prepare(`
    SELECT p.*, COUNT(c.id) as customer_count, COALESCE(SUM(CASE WHEN c.status='active' THEN c.monthly_bill ELSE 0 END),0) as monthly_potential_revenue
    FROM packages p LEFT JOIN customers c ON c.package_id = p.id
    GROUP BY p.id ORDER BY customer_count DESC
  `).all();
  res.json({ rows });
});

module.exports = router;
