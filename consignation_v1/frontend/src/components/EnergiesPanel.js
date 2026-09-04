import React, { useEffect, useState } from 'react';
import { energieService } from '../services/api';
import EnergiesFormModal from './EnergiesFormModal';
import { useAuth } from '../context/AuthContext';

const TYPE_LABELS = {
  ELECTRIQUE:       { label: 'Électrique',     color: '#1d4ed8', bg: '#dbeafe' },
  HYDRAULIQUE:      { label: 'Hydraulique',     color: '#0369a1', bg: '#e0f2fe' },
  PNEUMATIQUE:      { label: 'Pneumatique',     color: '#0f766e', bg: '#ccfbf1' },
  MECANIQUE:        { label: 'Mécanique',       color: '#7c3aed', bg: '#ede9fe' },
  THERMIQUE:        { label: 'Thermique',       color: '#c2410c', bg: '#ffedd5' },
  CHIMIQUE:         { label: 'Chimique',        color: '#b91c1c', bg: '#fee2e2' },
  GRAVITATIONNELLE: { label: 'Gravitation.',    color: '#374151', bg: '#f3f4f6' },
};

export default function EnergiesPanel({ plan, isParticipant, onEnergiesChange }) {
  const [energies, setEnergies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { canSaisirEnergies } = useAuth();

  // Édition possible dès que la demande est acceptée jusqu'à validation/test
  const canEdit = ['DEMANDE_ACCEPTE', 'PLAN_EN_COURS', 'PLAN_EN_ATTENTE_VALIDATION', 'PLAN_REJETE'].includes(plan.statut)
    && canSaisirEnergies();
  // Réordonner/supprimer uniquement si participant (a déjà saisi des énergies)
  const canReorder = canEdit && isParticipant;

  useEffect(() => {
    energieService.findByPlan(plan.id)
      .then(data => { setEnergies(data); onEnergiesChange(data); })
      .finally(() => setLoading(false));
  }, [plan.id]);

  const rafraichir = (data) => { setEnergies(data); onEnergiesChange(data); };

  const handleMonter    = async (id) => rafraichir(await energieService.monter(id));
  const handleDescendre = async (id) => rafraichir(await energieService.descendre(id));

  const handleSupprimer = async (id) => {
    if (!window.confirm('Supprimer cette énergie ?')) return;
    await energieService.supprimer(id);
    rafraichir(await energieService.findByPlan(plan.id));
  };

  return (
    <div style={s.panel}>
      <div style={s.header}>
        <div>
          <h3 style={s.title}>Énergies dangereuses</h3>
          {energies.length > 0 && (
            <span style={s.countBadge}>{energies.length} ligne{energies.length > 1 ? 's' : ''}</span>
          )}
        </div>
        {canEdit && (
          <button onClick={() => setShowModal(true)} style={s.btnAdd}>+ Ajouter des énergies</button>
        )}
      </div>

      {loading ? (
        <div style={s.empty}>Chargement...</div>
      ) : energies.length === 0 ? (
        <div style={s.empty}>
          {canEdit
            ? 'Cliquez sur "+ Ajouter des énergies" pour configurer ce plan.'
            : 'Aucune énergie définie pour ce plan.'}
        </div>
      ) : (
        <div style={s.list}>
          {energies.map((e, idx) => {
            const t = TYPE_LABELS[e.type] || { label: e.type, color: '#374151', bg: '#f3f4f6' };
            return (
              <div key={e.id} style={s.item}>
                {/* Numéro + type */}
                <div style={s.itemTop}>
                  <div style={s.ordre}>{e.ordre}</div>
                  <span style={{ background: t.bg, color: t.color, ...s.typeBadge }}>{t.label}</span>
                  {e.action && <span style={s.actionChip}>{e.action}</span>}
                  {canReorder && (
                    <div style={s.itemActions}>
                      <button
                        onClick={() => handleMonter(e.id)}
                        disabled={idx === 0}
                        style={{ ...s.arrowBtn, opacity: idx === 0 ? 0.3 : 1 }}
                        title="Monter"
                      >▲</button>
                      <button
                        onClick={() => handleDescendre(e.id)}
                        disabled={idx === energies.length - 1}
                        style={{ ...s.arrowBtn, opacity: idx === energies.length - 1 ? 0.3 : 1 }}
                        title="Descendre"
                      >▼</button>
                      <button
                        onClick={() => handleSupprimer(e.id)}
                        style={s.deleteBtn}
                        title="Supprimer"
                      >✕</button>
                    </div>
                  )}
                </div>

                {/* Détails */}
                <div style={s.itemBody}>
                  {e.equipementOrgane && (
                    <Field icon="⚙" label="Équipement / Organe" value={e.equipementOrgane} />
                  )}
                  {e.repereLocalisation && (
                    <Field icon="📍" label="Repère / Localisation" value={e.repereLocalisation} />
                  )}
                  {e.dispositifDesignation && (
                    <Field icon="🔒" label="Dispositif de cadenassage" value={e.dispositifDesignation} highlight />
                  )}
                  {e.pointValeurVAE && (
                    <Field icon="✔" label="Point / VAE" value={e.pointValeurVAE} />
                  )}
                  {e.saisieParNom && (
                    <div style={s.saisieParBadge}>
                      <span>👤</span>
                      <span>Saisi par <strong>{e.saisieParNom}</strong></span>
                      {e.saisieParMatricule && (
                        <span style={s.saisieParMat}>{e.saisieParMatricule}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <EnergiesFormModal
          plan={plan}
          planId={plan.id}
          energies={energies}
          onClose={() => setShowModal(false)}
          onSaved={rafraichir}
        />
      )}
    </div>
  );
}

function Field({ icon, label, value, highlight }) {
  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start', marginBottom: 4 }}>
      <span style={{ fontSize: '0.75rem', flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
          {label} :{' '}
        </span>
        <span style={{
          fontSize: '0.82rem',
          color: highlight ? '#5b21b6' : '#374151',
          fontWeight: highlight ? 600 : 400,
        }}>
          {value}
        </span>
      </div>
    </div>
  );
}

const s = {
  panel: { background: 'var(--white)', borderRadius: 'var(--radius-lg)', padding: 20, boxShadow: 'var(--shadow)' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  title: { fontSize: '0.95rem', fontWeight: 700, color: 'var(--primary)', margin: 0 },
  countBadge: {
    display: 'inline-block', marginTop: 4,
    background: '#dbeafe', color: '#1d4ed8', borderRadius: 12,
    padding: '1px 9px', fontSize: '0.73rem', fontWeight: 600,
  },
  btnAdd: {
    background: 'var(--primary)', color: '#fff',
    padding: '7px 14px', fontSize: '0.82rem', fontWeight: 600,
    borderRadius: 6, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
  },
  empty: { padding: '24px 0', color: 'var(--grey-600)', textAlign: 'center', fontSize: '0.85rem', fontStyle: 'italic' },
  list: { display: 'flex', flexDirection: 'column', gap: 10 },
  item: {
    background: 'var(--grey-100)', borderRadius: 'var(--radius)',
    border: '1px solid var(--grey-200)', overflow: 'hidden',
  },
  itemTop: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '8px 12px', background: '#eef2f7',
    borderBottom: '1px solid var(--grey-200)',
  },
  ordre: {
    width: 24, height: 24, background: 'var(--primary)', color: '#fff',
    borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
  },
  typeBadge: {
    borderRadius: 4, padding: '2px 8px', fontSize: '0.72rem', fontWeight: 700,
  },
  actionChip: {
    background: '#fff', border: '1px solid #cbd5e1', borderRadius: 4,
    padding: '2px 8px', fontSize: '0.72rem', color: '#475569', fontWeight: 600,
  },
  itemActions: { display: 'flex', gap: 4, marginLeft: 'auto' },
  arrowBtn: {
    background: 'var(--grey-200)', color: '#374151', border: 'none',
    borderRadius: 4, width: 28, height: 28, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', padding: 0,
  },
  deleteBtn: {
    background: '#fee2e2', color: '#991b1b', border: 'none',
    borderRadius: 4, width: 28, height: 28, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', padding: 0,
  },
  itemBody: { padding: '10px 12px' },
  saisieParBadge: {
    display: 'flex', alignItems: 'center', gap: 5,
    marginTop: 6, fontSize: '0.72rem', color: '#6b7280',
  },
  saisieParMat: {
    background: '#e5e7eb', color: '#374151',
    padding: '1px 6px', borderRadius: 4,
    fontFamily: 'monospace', fontSize: '0.7rem',
  },
};
