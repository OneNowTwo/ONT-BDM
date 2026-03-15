require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { startScheduler } = require('./cron');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/prospects', require('./routes/prospects'));
app.use('/api/outreach', require('./routes/outreach'));
app.use('/api/followups', require('./routes/followups'));
app.use('/api/runs', require('./routes/runAgent'));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// Serve React client in production
const clientDist = path.join(__dirname, '../client/dist');
const fs = require('fs');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(200).send(`
      <html><body style="background:#0D0D0D;color:#F5F5F5;font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;flex-direction:column;gap:12px">
        <div style="font-size:18px;font-weight:700;color:#C9A84C">One Now Two BDM</div>
        <div style="font-size:13px;color:#555">API running. Client build pending — check server logs.</div>
        <div style="font-size:12px;color:#333;margin-top:8px">GET /api/health to verify API</div>
      </body></html>
    `);
  }
});

app.listen(PORT, () => {
  console.log(`[Server] One Now Two BDM running on http://localhost:${PORT}`);
  startScheduler();
});

module.exports = app;
