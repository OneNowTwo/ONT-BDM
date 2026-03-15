import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { API_BASE } from '../config';

const NAV = [
  { to: '/review', label: 'Morning Review' },
  { to: '/pipeline', label: 'Pipeline' },
  { to: '/followups', label: 'Follow-Ups' },
  { to: '/runs', label: 'Run Log' },
];

const styles = {
  nav: {
    borderBottom: '1px solid #222',
    padding: '0 24px',
    display: 'flex',
    alignItems: 'center',
    gap: 0,
    background: '#0D0D0D',
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  brand: {
    color: '#C9A84C',
    fontWeight: 700,
    fontSize: 15,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    marginRight: 32,
    textDecoration: 'none',
    padding: '18px 0',
    whiteSpace: 'nowrap',
  },
  links: { display: 'flex', flex: 1, gap: 0 },
  link: {
    color: '#777',
    textDecoration: 'none',
    fontSize: 13,
    fontWeight: 500,
    padding: '18px 16px',
    borderBottom: '2px solid transparent',
    transition: 'color 0.15s',
  },
  activeLink: { color: '#F5F5F5', borderBottom: '2px solid #C9A84C' },
  runBtn: {
    background: '#C9A84C',
    color: '#0D0D0D',
    border: 'none',
    borderRadius: 4,
    padding: '8px 16px',
    fontSize: 12,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '0.05em',
    textTransform: 'uppercase',
    transition: 'opacity 0.15s',
  },
  runBtnRunning: { opacity: 0.6, cursor: 'not-allowed' },
  statusDot: {
    display: 'inline-block',
    width: 7,
    height: 7,
    borderRadius: '50%',
    marginRight: 6,
  },
};

export default function Navbar() {
  const [running, setRunning] = useState(false);

  useEffect(() => {
    const check = () =>
      fetch(`${API_BASE}/runs/status`)
        .then(r => r.json())
        .then(d => setRunning(d.running))
        .catch(() => {});
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  const triggerRun = async () => {
    if (running) return;
    try {
      const res = await fetch(`${API_BASE}/runs/trigger`, { method: 'POST' });
      if (res.ok) setRunning(true);
    } catch {}
  };

  return (
    <nav style={styles.nav}>
      <span style={styles.brand}>One Now Two</span>
      <div style={styles.links}>
        {NAV.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            style={({ isActive }) =>
              isActive ? { ...styles.link, ...styles.activeLink } : styles.link
            }
          >
            {n.label}
          </NavLink>
        ))}
      </div>
      <button
        style={running ? { ...styles.runBtn, ...styles.runBtnRunning } : styles.runBtn}
        onClick={triggerRun}
        disabled={running}
        title={running ? 'Agent is running' : 'Trigger nightly research run now'}
      >
        <span style={{ ...styles.statusDot, background: running ? '#f59e0b' : '#22c55e' }} />
        {running ? 'Running...' : 'Run Now'}
      </button>
    </nav>
  );
}
