import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { zoneService, equipementService, dashboardService } from '../services/api';
import Breadcrumb from '../components/Breadcrumb';
import QrCodeModal from '../components/QrCodeModal';
import EquipmentIcon from '../components/icons/EquipmentIcon';

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
.zp { font-family: 'Sora', sans-serif; }

/* ── Hero ── */
.zp-hero {
  background: linear-gradient(135deg, #0f1e35 0%, #162844 55%, #0d2545 100%);
  border-radius: 18px; padding: 24px 30px; margin-bottom: 24px;
  display: flex; align-items: center; justify-content: space-between; gap: 20px;
  position: relative; overflow: hidden;
}
.zp-hero::after {
  content: ''; position: absolute; bottom: -40px; left: -40px;
  width: 160px; height: 160px; border-radius: 50%;
  background: radial-gradient(circle, rgba(201,168,76,0.1) 0%, transparent 70%);
  pointer-events: none;
}
.zp-hero__eyebrow {
  font-family: 'DM Mono', monospace; font-size: 10px; color: rgba(201,168,76,0.75);
  text-transform: uppercase; letter-spacing: .12em; margin-bottom: 6px;
}
.zp-hero__code { font-size: 22px; font-weight: 800; color: #fff; letter-spacing: -.02em; }
.zp-hero__name { font-size: 13px; color: rgba(255,255,255,0.42); margin-top: 4px; }
.zp-hero__kpis { display: flex; gap: 12px; flex-shrink: 0; }
.zp-kpi {
  background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1);
  border-radius: 12px; padding: 12px 18px; text-align: center; min-width: 80px;
}
.zp-kpi__val { font-size: 24px; font-weight: 800; color: #c9a84c; line-height: 1; }
.zp-kpi__lbl { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; letter-spacing: .07em; margin-top: 3px; }

/* ── Toolbar ── */
.zp-toolbar { display: flex; gap: 10px; align-items: center; margin-bottom: 18px; flex-wrap: wrap; }
.zp-search-wrap { position: relative; flex: 1; max-width: 300px; }
.zp-search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 13px; pointer-events: none; }
.zp-search {
  width: 100%; padding: 10px 14px 10px 36px;
  border: 1.5px solid #e2ddd4; border-radius: 10px;
  background: #fff; font-family: 'Sora', sans-serif; font-size: 13px; color: #0f1e35;
  outline: none; transition: all .18s;
}
.zp-search:focus { border-color: #c9a84c; box-shadow: 0 0 0 3px rgba(201,168,76,0.12); }
.zp-filter {
  padding: 10px 14px; border: 1.5px solid #e2ddd4; border-radius: 10px;
  background: #fff; font-family: 'Sora', sans-serif; font-size: 12px; color: #0f1e35;
  outline: none; cursor: pointer; transition: border-color .18s;
}
.zp-filter:focus { border-color: #c9a84c; }
.zp-results { font-size: 12px; color: #94a3b8; background: #f7f5f0; padding: 7px 14px; border-radius: 20px; font-weight: 500; margin-left: auto; }
.zp-results span { font-weight: 700; color: #c9a84c; }

/* ── Grid ── */
.zp-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }

.zp-card {
  background: #fff; border: 1.5px solid #e2ddd4; border-radius: 16px; padding: 0;
  cursor: pointer; transition: all .25s cubic-bezier(0.4,0,0.2,1);
  display: flex; flex-direction: column; position: relative; overflow: hidden;
  font-family: 'Sora', sans-serif; text-align: left;
}
.zp-card::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px;
  background: linear-gradient(90deg, #c9a84c, transparent); opacity: 0; transition: opacity .22s;
}
.zp-card:hover { border-color: #c9a84c; transform: translateY(-4px); box-shadow: 0 14px 36px rgba(15,30,53,0.13); }
.zp-card:hover::before { opacity: 1; }

.zp-card__body { padding: 16px 18px 12px; flex: 1; }
.zp-card__top { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.zp-card__code {
  font-family: 'DM Mono', monospace; font-size: 11px; font-weight: 700; color: #c9a84c;
  background: rgba(201,168,76,0.12); padding: 4px 10px; border-radius: 6px;
  border: 1px solid rgba(201,168,76,0.3); letter-spacing: .04em;
}
.zp-card__icon {
  width: 34px; height: 34px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 18px;
  background: #f7f5f0; border: 1px solid #e2ddd4;
}
.zp-card__desc {
  font-size: 13px; color: #5a6a7e; line-height: 1.5; margin-bottom: 10px;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.zp-card__chips { display: flex; gap: 5px; flex-wrap: wrap; }
.zp-chip { display: inline-flex; align-items: center; gap: 3px; font-size: 10px; font-weight: 600; padding: 3px 8px; border-radius: 20px; }
.zp-chip--green { background: rgba(5,150,105,0.08); color: #059669; border: 1px solid rgba(5,150,105,0.18); }
.zp-chip--blue  { background: rgba(37,99,235,0.08); color: #2563eb; border: 1px solid rgba(37,99,235,0.18); }

.zp-card__footer {
  padding: 10px 18px 12px; border-top: 1px solid #f0ece3;
  display: flex; align-items: center; justify-content: space-between;
  font-size: 11px; color: #94a3b8;
}
.zp-card__arrow {
  font-size: 11px; font-weight: 700; color: #c9a84c;
  opacity: 0; transform: translateX(-4px); transition: all .18s;
}
.zp-card:hover .zp-card__arrow { opacity: 1; transform: translateX(0); }

/* ── Stats bar ── */
.zp-stats {
  display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:20px;
}
.zp-stat-card {
  background:#fff;border:1.5px solid #e2ddd4;border-radius:12px;
  padding:12px 14px;display:flex;flex-direction:column;gap:2px;
  position:relative;overflow:hidden;
}
.zp-stat-card::before {
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
}
.zp-stat-card__val {
  font-size:22px;font-weight:800;font-family:'DM Mono',monospace;line-height:1;
}
.zp-stat-card__lbl {
  font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.06em;margin-top:2px;
}

/* ── Empty ── */
.zp-empty {
  padding: 56px 24px; text-align: center;
  background: #fff; border: 1.5px solid #e2ddd4; border-radius: 16px;
}
.zp-empty__icon { font-size: 40px; opacity: .18; margin-bottom: 12px; }
.zp-empty__text { font-size: 14px; color: #5a6a7e; font-weight: 500; }

/* ── Spinner ── */
@keyframes zpSpin { to { transform: rotate(360deg); } }
.zp-spinner {
  width: 36px; height: 36px; border: 3px solid #e2ddd4; border-top-color: #c9a84c;
  border-radius: 50%; animation: zpSpin .8s linear infinite; margin: 48px auto;
}
`;

const STAT_CFG = [
  { key: 'totalPlans',               label: 'Total plans',    color: '#0f1e35', accent: '#c9a84c' },
  { key: 'plansDemande',             label: 'Demandes',       color: '#7c3aed', accent: '#7c3aed' },
  { key: 'plansEnTraitement',        label: 'En traitement',  color: '#d97706', accent: '#d97706' },
  { key: 'plansEnAttenteValidation', label: 'En attente',     color: '#0891b2', accent: '#0891b2' },
  { key: 'plansValides',             label: 'Validés',        color: '#059669', accent: '#059669' },
  { key: 'plansRejetes',             label: 'Rejetés',        color: '#dc2626', accent: '#dc2626' },
];

export default function ZonePage() {
  const { zoneId } = useParams();
  const navigate = useNavigate();
  const [zone,        setZone]        = useState(null);
  const [equipements, setEquipements] = useState([]);
  const [stats,       setStats]       = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [filter,      setFilter]      = useState('all');
  const [qrEquip,     setQrEquip]     = useState(null);

  useEffect(() => {
    Promise.all([
      zoneService.findById(zoneId),
      equipementService.findRacinesParZone(zoneId),
      dashboardService.getStatsByZone(zoneId).catch(() => null),
    ]).then(([z, eqs, st]) => { setZone(z); setEquipements(eqs); setStats(st); })
      .finally(() => setLoading(false));
  }, [zoneId]);

  const filtered = useMemo(() => {
    let list = equipements;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(e => e.code?.toLowerCase().includes(q) || e.description?.toLowerCase().includes(q));
    }
    if (filter === 'avec-plans')   list = list.filter(e => e.nombrePlans > 0);
    if (filter === 'avec-enfants') list = list.filter(e => e.hasSousEquipements);
    return list;
  }, [equipements, search, filter]);

  const totalPlans = equipements.reduce((s, e) => s + (e.nombrePlans || 0), 0);

  if (loading) return (
    <>
      <style>{CSS}</style>
      <div className="zp"><div className="zp-spinner" /></div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="zp">
        <Breadcrumb items={[{ label:'Zones', path:'/' }, { label: zone?.code }]} />

        {/* Hero */}
        <div className="zp-hero">
          <div>
            <div className="zp-hero__eyebrow">Zone industrielle</div>
            <div className="zp-hero__code">{zone?.code}</div>
            {zone?.nom && <div className="zp-hero__name">{zone.nom}</div>}
          </div>
          <div className="zp-hero__kpis">
            <div className="zp-kpi">
              <div className="zp-kpi__val">{stats?.totalEquipements ?? equipements.length}</div>
              <div className="zp-kpi__lbl">Équipements</div>
            </div>
            <div className="zp-kpi">
              <div className="zp-kpi__val">{stats?.totalPlans ?? totalPlans}</div>
              <div className="zp-kpi__lbl">Plans</div>
            </div>
            <div className="zp-kpi">
              <div className="zp-kpi__val">{stats?.plansValides ?? 0}</div>
              <div className="zp-kpi__lbl">Validés</div>
            </div>
          </div>
        </div>

        {/* Stats de la zone */}
        {stats && (
          <div className="zp-stats">
            {STAT_CFG.map(cfg => (
              <div key={cfg.key} className="zp-stat-card" style={{ borderTopColor: cfg.accent }}>
                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:cfg.accent }} />
                <div className="zp-stat-card__val" style={{ color: cfg.color }}>
                  {stats[cfg.key] ?? 0}
                </div>
                <div className="zp-stat-card__lbl">{cfg.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        {equipements.length > 0 && (
          <div className="zp-toolbar">
            <div className="zp-search-wrap">
              <span className="zp-search-icon">🔍</span>
              <input
                className="zp-search"
                placeholder="Rechercher un équipement…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
            <select className="zp-filter" value={filter} onChange={e => setFilter(e.target.value)}>
              <option value="all">Tous</option>
              <option value="avec-plans">Avec des plans</option>
              <option value="avec-enfants">Avec sous-équipements</option>
            </select>
            <div className="zp-results">
              <span>{filtered.length}</span> / {equipements.length}
            </div>
          </div>
        )}

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="zp-empty">
            <div className="zp-empty__icon">🔧</div>
            <div className="zp-empty__text">
              {search ? `Aucun résultat pour « ${search} »` : 'Aucun équipement dans cette zone'}
            </div>
            {search && (
              <button
                onClick={() => { setSearch(''); setFilter('all'); }}
                style={{ marginTop:10, background:'none', border:'none', color:'#c9a84c', fontWeight:600, cursor:'pointer', fontSize:13, fontFamily:'Sora,sans-serif' }}
              >
                ← Réinitialiser
              </button>
            )}
          </div>
        ) : (
          <div className="zp-grid">
            {filtered.map(eq => (
              <div
                key={eq.id}
                className="zp-card"
                onClick={() => navigate(`/equipement/${eq.id}`)}
                role="button" tabIndex={0}
                onKeyDown={e => e.key === 'Enter' && navigate(`/equipement/${eq.id}`)}
              >
                <div className="zp-card__body">
                  <div className="zp-card__top">
                    <span className="zp-card__code">{eq.code}</span>
                    <div className="zp-card__icon"><EquipmentIcon size={18} color="#b8892a" /></div>
                  </div>
                  <div className="zp-card__desc">
                    {eq.description || <span style={{ color:'#c9a84c', fontStyle:'italic' }}>Sans description</span>}
                  </div>
                  <div className="zp-card__chips">
                    {eq.hasSousEquipements && (
                      <span className="zp-chip zp-chip--green">📂 Sous-équipements</span>
                    )}
                    {eq.nombrePlans > 0 && (
                      <span className="zp-chip zp-chip--blue">📋 {eq.nombrePlans} plan{eq.nombrePlans > 1 ? 's' : ''}</span>
                    )}
                  </div>
                </div>
                <div className="zp-card__footer">
                  <span>{eq.hasSousEquipements ? 'Équipement composite' : 'Équipement simple'}</span>
                  <div style={{display:'flex',alignItems:'center',gap:8}}>
                    <button
                      onClick={e => { e.stopPropagation(); setQrEquip(eq); }}
                      title="Afficher le QR Code"
                      style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:7,border:'1px solid rgba(201,168,76,.3)',background:'rgba(201,168,76,.07)',color:'#b8892a',cursor:'pointer',fontSize:11,fontWeight:600,fontFamily:'Sora,sans-serif',transition:'all .15s'}}
                      onMouseEnter={e=>e.currentTarget.style.background='rgba(201,168,76,.15)'}
                      onMouseLeave={e=>e.currentTarget.style.background='rgba(201,168,76,.07)'}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
                      QR
                    </button>
                    <span className="zp-card__arrow">Ouvrir →</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {qrEquip && <QrCodeModal equipement={qrEquip} onClose={() => setQrEquip(null)} />}
    </>
  );
}
