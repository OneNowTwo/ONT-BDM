import React, { useEffect, useState } from 'react';

const styles = {
  header: { marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, color: '#F5F5F5', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#555' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 8,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  cardOverdue: { borderColor: '#f8717133' },
  info: { flex: 1 },
  name: { fontSize: 14, fontWeight: 700, color: '#F5F5F5', marginBottom: 2 },
  meta: { fontSize: 12, color: '#666' },
  draft: { fontSize: 12, color: '#aaa', marginTop: 6, lineHeight: 1.5 },
  dueDate: { fontSize: 11, fontWeight: 600, color: '#C9A84C', marginTop: 4 },
  dueDateOverdue: { color: '#f87171' },
  actions: { display: 'flex', gap: 8 },
  btn: { fontSize: 12, fontWeight: 600, padding: '7px 12px', borderRadius: 4, border: 'none', cursor: 'pointer' },
  sentBtn: { background: '#4ade8022', color: '#4ade80', border: '1px solid #4ade8033' },
  skipBtn: { background: '#1e1e1e', color: '#666', border: '1px solid #2a2a2a' },
  empty: { textAlign: 'center', color: '#444', padding: '60px 0', fontSize: 14 },
  emptyTitle: { fontSize: 18, color: '#333', marginBottom: 8 },
  loading: { textAlign: 'center', color: '#444', padding: '60px 0' },
  toggle: { display: 'flex', gap: 8, marginTop: 16 },
  toggleBtn: { fontSize: 12, padding: '6px 12px', borderRadius: 4, border: '1px solid #2a2a2a', background: '#111', color: '#666', cursor: 'pointer' },
  toggleBtnActive: { color: '#F5F5F5', borderColor: '#C9A84C' },
};

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
}

function isOverdue(iso) {
  return iso && new Date(iso) < new Date();
}

export default function FollowUps() {
  const [followups, setFollowups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  const load = async () => {
    setLoading(true);
    const url = showAll ? '/api/followups?all=1' : '/api/followups';
    const res = await fetch(url);
    const { followups: f } = await res.json();
    setFollowups(f);
    setLoading(false);
  };

  useEffect(() => { load(); }, [showAll]);

  const updateStatus = async (id, status) => {
    await fetch(`/api/followups/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    setFollowups(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.title}>Follow-Ups</div>
        <div style={styles.subtitle}>Due follow-ups from contacts made</div>
        <div style={styles.toggle}>
          <button
            style={{ ...styles.toggleBtn, ...(!showAll ? styles.toggleBtnActive : {}) }}
            onClick={() => setShowAll(false)}
          >
            Due / Overdue
          </button>
          <button
            style={{ ...styles.toggleBtn, ...(showAll ? styles.toggleBtnActive : {}) }}
            onClick={() => setShowAll(true)}
          >
            All Follow-Ups
          </button>
        </div>
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && followups.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyTitle}>No follow-ups due</div>
          <div>Follow-ups are created automatically when you send outreach.</div>
        </div>
      )}

      {!loading && followups.length > 0 && (
        <div style={styles.list}>
          {followups.map(f => {
            const overdue = isOverdue(f.due_date);
            return (
              <div key={f.id} style={{ ...styles.card, ...(overdue ? styles.cardOverdue : {}) }}>
                <div style={styles.info}>
                  <div style={styles.name}>{f.name}</div>
                  <div style={styles.meta}>{[f.role, f.agency].filter(Boolean).join(' · ')}</div>
                  {f.message_draft && <div style={styles.draft}>{f.message_draft}</div>}
                  <div style={{ ...styles.dueDate, ...(overdue ? styles.dueDateOverdue : {}) }}>
                    {overdue ? '⚠ Overdue — ' : 'Due '}{formatDate(f.due_date)}
                  </div>
                </div>
                <div style={styles.actions}>
                  {f.linkedin_url && (
                    <a
                      href={f.linkedin_url}
                      target="_blank"
                      rel="noreferrer"
                      style={{ ...styles.btn, background: '#1a1a2e', color: '#7c83f5', border: '1px solid #7c83f533', textDecoration: 'none', fontSize: 12, padding: '7px 12px', borderRadius: 4, fontWeight: 600 }}
                    >
                      LinkedIn ↗
                    </a>
                  )}
                  <button style={{ ...styles.btn, ...styles.sentBtn }} onClick={() => updateStatus(f.id, 'sent')}>
                    ✓ Sent
                  </button>
                  <button style={{ ...styles.btn, ...styles.skipBtn }} onClick={() => updateStatus(f.id, 'skipped')}>
                    Skip
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
