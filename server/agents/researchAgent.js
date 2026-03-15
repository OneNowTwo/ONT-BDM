require('dotenv').config();
const { claudeMessage, extractText } = require('../services/claude');

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
- Source URL where you found them
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

async function runResearchAgent() {
  const allProspects = [];
  const errors = [];

  for (const searchQuery of RESEARCH_SOURCES) {
    try {
      console.log(`[Research] Searching: "${searchQuery}"`);

      const response = await claudeMessage({
        model: 'claude-3-7-sonnet-20250219',
        maxTokens: 4000,
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

      const text = extractText(response);
      const clean = text.replace(/```json\n?|```\n?/g, '').trim();

      const jsonMatch = clean.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        console.warn(`[Research] No JSON array found for query: "${searchQuery}"`);
        continue;
      }

      const prospects = JSON.parse(jsonMatch[0]);
      if (Array.isArray(prospects)) {
        console.log(`[Research] Found ${prospects.length} prospects from "${searchQuery}"`);
        allProspects.push(...prospects);
      }

    } catch (err) {
      const msg = `Research error for "${searchQuery}": ${err.message}`;
      console.error(`[Research] ${msg}`);
      errors.push(msg);
    }

    await new Promise(r => setTimeout(r, 2000));
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
