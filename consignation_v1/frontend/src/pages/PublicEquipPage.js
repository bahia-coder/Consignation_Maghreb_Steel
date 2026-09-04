/**
 * PublicEquipPage.js  —  Page QR publique SANS authentification
 * Route : /qr/equipement/:id
 * Appelle /api/public/**  (endpoints ouverts, pas de JWT)
 */
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

// URL relative → le proxy CRA redirige vers localhost:8082 côté serveur
// Fonctionne depuis n'importe quel appareil (téléphone via ngrok)
const API = axios.create({ baseURL: '/api/public' });

/* ═════════════════════════════ CSS ═════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
body{background:#0f1e35;font-family:'Plus Jakarta Sans',system-ui,sans-serif;}

.pep{min-height:100vh;background:linear-gradient(160deg,#08121f 0%,#0f1e35 40%,#0d2040 100%);display:flex;flex-direction:column;align-items:center;padding:0 0 48px;}

/* topbar */
.pep-top{width:100%;max-width:520px;padding:18px 20px;display:flex;align-items:center;gap:10px;}
.pep-top__logo{width:36px;height:36px;border-radius:10px;background:rgba(201,168,76,.12);border:1.5px solid rgba(201,168,76,.35);display:flex;align-items:center;justify-content:center;color:#c9a84c;flex-shrink:0;}
.pep-top__name{font-size:15px;font-weight:800;color:#fff;letter-spacing:-.02em;}
.pep-top__name span{color:#c9a84c;}
.pep-top__badge{margin-left:auto;padding:4px 11px;border-radius:20px;background:rgba(16,185,129,.12);border:1px solid rgba(16,185,129,.25);color:#34d399;font-size:11px;font-weight:700;}

/* hero */
.pep-hero{width:100%;max-width:520px;padding:0 16px 20px;}
.pep-hero-card{background:linear-gradient(135deg,rgba(255,255,255,.07),rgba(255,255,255,.03));border:1px solid rgba(201,168,76,.2);border-radius:20px;padding:22px 20px;position:relative;overflow:hidden;}
.pep-hero-card::after{content:'';position:absolute;top:-40px;right:-40px;width:160px;height:160px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.1) 0%,transparent 70%);pointer-events:none;}
.pep-eye{font-size:10px;color:rgba(201,168,76,.65);text-transform:uppercase;letter-spacing:.14em;font-weight:700;margin-bottom:8px;display:flex;align-items:center;gap:6px;}
.pep-code{font-family:'DM Mono',monospace;font-size:26px;font-weight:700;color:#fff;letter-spacing:-.02em;margin-bottom:4px;}
.pep-desc{font-size:13px;color:rgba(255,255,255,.45);line-height:1.5;}
.pep-badges{display:flex;gap:8px;margin-top:14px;flex-wrap:wrap;}
.pep-bdg{display:inline-flex;align-items:center;gap:5px;padding:4px 11px;border-radius:20px;font-size:11px;font-weight:600;}
.pep-bdg--g{background:rgba(5,150,105,.15);color:#34d399;border:1px solid rgba(5,150,105,.25);}
.pep-bdg--gold{background:rgba(201,168,76,.12);color:#c9a84c;border:1px solid rgba(201,168,76,.25);}

/* section */
.pep-sec{width:100%;max-width:520px;padding:0 16px;}
.pep-sec-title{font-size:11px;font-weight:700;color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.14em;margin-bottom:12px;display:flex;align-items:center;gap:8px;}
.pep-sec-title::after{content:'';flex:1;height:1px;background:rgba(255,255,255,.08);}

/* plan card */
.pep-card{background:#fff;border-radius:16px;overflow:hidden;margin-bottom:12px;box-shadow:0 4px 24px rgba(0,0,0,.18);}
.pep-card__head{padding:14px 16px 12px;border-bottom:1px solid #f0ece3;}
.pep-card__top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}
.pep-ref{font-family:'DM Mono',monospace;font-size:11.5px;font-weight:700;color:#c9a84c;background:rgba(201,168,76,.1);padding:3px 9px;border-radius:6px;border:1px solid rgba(201,168,76,.25);letter-spacing:.04em;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:190px;}
.pep-valide{display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:700;background:rgba(5,150,105,.1);color:#059669;border:1px solid rgba(5,150,105,.2);}
.pep-card__desc{font-size:12.5px;color:#5a6a7e;line-height:1.55;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.pep-card__body{padding:10px 16px 12px;display:flex;flex-direction:column;gap:6px;}
.pep-meta{display:flex;align-items:center;gap:6px;font-size:11.5px;color:#94a3b8;}
.pep-meta b{color:#5a6a7e;font-weight:600;}
.pep-card__foot{padding:0 16px 14px;}
.pep-dl{width:100%;padding:12px;border-radius:11px;border:none;background:linear-gradient(135deg,#0f1e35,#1a3260);color:#c9a84c;font-size:13.5px;font-weight:700;font-family:inherit;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:all .2s;box-shadow:0 3px 12px rgba(15,30,53,.25);}
.pep-dl:hover{transform:translateY(-1px);box-shadow:0 5px 18px rgba(15,30,53,.32);}
.pep-dl:disabled{opacity:.5;cursor:not-allowed;transform:none;}
.pep-dl-spin{width:14px;height:14px;border:2px solid rgba(201,168,76,.3);border-top-color:#c9a84c;border-radius:50%;animation:pepSpin .7s linear infinite;flex-shrink:0;}
@keyframes pepSpin{to{transform:rotate(360deg)}}
.pep-dl--ok{background:linear-gradient(135deg,#059669,#047857);color:#fff;}

/* empty */
.pep-empty{text-align:center;padding:40px 20px;color:rgba(255,255,255,.3);}
.pep-empty__icon{font-size:44px;opacity:.15;margin-bottom:14px;}
.pep-empty__text{font-size:14px;font-weight:600;color:rgba(255,255,255,.4);margin-bottom:6px;}
.pep-empty__sub{font-size:12px;color:rgba(255,255,255,.22);}

/* spinner page */
.pep-load{display:flex;flex-direction:column;align-items:center;padding:60px 20px;gap:16px;}
.pep-load__ring{width:44px;height:44px;border:3px solid rgba(255,255,255,.1);border-top-color:#c9a84c;border-radius:50%;animation:pepSpin .8s linear infinite;}
.pep-load__txt{font-size:13px;color:rgba(255,255,255,.4);}

/* erreur */
.pep-err{width:100%;max-width:520px;padding:20px 16px;}
.pep-err-card{background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.25);border-radius:16px;padding:24px;text-align:center;}
.pep-err__icon{font-size:36px;margin-bottom:12px;opacity:.6;}
.pep-err__title{font-size:15px;font-weight:700;color:#f87171;margin-bottom:6px;}
.pep-err__sub{font-size:12.5px;color:rgba(255,255,255,.35);line-height:1.55;}

/* footer */
.pep-foot{margin-top:36px;text-align:center;font-size:11px;color:rgba(255,255,255,.18);line-height:1.7;}
`;

export default function PublicEquipPage() {
  const { id } = useParams();

  const [equip,   setEquip]   = useState(null);
  const [plans,   setPlans]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);
  const [dlState, setDlState] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [eqRes, plansRes] = await Promise.all([
          API.get(`/equipement/${id}`),
          API.get(`/equipement/${id}/plans-valides`),
        ]);
        setEquip(eqRes.data);
        setPlans(plansRes.data || []);
      } catch (e) {
        setError('Impossible de charger les données de cet équipement.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric'
  }) : '—';

  const downloadPdf = async (plan) => {
    setDlState(s => ({ ...s, [plan.id]: 'loading' }));
    try {
      const res = await API.get(`/plan/${plan.id}/pdf`, { responseType: 'blob' });
      const url  = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `plan-${plan.reference}.pdf`);
      document.body.appendChild(link); link.click(); link.remove();
      window.URL.revokeObjectURL(url);
      setDlState(s => ({ ...s, [plan.id]: 'done' }));
      setTimeout(() => setDlState(s => ({ ...s, [plan.id]: null })), 3000);
    } catch {
      setDlState(s => ({ ...s, [plan.id]: null }));
      alert('Erreur lors du téléchargement du PDF.');
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="pep">

        {/* ── Topbar ── */}
        <div className="pep-top">
          <div className="pep-top__logo">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <polyline points="9 12 11 14 15 10"/>
            </svg>
          </div>
          <span className="pep-top__name">Consign<span>App</span></span>
          <span className="pep-top__badge">✓ Accès public</span>
        </div>

        {/* ── Loading ── */}
        {loading && (
          <div className="pep-load">
            <div className="pep-load__ring"/>
            <span className="pep-load__txt">Chargement de l'équipement…</span>
          </div>
        )}

        {/* ── Erreur ── */}
        {!loading && error && (
          <div className="pep-err">
            <div className="pep-err-card">
              <div className="pep-err__icon">⚠️</div>
              <div className="pep-err__title">Équipement introuvable</div>
              <div className="pep-err__sub">{error}</div>
            </div>
          </div>
        )}

        {/* ── Contenu ── */}
        {!loading && !error && equip && (
          <>
            {/* Hero */}
            <div className="pep-hero">
              <div className="pep-hero-card">
                <div className="pep-eye">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
                  Équipement industriel
                </div>
                <div className="pep-code">{equip.code}</div>
                {equip.description && (
                  <div className="pep-desc">{equip.description}</div>
                )}
                <div className="pep-badges">
                  <span className="pep-bdg pep-bdg--g">
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                    {plans.length} plan{plans.length !== 1 ? 's' : ''} validé{plans.length !== 1 ? 's' : ''}
                  </span>
                  {equip.zoneCode && (
                    <span className="pep-bdg pep-bdg--gold">
                      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/></svg>
                      Zone {equip.zoneCode}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Plans */}
            <div className="pep-sec">
              <div className="pep-sec-title">Plans de consignation validés</div>

              {plans.length === 0 ? (
                <div className="pep-empty">
                  <div className="pep-empty__icon">📋</div>
                  <div className="pep-empty__text">Aucun plan validé</div>
                  <div className="pep-empty__sub">
                    Cet équipement n'a pas encore de plan de consignation validé.
                  </div>
                </div>
              ) : (
                plans.map(plan => (
                  <div key={plan.id} className="pep-card">
                    <div className="pep-card__head">
                      <div className="pep-card__top">
                        <span className="pep-ref" title={plan.reference}>{plan.reference}</span>
                        <span className="pep-valide">
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                          Validé
                        </span>
                      </div>
                      {plan.descriptionIntervention && (
                        <div className="pep-card__desc">{plan.descriptionIntervention}</div>
                      )}
                    </div>

                    <div className="pep-card__body">
                      {plan.dateValidation && (
                        <div className="pep-meta">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                          Validé le <b>{fmtDate(plan.dateValidation)}</b>
                        </div>
                      )}
                      {plan.dateCreation && (
                        <div className="pep-meta">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          Créé le <b>{fmtDate(plan.dateCreation)}</b>
                        </div>
                      )}
                      {plan.demandeurNom && (
                        <div className="pep-meta">
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          Demandeur : <b>{plan.demandeurNom}</b>
                        </div>
                      )}
                    </div>

                    <div className="pep-card__foot">
                      <button
                        className={`pep-dl${dlState[plan.id] === 'done' ? ' pep-dl--ok' : ''}`}
                        onClick={() => downloadPdf(plan)}
                        disabled={dlState[plan.id] === 'loading'}
                      >
                        {dlState[plan.id] === 'loading' ? (
                          <><div className="pep-dl-spin"/>Génération du PDF…</>
                        ) : dlState[plan.id] === 'done' ? (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                            PDF téléchargé !
                          </>
                        ) : (
                          <>
                            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                            Télécharger le PDF officiel
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        <div className="pep-foot">
          ConsignApp · Plans de consignation industrielle<br/>
          Accès via QR Code · {new Date().getFullYear()}
        </div>
      </div>
    </>
  );
}
