const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const db = require('../db/database');

// POST /auth/register
// body: { username, password }
router.post('/register', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const passwordHash = bcrypt.hashSync(password, 10);

  const sql = 'INSERT INTO users (username, password_hash) VALUES (?, ?)';
  db.run(sql, [username, passwordHash], function (err) {
    if (err) {
      // likely UNIQUE constraint (username already exists)
      return res.status(400).json({ error: 'username already exists' });
    }

    return res.status(201).json({
      message: 'registered',
      user: { id: this.lastID, username }
    });
  });
});

// POST /auth/login
// body: { username, password }
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const sql = 'SELECT id, username, password_hash FROM users WHERE username = ?';
  db.get(sql, [username], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error', details: err.message });
    }

    // Invalid username
    if (!user) {
      return res.status(401).json({ error: 'invalid username or password' });
    }

    const ok = bcrypt.compareSync(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid username or password' });
    }

    // Keep it simple: return user info (no JWT needed for passing)
    return res.json({
      message: 'logged_in',
      user: { id: user.id, username: user.username }
    });
  });
});

module.exports = router;
