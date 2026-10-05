const express = require('express');
const db = require('../db');
const { authenticate, logAudit } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/', (req, res) => {
  const { unread_only } = req.query;
  const whereSql = unread_only === 'true' ? 'WHERE n.is_read = 0' : '';
  const rows = db.prepare(`SELECT n.*, c.name as customer_name FROM notifications n
    LEFT JOIN customers c ON n.customer_id = c.id ${whereSql} ORDER BY n.id DESC LIMIT 100`).all();
  const unreadCount = db.prepare('SELECT COUNT(*) c FROM notifications WHERE is_read = 0').get().c;
  res.json({ notifications: rows, unreadCount });
});

router.put('/:id/read', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

router.put('/read-all', authenticate, (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
  res.json({ success: true });
});

module.exports = router;
