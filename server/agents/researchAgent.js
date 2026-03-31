require('dotenv').config();
const { claudeMessage, extractText } = require('../services/claude');
const { isPipelineCancelRequested } = require('../pipelineCancel');

const RESEARCH_SYSTEM_PROMPT = `You are an autonomous business development research agent for One Now Two, 
a Sydney-based commercial property video production company.

Your job is to sweep the Australian commercial property internet and identify 
real, named, currently active commercial real estate agents, industrial property 
agents, development managers, and property marketing professionals who are likely 
to need high-quality video production services.

Signs someone is a good prospect:
- They have active commercial listings (new to market = highest priority)
- They work at a recognisable commercial agency (CBRE, JLL, Colliers, Ray White Commercial, etc.)
- They appear to be a decision-maker (director, senior agent, head of)
- Their listings are high-value (office buildings, industrial estates, development sites, retail centres)
- They have recently been mentioned in property news or press
- They are active on LinkedIn with property content

For each prospect you find, extract:
- Full name
- Agency / employer
- Role / title
- LinkedIn URL (if findable)
- Email (if publicly listed)
- Source URL: full https:// link only, or null — never placeholders like "Source 1"
- Key personalisation hook (what specific thing about them or their listing is relevant)
- Why they need video right now (specific reasoning)

Return a JSON array of prospects. Be specific and factual. Do not invent contacts.
Only include people you have genuine evidence are currently active in commercial property.`;

const RESEARCH_SOURCES = [
  "realcommercial.com.au new listings Sydney commercial property agents",
  "commercialrealestate.com.au Sydney industrial warehouse listings agent",
  "cbre.com.au Sydney commercial property listings agents team",
  "jll.com.au Sydney commercial listings leasing agents",
  "colliers.com.au Sydney commercial industrial listings agents",
  "theurbandeveloper.com Sydney commercial development projects 2026",
  "burgessrawson.com.au commercial investment property listings agents",
  "raywhitecommercial.com Sydney agents listings",
  "afr.com commercial property Sydney deals agents 2026",
  "planning.nsw.gov.au major commercial development applications Sydney 2026",
  "cushmanwakefield.com.au Sydney commercial agents listings",
  "knightfrank.com.au Sydney commercial property agents",
  "commercialproperty2sell.com.au Sydney agents listings",
  "ljhooker.com.au commercial Sydney agents",
  "theurbandeveloper.com Sydney industrial development 2026",
  "smh.com.au commercial property Sydney agents deals",
  "realestatebusiness.com.au commercial agents NSW 2026",
];

const PROSPECT_SCHEMA = `{
  "name": "Full Name",
  "agency": "Agency Name",
  "role": "Their Title",
  "linkedin_url": "if findable or null",
  "email": "if publicly listed or null",
  "source_url": "URL where found",
  "personalisation_hook": "specific detail about them or their listing",
  "why_video_now": "specific reason they need video right now"
}`;

/** Min ms between research API calls — web_search blows past 50k input TPM if this is too low */
const RESEARCH_QUERY_GAP_MS = Math.max(
  0,
  parseInt(process.env.RESEARCH_QUERY_GAP_MS || '65000', 10) || 65000,
);

const RATE_LIMIT_BACKOFF_SECS = [75, 90, 120, 120, 150, 150];

async function searchWithRetry(searchQuery, maxAttempts = 7) {
  let lastErr;
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await claudeMessage({
        model: 'claude-haiku-4-5-20251001',
        maxTokens: 3500,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: RESEARCH_SYSTEM_PROMPT,
        messages: [{
          role: 'user',
          content: `Search for: "${searchQuery}"
          
Find all named commercial real estate agents, industrial property agents, 
development managers, and property marketing professionals you can identify.
Return ONLY a valid JSON array of prospect objects. No other text.

Each object must have:
${PROSPECT_SCHEMA}`,
        }],
      });
    } catch (err) {
      lastErr = err;
      if (err.status === 429 && attempt < maxAttempts - 1) {
        const waitSecs = RATE_LIMIT_BACKOFF_SECS[Math.min(attempt, RATE_LIMIT_BACKOFF_SECS.length - 1)];
        console.log(`[Research] Rate limited — waiting ${waitSecs}s (attempt ${attempt + 1}/${maxAttempts})...`);
        await new Promise(r => setTimeout(r, waitSecs * 1000));
      } else {
        throw err;
      }
    }
  }
  throw lastErr;
}

async function runOneResearchQuery(searchQuery, allProspects, errors, label) {
  console.log(`[Research] ${label}: "${searchQuery}"`);
  const response = await searchWithRetry(searchQuery);

  const text = extractText(response);
  const clean = text.replace(/```json\n?|```\n?/g, '').trim();

  const jsonMatch = clean.match(/\[[\s\S]*\]/);
  if (!jsonMatch) {
    console.warn(`[Research] No JSON array found for query: "${searchQuery}"`);
    return false;
  }

  const prospects = JSON.parse(jsonMatch[0]);
  if (Array.isArray(prospects)) {
    console.log(`[Research] Found ${prospects.length} prospects from "${searchQuery}"`);
    for (const p of prospects) {
      allProspects.push({ ...p, research_query: searchQuery });
    }
  }
  return true;
}

async function runResearchAgent() {
  const allProspects = [];
  const errors = [];
  const rateLimitRetryQueue = [];

  for (const searchQuery of RESEARCH_SOURCES) {
    if (isPipelineCancelRequested()) {
      errors.push('Research stopped early: pipeline cancelled by user');
      console.log('[Research] Cancelled — returning partial results');
      break;
    }
    try {
      await runOneResearchQuery(searchQuery, allProspects, errors, 'Searching');
    } catch (err) {
      if (err.status === 429) {
        console.warn(`[Research] Rate limit on "${searchQuery}" — queued for cooldown retry`);
        rateLimitRetryQueue.push(searchQuery);
      } else {
        const msg = `Research error for "${searchQuery}": ${err.message}`;
        console.error(`[Research] ${msg}`);
        errors.push(msg);
      }
    }

    if (RESEARCH_QUERY_GAP_MS > 0) {
      await new Promise(r => setTimeout(r, RESEARCH_QUERY_GAP_MS));
    }
  }

  // Second pass: sources that still 429'd after backoff — extra cooldown then one more try each
  if (rateLimitRetryQueue.length > 0 && !isPipelineCancelRequested()) {
    console.log(`[Research] Retrying ${rateLimitRetryQueue.length} source(s) that hit rate limits after cooldown...`);
    await new Promise(r => setTimeout(r, 90000));
    for (const searchQuery of rateLimitRetryQueue) {
      if (isPipelineCancelRequested()) break;
      try {
        await runOneResearchQuery(searchQuery, allProspects, errors, 'Retry');
      } catch (err) {
        const msg = `Research retry error for "${searchQuery}": ${err.message}`;
        console.error(`[Research] ${msg}`);
        errors.push(msg);
      }
      if (RESEARCH_QUERY_GAP_MS > 0) {
        await new Promise(r => setTimeout(r, RESEARCH_QUERY_GAP_MS));
      }
    }
  }

  const seen = new Set();
  const deduped = allProspects.filter(p => {
    const key = `${p.name?.toLowerCase().trim()}-${p.agency?.toLowerCase().trim()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  console.log(`[Research] Done. ${deduped.length} unique prospects (from ${allProspects.length} raw)`);
  return { prospects: deduped, errors, sourcesSwept: RESEARCH_SOURCES };
}

module.exports = { runResearchAgent, RESEARCH_SOURCES };
