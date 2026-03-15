# One Now Two — Autonomous BDM Agent

Nightly research agent that sweeps the Australian commercial property internet, identifies 20 qualified prospects per day, drafts personalised outreach for each, and surfaces them in a morning review dashboard.

---

## Quick Start (Local)

```bash
npm install
cd client && npm install && cd ..
npm start
# In another terminal:
cd client && npm run dev
```

Dashboard: **http://localhost:5173**

---

## How It Works

The agent runs nightly at **2:00am AEST** via node-cron:

| Time | Step | What happens |
|------|------|------|
| 2:00am | Research | Claude sweeps 17 commercial property sources via web_search |
| 2:30am | Enrich | Apify fetches LinkedIn profiles for identified agents |
| 3:00am | Qualify | Claude scores each prospect 1-10, keeps 7+ only |
| 3:30am | Draft | Claude writes personalised LinkedIn DM + email for each |
| 7:00am | Review | Dashboard shows 20 best prospects ready for your action |

**Your only job:** wake up, open the dashboard, approve + send.

---

## Dashboard Pages

| Page | What it does |
|------|------|
| **Morning Review** | Today's 20 prospects — approve, reject, or edit outreach |
| **Pipeline** | Full CRM — filter by status, track all prospects |
| **Follow-Ups** | Due follow-ups from previous outreach |
| **Run Log** | History of every nightly run with stats and errors |

---

## Manual Run

```bash
npm run run-agent
# or via dashboard: click "Run Now" in the nav
# or via API: curl -X POST http://localhost:3001/api/runs/trigger
```

---

## Deploy to Render

1. Push this repo to GitHub
2. Go to [render.com](https://render.com) → New → Web Service
3. Connect this GitHub repo
4. Add environment variables in Render dashboard:
   - `ANTHROPIC_API_KEY`
   - `APIFY_API_TOKEN`
   - `RESEND_API_KEY`
5. Render will auto-detect `render.yaml` and deploy

The `render.yaml` configures a persistent disk at `/data` for the SQLite database.

---

## Environment Variables

```
ANTHROPIC_API_KEY=sk-ant-...
APIFY_API_TOKEN=apify_api_...
RESEND_API_KEY=re_...
PORT=3001
DB_PATH=./server/db/bdm.sqlite   # local
# DB_PATH=/data/bdm.sqlite       # on Render
```

---

## Project Structure

```
one-now-two-bdm/
├── .env                    ← API keys (never commit — in .gitignore)
├── render.yaml             ← Render deployment config
├── package.json
│
├── server/
│   ├── index.js            ← Express + scheduler
│   ├── cron.js             ← Nightly pipeline orchestrator
│   ├── db/
│   │   ├── db.js           ← SQLite (auto-creates on first run)
│   │   └── schema.sql
│   ├── agents/
│   │   ├── researchAgent.js
│   │   ├── enrichAgent.js
│   │   ├── qualifyAgent.js
│   │   └── draftAgent.js
│   ├── routes/
│   │   ├── prospects.js
│   │   ├── outreach.js
│   │   ├── followups.js
│   │   └── runAgent.js
│   └── services/
│       ├── claude.js
│       ├── apify.js
│       └── resend.js
│
└── client/                 ← React/Vite dashboard
    └── src/
        ├── pages/
        └── components/
```

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/prospects/pending` | Today's review queue |
| GET | `/api/prospects/stats` | Status counts |
| PATCH | `/api/prospects/:id` | Update status/notes |
| PATCH | `/api/outreach/:id` | Save draft edits |
| POST | `/api/outreach/:id/send-email` | Send via Resend |
| POST | `/api/outreach/:id/copy-dm` | Mark DM copied |
| GET | `/api/followups` | Due follow-ups |
| POST | `/api/runs/trigger` | Trigger manual run |

---

*One Now Two BDM Agent — Built for Michael Hegarty, March 2026*
