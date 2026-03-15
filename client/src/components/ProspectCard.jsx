import React, { useState } from 'react';
import { StatusBadge, ScoreBadge } from './StatusBadge';
import DraftEditor from './DraftEditor';
import { API_BASE } from '../config';

const styles = {
  card: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 8,
    overflow: 'hidden',
    transition: 'border-color 0.15s',
  },
  cardApproved: { borderColor: '#4ade8033' },
  cardRejected: { borderColor: '#f8717133', opacity: 0.6 },
  header: {
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: 12,
    cursor: 'pointer',
    userSelect: 'none',
  },
  headerLeft: { flex: 1 },
  name: { fontSize: 15, fontWeight: 700, color: '#F5F5F5', marginBottom: 2 },
  agencyRole: { fontSize: 13, color: '#aaa', marginBottom: 4 },
  badges: { display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 },
  headerRight: { display: 'flex', gap: 8, alignItems: 'center' },
  chevron: { color: '#444', fontSize: 12, transition: 'transform 0.2s', lineHeight: 1 },
  body: { borderTop: '1px solid #1a1a1a', padding: '0 20px' },
  grid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: '20px 0' },
  section: { display: 'flex', flexDirection: 'column', gap: 12 },
  sectionTitle: { fontSize: 11, fontWeight: 700, color: '#555', letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: '1px solid #1e1e1e', paddingBottom: 8 },
  field: { display: 'flex', flexDirection: 'column', gap: 3 },
  fieldLabel: { fontSize: 10, color: '#555', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' },
  fieldValue: { fontSize: 13, color: '#ccc', lineHeight: 1.5 },
  link: { color: '#C9A84C', textDecoration: 'none', fontSize: 12 },
  reasoning: { fontSize: 12, color: '#888', lineHeight: 1.6, fontStyle: 'italic', background: '#0D0D0D', borderRadius: 6, padding: '10px 12px', border: '1px solid #1a1a1a' },
  actions: { display: 'flex', gap: 8, padding: '16px 20px', borderTop: '1px solid #1a1a1a', background: '#0a0a0a' },
  btn: { fontSize: 12, fontWeight: 600, padding: '8px 16px', borderRadius: 4, border: 'none', cursor: 'pointer', letterSpacing: '0.04em', transition: 'opacity 0.15s' },
  approveBtn: { background: '#4ade8022', color: '#4ade80', border: '1px solid #4ade8033' },
  rejectBtn: { background: '#f8717122', color: '#f87171', border: '1px solid #f8717133' },
  sendEmailBtn: { background: '#C9A84C', color: '#0D0D0D' },
  sendEmailBtnDisabled: { background: '#2a2a2a', color: '#555', cursor: 'not-allowed' },
  statusChangeBtn: { background: '#1e1e1e', color: '#aaa', border: '1px solid #2a2a2a', marginLeft: 'auto' },
  sent: { fontSize: 11, color: '#4ade80', alignSelf: 'center' },
};

const STATUS_FLOW = ['pending_review', 'approved', 'contacted', 'replied', 'won', 'lost', 'not_interested'];

export default function ProspectCard({ prospect, onStatusChange }) {
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(prospect.status);
  const [emailSent, setEmailSent] = useState(!!prospect.sent_at);
  const [sending, setSending] = useState(false);
  const [draft, setDraft] = useState({
    id: prospect.draft_id,
    linkedin_dm: prospect.linkedin_dm,
    edited_dm: prospect.edited_dm,
    email_subject: prospect.email_subject,
    email_body: prospect.email_body,
    edited_email_body: prospect.edited_email_body,
    follow_up_days: prospect.follow_up_days,
    sent_at: prospect.sent_at,
  });

  const updateStatus = async (newStatus) => {
    await fetch(`${API_BASE}/prospects/${prospect.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setStatus(newStatus);
    if (onStatusChange) onStatusChange(prospect.id, newStatus);
  };

  const sendEmail = async () => {
    if (!prospect.email || sending || emailSent) return;
    setSending(true);
    try {
      const res = await fetch(`${API_BASE}/outreach/${draft.id}/send-email`, { method: 'POST' });
      if (res.ok) {
        setEmailSent(true);
        setStatus('contacted');
        if (onStatusChange) onStatusChange(prospect.id, 'contacted');
      }
    } finally {
      setSending(false);
    }
  };

  const cardStyle = {
    ...styles.card,
    ...(status === 'approved' || status === 'contacted' ? styles.cardApproved : {}),
    ...(status === 'rejected' || status === 'not_interested' ? styles.cardRejected : {}),
  };

  return (
    <div style={cardStyle}>
      <div style={styles.header} onClick={() => setExpanded(!expanded)}>
        <div style={styles.headerLeft}>
          <div style={styles.name}>{prospect.name}</div>
          <div style={styles.agencyRole}>
            {[prospect.role, prospect.agency].filter(Boolean).join(' · ')}
          </div>
          <div style={styles.badges}>
            <ScoreBadge score={prospect.qualify_score} />
            <StatusBadge status={status} />
            {prospect.linkedin_url && (
              <a href={prospect.linkedin_url} target="_blank" rel="noreferrer" style={styles.link} onClick={e => e.stopPropagation()}>
                LinkedIn ↗
              </a>
            )}
            {prospect.source_url && (
              <a href={prospect.source_url} target="_blank" rel="noreferrer" style={{ ...styles.link, color: '#666' }} onClick={e => e.stopPropagation()}>
                Source ↗
              </a>
            )}
          </div>
        </div>
        <div style={styles.headerRight}>
          <span style={{ ...styles.chevron, transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
        </div>
      </div>

      {expanded && (
        <div style={styles.body}>
          <div style={styles.grid}>
            <div style={styles.section}>
              <div style={styles.sectionTitle}>Prospect Details</div>
              {prospect.personalisation_hook && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Why them</span>
                  <span style={styles.fieldValue}>{prospect.personalisation_hook}</span>
                </div>
              )}
              {prospect.why_video_now && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Why video now</span>
                  <span style={styles.fieldValue}>{prospect.why_video_now}</span>
                </div>
              )}
              {prospect.email && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Email</span>
                  <span style={styles.fieldValue}>{prospect.email}</span>
                </div>
              )}
              {prospect.qualify_reasoning && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Qualification note</span>
                  <div style={styles.reasoning}>{prospect.qualify_reasoning}</div>
                </div>
              )}
              {prospect.notes && (
                <div style={styles.field}>
                  <span style={styles.fieldLabel}>Notes</span>
                  <span style={styles.fieldValue}>{prospect.notes}</span>
                </div>
              )}
            </div>

            <div style={styles.section}>
              <div style={styles.sectionTitle}>Outreach Drafts</div>
              <DraftEditor draft={draft} onSave={updates => setDraft(prev => ({ ...prev, ...updates }))} />
            </div>
          </div>

          <div style={styles.actions}>
            {status === 'pending_review' && (
              <>
                <button style={{ ...styles.btn, ...styles.approveBtn }} onClick={() => updateStatus('approved')}>
                  ✓ Approve
                </button>
                <button style={{ ...styles.btn, ...styles.rejectBtn }} onClick={() => updateStatus('rejected')}>
                  ✕ Reject
                </button>
              </>
            )}
            {prospect.email && !emailSent && (
              <button
                style={{ ...styles.btn, ...(sending || !draft.id ? styles.sendEmailBtnDisabled : styles.sendEmailBtn) }}
                onClick={sendEmail}
                disabled={sending || !draft.id}
              >
                {sending ? 'Sending...' : 'Send Email'}
              </button>
            )}
            {emailSent && <span style={styles.sent}>✓ Email sent</span>}
            <select
              style={{ ...styles.btn, ...styles.statusChangeBtn, cursor: 'pointer' }}
              value={status}
              onChange={e => updateStatus(e.target.value)}
            >
              {STATUS_FLOW.map(s => (
                <option key={s} value={s} style={{ background: '#111', color: '#F5F5F5' }}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
