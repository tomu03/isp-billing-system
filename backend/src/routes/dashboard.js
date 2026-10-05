const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/stats', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';

  const totalCustomers = db.prepare('SELECT COUNT(*) c FROM customers').get().c;
  const activeCustomers = db.prepare("SELECT COUNT(*) c FROM customers WHERE status='active'").get().c;
  const inactiveCustomers = db.prepare("SELECT COUNT(*) c FROM customers WHERE status='inactive'").get().c;
  const suspendedCustomers = db.prepare("SELECT COUNT(*) c FROM customers WHERE status='suspended'").get().c;

  const todaysCollection = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE date(payment_date) = date(?)`).get(today).s;
  const monthCollection = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM payments WHERE date(payment_date) >= date(?)`).get(monthStart).s;

  const pendingBills = db.prepare(`SELECT COUNT(*) c FROM invoices WHERE status IN ('unpaid','partially_paid')`).get().c;
  const overdueBills = db.prepare(`SELECT COUNT(*) c FROM invoices WHERE status = 'overdue'`).get().c;

  const monthRevenue = db.prepare(`SELECT COALESCE(SUM(total_amount),0) s FROM invoices WHERE billing_period_start >= ?`).get(monthStart).s;
  const monthExpenses = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE expense_date >= ?`).get(monthStart).s;

  const activePackages = db.prepare("SELECT COUNT(*) c FROM packages WHERE status='active'").get().c;
  const newCustomersThisMonth = db.prepare(`SELECT COUNT(*) c FROM customers WHERE created_at >= ?`).get(monthStart).c;
  const expiringConnections = db.prepare(`SELECT COUNT(*) c FROM connections WHERE status IN ('suspended','pending')`).get().c;

  res.json({
    totalCustomers, activeCustomers, inactiveCustomers, suspendedCustomers,
    todaysCollection, monthCollection, pendingBills, overdueBills,
    monthRevenue, monthExpenses, netRevenue: monthRevenue - monthExpenses,
    activePackages, newCustomersThisMonth, expiringConnections
  });
});

router.get('/charts', (req, res) => {
  // Last 6 months revenue & expenses
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const revenueByMonth = months.map(m => {
    const s = db.prepare(`SELECT COALESCE(SUM(total_amount),0) s FROM invoices WHERE billing_period_start LIKE ?`).get(`${m}%`).s;
    return { month: m, revenue: s };
  });
  const expensesByMonth = months.map(m => {
    const s = db.prepare(`SELECT COALESCE(SUM(amount),0) s FROM expenses WHERE expense_date LIKE ?`).get(`${m}%`).s;
    return { month: m, expenses: s };
  });

  const customerGrowth = months.map(m => {
    const c = db.prepare(`SELECT COUNT(*) c FROM customers WHERE created_at < date(?, '+1 month')`).get(`${m}-01`).c;
    return { month: m, customers: c };
  });

  const paidVsUnpaid = db.prepare(`
    SELECT
      SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END) as paid,
      SUM(CASE WHEN status = 'unpaid' THEN 1 ELSE 0 END) as unpaid,
      SUM(CASE WHEN status = 'partially_paid' THEN 1 ELSE 0 END) as partially_paid,
      SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END) as overdue
    FROM invoices
  `).get();

  const packageDistribution = db.prepare(`
    SELECT p.name, COUNT(c.id) as customers
    FROM packages p LEFT JOIN customers c ON c.package_id = p.id
    GROUP BY p.id ORDER BY customers DESC
  `).all();

  res.json({ revenueByMonth, expensesByMonth, customerGrowth, paidVsUnpaid, packageDistribution });
});

module.exports = router;
