require('dotenv').config();
const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Generic Claude message call — wraps the SDK for reuse across agents
 */
async function claudeMessage({ model = 'claude-sonnet-4-20250514', maxTokens = 2000, system, messages, tools }) {
  const params = {
    model,
    max_tokens: maxTokens,
    messages,
  };
  if (system) params.system = system;
  if (tools) params.tools = tools;

  return client.messages.create(params);
}

/**
 * Extract plain text from a Claude response content array
 */
function extractText(response) {
  return response.content
    .filter(b => b.type === 'text')
    .map(b => b.text)
    .join('');
}

/**
 * Parse JSON from Claude response (strips markdown code fences if present)
 */
function parseJSON(response) {
  const text = extractText(response);
  const clean = text.replace(/```json\n?|```\n?/g, '').trim();
  return JSON.parse(clean);
}

module.exports = { client, claudeMessage, extractText, parseJSON };
