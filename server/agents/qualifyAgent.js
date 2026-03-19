require('dotenv').config();
const { claudeMessage, parseJSON } = require('../services/claude');

const QUALIFY_THRESHOLD = 7;

async function qualifyProspect(prospect) {
  const response = await claudeMessage({
    model: 'claude-haiku-4-5-20251001',
    maxTokens: 500,
    messages: [{
      role: 'user',
      content: `Score this commercial real estate prospect for a video production company 
targeting commercial property agents in Sydney. Score 1-10.

Prospect:
Name: ${prospect.name}
Agency: ${prospect.agency || 'Unknown'}
Role: ${prospect.role || 'Unknown'}
Source: ${prospect.source_url || 'Unknown'}
Hook: ${prospect.personalisation_hook || 'None'}
Why video now: ${prospect.why_video_now || 'Unknown'}
LinkedIn activity: ${prospect.linkedin_activity || 'Unknown'}

Return ONLY valid JSON: { "score": 8, "reasoning": "brief reason" }

Score high (8-10) if:
- Active listings right now (especially new to market)
- Senior decision-maker (director, head of, senior agent)
- Major commercial agency (CBRE, JLL, Colliers, Knight Frank, Cushman, Ray White Commercial, Burgess Rawson)
- High-value asset class (office, industrial estate, development site, retail centre)
- Specific compelling reason for video right now

Score low (1-5) if:
- Residential agent who occasionally does commercial
- Junior role unlikely to commission video
- No clear current listing activity
- Vague or unclear connection to commercial property
- Small agency with limited budget history`,
    }],
  });

  try {
    return parseJSON(response);
  } catch {
    return { score: 5, reasoning: 'Could not parse score response' };
  }
}

/**
 * Qualify an array of prospects — returns only those scoring >= threshold
 */
async function qualifyAll(prospects, threshold = QUALIFY_THRESHOLD) {
  const qualified = [];

  for (const prospect of prospects) {
    try {
      const { score, reasoning } = await qualifyProspect(prospect);
      console.log(`[Qualify] ${prospect.name} @ ${prospect.agency} → ${score}/10`);

      if (score >= threshold) {
        qualified.push({ ...prospect, qualify_score: score, qualify_reasoning: reasoning });
      }
    } catch (err) {
      console.error(`[Qualify] Error for ${prospect.name}:`, err.message);
    }

    await new Promise(r => setTimeout(r, 500));
  }

  return qualified;
}

module.exports = { qualifyProspect, qualifyAll, QUALIFY_THRESHOLD };
