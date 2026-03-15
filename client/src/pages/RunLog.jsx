import React, { useEffect, useState } from 'react';

const styles = {
  header: { marginBottom: 28 },
  title: { fontSize: 24, fontWeight: 700, color: '#F5F5F5', marginBottom: 6 },
  subtitle: { fontSize: 13, color: '#555' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  card: { background: '#111', border: '1px solid #1e1e1e', borderRadius: 8, padding: '16px 20px' },
  cardError: { borderColor: '#f8717133' },
  top: { display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 },
  date: { fontSize: 14, fontWeight: 600, color: '#F5F5F5', flex: 1 },
  duration: { fontSize: 12, color: '#555' },
  statsRow: { display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 },
  stat: { display: 'flex', flexDirection: 'column', gap: 2 },
  statNum: { fontSize: 18, fontWeight: 700, color: '#C9A84C' },
  statLabel: { fontSize: 10, color: '#555', textTransform: 'uppercase', letterSpacing: '0.07em' },
  errorBox: { background: '#1f0a0a', border: '1px solid #f8717133', borderRadius: 4, padding: '10px 12px', marginTop: 10 },
  errorTitle: { fontSize: 11, fontWeight: 700, color: '#f87171', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' },
  errorItem: { fontSize: 12, color: '#fca5a5', marginBottom: 4, lineHeight: 1.5 },
  sources: { marginTop: 10, fontSize: 11, color: '#444', lineHeight: 1.7 },
  sourcesToggle: { fontSize: 11, color: '#555', cursor: 'pointer', textDecoration: 'underline', background: 'none', border: 'none', padding: 0 },
  empty: { textAlign: 'center', color: '#444', padding: '60px 0', fontSize: 14 },
  loading: { textAlign: 'center', color: '#444', padding: '60px 0' },
};

function formatDateTime(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('en-AU', {
    weekday: 'short', day: 'numeric', month: 'short',
    hour: '2-digit', minute: '2-digit',
  });
}

function RunCard({ run }) {
  const [showSources, setShowSources] = useState(false);
  const errors = run.errors ? JSON.parse(run.errors) : [];
  const sources = run.sources_swept ? JSON.parse(run.sources_swept) : [];

  return (
    <div style={{ ...styles.card, ...(errors.length > 0 ? styles.cardError : {}) }}>
      <div style={styles.top}>
        <span style={styles.date}>{formatDateTime(run.ran_at)}</span>
        {run.duration_seconds && (
          <span style={styles.duration}>
            {run.duration_seconds >= 60
              ? `${Math.round(run.duration_seconds / 60)}m ${run.duration_seconds % 60}s`
              : `${run.duration_seconds}s`}
          </span>
        )}
        {errors.length > 0 && (
          <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', background: '#1f0a0a', padding: '3px 8px', borderRadius: 4, border: '1px solid #f8717133' }}>
            {errors.length} error{errors.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>
      <div style={styles.statsRow}>
        <div style={styles.stat}>
          <span style={styles.statNum}>{run.prospects_found ?? 0}</span>
          <span style={styles.statLabel}>Found</span>
        </div>
        <div style={styles.stat}>
          <span style={{ ...styles.statNum, color: '#4ade80' }}>{run.prospects_qualified ?? 0}</span>
          <span style={styles.statLabel}>Qualified</span>
        </div>
        {sources.length > 0 && (
          <div style={styles.stat}>
            <span style={{ ...styles.statNum, color: '#7c83f5' }}>{sources.length}</span>
            <span style={styles.statLabel}>Sources swept</span>
          </div>
        )}
      </div>
      {errors.length > 0 && (
        <div style={styles.errorBox}>
          <div style={styles.errorTitle}>Errors</div>
          {errors.map((e, i) => <div key={i} style={styles.errorItem}>· {e}</div>)}
        </div>
      )}
      {sources.length > 0 && (
        <div style={styles.sources}>
          <button style={styles.sourcesToggle} onClick={() => setShowSources(!showSources)}>
            {showSources ? 'Hide sources' : `Show ${sources.length} sources swept`}
          </button>
          {showSources && (
            <div style={{ marginTop: 8, columns: 2, columnGap: 24 }}>
              {sources.map((s, i) => <div key={i}>· {s}</div>)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RunLog() {
  const [runs, setRuns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    fetch('/api/runs').then(r => r.json()).then(({ runs: r }) => { setRuns(r); setLoading(false); });
    fetch('/api/runs/status').then(r => r.json()).then(d => setRunning(d.running));
  }, []);

  const triggerRun = async () => {
    if (running) return;
    const res = await fetch('/api/runs/trigger', { method: 'POST' });
    if (res.ok) {
      setRunning(true);
      setTimeout(() => window.location.reload(), 3000);
    }
  };

  return (
    <div>
      <div style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 6 }}>
          <div style={styles.title}>Run Log</div>
          <button
            onClick={triggerRun}
            disabled={running}
            style={{
              background: running ? '#2a2a2a' : '#C9A84C',
              color: running ? '#555' : '#0D0D0D',
              border: 'none', borderRadius: 4, padding: '8px 16px',
              fontSize: 12, fontWeight: 700,
              cursor: running ? 'not-allowed' : 'pointer',
              letterSpacing: '0.05em', textTransform: 'uppercase',
            }}
          >
            {running ? 'Running...' : 'Trigger Run'}
          </button>
        </div>
        <div style={styles.subtitle}>
          {runs.length} run{runs.length !== 1 ? 's' : ''} recorded — nightly at 2:00am AEST
        </div>
      </div>

      {loading && <div style={styles.loading}>Loading...</div>}
      {!loading && runs.length === 0 && <div style={styles.empty}>No runs yet. Trigger a run manually to get started.</div>}
      {!loading && runs.length > 0 && (
        <div style={styles.list}>
          {runs.map(r => <RunCard key={r.id} run={r} />)}
        </div>
      )}
    </div>
  );
}
