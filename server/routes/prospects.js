const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/prospects — list all, with optional status filter
router.get('/', (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;

  let query = `
    SELECT p.*, od.id as draft_id, od.linkedin_dm, od.email_subject, od.email_body,
           od.edited_dm, od.edited_email_body, od.approved, od.sent_at, od.follow_up_days
    FROM prospects p
    LEFT JOIN outreach_drafts od ON od.prospect_id = p.id
  `;
  const params = [];

  if (status) {
    query += ' WHERE p.status = ?';
    params.push(status);
  }

  query += ' ORDER BY p.qualify_score DESC, p.created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const prospects = db.prepare(query).all(...params);
  const total = db.prepare(`SELECT COUNT(*) as count FROM prospects${status ? ' WHERE status = ?' : ''}`).get(...(status ? [status] : []));

  res.json({ prospects, total: total.count });
});

// GET /api/prospects/pending — today's morning review queue (pending_review only)
router.get('/pending', (req, res) => {
  const prospects = db.prepare(`
    SELECT p.*, od.id as draft_id, od.linkedin_dm, od.email_subject, od.email_body,
           od.edited_dm, od.edited_email_body, od.approved, od.sent_at, od.follow_up_days
    FROM prospects p
    LEFT JOIN outreach_drafts od ON od.prospect_id = p.id
    WHERE p.status = 'pending_review'
    ORDER BY p.qualify_score DESC, p.created_at DESC
    LIMIT 20
  `).all();

  res.json({ prospects });
});

// GET /api/prospects/stats — status counts for dashboard header
router.get('/stats', (req, res) => {
  const stats = db.prepare(`
    SELECT status, COUNT(*) as count FROM prospects GROUP BY status
  `).all();

  const result = {
    pending_review: 0, approved: 0, rejected: 0,
    contacted: 0, replied: 0, won: 0, lost: 0, not_interested: 0,
  };
  stats.forEach(row => { result[row.status] = row.count; });
  res.json(result);
});

// GET /api/prospects/:id
router.get('/:id', (req, res) => {
  const prospect = db.prepare(`
    SELECT p.*, od.id as draft_id, od.linkedin_dm, od.email_subject, od.email_body,
           od.edited_dm, od.edited_email_body, od.approved, od.sent_at, od.follow_up_days
    FROM prospects p
    LEFT JOIN outreach_drafts od ON od.prospect_id = p.id
    WHERE p.id = ?
  `).get(req.params.id);

  if (!prospect) return res.status(404).json({ error: 'Not found' });
  res.json(prospect);
});

// PATCH /api/prospects/:id — update status or notes
router.patch('/:id', (req, res) => {
  const allowed = ['status', 'notes', 'email', 'linkedin_url', 'last_contacted_at'];
  const updates = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) updates[key] = req.body[key];
  }

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No valid fields to update' });
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  const values = [...Object.values(updates), req.params.id];

  db.prepare(`UPDATE prospects SET ${setClauses} WHERE id = ?`).run(...values);
  res.json({ success: true });
});

// DELETE /api/prospects/:id — hard delete (use with care)
router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM outreach_drafts WHERE prospect_id = ?').run(req.params.id);
  db.prepare('DELETE FROM followups WHERE prospect_id = ?').run(req.params.id);
  db.prepare('DELETE FROM prospects WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
