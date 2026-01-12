const express = require('express');
const router = express.Router();

const db = require('../db/database');

// GET /questions/:categoryId
router.get('/:categoryId', (req, res) => {
  const categoryId = Number(req.params.categoryId);

  if (!Number.isInteger(categoryId)) {
    return res.status(400).json({ error: 'categoryId must be an integer' });
  }

  const sql = `
    SELECT q.id, q.title, q.body, q.created_at, u.username
    FROM questions q
    JOIN users u ON u.id = q.user_id
    WHERE q.category_id = ?
    ORDER BY q.created_at ASC
  `;

  db.all(sql, [categoryId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
