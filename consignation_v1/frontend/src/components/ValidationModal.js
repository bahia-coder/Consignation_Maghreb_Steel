import React, { useState, useRef } from 'react';
import { planService } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ROLE_FONCTIONS = {
  ADMIN: 'Administrateur',
  MANAGER: 'Manager de Zone',
  CHARGE: 'Chargé de Consignation',
};

export default function ValidationModal({ plan, onClose, onValidated }) {
  const { user } = useAuth();
  const [decision, setDecision] = useState('VALIDE');
  const [commentaire, setCommentaire] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [signed, setSigned] = useState(false);
  const canvasRef = useRef(null);
  const [drawing, setDrawing] = useState(false);

  const startDraw = (e) => {
    setDrawing(true);
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!drawing) return;
    const ctx = canvasRef.current.getContext('2d');
    const rect = canvasRef.current.getBoundingClientRect();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#1e3a5f';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setSigned(true);
  };

  const stopDraw = () => setDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigned(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!signed) {
      setError('Veuillez apposer votre signature.');
      return;
    }
    if (decision === 'REJETE' && !commentaire.trim()) {
      setError('Un commentaire est obligatoire en cas de rejet.');
      return;
    }

    const donneesSignature = canvasRef.current.toDataURL();
    setLoading(true);
    setError(null);

    try {
      const updated = await planService.valider(plan.id, {
        decision,
        commentaire,
        donneesSignature,
      });
      onValidated(updated);
    } catch (err) {
      setError('Erreur lors de la validation.');
    } finally {
      setLoading(false);
    }
  };

  const signataire = user ? `${user.prenom} ${user.nom}` : '—';
  const fonction = ROLE_FONCTIONS[user?.role] || user?.role || '—';

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={e => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>Validation du plan</h2>
          <button onClick={onClose} style={styles.close}>✕</button>
        </div>

        <div style={styles.planInfo}>
          <span style={styles.planRef}>{plan.reference}</span>
          <span style={styles.planEq}>{plan.equipementCode}</span>
        </div>

        {/* Infos signataire auto-remplies */}
        <div style={styles.signataireBanner}>
          <div style={styles.signataireRow}>
            <div>
              <div style={styles.signataireLabel}>Signataire</div>
              <div style={styles.signataireValue}>{signataire}</div>
              {user?.matricule && (
                <div style={styles.signataireMat}>{user.matricule}</div>
              )}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={styles.signataireLabel}>Fonction</div>
              <div style={styles.signataireValue}>{fonction}</div>
            </div>
          </div>
          <div style={styles.signataireNote}>
            Ces informations sont récupérées automatiquement depuis votre compte
          </div>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {/* Décision */}
          <div style={styles.decisionRow}>
            <button
              type="button"
              onClick={() => setDecision('VALIDE')}
              style={{ ...styles.decisionBtn, ...(decision === 'VALIDE' ? styles.decisionValide : {}) }}
            >
              ✅ Valider
            </button>
            <button
              type="button"
              onClick={() => setDecision('REJETE')}
              style={{ ...styles.decisionBtn, ...(decision === 'REJETE' ? styles.decisionRejete : {}) }}
            >
              ❌ Rejeter
            </button>
          </div>

          {/* Commentaire */}
          <div style={styles.field}>
            <label>
              Commentaire {decision === 'REJETE' ? <span style={{ color: '#991b1b' }}>* (obligatoire)</span> : '(facultatif)'}
            </label>
            <textarea
              rows={3}
              value={commentaire}
              onChange={e => setCommentaire(e.target.value)}
              placeholder={decision === 'REJETE' ? 'Justifiez le rejet...' : 'Remarques complémentaires...'}
            />
          </div>

          {/* Zone de signature */}
          <div style={styles.field}>
            <label>Signature numérique *</label>
            <div style={styles.canvasWrapper}>
              <canvas
                ref={canvasRef}
                width={440}
                height={120}
                style={styles.canvas}
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
              />
              {!signed && (
                <div style={styles.canvasPlaceholder}>Signez ici</div>
              )}
            </div>
            <button type="button" onClick={clearCanvas} style={styles.btnClear}>
              Effacer la signature
            </button>
          </div>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.btnCancel}>Annuler</button>
            <button
              type="submit"
              disabled={loading}
              style={{ ...styles.btnSubmit, background: decision === 'VALIDE' ? 'var(--success)' : '#991b1b' }}
            >
              {loading ? 'Traitement...' : decision === 'VALIDE' ? '✅ Confirmer la validation' : '❌ Confirmer le rejet'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 },
  modal: { background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 24, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxShadow: 'var(--shadow-md)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  title: { fontSize: '1.1rem', fontWeight: 700, color: 'var(--primary)' },
  close: { background: 'none', fontSize: '1.1rem', color: 'var(--grey-600)', padding: '2px 6px' },
  planInfo: { display: 'flex', gap: 10, alignItems: 'center', background: 'var(--grey-100)', borderRadius: 'var(--radius)', padding: '8px 12px', marginBottom: 16 },
  planRef: { fontFamily: 'monospace', fontWeight: 700, color: 'var(--primary)', fontSize: '0.9rem' },
  planEq: { color: 'var(--grey-600)', fontSize: '0.85rem' },
  signataireBanner: {
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: 8, padding: '12px 14px', marginBottom: 16,
  },
  signataireRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 },
  signataireLabel: { fontSize: '0.7rem', fontWeight: 700, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 },
  signataireValue: { fontSize: '0.9rem', fontWeight: 700, color: '#1e3a5f' },
  signataireMat: { fontSize: '0.72rem', color: '#1d4ed8', fontFamily: 'monospace', marginTop: 2 },
  signataireNote: { fontSize: '0.72rem', color: '#6b7280', marginTop: 8, fontStyle: 'italic' },
  form: { display: 'flex', flexDirection: 'column', gap: 14 },
  decisionRow: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  decisionBtn: { padding: '12px', borderRadius: 'var(--radius)', border: '2px solid var(--grey-200)', background: 'var(--grey-100)', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' },
  decisionValide: { border: '2px solid #166534', background: '#dcfce7', color: '#166534' },
  decisionRejete: { border: '2px solid #991b1b', background: '#fee2e2', color: '#991b1b' },
  field: { display: 'flex', flexDirection: 'column', gap: 4 },
  canvasWrapper: { position: 'relative', border: '1.5px solid var(--grey-300)', borderRadius: 'var(--radius)', overflow: 'hidden', background: 'var(--white)' },
  canvas: { display: 'block', cursor: 'crosshair', width: '100%' },
  canvasPlaceholder: { position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--grey-300)', fontSize: '1rem', pointerEvents: 'none', fontStyle: 'italic' },
  btnClear: { background: 'none', border: '1px solid var(--grey-300)', color: 'var(--grey-600)', padding: '4px 10px', fontSize: '0.78rem', alignSelf: 'flex-start', borderRadius: 4, cursor: 'pointer', marginTop: 4 },
  error: { background: '#fee2e2', color: '#991b1b', padding: '8px 12px', borderRadius: 6, fontSize: '0.85rem' },
  actions: { display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 },
  btnCancel: { background: 'var(--grey-200)', color: '#374151', padding: '9px 18px' },
  btnSubmit: { color: 'var(--white)', padding: '9px 18px', fontWeight: 600 },
};
