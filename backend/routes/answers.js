const express = require('express');
const router = express.Router();

const db = require('../db/database');

// GET /answers/:questionId (chronological)
router.get('/:questionId', (req, res) => {
  const questionId = Number(req.params.questionId);

  if (!Number.isInteger(questionId)) {
    return res.status(400).json({ error: 'questionId must be an integer' });
  }

  const sql = `
    SELECT a.id, a.body, a.created_at, u.username
    FROM answers a
    JOIN users u ON u.id = a.user_id
    WHERE a.question_id = ?
    ORDER BY a.created_at ASC
  `;

  db.all(sql, [questionId], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows);
  });
});

// POST /answers
// body: { questionId, userId, body }
router.post('/', (req, res) => {
  const { questionId, userId, body } = req.body || {};

  if (!questionId || !userId || !body) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sql = `
    INSERT INTO answers (question_id, user_id, body)
    VALUES (?, ?, ?)
  `;

  db.run(sql, [questionId, userId, body], function (err) {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    res.status(201).json({
      id: this.lastID,
      questionId,
      userId,
      body
    });
  });
});

module.exports = router;
