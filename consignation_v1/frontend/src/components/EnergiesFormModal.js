import React, { useState, useEffect } from 'react';
import { energieService, dispositifService } from '../services/api';

const TYPES = [
  { key: 'ELECTRIQUE',       label: '⚡ Électrique',    icon: '⚡' },
  { key: 'HYDRAULIQUE',      label: '💧 Hydraulique',   icon: '💧' },
  { key: 'PNEUMATIQUE',      label: '🌀 Pneumatique',   icon: '🌀' },
  { key: 'MECANIQUE',        label: '⚙ Mécanique',     icon: '⚙'  },
  { key: 'THERMIQUE',        label: '🌡 Thermique',     icon: '🌡' },
];

const ETATS = ['Ouvert', 'Fermé', 'Purgé', 'Verrouillé', 'Autre'];

const CSS = `
  .efm-overlay {
    position:fixed; inset:0; background:rgba(10,20,40,0.65);
    backdrop-filter:blur(6px); z-index:2000;
    display:flex; align-items:center; justify-content:center;
    padding:16px;
  }
  .efm-modal {
    background:#fff; border-radius:16px; width:100%; max-width:900px;
    max-height:92vh; display:flex; flex-direction:column;
    box-shadow:0 32px 80px rgba(10,20,40,0.40);
    overflow:hidden;
  }

  /* ── Header ── */
  .efm-head {
    background:linear-gradient(135deg,#0c1829 0%,#14243e 100%);
    padding:16px 20px; display:flex; align-items:center; justify-content:space-between;
    gap:12px; flex-shrink:0;
  }
  .efm-head__left { display:flex; align-items:center; gap:10px; }
  .efm-head__mode {
    font-size:9.5px; font-weight:700; letter-spacing:.1em; text-transform:uppercase;
    background:rgba(201,168,76,0.15); color:#c9a84c;
    border:1px solid rgba(201,168,76,0.3); padding:3px 9px; border-radius:6px;
  }
  .efm-head__title { font-size:15px; font-weight:700; color:#fff; }
  .efm-head__badge {
    background:rgba(201,168,76,0.18); color:#c9a84c;
    font-size:12px; font-weight:700; padding:3px 11px;
    border-radius:20px; border:1px solid rgba(201,168,76,0.3);
  }
  .efm-head__right { display:flex; align-items:center; gap:8px; }
  .efm-head__sub {
    font-size:11px; color:rgba(255,255,255,0.38);
    padding-top:2px;
  }

  /* Mode toggle */
  .efm-mode-toggle {
    display:flex; background:rgba(255,255,255,0.08); border-radius:8px;
    padding:3px; gap:2px;
  }
  .efm-mode-btn {
    padding:4px 12px; border-radius:6px; border:none; cursor:pointer;
    font-size:11px; font-weight:600; transition:all .18s;
    background:transparent; color:rgba(255,255,255,0.45);
  }
  .efm-mode-btn.active {
    background:rgba(201,168,76,0.22); color:#c9a84c;
    border:1px solid rgba(201,168,76,0.35);
  }
  .efm-close-btn {
    width:30px; height:30px; border-radius:8px; border:1px solid rgba(255,255,255,0.12);
    background:rgba(255,255,255,0.06); color:rgba(255,255,255,0.6);
    cursor:pointer; font-size:14px; display:flex; align-items:center; justify-content:center;
  }
  .efm-close-btn:hover { border-color:rgba(239,68,68,.4); color:#ef4444; background:rgba(239,68,68,.1); }

  /* ── Body ── */
  .efm-body { overflow-y:auto; flex:1; padding:0; }

  /* ── TABLEUR MODE ── */
  .efm-tbl-wrap { overflow-x:auto; }
  .efm-tbl {
    width:100%; border-collapse:collapse; min-width:760px;
  }
  .efm-tbl thead th {
    background:#f1f5f9; font-size:10px; font-weight:700; text-transform:uppercase;
    letter-spacing:.08em; color:#64748b; padding:10px 10px;
    border-bottom:2px solid #e2e8f0; white-space:nowrap;
    text-align:left;
  }
  .efm-tbl thead th.req::after { content:' *'; color:#c9a84c; }
  .efm-tbl tbody tr { border-bottom:1px solid #f1f5f9; }
  .efm-tbl tbody tr:hover { background:#fafafa; }
  .efm-tbl td { padding:8px 8px; vertical-align:middle; }
  .efm-tbl__num {
    width:32px; height:32px; background:#0f1e35; color:#fff;
    border-radius:8px; display:flex; align-items:center; justify-content:center;
    font-size:12px; font-weight:700; margin:0 auto;
  }
  .efm-sel, .efm-inp {
    width:100%; border:1.5px solid #e2e8f0; border-radius:8px;
    padding:7px 10px; font-size:12.5px; background:#fff;
    color:#1e293b; outline:none; transition:border-color .15s;
    font-family:inherit;
  }
  .efm-sel:focus, .efm-inp:focus { border-color:#c9a84c; box-shadow:0 0 0 3px rgba(201,168,76,.12); }
  .efm-sel option { padding:4px; }
  .efm-add-row {
    width:100%; border:2px dashed #cbd5e1; background:transparent;
    color:#94a3b8; padding:11px; font-size:12px; font-weight:600;
    cursor:pointer; border-radius:0; transition:all .15s;
    display:flex; align-items:center; justify-content:center; gap:6px;
  }
  .efm-add-row:hover { background:#f8fafc; border-color:#c9a84c; color:#c9a84c; }
  .efm-del-btn {
    width:28px; height:28px; border:none; border-radius:6px;
    background:#fee2e2; color:#ef4444; cursor:pointer;
    display:flex; align-items:center; justify-content:center; font-size:12px;
  }
  .efm-del-btn:disabled { opacity:.25; cursor:default; }

  /* ── WIZARD MODE ── */
  .efm-wiz-wrap { padding:18px; display:flex; flex-direction:column; gap:14px; }
  .efm-wiz-card {
    border:1.5px solid #e8e4dc; border-radius:14px;
    overflow:hidden; background:#fff;
    box-shadow:0 2px 8px rgba(15,30,53,.04);
  }
  .efm-wiz-card__head {
    background:linear-gradient(90deg,#0f1e35,#162844);
    padding:10px 16px; display:flex; align-items:center; gap:10px;
  }
  .efm-wiz-card__num {
    width:26px; height:26px; background:rgba(201,168,76,.2);
    border:1px solid rgba(201,168,76,.35); border-radius:8px;
    font-size:12px; font-weight:800; color:#c9a84c;
    display:flex; align-items:center; justify-content:center; flex-shrink:0;
  }
  .efm-wiz-card__title { font-size:13px; font-weight:700; color:#fff; }
  .efm-wiz-card__sub { font-size:11px; color:rgba(255,255,255,.35); margin-left:auto; }
  .efm-wiz-card__del {
    width:26px; height:26px; border:1px solid rgba(239,68,68,.25);
    background:rgba(239,68,68,.08); border-radius:6px;
    color:rgba(239,68,68,.7); cursor:pointer; font-size:12px;
    display:flex; align-items:center; justify-content:center;
    margin-left:auto;
  }
  .efm-wiz-card__del:hover { background:rgba(239,68,68,.15); color:#ef4444; }
  .efm-wiz-card__del:disabled { opacity:.2; cursor:default; }
  .efm-wiz-card__body {
    display:grid; grid-template-columns:1fr 1fr; gap:0;
  }
  .efm-wiz-panel {
    padding:16px 18px;
  }
  .efm-wiz-panel:first-child {
    border-right:1.5px solid #f1ede6;
  }
  .efm-wiz-sec {
    font-size:9.5px; font-weight:800; letter-spacing:.12em; text-transform:uppercase;
    color:#94a3b8; margin-bottom:12px; display:flex; align-items:center; gap:6px;
  }
  .efm-wiz-sec::before { content:''; display:inline-block; width:3px; height:12px;
    background:#c9a84c; border-radius:2px; }
  .efm-type-grid {
    display:grid; grid-template-columns:1fr 1fr; gap:6px; margin-bottom:12px;
  }
  .efm-type-btn {
    padding:8px 10px; border-radius:9px; border:1.5px solid #e2e8f0;
    background:#f8fafc; font-size:11.5px; font-weight:600; cursor:pointer;
    color:#475569; transition:all .15s; text-align:center;
    display:flex; align-items:center; justify-content:center; gap:5px;
  }
  .efm-type-btn:hover { border-color:#c9a84c; color:#c9a84c; background:#fffbf0; }
  .efm-type-btn.active {
    border-color:#0f1e35; background:#0f1e35; color:#fff;
  }
  .efm-type-btn:last-child:nth-child(odd) { grid-column:1/-1; }
  .efm-lbl {
    display:block; font-size:10px; font-weight:700; text-transform:uppercase;
    letter-spacing:.07em; color:#64748b; margin-bottom:5px;
  }
  .efm-lbl.req::after { content:' *'; color:#c9a84c; }
  .efm-fld { margin-bottom:12px; }
  .efm-ta {
    width:100%; border:1.5px solid #e2e8f0; border-radius:8px;
    padding:8px 10px; font-size:12px; resize:vertical; min-height:68px;
    font-family:inherit; color:#1e293b; outline:none;
    transition:border-color .15s;
  }
  .efm-ta:focus { border-color:#c9a84c; box-shadow:0 0 0 3px rgba(201,168,76,.1); }

  /* ── Footer ── */
  .efm-foot {
    padding:13px 20px; border-top:1.5px solid #f1ede6;
    display:flex; align-items:center; justify-content:space-between;
    background:#faf9f7; flex-shrink:0;
    font-size:12px; color:#94a3b8;
  }
  .efm-foot__info span { color:#c9a84c; font-weight:700; }
  .efm-foot__btns { display:flex; gap:10px; }
  .efm-btn-cancel {
    padding:8px 18px; border:1.5px solid #e2e8f0; background:#fff;
    color:#475569; border-radius:9px; font-weight:600; cursor:pointer;
    font-size:13px;
  }
  .efm-btn-save {
    padding:8px 20px; background:linear-gradient(135deg,#0f1e35,#1a3050);
    color:#fff; border:none; border-radius:9px; font-weight:700;
    cursor:pointer; font-size:13px; display:flex; align-items:center; gap:7px;
  }
  .efm-btn-save:disabled { opacity:.45; cursor:default; }
  .efm-err {
    background:#fee2e2; color:#991b1b; font-size:12px;
    padding:6px 12px; border-radius:7px; border:1px solid #fecaca;
  }
  .efm-add-wiz-btn {
    border:2px dashed #c9a84c; background:transparent; color:#c9a84c;
    padding:12px; border-radius:14px; width:100%; cursor:pointer;
    font-size:13px; font-weight:600; display:flex; align-items:center;
    justify-content:center; gap:8px; transition:all .15s;
  }
  .efm-add-wiz-btn:hover { background:rgba(201,168,76,.06); }
`;

function emptyRow() {
  return { id: null, type: 'ELECTRIQUE', risques: '', dispositifId: '', repere: '', localisation: '', etat: '' };
}

function fromEnergie(e) {
  const rep = e.repereLocalisation || '';
  const [repere, localisation] = rep.includes(' — ') ? rep.split(' — ', 2) : [rep, ''];
  return {
    id: e.id ?? null,
    type: e.type || 'ELECTRIQUE',
    risques: e.energieResiduelle || '',
    dispositifId: e.dispositifId != null ? String(e.dispositifId) : '',
    repere,
    localisation,
    etat: e.action || '',
  };
}

export default function EnergiesFormModal({ plan, planId, energies, onClose, onSaved }) {
  const [mode, setMode]             = useState('tableur');
  const [rows, setRows]             = useState(() =>
    energies?.length > 0 ? energies.map(fromEnergie) : [emptyRow()]
  );
  const [dispositifs, setDispositifs] = useState([]);
  const [saving, setSaving]         = useState(false);
  const [error, setError]           = useState(null);

  useEffect(() => {
    dispositifService.findAll()
      .then(data => setDispositifs(data))
      .catch(() => setDispositifs([]));
  }, []);

  const update = (idx, field, val) =>
    setRows(prev => prev.map((r, i) => i === idx ? { ...r, [field]: val } : r));

  const addRow    = () => setRows(prev => [...prev, emptyRow()]);
  const removeRow = (idx) => { if (rows.length > 1) setRows(prev => prev.filter((_, i) => i !== idx)); };

  const readyCount = rows.filter(r => r.type && r.dispositifId).length;

  const handleSave = async () => {
    setError(null);
    const filled = rows.filter(r => r.type || r.dispositifId || r.repere || r.localisation);
    if (!filled.length) { setError('Remplissez au moins une ligne.'); return; }
    setSaving(true);
    try {
      const payload = rows.map(r => ({
        id:                 r.id || null,
        type:               r.type,
        energieResiduelle:  r.risques,
        dispositifId:       r.dispositifId ? Number(r.dispositifId) : null,
        repereLocalisation: r.repere + (r.localisation ? ` — ${r.localisation}` : ''),
        action:             r.etat || 'Ouvrir',
        equipementOrgane:   '',
        pointValeurVAE:     '',
      }));
      const updated = await energieService.sync(planId, payload);
      onSaved(updated);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || "Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="efm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="efm-modal">

          {/* Header */}
          <div className="efm-head">
            <div className="efm-head__left">
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3 }}>
                  <span className="efm-head__mode">
                    {mode === 'tableur' ? 'MODE TABLEUR' : 'MODE FORMULAIRE'}
                  </span>
                  <span className="efm-head__badge">{rows.length} ligne{rows.length > 1 ? 's' : ''}</span>
                </div>
                <div className="efm-head__title">
                  {mode === 'tableur' ? 'Saisie multi-énergies' : 'Déclarer les énergies à consigner'}
                </div>
                <div className="efm-head__sub">
                  {readyCount} / {rows.length} ligne{rows.length > 1 ? 's' : ''} complète{readyCount > 1 ? 's' : ''}
                </div>
              </div>
            </div>
            <div className="efm-head__right">
              <div className="efm-mode-toggle">
                <button className={`efm-mode-btn ${mode === 'tableur' ? 'active' : ''}`} onClick={() => setMode('tableur')}>
                  Tableur
                </button>
                <button className={`efm-mode-btn ${mode === 'formulaire' ? 'active' : ''}`} onClick={() => setMode('formulaire')}>
                  Formulaire
                </button>
              </div>
              <button className="efm-close-btn" onClick={onClose}>✕</button>
            </div>
          </div>

          {/* Body */}
          <div className="efm-body">
            {mode === 'tableur' ? (
              <div className="efm-tbl-wrap">
                <table className="efm-tbl">
                  <thead>
                    <tr>
                      <th style={{ width:46, textAlign:'center' }}>#</th>
                      <th className="req" style={{ minWidth:140 }}>Type Énergie</th>
                      <th style={{ minWidth:160 }}>Risques Résiduels</th>
                      <th className="req" style={{ minWidth:180 }}>Dispositif</th>
                      <th style={{ minWidth:120 }}>Repère Point</th>
                      <th style={{ minWidth:130 }}>Localisation</th>
                      <th style={{ minWidth:120 }}>État Point</th>
                      <th style={{ width:40 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, idx) => (
                      <tr key={idx}>
                        <td style={{ textAlign:'center' }}>
                          <div className="efm-tbl__num">{idx + 1}</div>
                        </td>
                        <td>
                          <select
                            className="efm-sel"
                            value={row.type}
                            onChange={e => update(idx, 'type', e.target.value)}
                          >
                            {TYPES.map(t => (
                              <option key={t.key} value={t.key}>{t.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="efm-inp"
                            value={row.risques}
                            onChange={e => update(idx, 'risques', e.target.value)}
                            placeholder="Risques résiduels..."
                          />
                        </td>
                        <td>
                          <select
                            className="efm-sel"
                            value={row.dispositifId}
                            onChange={e => update(idx, 'dispositifId', e.target.value)}
                          >
                            <option value="">-- Choisir --</option>
                            {dispositifs.map(d => (
                              <option key={d.id} value={String(d.id)}>{d.designation}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <input
                            className="efm-inp"
                            value={row.repere}
                            onChange={e => update(idx, 'repere', e.target.value)}
                            placeholder="Ex : Q1, V12..."
                          />
                        </td>
                        <td>
                          <input
                            className="efm-inp"
                            value={row.localisation}
                            onChange={e => update(idx, 'localisation', e.target.value)}
                            placeholder="Ex : Armoire A..."
                          />
                        </td>
                        <td>
                          <select
                            className="efm-sel"
                            value={row.etat}
                            onChange={e => update(idx, 'etat', e.target.value)}
                          >
                            <option value="">-- État --</option>
                            {ETATS.map(et => <option key={et} value={et}>{et}</option>)}
                          </select>
                        </td>
                        <td>
                          <button
                            className="efm-del-btn"
                            onClick={() => removeRow(idx)}
                            disabled={rows.length === 1}
                            title="Supprimer"
                          >✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button className="efm-add-row" onClick={addRow}>
                  + Ajouter une ligne
                </button>
              </div>
            ) : (
              <div className="efm-wiz-wrap">
                {rows.map((row, idx) => {
                  const typeLabel = TYPES.find(t => t.key === row.type)?.label || row.type;
                  const dispLabel = dispositifs.find(d => String(d.id) === row.dispositifId)?.designation;
                  const isReady   = row.type && row.dispositifId;
                  return (
                    <div className="efm-wiz-card" key={idx}>
                      <div className="efm-wiz-card__head">
                        <div className="efm-wiz-card__num">{idx + 1}</div>
                        <div className="efm-wiz-card__title">
                          Énergie {idx + 1}{isReady ? ` — ${typeLabel}` : ' — non définie'}
                        </div>
                        {isReady && dispLabel && (
                          <span style={{ fontSize:10.5, background:'rgba(201,168,76,.15)', color:'#c9a84c', border:'1px solid rgba(201,168,76,.28)', padding:'2px 8px', borderRadius:6, marginLeft:8, fontWeight:600 }}>
                            🔒 {dispLabel}
                          </span>
                        )}
                        <button
                          className="efm-wiz-card__del"
                          onClick={() => removeRow(idx)}
                          disabled={rows.length === 1}
                          title="Supprimer"
                        >✕</button>
                      </div>
                      <div className="efm-wiz-card__body">
                        {/* Left: Énergie */}
                        <div className="efm-wiz-panel">
                          <div className="efm-wiz-sec">⚡ Énergie Dangereuse</div>
                          <div className="efm-fld">
                            <label className="efm-lbl req">Type d'Énergie</label>
                            <div className="efm-type-grid">
                              {TYPES.map(t => (
                                <button
                                  key={t.key}
                                  className={`efm-type-btn ${row.type === t.key ? 'active' : ''}`}
                                  onClick={() => update(idx, 'type', t.key)}
                                  type="button"
                                >
                                  {t.label}
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="efm-fld">
                            <label className="efm-lbl">Obstacles / Risques Résiduels</label>
                            <textarea
                              className="efm-ta"
                              value={row.risques}
                              onChange={e => update(idx, 'risques', e.target.value)}
                              placeholder="Ex : condensateurs chargés, pression résiduelle..."
                              rows={3}
                            />
                          </div>
                        </div>
                        {/* Right: Point de consignation */}
                        <div className="efm-wiz-panel">
                          <div className="efm-wiz-sec">📍 Point de Consignation</div>
                          <div className="efm-fld">
                            <label className="efm-lbl req">Dispositif d'Isolation</label>
                            <select
                              className="efm-sel"
                              value={row.dispositifId}
                              onChange={e => update(idx, 'dispositifId', e.target.value)}
                            >
                              <option value="">-- Choisir --</option>
                              {dispositifs.map(d => (
                                <option key={d.id} value={String(d.id)}>{d.designation}</option>
                              ))}
                            </select>
                            {dispositifs.length === 0 && (
                              <div style={{ fontSize:10.5, color:'#94a3b8', marginTop:4 }}>
                                Aucun dispositif disponible — ajoutez-en dans l'administration.
                              </div>
                            )}
                          </div>
                          <div className="efm-fld">
                            <label className="efm-lbl">Repère Point</label>
                            <input
                              className="efm-sel"
                              value={row.repere}
                              onChange={e => update(idx, 'repere', e.target.value)}
                              placeholder="Ex : Q1, V12, D-EST..."
                            />
                          </div>
                          <div className="efm-fld">
                            <label className="efm-lbl">Localisation</label>
                            <input
                              className="efm-sel"
                              value={row.localisation}
                              onChange={e => update(idx, 'localisation', e.target.value)}
                              placeholder="Ex : Armoire A, niveau 2..."
                            />
                          </div>
                          <div className="efm-fld">
                            <label className="efm-lbl">État du Point</label>
                            <select
                              className="efm-sel"
                              value={row.etat}
                              onChange={e => update(idx, 'etat', e.target.value)}
                            >
                              <option value="">-- État --</option>
                              {ETATS.map(et => <option key={et} value={et}>{et}</option>)}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                <button className="efm-add-wiz-btn" onClick={addRow}>
                  ＋ Ajouter une énergie
                </button>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="efm-foot">
            <div className="efm-foot__info">
              <span>{readyCount}</span> énergie{readyCount > 1 ? 's' : ''} prête{readyCount > 1 ? 's' : ''} à enregistrer
              &nbsp;·&nbsp; Colonnes <span>*</span> obligatoires
            </div>
            <div className="efm-foot__btns">
              {error && <span className="efm-err">{error}</span>}
              <button className="efm-btn-cancel" onClick={onClose} disabled={saving}>Annuler</button>
              <button className="efm-btn-save" onClick={handleSave} disabled={saving}>
                ⚡ {saving ? 'Enregistrement…' : `Enregistrer ${rows.length} énergie${rows.length > 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
