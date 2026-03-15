const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { sendOutreachEmail } = require('../services/resend');

// GET /api/outreach/:prospectId — get drafts for a prospect
router.get('/:prospectId', (req, res) => {
  const draft = db.prepare(
    'SELECT * FROM outreach_drafts WHERE prospect_id = ? ORDER BY created_at DESC LIMIT 1'
  ).get(req.params.prospectId);

  if (!draft) return res.status(404).json({ error: 'No draft found' });
  res.json(draft);
});

// PATCH /api/outreach/:id — save edits to a draft
router.patch('/:id', (req, res) => {
  const { edited_dm, edited_email_body, email_subject, approved } = req.body;
  const updates = {};
  if (edited_dm !== undefined) updates.edited_dm = edited_dm;
  if (edited_email_body !== undefined) updates.edited_email_body = edited_email_body;
  if (email_subject !== undefined) updates.email_subject = email_subject;
  if (approved !== undefined) updates.approved = approved ? 1 : 0;

  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ error: 'No fields to update' });
  }

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE outreach_drafts SET ${setClauses} WHERE id = ?`)
    .run(...Object.values(updates), req.params.id);

  res.json({ success: true });
});

// POST /api/outreach/:id/send-email — send approved email via Resend
router.post('/:id/send-email', async (req, res) => {
  const draft = db.prepare('SELECT * FROM outreach_drafts WHERE id = ?').get(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft not found' });

  const prospect = db.prepare('SELECT * FROM prospects WHERE id = ?').get(draft.prospect_id);
  if (!prospect) return res.status(404).json({ error: 'Prospect not found' });

  if (!prospect.email) {
    return res.status(400).json({ error: 'No email address on file for this prospect' });
  }

  try {
    const body = draft.edited_email_body || draft.email_body;
    const subject = draft.email_subject;

    await sendOutreachEmail({
      to: prospect.email,
      subject,
      body,
      prospectId: prospect.id,
    });

    const now = new Date().toISOString();
    db.prepare('UPDATE outreach_drafts SET sent_at = ? WHERE id = ?').run(now, draft.id);
    db.prepare('UPDATE prospects SET status = ?, last_contacted_at = ? WHERE id = ?')
      .run('contacted', now, prospect.id);

    const followUpDate = new Date(Date.now() + (draft.follow_up_days || 5) * 86400000).toISOString();
    db.prepare(`
      INSERT INTO followups (prospect_id, due_date, message_draft, status)
      VALUES (?, ?, ?, 'pending')
    `).run(prospect.id, followUpDate, `Follow up with ${prospect.name} re: commercial video`);

    res.json({ success: true, sent_at: now });
  } catch (err) {
    console.error('[Outreach] Send failed:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/outreach/:id/copy-dm — mark LinkedIn DM as copied (for tracking)
router.post('/:id/copy-dm', (req, res) => {
  const draft = db.prepare('SELECT * FROM outreach_drafts WHERE id = ?').get(req.params.id);
  if (!draft) return res.status(404).json({ error: 'Draft not found' });

  const now = new Date().toISOString();
  db.prepare('UPDATE outreach_drafts SET approved = 1 WHERE id = ?').run(draft.id);
  db.prepare('UPDATE prospects SET status = ?, last_contacted_at = ? WHERE id = ?')
    .run('contacted', now, draft.prospect_id);

  const followUpDate = new Date(Date.now() + (draft.follow_up_days || 5) * 86400000).toISOString();
  db.prepare(`
    INSERT INTO followups (prospect_id, due_date, message_draft, status)
    VALUES (?, ?, ?, 'pending')
  `).run(draft.prospect_id, followUpDate, `Follow up with prospect re: commercial video`);

  const dm = draft.edited_dm || draft.linkedin_dm;
  res.json({ success: true, dm });
});

module.exports = router;
