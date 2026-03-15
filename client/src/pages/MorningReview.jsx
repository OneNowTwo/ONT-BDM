import React, { useEffect, useState } from 'react';
import ProspectCard from '../components/ProspectCard';

const styles = {
  header: { marginBottom: 32 },
  title: { fontSize: 24, fontWeight: 700, color: '#F5F5F5', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#555' },
  statsRow: { display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' },
  stat: {
    background: '#111',
    border: '1px solid #1e1e1e',
    borderRadius: 6,
    padding: '10px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
  },
  statNum: { fontSize: 20, fontWeight: 700, color: '#F5F5F5' },
  statLabel: { fontSize: 11, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em' },
  empty: { textAlign: 'center', color: '#444', padding: '80px 0', fontSize: 14 },
  emptyTitle: { fontSize: 18, color: '#333', marginBottom: 8 },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  loading: { textAlign: 'center', color: '#444', padding: '60px 0' },
};

export default function MorningReview() {
  const [prospects, setProspects] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [pRes, sRes] = await Promise.all([
      fetch('/api/prospects/pending'),
      fetch('/api/prospects/stats'),
    ]);
    const { prospects: p } = await pRes.json();
    const s = await sRes.json();
    setProspects(p);
    setStats(s);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleStatusChange = (id, newStatus) => {
    setProspects(prev => prev.filter(p => {
      if (p.id !== id) return true;
      return newStatus === 'pending_review';
    }));
    setStats(prev => ({
      ...prev,
      pending_review: Math.max(0, (prev.pending_review || 0) - 1),
      [newStatus]: (prev[newStatus] || 0) + 1,
    }));
  };

  const today = new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.title}>Morning Review</div>
        <div style={styles.subtitle}>{today} — {prospects.length} prospect{prospects.length !== 1 ? 's' : ''} awaiting review</div>
        <div style={styles.statsRow}>
          {[
            { key: 'pending_review', label: 'Pending', color: '#7c83f5' },
            { key: 'approved', label: 'Approved', color: '#4ade80' },
            { key: 'contacted', label: 'Contacted', color: '#C9A84C' },
            { key: 'replied', label: 'Replied', color: '#38bdf8' },
            { key: 'won', label: 'Won', color: '#86efac' },
          ].map(s => (
            <div key={s.key} style={styles.stat}>
              <span style={{ ...styles.statNum, color: s.color }}>{stats[s.key] || 0}</span>
              <span style={styles.statLabel}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {loading && <div style={styles.loading}>Loading prospects...</div>}

      {!loading && prospects.length === 0 && (
        <div style={styles.empty}>
          <div style={styles.emptyTitle}>No prospects pending review</div>
          <div>The nightly agent will surface new prospects at 2am. Or trigger a run manually from the nav.</div>
        </div>
      )}

      {!loading && prospects.length > 0 && (
        <div style={styles.list}>
          {prospects.map(p => (
            <ProspectCard key={p.id} prospect={p} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
