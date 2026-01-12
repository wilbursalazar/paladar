const express = require('express');
const router = express.Router();

const db = require('../db/database');

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


router.post('/', (req, res) => {
  const { title, body, categoryId, userId } = req.body || {};

  if (!title || !body || !categoryId || !userId) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO questions (title, body, category_id, user_id)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [title, body, categoryId, userId], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      title,
      body,
      categoryId,
      userId
    });
  });
});

module.exports = router;
