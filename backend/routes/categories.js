const express = require('express');
const router = express.Router();

const db = require('../db/database');

// GET /categories  -> returns all categories
router.get('/', (req, res) => {
  const sql = 'SELECT id, name FROM categories ORDER BY name ASC';

  db.all(sql, [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }
    res.json(rows);
  });
});

module.exports = router;
