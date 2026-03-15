require('dotenv').config();
const { scrapeLinkedInProfile, searchLinkedInProfiles } = require('../services/apify');

/**
 * Attempt to find a LinkedIn URL for a prospect if not already known
 */
async function findLinkedInUrl(prospect) {
  if (prospect.linkedin_url) return prospect.linkedin_url;

  const query = `${prospect.name} ${prospect.agency} commercial real estate`;
  const results = await searchLinkedInProfiles(query, 3);

  if (results.length > 0) {
    const best = results[0];
    return best.url || best.linkedInUrl || null;
  }
  return null;
}

/**
 * Enrich a single prospect with LinkedIn data
 */
async function enrichProspect(prospect) {
  try {
    const linkedinUrl = await findLinkedInUrl(prospect);
    if (!linkedinUrl) return prospect;

    const profile = await scrapeLinkedInProfile(linkedinUrl);
    if (!profile) return { ...prospect, linkedin_url: linkedinUrl };

    return {
      ...prospect,
      linkedin_url: linkedinUrl,
      role: prospect.role || profile.headline || profile.title,
      linkedin_summary: profile.summary || profile.about,
      linkedin_connections: profile.connectionsCount,
      linkedin_activity: profile.posts?.length > 0 ? 'active' : 'unknown',
    };
  } catch (err) {
    console.error(`[Enrich] Failed for ${prospect.name}:`, err.message);
    return prospect;
  }
}

/**
 * Enrich all prospects — fetches LinkedIn data where missing
 */
async function enrichWithLinkedIn(prospects) {
  const enriched = [];

  for (const prospect of prospects) {
    const result = await enrichProspect(prospect);
    enriched.push(result);
    await new Promise(r => setTimeout(r, 1500));
  }

  console.log(`[Enrich] Enriched ${enriched.length} prospects`);
  return enriched;
}

module.exports = { enrichWithLinkedIn, enrichProspect };
