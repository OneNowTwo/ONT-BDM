require('dotenv').config();
const axios = require('axios');

const APIFY_BASE = 'https://api.apify.com/v2';
const TOKEN = process.env.APIFY_API_TOKEN;

const LINKEDIN_ACTOR = 'apify/linkedin-profile-scraper';

/**
 * Run an Apify actor and wait for the result
 */
async function runActor(actorId, input, timeoutSeconds = 120) {
  const runRes = await axios.post(
    `${APIFY_BASE}/acts/${actorId}/runs?token=${TOKEN}`,
    { ...input },
    { headers: { 'Content-Type': 'application/json' } }
  );

  const runId = runRes.data.data.id;
  const datasetId = runRes.data.data.defaultDatasetId;

  const deadline = Date.now() + timeoutSeconds * 1000;
  while (Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 5000));

    const statusRes = await axios.get(
      `${APIFY_BASE}/actor-runs/${runId}?token=${TOKEN}`
    );
    const status = statusRes.data.data.status;

    if (status === 'SUCCEEDED') {
      const dataRes = await axios.get(
        `${APIFY_BASE}/datasets/${datasetId}/items?token=${TOKEN}&format=json`
      );
      return dataRes.data;
    }

    if (['FAILED', 'TIMED-OUT', 'ABORTED'].includes(status)) {
      throw new Error(`Apify actor ${actorId} run ${status}`);
    }
  }

  throw new Error(`Apify actor ${actorId} timed out after ${timeoutSeconds}s`);
}

/**
 * Scrape a LinkedIn profile URL and return structured data
 */
async function scrapeLinkedInProfile(profileUrl) {
  try {
    const results = await runActor(LINKEDIN_ACTOR, {
      profileUrls: [profileUrl],
    });
    return results[0] || null;
  } catch (err) {
    console.error(`[Apify] LinkedIn scrape failed for ${profileUrl}:`, err.message);
    return null;
  }
}

/**
 * Search LinkedIn profiles by query — returns array of profile data
 */
async function searchLinkedInProfiles(searchQuery, maxResults = 10) {
  try {
    const results = await runActor(LINKEDIN_ACTOR, {
      searchQuery,
      maxResults,
    });
    return results || [];
  } catch (err) {
    console.error(`[Apify] LinkedIn search failed for "${searchQuery}":`, err.message);
    return [];
  }
}

module.exports = { scrapeLinkedInProfile, searchLinkedInProfiles };
