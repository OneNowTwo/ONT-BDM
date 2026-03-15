require('dotenv').config();
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = 'michael@onenow.com.au';
const FROM_NAME = 'Michael Hegarty — One Now Two';

/**
 * Send an outreach email to a prospect
 */
async function sendOutreachEmail({ to, subject, body, prospectId }) {
  try {
    const result = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to: [to],
      subject,
      html: bodyToHtml(body),
      text: body,
      tags: [
        { name: 'type', value: 'outreach' },
        { name: 'prospect_id', value: String(prospectId) },
      ],
    });

    console.log(`[Resend] Email sent to ${to} — ID: ${result.data?.id}`);
    return result;
  } catch (err) {
    console.error(`[Resend] Failed to send to ${to}:`, err.message);
    throw err;
  }
}

/**
 * Convert plain text email body to simple HTML
 */
function bodyToHtml(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  const paragraphs = escaped
    .split(/\n\n+/)
    .map(p => `<p style="margin:0 0 16px 0;line-height:1.6;">${p.replace(/\n/g, '<br>')}</p>`)
    .join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:15px;color:#1a1a1a;max-width:600px;margin:0 auto;padding:32px 24px;">
${paragraphs}
<hr style="border:none;border-top:1px solid #e5e5e5;margin:32px 0;">
<p style="font-size:13px;color:#666;margin:0;">
  <strong>Michael Hegarty</strong><br>
  One Now Two — Commercial Property Video<br>
  <a href="https://onenowtwo.com.au" style="color:#8B7355;">onenowtwo.com.au</a>
</p>
</body>
</html>`;
}

module.exports = { sendOutreachEmail };
