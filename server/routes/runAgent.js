const express = require('express');
const router = express.Router();
const db = require('../db/db');
const { runNightlyPipeline } = require('../cron');

// GET /api/runs — get run history
router.get('/', (req, res) => {
  const runs = db.prepare(
    'SELECT * FROM research_runs ORDER BY ran_at DESC LIMIT 30'
  ).all();
  res.json({ runs });
});

// POST /api/runs/trigger — manually trigger a full nightly run
router.post('/trigger', async (req, res) => {
  if (global.agentRunning) {
    return res.status(409).json({ error: 'Agent is already running' });
  }

  res.json({ success: true, message: 'Agent run started. Check /api/runs for status.' });

  runNightlyPipeline().catch(err => {
    console.error('[Manual Run] Pipeline error:', err);
  });
});

// GET /api/runs/status — is the agent currently running?
router.get('/status', (req, res) => {
  res.json({ running: !!global.agentRunning });
});

module.exports = router;
