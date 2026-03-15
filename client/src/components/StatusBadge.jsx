import React from 'react';

const STATUS_STYLES = {
  pending_review: { bg: '#1a1a2e', color: '#7c83f5', label: 'Pending Review' },
  approved:       { bg: '#0f1f0f', color: '#4ade80', label: 'Approved' },
  rejected:       { bg: '#1f0f0f', color: '#f87171', label: 'Rejected' },
  contacted:      { bg: '#1a1200', color: '#C9A84C', label: 'Contacted' },
  replied:        { bg: '#0f1a1f', color: '#38bdf8', label: 'Replied' },
  won:            { bg: '#0a1f0a', color: '#86efac', label: 'Won' },
  lost:           { bg: '#1f0a0a', color: '#fca5a5', label: 'Lost' },
  not_interested: { bg: '#141414', color: '#666', label: 'Not Interested' },
};

const SCORE_COLORS = {
  high: '#4ade80',
  mid: '#C9A84C',
  low: '#f87171',
};

export function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || { bg: '#1a1a1a', color: '#888', label: status };
  return (
    <span style={{
      background: s.bg,
      color: s.color,
      fontSize: 11,
      fontWeight: 600,
      padding: '3px 8px',
      borderRadius: 4,
      letterSpacing: '0.05em',
      textTransform: 'uppercase',
      border: `1px solid ${s.color}22`,
    }}>
      {s.label}
    </span>
  );
}

export function ScoreBadge({ score }) {
  const color = score >= 9 ? SCORE_COLORS.high : score >= 7 ? SCORE_COLORS.mid : SCORE_COLORS.low;
  return (
    <span style={{
      color,
      background: `${color}18`,
      border: `1px solid ${color}44`,
      fontSize: 12,
      fontWeight: 700,
      padding: '3px 9px',
      borderRadius: 4,
    }}>
      {score}/10
    </span>
  );
}
