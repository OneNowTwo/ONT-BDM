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
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  const indexPath = path.join(clientDist, 'index.html');
  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`[Server] One Now Two BDM running on http://localhost:${PORT}`);
  startScheduler();
});

module.exports = app;
