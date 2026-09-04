import React, { useState } from 'react';
import { planService } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function DemandePlanModal({ equipement, onClose, onCreated }) {
  const { user } = useAuth();
  const [form, setForm] = useState({ descriptionIntervention: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.descriptionIntervention.trim()) {
      setError('La description est obligatoire.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const plan = await planService.creerDemande({ ...form, equipementId: equipement.id });
      onCreated(plan);
    } catch {
      setError('Erreur lors de la création de la demande.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Demande de plan de consignation</h2>
          <button onClick={onClose} style={styles.close}>✕</button>
        </div>
        <div style={styles.eqInfo}>
          <span style={styles.eqCode}>{equipement.code}</span>
          <span style={styles.eqDesc}>{equipement.description}</span>
        </div>

        {/* Demandeur auto-rempli */}
        <div style={styles.demandeurBox}>
          <div style={styles.demandeurLabel}>Demandeur</div>
          <div style={styles.demandeurValue}>
            <span style={styles.demandeurName}>{user?.prenom} {user?.nom}</span>
            <span style={styles.demandeurMat}>{user?.matricule}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label>Description de l'intervention *</label>
            <textarea
              rows={3}
              value={form.descriptionIntervention}
              onChange={e => setForm(f => ({ ...f, descriptionIntervention: e.target.value }))}
              placeholder="Décrivez l'intervention de maintenance..."
            />
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Annuler</button>
            <button type="submit" disabled={loading} style={styles.btnSubmit}>
              {loading ? 'Envoi...' : 'Créer la demande'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-md)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' },
  close: { background: 'none', fontSize: '1.1rem', color: 'var(--grey-600)', padding: '2px 6px' },
  eqInfo: { display: 'flex', gap: 8, alignItems: 'center', background: 'var(--grey-100)', borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: 16 },
  eqCode: { fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' },
  eqDesc: { color: 'var(--grey-600)', fontSize: '0.85rem' },
  demandeurBox: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    background: '#f0fdf4', border: '1px solid #bbf7d0',
    borderRadius: 8, padding: '10px 14px', marginBottom: 16,
  },
  demandeurLabel: { fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.04em' },
  demandeurValue: { display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 },
  demandeurName: { fontWeight: 700, color: '#166534', fontSize: '0.875rem' },
  demandeurMat: { fontSize: '0.72rem', color: '#4ade80', fontFamily: 'monospace', background: '#166534', padding: '1px 6px', borderRadius: 4, color: '#fff' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  error: { background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, fontSize: '0.85rem' },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  btnCancel: { background: 'var(--grey-200)', color: '#374151', padding: '9px 18px' },
  btnSubmit: { background: 'var(--primary)', color: 'var(--white)', padding: '9px 18px', fontWeight: 600 },
};
