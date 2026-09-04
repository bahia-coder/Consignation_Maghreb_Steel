import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { planService, historiqueService, approbationService } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import StatutBadge from '../components/StatutBadge';
import EnergiesPanel from '../components/EnergiesPanel';
import ValidationModal from '../components/ValidationModal';
import { useAuth } from '../context/AuthContext';

const ACTION_CONFIG = {
  DEMANDE_CREEE:    { label: 'Demande créée',              color: '#2563eb' },
  DEMANDE_ACCEPTEE: { label: 'Demande acceptée',            color: '#059669' },
  DEMANDE_REJETEE:  { label: 'Demande rejetée',             color: '#e11d48' },
  PLAN_EN_COURS:    { label: 'Plan en cours',               color: '#d97706' },
  ENERGIE_AJOUTEE:  { label: 'Énergie(s) ajoutée(s)',       color: '#059669' },
  ENERGIE_MODIFIEE: { label: 'Énergie modifiée',            color: '#7c3aed' },
  ENERGIE_SUPPRIMEE:{ label: 'Énergie supprimée',           color: '#e11d48' },
  ORDRE_MODIFIE:    { label: 'Ordre des énergies modifié',  color: '#0891b2' },
  SOUMIS_VALIDATION:{ label: 'Soumis pour validation',      color: '#d97706' },
  PLAN_VALIDE:      { label: 'Plan validé',                  color: '#059669' },
  PLAN_REJETE:      { label: 'Plan rejeté',                  color: '#e11d48' },
  PLAN_TESTE:       { label: 'Plan testé',                   color: '#7c3aed' },
};

export default function PlanDetailPage() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { user, canValidate, canSaisirEnergies, isChargeTravaux, isManager, isAdmin } = useAuth();
  const [plan, setPlan]                       = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [showValidation, setShowValidation]   = useState(false);
  const [actionLoading, setActionLoading]     = useState(false);
  const [pdfLoading, setPdfLoading]           = useState(false);
  const [showHistorique, setShowHistorique]   = useState(false);
  const [historique, setHistorique]           = useState([]);
  const [histLoading, setHistLoading]         = useState(false);
  const [approbations, setApprobations]       = useState([]);
  const [approuvLoading, setApprouveLoading]  = useState(false);
  const [showRejetModal, setShowRejetModal]   = useState(false);
  const [rejetCommentaire, setRejetCommentaire] = useState('');

  useEffect(() => {
    planService.findById(planId).then(setPlan).finally(() => setLoading(false));
    approbationService.findByPlan(planId).then(setApprobations);
  }, [planId]);

  const rafraichirApprobations = () => approbationService.findByPlan(planId).then(setApprobations);

  const handleApprouverOrdre = async () => {
    setApprouveLoading(true);
    try {
      const updated = await approbationService.approuver(planId);
      setApprobations(prev => prev.map(a => a.id === updated.id ? updated : a));
    } finally { setApprouveLoading(false); }
  };

  const ouvrirHistorique = async () => {
    setShowHistorique(true);
    setHistLoading(true);
    try { setHistorique(await historiqueService.findByPlan(planId)); }
    finally { setHistLoading(false); }
  };

  const accepterDemande = async () => {
    setActionLoading(true);
    try { const u = await planService.accepterDemande(planId); setPlan(p => ({ ...p, ...u })); }
    finally { setActionLoading(false); }
  };

  const confirmerRejetDemande = async () => {
    if (!rejetCommentaire.trim()) return;
    setActionLoading(true);
    try {
      const u = await planService.rejeterDemande(planId, rejetCommentaire);
      setPlan(p => ({ ...p, ...u }));
      setShowRejetModal(false);
      setRejetCommentaire('');
    } finally { setActionLoading(false); }
  };

  const soumettreValidation = async () => {
    setActionLoading(true);
    try { const u = await planService.soumettreValidation(planId); setPlan(p => ({ ...p, ...u })); }
    finally { setActionLoading(false); }
  };

  const testerPlan = async () => {
    setActionLoading(true);
    try { const u = await planService.testerPlan(planId); setPlan(p => ({ ...p, ...u })); }
    finally { setActionLoading(false); }
  };

  const handleTelechargerPdf = async () => {
    setPdfLoading(true);
    try { await planService.telechargerPdf(planId, plan.reference); }
    catch { alert('Erreur lors de la génération du PDF.'); }
    finally { setPdfLoading(false); }
  };

  const handleValidation = async (planMisAJour) => {
    setPlan(planMisAJour);
    setShowValidation(false);
    if (showHistorique) setHistorique(await historiqueService.findByPlan(planId));
  };

  if (loading || !plan) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
      <div style={{ width: 32, height: 32, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  const canAccepter   = plan.statut === 'DEMANDE_EN_COURS' && (isManager() || isAdmin());
  const canRejeter    = plan.statut === 'DEMANDE_EN_COURS' && (isManager() || isAdmin());
  const canValider    = plan.statut === 'PLAN_EN_ATTENTE_VALIDATION' && canValidate();
  const canTester     = plan.statut === 'PLAN_VALIDE' && (canSaisirEnergies() || isAdmin());
  const isParticipant = approbations.some(a => a.utilisateurId === user?.userId);
  const allApproved   = approbations.length === 0 || approbations.every(a => a.approuve);
  const myApproval    = approbations.find(a => a.utilisateurId === user?.userId);
  const needsMyApproval = isParticipant && myApproval && !myApproval.approuve;
  const showSoumettre = plan.statut === 'PLAN_EN_COURS' && !isChargeTravaux() &&
    ((approbations.length === 0 && canSaisirEnergies()) || isParticipant);
  const canSoumettre  = showSoumettre && allApproved;

  const isValide = plan.statut === 'PLAN_VALIDE' || plan.statut === 'PLAN_TESTE';

  return (
    <div>
      <Breadcrumb items={[
        { label: 'Zones', path: '/' },
        { label: plan.equipementCode, path: `/equipement/${plan.equipementId}` },
        { label: plan.reference },
      ]} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>

        {/* ── Colonne gauche ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, overflow: 'hidden', boxShadow: '0 1px 3px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06)' }}>
            <div style={{ padding: '16px 22px', borderBottom: '1px solid var(--border)', background: 'var(--bg-cream)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1rem', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{plan.reference}</div>
                <div style={{ fontSize: 12.5, color: 'var(--text-sub)' }}>{plan.equipementCode} — {plan.equipementDescription}</div>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <StatutBadge statut={plan.statut} />
                <button onClick={ouvrirHistorique} style={btnStyle('#0f172a', '#fff')}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  Historique &amp; PDF
                </button>
              </div>
            </div>

            <div style={{ padding: '20px 22px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px', marginBottom: 16 }}>
                <InfoField label="Description" value={plan.descriptionIntervention} />
                <InfoField label="Demandeur" value={plan.demandeurNom || '—'} />
                <InfoField label="Date de création" value={new Date(plan.dateCreation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
                {plan.dateValidation && (
                  <InfoField label="Date de validation" value={new Date(plan.dateValidation).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })} />
                )}
              </div>

              {/* Approbations */}
              {plan.statut === 'PLAN_EN_COURS' && approbations.length > 0 && (
                <div style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.18)', borderRadius: 10, padding: '12px 14px', marginBottom: 16 }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    ✅ Approbation de l'ordre des énergies
                    {allApproved
                      ? <span style={{ background: 'rgba(5,150,105,0.1)', color: '#059669', border: '1px solid rgba(5,150,105,0.22)', borderRadius: 20, padding: '2px 9px', fontSize: '0.72rem' }}>Tous approuvés</span>
                      : <span style={{ background: '#fffbeb', color: '#d97706', border: '1px solid rgba(217,119,6,0.22)', borderRadius: 20, padding: '2px 9px', fontSize: '0.72rem' }}>En attente</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
                    {approbations.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#fff', borderRadius: 8, padding: '7px 12px', border: '1px solid rgba(5,150,105,0.12)', fontSize: '0.82rem' }}>
                        <span>{a.approuve ? '✅' : '⏳'}</span>
                        <span style={{ fontWeight: 600, color: 'var(--text)', flex: 1 }}>{a.utilisateurNom}</span>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', background: 'var(--bg-cream)', color: 'var(--text-sub)', padding: '1px 6px', borderRadius: 4 }}>{a.utilisateurMatricule}</span>
                        {a.approuve
                          ? <span style={{ fontSize: '0.72rem', color: '#059669', fontWeight: 600 }}>{new Date(a.dateApprobation).toLocaleDateString('fr-FR')}</span>
                          : <span style={{ fontSize: '0.72rem', color: '#d97706', fontStyle: 'italic' }}>En attente</span>}
                      </div>
                    ))}
                  </div>
                  {needsMyApproval && (
                    <button onClick={handleApprouverOrdre} disabled={approuvLoading}
                      style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 16px', fontWeight: 600, fontSize: '0.82rem', cursor: 'pointer' }}>
                      {approuvLoading ? '…' : '✓ Approuver cet ordre'}
                    </button>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid var(--border)', flexWrap: 'wrap' }}>
                {canAccepter && (
                  <button onClick={accepterDemande} disabled={actionLoading}
                    style={{ padding: '9px 18px', borderRadius: 9, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(5,150,105,0.25)' }}>
                    {actionLoading ? '…' : '✅ Accepter la demande'}
                  </button>
                )}
                {canRejeter && (
                  <button onClick={() => setShowRejetModal(true)} disabled={actionLoading}
                    style={{ padding: '9px 18px', borderRadius: 9, background: '#e11d48', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem' }}>
                    ❌ Rejeter la demande
                  </button>
                )}
                {showSoumettre && (
                  <button onClick={soumettreValidation} disabled={actionLoading || !allApproved}
                    title={!allApproved ? "En attente d'approbation de tous les participants" : ''}
                    style={{ padding: '9px 18px', borderRadius: 9, background: '#d97706', color: '#fff', border: 'none', cursor: !allApproved ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.875rem', opacity: !allApproved ? 0.5 : 1 }}>
                    {actionLoading ? '…' : '📤 Envoyer pour validation'}
                  </button>
                )}
                {canValider && (
                  <button onClick={() => setShowValidation(true)}
                    style={{ padding: '9px 18px', borderRadius: 9, background: '#059669', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(5,150,105,0.25)' }}>
                    ✍ Valider le plan
                  </button>
                )}
                {canTester && (
                  <button onClick={testerPlan} disabled={actionLoading}
                    style={{ padding: '9px 18px', borderRadius: 9, background: '#7c3aed', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem', boxShadow: '0 4px 14px rgba(124,58,237,0.25)' }}>
                    {actionLoading ? '…' : '🔬 Marquer comme testé'}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Décision de validation */}
          {plan.validation && (
            <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 16, padding: '20px 22px', boxShadow: '0 1px 3px rgba(15,23,42,0.05), 0 4px 16px rgba(15,23,42,0.06)' }}>
              <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text)', marginBottom: 16, paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
                Décision de validation
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 28px' }}>
                <InfoField label="Décision" value={
                  <span style={{ color: plan.validation.decision === 'VALIDE' ? '#059669' : '#e11d48', fontWeight: 700 }}>
                    {plan.validation.decision === 'VALIDE' ? '✅ Validé' : '❌ Rejeté'}
                  </span>
                } />
                <InfoField label="Date" value={new Date(plan.validation.dateValidation).toLocaleDateString('fr-FR')} />
                {plan.validation.commentaire && <InfoField label="Commentaire" value={plan.validation.commentaire} />}
                {plan.validation.signature && (
                  <>
                    <InfoField label="Signataire" value={plan.validation.signature.signataire} />
                    <InfoField label="Fonction" value={plan.validation.signature.fonction} />
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ── Colonne droite — Énergies ── */}
        <div>
          <EnergiesPanel
            plan={plan}
            isParticipant={isParticipant}
            onEnergiesChange={(energies) => { setPlan(p => ({ ...p, energies })); rafraichirApprobations(); }}
          />
        </div>
      </div>

      {/* Overlay historique */}
      {showHistorique && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.25)', zIndex: 200 }} onClick={() => setShowHistorique(false)} />
      )}

      {/* Drawer historique + PDF */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 380,
        background: '#fff', boxShadow: '-4px 0 32px rgba(15,23,42,0.15)',
        zIndex: 201, display: 'flex', flexDirection: 'column',
        transform: showHistorique ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.22,1,0.36,1)',
      }}>
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: '16px 20px', borderBottom: '1px solid var(--border)',
          background: 'linear-gradient(135deg, #0f172a, #1e3a5f)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#fff' }}>Journal du plan</div>
              <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.45)', marginTop: 1 }}>{plan.reference}</div>
            </div>
          </div>
          <button onClick={() => setShowHistorique(false)} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', cursor: 'pointer', lineHeight: 1, padding: '6px 9px', borderRadius: 7, fontSize: '0.9rem', transition: 'background .15s' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.16)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.08)'}>✕</button>
        </div>

        <div style={{
          margin: '14px 14px 0',
          borderRadius: 12,
          border: '1.5px solid rgba(37,99,235,0.18)',
          background: 'linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(30,58,138,0.07) 100%)',
          overflow: 'hidden',
          flexShrink: 0,
        }}>
          <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(37,99,235,0.1)' }}>
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/>
              </svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#0f172a' }}>Document officiel</div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: 1 }}>Plan de consignation · Format PDF</div>
            </div>
            <div style={{ fontSize: '0.65rem', fontWeight: 700, background: isValide ? 'rgba(5,150,105,0.1)' : 'rgba(245,158,11,0.1)', color: isValide ? '#059669' : '#d97706', border: `1px solid ${isValide ? 'rgba(5,150,105,0.22)' : 'rgba(245,158,11,0.22)'}`, borderRadius: 20, padding: '3px 8px', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              {isValide ? '✓ Validé' : plan.statut.replaceAll('_', ' ')}
            </div>
          </div>

          <div style={{ padding: '10px 14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 12px' }}>
            {[
              { label: 'Référence', value: plan.reference },
              { label: 'Équipement', value: plan.equipementCode },
              { label: 'Créé le', value: new Date(plan.dateCreation).toLocaleDateString('fr-FR') },
              { label: 'Énergies', value: `${(plan.energies || []).length} point${(plan.energies||[]).length > 1 ? 's' : ''}` },
            ].map(({ label, value }) => (
              <div key={label}>
                <div style={{ fontSize: '0.62rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.07em' }}>{label}</div>
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#1e293b', marginTop: 1, fontFamily: 'var(--font-mono)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value}</div>
              </div>
            ))}
          </div>

          <div style={{ padding: '4px 14px 14px' }}>
            <button
              onClick={handleTelechargerPdf}
              disabled={pdfLoading}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9,
                padding: '10px 16px', borderRadius: 9,
                background: pdfLoading ? 'rgba(37,99,235,0.6)' : 'linear-gradient(135deg, #1d4ed8, #2563eb)',
                color: '#fff', border: 'none', cursor: pdfLoading ? 'wait' : 'pointer',
                fontWeight: 700, fontSize: '0.83rem', letterSpacing: '.01em',
                boxShadow: pdfLoading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
                transition: 'all .2s',
              }}
              onMouseEnter={e => { if (!pdfLoading) e.currentTarget.style.background = 'linear-gradient(135deg, #1e40af, #1d4ed8)'; }}
              onMouseLeave={e => { if (!pdfLoading) e.currentTarget.style.background = 'linear-gradient(135deg, #1d4ed8, #2563eb)'; }}
            >
              {pdfLoading ? (
                <>
                  <div style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
                  Génération en cours…
                </>
              ) : (
                <>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                  Télécharger le PDF
                </>
              )}
            </button>
            {!isValide && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.68rem', color: '#d97706' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                Le document sera généré sans cachet de validation
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 14px 6px', flexShrink: 0 }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.1em', whiteSpace: 'nowrap' }}>Historique des actions</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px 20px' }}>
          {histLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}>
              <div style={{ width: 24, height: 24, border: '3px solid var(--border)', borderTopColor: 'var(--blue)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            </div>
          ) : historique.length === 0 ? (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'block', margin: '0 auto 10px' }}>
                <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
              </svg>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>Aucun historique disponible.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {historique.map((h, i) => {
                const color = ACTION_CONFIG[h.typeAction]?.color || '#94a3b8';
                return (
                  <div key={h.id} style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 12 }}>
                      <div style={{ width: 12, height: 12, borderRadius: '50%', flexShrink: 0, background: color, boxShadow: `0 0 0 3px ${color}33` }} />
                      {i < historique.length - 1 && <div style={{ flex: 1, width: 2, background: 'var(--border)', minHeight: 20, marginTop: 4 }} />}
                    </div>
                    <div style={{ flex: 1, paddingBottom: 20 }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{ACTION_CONFIG[h.typeAction]?.label || h.typeAction}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-sub)', marginTop: 3, lineHeight: 1.4 }}>{h.description}</div>
                      {h.realiseeParNom && <div style={{ fontSize: '0.72rem', color: 'var(--blue)', marginTop: 3, fontWeight: 600 }}>👤 {h.realiseeParNom}</div>}
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: 4, fontFamily: 'var(--font-mono)' }}>
                        {new Date(h.dateAction).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Modal rejet demande */}
      {showRejetModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setShowRejetModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, boxShadow: '0 8px 40px rgba(15,23,42,0.18)' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>Rejeter la demande</h3>
            <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: 12 }}>Un commentaire est obligatoire pour rejeter une demande.</p>
            <textarea
              value={rejetCommentaire}
              onChange={e => setRejetCommentaire(e.target.value)}
              placeholder="Motif du rejet…"
              rows={4}
              style={{ width: '100%', borderRadius: 8, border: '1px solid var(--border)', padding: '8px 12px', fontSize: '0.87rem', fontFamily: 'var(--font)', resize: 'vertical', boxSizing: 'border-box' }}
            />
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
              <button onClick={() => setShowRejetModal(false)}
                style={{ padding: '8px 18px', borderRadius: 8, background: 'var(--bg-cream)', border: '1px solid var(--border)', cursor: 'pointer', fontWeight: 600, fontSize: '0.85rem' }}>
                Annuler
              </button>
              <button onClick={confirmerRejetDemande} disabled={!rejetCommentaire.trim() || actionLoading}
                style={{ padding: '8px 18px', borderRadius: 8, background: '#e11d48', color: '#fff', border: 'none', cursor: !rejetCommentaire.trim() ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: '0.85rem', opacity: !rejetCommentaire.trim() ? 0.5 : 1 }}>
                {actionLoading ? '…' : 'Confirmer le rejet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showValidation && (
        <ValidationModal plan={plan} onClose={() => setShowValidation(false)} onValidated={handleValidation} />
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function InfoField({ label, value }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{value}</div>
    </div>
  );
}

function btnStyle(bg, color) {
  return {
    padding: '6px 13px', borderRadius: 8,
    background: bg, color, border: 'none',
    cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem',
    display: 'flex', alignItems: 'center', gap: 5,
    boxShadow: '0 1px 3px rgba(15,23,42,0.12)',
    transition: 'all 0.15s',
    fontFamily: 'var(--font)',
  };
}
