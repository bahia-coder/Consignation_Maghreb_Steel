import React from 'react';

const CONFIG = {
  DEMANDE_EN_COURS:           { label: 'Demande en cours',          bg: '#eff6ff', color: '#1d4ed8', border: '#bfdbfe' },
  DEMANDE_ACCEPTE:            { label: 'Demande acceptée',           bg: '#f0fdf4', color: '#15803d', border: '#bbf7d0' },
  DEMANDE_REJETE:             { label: 'Demande rejetée',            bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  PLAN_EN_COURS:              { label: 'Plan en cours',              bg: '#fffbeb', color: '#b45309', border: '#fde68a' },
  PLAN_EN_ATTENTE_VALIDATION: { label: 'En attente de validation',   bg: '#ecfeff', color: '#0e7490', border: '#a5f3fc' },
  PLAN_VALIDE:                { label: 'Plan validé',                bg: '#f0fdf4', color: '#15803d', border: '#86efac' },
  PLAN_REJETE:                { label: 'Plan rejeté',                bg: '#fff1f2', color: '#be123c', border: '#fecdd3' },
  PLAN_TESTE:                 { label: 'Plan testé',                 bg: '#faf5ff', color: '#7c3aed', border: '#ddd6fe' },
};

export default function StatutBadge({ statut }) {
  const cfg = CONFIG[statut] || { label: statut, bg: '#f3f4f6', color: '#374151', border: '#d1d5db' };
  return (
    <span style={{
      display: 'inline-block',
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.75rem', fontWeight: 600, whiteSpace: 'nowrap',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
    }}>
      {cfg.label}
    </span>
  );
}
