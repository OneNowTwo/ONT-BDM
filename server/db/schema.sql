-- Prospects master table
CREATE TABLE IF NOT EXISTS prospects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  agency TEXT,
  role TEXT,
  linkedin_url TEXT,
  email TEXT,
  source_url TEXT,
  research_query TEXT,
  personalisation_hook TEXT,
  why_video_now TEXT,
  qualify_score INTEGER,
  qualify_reasoning TEXT,
  status TEXT DEFAULT 'pending_review',
  -- statuses: pending_review | approved | rejected | contacted | replied | won | lost | not_interested
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_contacted_at DATETIME,
  notes TEXT
);

-- Outreach drafts table
CREATE TABLE IF NOT EXISTS outreach_drafts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospect_id INTEGER REFERENCES prospects(id),
  linkedin_dm TEXT,
  email_subject TEXT,
  email_body TEXT,
  follow_up_days INTEGER DEFAULT 5,
  approved INTEGER DEFAULT 0,
  edited_dm TEXT,
  edited_email_body TEXT,
  sent_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Follow-up queue
CREATE TABLE IF NOT EXISTS followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  prospect_id INTEGER REFERENCES prospects(id),
  due_date DATETIME,
  message_draft TEXT,
  status TEXT DEFAULT 'pending',
  -- statuses: pending | sent | skipped
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Research run log
CREATE TABLE IF NOT EXISTS research_runs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  prospects_found INTEGER DEFAULT 0,
  prospects_qualified INTEGER DEFAULT 0,
  sources_swept TEXT,
  errors TEXT,
  duration_seconds INTEGER
);
