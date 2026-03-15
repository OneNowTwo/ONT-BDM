import React, { useState, useEffect } from 'react';
import { API_BASE } from '../config';

const styles = {
  wrap: { display: 'flex', flexDirection: 'column', gap: 16 },
  section: { display: 'flex', flexDirection: 'column', gap: 6 },
  label: { fontSize: 11, fontWeight: 600, color: '#888', letterSpacing: '0.08em', textTransform: 'uppercase' },
  textarea: {
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 6,
    color: '#F5F5F5',
    fontSize: 13,
    lineHeight: 1.6,
    padding: '10px 12px',
    resize: 'vertical',
    fontFamily: 'inherit',
    transition: 'border-color 0.15s',
    outline: 'none',
  },
  input: {
    background: '#111',
    border: '1px solid #2a2a2a',
    borderRadius: 6,
    color: '#F5F5F5',
    fontSize: 13,
    padding: '8px 12px',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    transition: 'border-color 0.15s',
  },
  wordCount: { fontSize: 11, color: '#555', textAlign: 'right', marginTop: 2 },
  wordCountWarn: { color: '#f87171' },
  actionRow: { display: 'flex', gap: 8, marginTop: 4 },
  btn: {
    fontSize: 12,
    fontWeight: 600,
    padding: '7px 14px',
    borderRadius: 4,
    border: 'none',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    transition: 'opacity 0.15s',
  },
  copyBtn: { background: '#C9A84C', color: '#0D0D0D' },
  savedIndicator: { fontSize: 11, color: '#4ade80', alignSelf: 'center' },
};

function wordCount(text) {
  return text ? text.trim().split(/\s+/).filter(Boolean).length : 0;
}

export default function DraftEditor({ draft, onSave }) {
  const [dm, setDm] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (draft) {
      setDm(draft.edited_dm || draft.linkedin_dm || '');
      setEmailSubject(draft.email_subject || '');
      setEmailBody(draft.edited_email_body || draft.email_body || '');
    }
  }, [draft]);

  const save = async () => {
    if (!draft?.id) return;
    await fetch(`${API_BASE}/outreach/${draft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        edited_dm: dm,
        email_subject: emailSubject,
        edited_email_body: emailBody,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
    if (onSave) onSave({ edited_dm: dm, email_subject: emailSubject, edited_email_body: emailBody });
  };

  const copyDm = async () => {
    await navigator.clipboard.writeText(dm);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    if (draft?.id) {
      await fetch(`${API_BASE}/outreach/${draft.id}/copy-dm`, { method: 'POST' });
    }
  };

  const dmWords = wordCount(dm);
  const emailWords = wordCount(emailBody);

  return (
    <div style={styles.wrap}>
      <div style={styles.section}>
        <label style={styles.label}>LinkedIn DM</label>
        <textarea
          value={dm}
          onChange={e => setDm(e.target.value)}
          rows={4}
          style={{ ...styles.textarea, borderColor: dmWords > 80 ? '#f87171' : '#2a2a2a' }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = dmWords > 80 ? '#f87171' : '#2a2a2a')}
          placeholder="LinkedIn DM (max 80 words)..."
        />
        <div style={{ ...styles.wordCount, ...(dmWords > 80 ? styles.wordCountWarn : {}) }}>
          {dmWords} / 80 words
        </div>
        <div style={styles.actionRow}>
          <button style={{ ...styles.btn, ...styles.copyBtn }} onClick={copyDm}>
            {copied ? '✓ Copied!' : 'Copy DM'}
          </button>
        </div>
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Email Subject</label>
        <input
          type="text"
          value={emailSubject}
          onChange={e => setEmailSubject(e.target.value)}
          style={styles.input}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = '#2a2a2a')}
          placeholder="Subject line..."
        />
      </div>

      <div style={styles.section}>
        <label style={styles.label}>Email Body</label>
        <textarea
          value={emailBody}
          onChange={e => setEmailBody(e.target.value)}
          rows={8}
          style={{
            ...styles.textarea,
            borderColor: emailWords > 200 ? '#f87171' : emailWords < 140 ? '#666' : '#2a2a2a',
          }}
          onFocus={e => (e.target.style.borderColor = '#C9A84C')}
          onBlur={e => (e.target.style.borderColor = emailWords > 200 ? '#f87171' : emailWords < 140 ? '#666' : '#2a2a2a')}
          placeholder="Email body (150-200 words)..."
        />
        <div style={{ ...styles.wordCount, ...(emailWords > 200 ? styles.wordCountWarn : {}) }}>
          {emailWords} / 200 words
        </div>
      </div>

      <div style={styles.actionRow}>
        <button style={{ ...styles.btn, background: '#1e1e1e', color: '#F5F5F5', border: '1px solid #333' }} onClick={save}>
          Save Edits
        </button>
        {saved && <span style={styles.savedIndicator}>Saved</span>}
      </div>
    </div>
  );
}
