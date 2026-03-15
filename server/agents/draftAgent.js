require('dotenv').config();
const { claudeMessage, parseJSON } = require('../services/claude');

const OUTREACH_SYSTEM_PROMPT = `You are a BDM assistant for One Now Two, a Sydney-based commercial property 
video production company founded by Michael Hegarty.

One Now Two creates cinematic, high-end video content specifically for 
commercial real estate — office buildings, industrial warehouses, retail spaces, 
development sites, hospitality venues.

Brand voice: confident, professional, peer-to-peer. Not salesy. Not desperate. 
Short and sharp. Michael is a fellow professional speaking to another professional.

When drafting outreach:
- Lead with something SPECIFIC to this person — their listing, their recent deal, 
  their agency, something real. Never generic openers.
- LinkedIn DM: max 80 words. No fluff. Soft CTA only ("happy to share a reel" 
  or "worth a quick look if you're open to it")
- Email: 150-200 words. Subject line must be specific, not clickbait.
- Never use: "I hope this finds you well", "reaching out", "touch base", 
  "circle back", "synergy", "leverage", "game-changer"
- Tone: like a respected colleague, not a vendor cold-calling

Always include a personalisation anchor — one specific thing about their work 
that justifies why you're contacting them specifically.`;

async function draftOutreach(prospect) {
  const response = await claudeMessage({
    model: 'claude-sonnet-4-20250514',
    maxTokens: 1200,
    system: OUTREACH_SYSTEM_PROMPT,
    messages: [{
      role: 'user',
      content: `Draft outreach for this prospect.

Name: ${prospect.name}
Agency: ${prospect.agency || 'Unknown'}
Role: ${prospect.role || 'Unknown'}
Personalisation hook: ${prospect.personalisation_hook || 'Active in commercial property'}
Why video now: ${prospect.why_video_now || 'Currently listing commercial property'}
LinkedIn: ${prospect.linkedin_url || 'unknown'}
Qualify score: ${prospect.qualify_score}/10
Reasoning: ${prospect.qualify_reasoning || ''}

Return ONLY valid JSON (no markdown, no explanation):
{
  "linkedin_dm": "max 80 word LinkedIn DM",
  "email_subject": "specific subject line, not clickbait",
  "email_body": "150-200 word email body, plain text with paragraph breaks",
  "follow_up_days": 5
}`,
    }],
  });

  try {
    return parseJSON(response);
  } catch (err) {
    console.error(`[Draft] Parse error for ${prospect.name}:`, err.message);
    return {
      linkedin_dm: `Hi ${prospect.name?.split(' ')[0]}, I work with commercial agents on property video — your current listings caught my attention. Happy to share a reel if it's useful.`,
      email_subject: `Commercial property video — ${prospect.agency}`,
      email_body: `Hi ${prospect.name?.split(' ')[0]},\n\nSaw your listings on the market — strong assets.\n\nI run One Now Two, we produce high-end video content specifically for commercial property — offices, industrial, development sites.\n\nWorth a look if you're thinking about how to present this one. Happy to share recent work.\n\nMichael`,
      follow_up_days: 5,
    };
  }
}

module.exports = { draftOutreach, OUTREACH_SYSTEM_PROMPT };
