require('dotenv').config();
const cron = require('node-cron');
const { runResearchAgent, RESEARCH_SOURCES } = require('./agents/researchAgent');
const { enrichWithLinkedIn } = require('./agents/enrichAgent');
const { qualifyAll } = require('./agents/qualifyAgent');
const { draftOutreach } = require('./agents/draftAgent');
const db = require('./db/db');

/**
 * Full nightly pipeline — research → enrich → qualify → draft → save
 */
async function runNightlyPipeline() {
  if (global.agentRunning) {
    console.log('[BDM] Pipeline already running — skipping');
    return;
  }

  global.agentRunning = true;
  const runStart = Date.now();
  console.log('[BDM] Nightly pipeline starting:', new Date().toISOString());

  let rawCount = 0;
  let qualifiedCount = 0;
  const allErrors = [];

  try {
    // ─── Step 1: Research ────────────────────────────────────────────────────
    console.log('[BDM] Step 1/4 — Sweeping research sources...');
    const { prospects: rawProspects, errors: researchErrors } = await runResearchAgent();
    rawCount = rawProspects.length;
    allErrors.push(...researchErrors);
    console.log(`[BDM] Found ${rawCount} raw prospects`);

    // ─── Step 2: Dedup against existing DB ──────────────────────────────────
    const existing = db.prepare('SELECT name, agency FROM prospects').all();
    const existingKeys = new Set(
      existing.map(p => `${p.name?.toLowerCase().trim()}-${p.agency?.toLowerCase().trim()}`)
    );

    const newProspects = rawProspects.filter(p => {
      const key = `${p.name?.toLowerCase().trim()}-${p.agency?.toLowerCase().trim()}`;
      return !existingKeys.has(key);
    });
    console.log(`[BDM] ${newProspects.length} are new (not already in DB)`);

    if (newProspects.length === 0) {
      console.log('[BDM] No new prospects found — run complete');
      logRun({ rawCount, qualifiedCount: 0, errors: allErrors, durationMs: Date.now() - runStart });
      return;
    }

    // ─── Step 3: Enrich with LinkedIn ────────────────────────────────────────
    console.log('[BDM] Step 2/4 — Enriching with LinkedIn data...');
    const enriched = await enrichWithLinkedIn(newProspects);

    // ─── Step 4: Qualify — only keep score 7+ ────────────────────────────────
    console.log('[BDM] Step 3/4 — Qualifying prospects...');
    const qualified = await qualifyAll(enriched);
    qualifiedCount = qualified.length;
    console.log(`[BDM] ${qualifiedCount} qualified (score 7+)`);

    // ─── Step 5: Take top 20, draft outreach + save ───────────────────────────
    const top20 = qualified
      .sort((a, b) => b.qualify_score - a.qualify_score)
      .slice(0, 20);

    console.log(`[BDM] Step 4/4 — Drafting outreach for ${top20.length} prospects...`);

    for (const prospect of top20) {
      try {
        // Save prospect to DB
        const result = db.prepare(`
          INSERT INTO prospects 
            (name, agency, role, linkedin_url, email, source_url, 
             personalisation_hook, why_video_now, qualify_score, qualify_reasoning, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_review')
        `).run(
          prospect.name,
          prospect.agency || null,
          prospect.role || null,
          prospect.linkedin_url || null,
          prospect.email || null,
          prospect.source_url || null,
          prospect.personalisation_hook || null,
          prospect.why_video_now || null,
          prospect.qualify_score,
          prospect.qualify_reasoning || null,
        );

        // Draft outreach
        const drafts = await draftOutreach(prospect);

        // Save drafts
        db.prepare(`
          INSERT INTO outreach_drafts 
            (prospect_id, linkedin_dm, email_subject, email_body, follow_up_days)
          VALUES (?, ?, ?, ?, ?)
        `).run(
          result.lastInsertRowid,
          drafts.linkedin_dm,
          drafts.email_subject,
          drafts.email_body,
          drafts.follow_up_days || 5,
        );

        console.log(`[BDM] Saved: ${prospect.name} @ ${prospect.agency} (${prospect.qualify_score}/10)`);
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        const msg = `Failed to save/draft for ${prospect.name}: ${err.message}`;
        console.error(`[BDM] ${msg}`);
        allErrors.push(msg);
      }
    }

    console.log(`[BDM] Pipeline complete. ${top20.length} prospects ready for morning review.`);

  } catch (err) {
    const msg = `Pipeline fatal error: ${err.message}`;
    console.error('[BDM]', msg);
    allErrors.push(msg);
  } finally {
    logRun({
      rawCount,
      qualifiedCount,
      errors: allErrors,
      durationMs: Date.now() - runStart,
    });
    global.agentRunning = false;
  }
}

function logRun({ rawCount, qualifiedCount, errors, durationMs }) {
  try {
    db.prepare(`
      INSERT INTO research_runs 
        (prospects_found, prospects_qualified, sources_swept, errors, duration_seconds)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      rawCount,
      qualifiedCount,
      JSON.stringify(RESEARCH_SOURCES),
      errors.length > 0 ? JSON.stringify(errors) : null,
      Math.round(durationMs / 1000),
    );
  } catch (err) {
    console.error('[BDM] Failed to log run:', err.message);
  }
}

/**
 * Schedule nightly run at 2:00am Sydney time
 */
function startScheduler() {
  cron.schedule('0 2 * * *', () => {
    console.log('[BDM] Cron triggered — starting nightly pipeline');
    runNightlyPipeline().catch(err => {
      console.error('[BDM] Scheduled run failed:', err);
    });
  }, {
    timezone: 'Australia/Sydney',
  });

  console.log('[BDM] Scheduler started — nightly run at 2:00am AEST');
}

module.exports = { startScheduler, runNightlyPipeline };
