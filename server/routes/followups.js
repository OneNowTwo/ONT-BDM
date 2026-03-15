const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/followups — get pending follow-ups (due today or overdue)
router.get('/', (req, res) => {
  const { all } = req.query;
  let query = `
    SELECT f.*, p.name, p.agency, p.role, p.linkedin_url, p.email, p.status as prospect_status
    FROM followups f
    JOIN prospects p ON p.id = f.prospect_id
  `;
  const params = [];

  if (!all) {
    query += ' WHERE f.status = ? AND f.due_date <= ?';
    params.push('pending', new Date(Date.now() + 86400000).toISOString());
  }

  query += ' ORDER BY f.due_date ASC';

  const followups = db.prepare(query).all(...params);
  res.json({ followups });
});

// PATCH /api/followups/:id — mark sent or skipped
router.patch('/:id', (req, res) => {
  const { status } = req.body;
  if (!['pending', 'sent', 'skipped'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  db.prepare('UPDATE followups SET status = ? WHERE id = ?').run(status, req.params.id);

  if (status === 'sent') {
    const followup = db.prepare('SELECT * FROM followups WHERE id = ?').get(req.params.id);
    if (followup) {
      db.prepare('UPDATE prospects SET last_contacted_at = ? WHERE id = ?')
        .run(new Date().toISOString(), followup.prospect_id);
    }
  }

  res.json({ success: true });
});

module.exports = router;
