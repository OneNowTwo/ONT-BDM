import React, { useEffect, useState } from 'react';
import ProspectCard from '../components/ProspectCard';

const STATUSES = [
  'pending_review', 'approved', 'contacted', 'replied', 'won', 'lost', 'not_interested', 'rejected',
];

const styles = {
  header: { marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, color: '#F5F5F5', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#555' },
  controls: { display: 'flex', gap: 8, marginTop: 20, flexWrap: 'wrap' },
  filterBtn: {
    fontSize: 12,
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 4,
    border: '1px solid #2a2a2a',
    background: '#111',
    color: '#666',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  filterBtnActive: { background: '#1a1a1a', color: '#F5F5F5', borderColor: '#C9A84C' },
  list: { display: 'flex', flexDirection: 'column', gap: 12 },
  empty: { textAlign: 'center', color: '#444', padding: '60px 0', fontSize: 13 },
  loading: { textAlign: 'center', color: '#444', padding: '60px 0' },
  total: { fontSize: 12, color: '#555', marginTop: 8 },
};

export default function Pipeline() {
  const [prospects, setProspects] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  const load = async () => {
    setLoading(true);
    const url = filter === 'all' ? '/api/prospects?limit=100' : `/api/prospects?status=${filter}&limit=100`;
    const res = await fetch(url);
    const { prospects: p, total: t } = await res.json();
    setProspects(p);
    setTotal(t);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <div>
      <div style={styles.header}>
        <div style={styles.title}>Pipeline</div>
        <div style={styles.subtitle}>Full CRM view — all prospects</div>
        <div style={styles.controls}>
          <button
            style={{ ...styles.filterBtn, ...(filter === 'all' ? styles.filterBtnActive : {}) }}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          {STATUSES.map(s => (
            <button
              key={s}
              style={{ ...styles.filterBtn, ...(filter === s ? styles.filterBtnActive : {}) }}
              onClick={() => setFilter(s)}
            >
              {s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
        <div style={styles.total}>{total} prospect{total !== 1 ? 's' : ''} total</div>
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}

      {!loading && prospects.length === 0 && (
        <div style={styles.empty}>No prospects found for this filter.</div>
      )}

      {!loading && prospects.length > 0 && (
        <div style={styles.list}>
          {prospects.map(p => (
            <ProspectCard key={p.id} prospect={p} onStatusChange={() => load()} />
          ))}
        </div>
      )}
    </div>
  );
}
