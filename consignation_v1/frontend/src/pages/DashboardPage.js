import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService } from '../services/api';
import BackupPanel from '../components/BackupPanel';
import {
  PieChart, Pie, Tooltip, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, Area, AreaChart,
} from 'recharts';

/* ══════════════════════════════════════════
   DESIGN TOKENS (PFE Blue Premium)
══════════════════════════════════════════ */
const ADM_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap');

:root {
  --adm-blue:#2563eb; --adm-blue-d:#1e40af; --adm-blue-l:#3b82f6;
  --adm-blue-faint:#eff6ff; --adm-blue-mid:#dbeafe;
  --adm-teal:#0d9488; --adm-purple:#7c3aed;
  --adm-green:#059669; --adm-red:#e11d48; --adm-amber:#d97706;
  --adm-bg:#f1f5f9; --adm-white:#ffffff; --adm-card:#ffffff;
  --adm-navy:#0f172a; --adm-sub:#64748b; --adm-muted:#94a3b8;
  --adm-border:#e2e8f0; --adm-border-h:#cbd5e1;
  --adm-sh:0 1px 3px rgba(15,23,42,.05),0 4px 16px rgba(15,23,42,.06);
  --adm-sh-md:0 4px 6px rgba(15,23,42,.05),0 10px 30px rgba(15,23,42,.07);
  --adm-ease:cubic-bezier(.4,0,.2,1);
  --adm-font:'Inter',system-ui,sans-serif;
  --adm-head:'Plus Jakarta Sans','Inter',system-ui,sans-serif;
  --adm-mono:'JetBrains Mono',monospace;
  --adm-r-sm:8px; --adm-r-md:12px; --adm-r-lg:16px; --adm-r-xl:20px; --adm-r-2xl:24px;
}

.adm-page { padding:24px 28px; font-family:var(--adm-font); background:var(--adm-bg); min-height:100vh; }

/* ── BANNER ── */
.adm-banner {
  position:relative; overflow:hidden; border-radius:var(--adm-r-2xl);
  margin-bottom:28px; padding:26px 36px;
  background:linear-gradient(135deg,#0c1e6e 0%,#0e2781 35%,#1a3585 70%,#183176 100%);
  border:1px solid rgba(255,255,255,.08);
  box-shadow:0 4px 6px rgba(14,28,100,.15),0 16px 48px rgba(14,28,100,.28),inset 0 1px 0 rgba(255,255,255,.10);
  display:flex; align-items:center; justify-content:space-between; gap:28px;
  animation:admFadeIn .5s var(--adm-ease) both;
}
.adm-banner::before {
  content:''; position:absolute; top:0; left:0; right:0; height:1px;
  background:linear-gradient(90deg,transparent,rgba(255,255,255,.4),transparent);
}
.adm-banner__orb { position:absolute; border-radius:50%; pointer-events:none; }
.adm-banner__orb--1 { width:300px;height:300px;top:-150px;right:200px;
  background:radial-gradient(circle,rgba(96,165,250,.18) 0%,transparent 65%);
  filter:blur(40px); animation:admOrbDrift 12s ease-in-out infinite alternate; }
.adm-banner__orb--2 { width:200px;height:200px;bottom:-100px;left:35%;
  background:radial-gradient(circle,rgba(251,191,36,.12) 0%,transparent 65%);
  filter:blur(45px); animation:admOrbDrift 16s ease-in-out infinite alternate-reverse; }
.adm-banner__orb--3 { width:170px;height:170px;top:-60px;left:-40px;
  background:radial-gradient(circle,rgba(147,197,253,.14) 0%,transparent 65%);
  filter:blur(30px); animation:admOrbDrift 20s ease-in-out infinite alternate; }
.adm-banner__grid {
  position:absolute; inset:0; pointer-events:none;
  background-image:radial-gradient(circle,rgba(255,255,255,.065) 1px,transparent 1px);
  background-size:28px 28px;
  mask-image:linear-gradient(135deg,transparent 0%,black 40%,black 70%,transparent 100%);
}
@keyframes admOrbDrift { from{transform:translate(0,0) scale(1);} to{transform:translate(24px,16px) scale(1.08);} }

.adm-banner__content { position:relative; z-index:2; flex:1; min-width:0; display:flex; flex-direction:column; gap:12px; }

.adm-clock {
  display:inline-flex; align-items:center; gap:8px;
  background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.14);
  border-radius:100px; padding:5px 13px; width:fit-content; backdrop-filter:blur(12px);
}
.adm-clock__dot { width:6px;height:6px;border-radius:50%;background:#4ade80;box-shadow:0 0 8px #4ade80;animation:admPulse 1.5s ease-in-out infinite; }
.adm-clock__time { font-size:12px;font-weight:700;color:rgba(255,255,255,.85);font-family:var(--adm-mono);letter-spacing:.06em; }
.adm-clock__date { font-size:11px;color:rgba(255,255,255,.38);font-weight:500; }
@keyframes admPulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.7);} }

.adm-banner__eyebrow {
  display:inline-flex; align-items:center; gap:6px;
  font-size:10px; font-weight:700; letter-spacing:.12em;
  text-transform:uppercase; color:rgba(255,255,255,.40);
}
.adm-banner__greeting {
  font-size:clamp(20px,2vw,26px); font-weight:800;
  font-family:var(--adm-head); letter-spacing:-.03em; line-height:1.1; color:#fff; margin:0;
}
.adm-banner__greeting-name {
  background:linear-gradient(120deg,#bfdbfe 0%,#93c5fd 50%,#e0f2fe 100%);
  -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text;
}
.adm-banner__badges { display:flex; gap:7px; flex-wrap:wrap; align-items:center; }
.adm-banner__badge {
  display:inline-flex; align-items:center; gap:6px; padding:5px 12px;
  border-radius:100px; font-size:11px; font-weight:600; white-space:nowrap;
  backdrop-filter:blur(8px); transition:transform .2s;
}
.adm-banner__badge:hover { transform:translateY(-1px); }
.adm-banner__badge--green { background:rgba(74,222,128,.12);color:#86efac;border:1px solid rgba(74,222,128,.22); }
.adm-banner__badge--gold  { background:rgba(251,191,36,.12);color:#fde68a;border:1px solid rgba(251,191,36,.22); }
.adm-banner__badge--blue  { background:rgba(255,255,255,.10);color:rgba(255,255,255,.80);border:1px solid rgba(255,255,255,.18); }
.adm-banner__badge-dot { width:5px;height:5px;border-radius:50%;animation:admPulse 1.5s ease-in-out infinite;flex-shrink:0; }

.adm-banner__kpi-panel {
  position:relative; z-index:2; flex-shrink:0; width:210px;
  background:rgba(255,255,255,.07); border:1px solid rgba(255,255,255,.14);
  border-top-color:rgba(255,255,255,.22); border-radius:16px;
  backdrop-filter:blur(20px) saturate(1.3); overflow:hidden;
  box-shadow:0 8px 32px rgba(0,0,0,.16),inset 0 1px 0 rgba(255,255,255,.12);
}
.adm-banner__kpi-head {
  display:flex; align-items:center; justify-content:space-between;
  padding:10px 16px 9px; border-bottom:1px solid rgba(255,255,255,.07);
  font-size:9.5px; font-weight:700; letter-spacing:.10em;
  text-transform:uppercase; color:rgba(255,255,255,.40);
}
.adm-kpi-live { display:inline-flex;align-items:center;gap:4px;font-size:9px;color:#4ade80;font-weight:700; }
.adm-kpi-live-dot { width:4px;height:4px;border-radius:50%;background:#4ade80;box-shadow:0 0 5px #4ade80;animation:admPulse 1.4s ease-in-out infinite; }
.adm-banner__kpi-rows { padding:8px 16px 12px; display:flex; flex-direction:column; }
.adm-banner__kpi-row { display:flex;align-items:center;justify-content:space-between;padding:8px 0; }
.adm-banner__kpi-sep { height:1px;background:rgba(255,255,255,.05); }
.adm-banner__kpi-lbl { font-size:11px;color:rgba(255,255,255,.42);font-weight:500; }
.adm-banner__kpi-val { font-size:17px;font-weight:800;letter-spacing:-.02em;color:#fff;font-family:var(--adm-head);line-height:1; }

/* ── STATS SECTION ── */
.adm-stats-section { margin-bottom:26px; }
.adm-stats-header {
  display:flex; align-items:center; justify-content:space-between;
  margin-bottom:14px; padding:0 2px;
}
.adm-stats-title {
  display:flex; align-items:center; gap:8px;
  font-size:11px; font-weight:700; color:var(--adm-sub);
  text-transform:uppercase; letter-spacing:.10em;
}
.adm-stats-badge {
  display:inline-flex; align-items:center; gap:6px;
  font-size:10.5px; font-weight:600; color:var(--adm-green);
  background:rgba(5,150,105,.07); border:1px solid rgba(5,150,105,.16);
  padding:4px 12px; border-radius:20px;
}
.adm-stats-badge-dot { width:5px;height:5px;border-radius:50%;background:var(--adm-green);animation:admPulse 2s ease-in-out infinite; }
.adm-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:20px; }

/* ── STAT CARD ── */
.adm-stat-card {
  position:relative; font-family:var(--adm-head); background:#fff;
  border-radius:18px; padding:1.25rem 1.4rem 1.1rem; cursor:default;
  overflow:hidden; border:1.5px solid rgba(0,0,0,.06);
  box-shadow:0 1px 3px rgba(0,0,0,.04),0 4px 14px rgba(0,0,0,.05);
  transition:box-shadow .32s cubic-bezier(.2,.9,.4,1),border-color .32s,transform .32s cubic-bezier(.2,.9,.4,1);
  will-change:transform,box-shadow;
}
.adm-stat-card::before {
  content:''; position:absolute; top:20%; left:0; width:3px; height:60%;
  border-radius:0 3px 3px 0; background:var(--adm-sc-solid,#2563eb);
  opacity:0; transition:opacity .32s;
}
.adm-stat-card:hover::before { opacity:1; }
.adm-stat-card:hover { border-color:rgba(0,0,0,.09); }
.adm-stat-shine {
  position:absolute; inset:0; pointer-events:none; border-radius:inherit;
  background:radial-gradient(ellipse 55% 45% at 18% 8%,rgba(255,255,255,.65) 0%,rgba(255,255,255,0) 100%);
  opacity:0; transition:opacity .4s; z-index:1;
}
.adm-stat-card:hover .adm-stat-shine { opacity:1; }
.adm-stat-body { position:relative; z-index:2; display:flex; flex-direction:column; width:100%; }
.adm-stat-top { display:flex; align-items:center; gap:12px; margin-bottom:1rem; }
.adm-stat-label { font-size:11px; font-weight:700; letter-spacing:.09em; text-transform:uppercase; color:#64748b; }
.adm-stat-icon {
  width:36px; height:36px; border-radius:12px;
  display:flex; align-items:center; justify-content:center;
  flex-shrink:0; font-size:1.1rem; line-height:1;
  box-shadow:0 3px 10px rgba(0,0,0,.07);
  transition:transform .28s cubic-bezier(.2,.9,.4,1.3);
}
.adm-stat-card:hover .adm-stat-icon { transform:scale(1.05) rotate(2deg); }
.adm-stat-val {
  font-family:var(--adm-mono); font-size:2.2rem; font-weight:700;
  line-height:1; letter-spacing:-.03em; margin-bottom:.75rem; margin-top:.25rem;
  display:flex; align-items:center; justify-content:center; text-align:center; width:100%;
}
.adm-stat-delta {
  display:flex; align-items:center; justify-content:center; gap:6px;
  font-size:.7rem; font-weight:700; padding:5px 12px; border-radius:100px;
  margin:0 auto; line-height:1; white-space:nowrap; width:fit-content;
}
.adm-stat-delta--up   { background:linear-gradient(135deg,#d1fae5,#a7f3d0); color:#065f46; }
.adm-stat-delta--neu  { background:#f1f5f9; color:#475569; border:1px solid rgba(0,0,0,.05); }

/* ── CARD ── */
.adm-card {
  background:var(--adm-card); border:1px solid var(--adm-border);
  border-radius:var(--adm-r-xl); overflow:hidden;
  box-shadow:var(--adm-sh); transition:all .25s var(--adm-ease);
}
.adm-card:hover { border-color:var(--adm-border-h); box-shadow:var(--adm-sh-md); transform:translateY(-2px); }
.adm-card__head {
  padding:16px 20px; border-bottom:1px solid var(--adm-border);
  display:flex; justify-content:space-between; align-items:center;
  background:#f8fafc;
}
.adm-card__head-l { display:flex; align-items:center; gap:10px; }
.adm-card__head-icon {
  width:30px; height:30px; border-radius:var(--adm-r-sm);
  display:flex; align-items:center; justify-content:center; flex-shrink:0;
}
.adm-card__head-icon--blue   { background:var(--adm-blue-faint);color:var(--adm-blue);border:1px solid var(--adm-blue-mid); }
.adm-card__head-icon--amber  { background:#fffbeb;color:var(--adm-amber);border:1px solid rgba(217,119,6,.18); }
.adm-card__head-icon--green  { background:rgba(5,150,105,.08);color:var(--adm-green);border:1px solid rgba(5,150,105,.18); }
.adm-card__title { font-size:13px; font-weight:600; color:var(--adm-navy); letter-spacing:-.01em; }
.adm-card__total { font-size:11px; font-weight:600; color:var(--adm-muted); background:#f1f5f9; border:1px solid var(--adm-border); padding:3px 10px; border-radius:20px; }

.adm-three-col { display:grid; grid-template-columns:1fr 1fr 1fr; gap:18px; margin-bottom:18px; }
.adm-two-col   { display:grid; grid-template-columns:1fr; gap:18px; margin-bottom:18px; }

/* ── ACTIVITY ── */
.adm-activity { padding:0; }
.adm-act-item { display:flex; align-items:flex-start; gap:11px; padding:12px 20px; border-bottom:1px solid var(--adm-border); }
.adm-act-item:last-child { border:none; }
.adm-act-dot { width:30px;height:30px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px; }
.adm-act-text { font-size:12.5px;color:var(--adm-navy);line-height:1.4; }
.adm-act-time { font-size:10.5px;color:var(--adm-muted);margin-top:2px;font-family:var(--adm-mono); }

/* ── ZONE TABLE ── */
.adm-zone-table { width:100%; border-collapse:collapse; }
.adm-zone-table th { padding:10px 16px;text-align:left;font-size:10px;font-family:var(--adm-mono);letter-spacing:.10em;text-transform:uppercase;color:var(--adm-muted);background:#f8fafc;border-bottom:1px solid var(--adm-border); }
.adm-zone-table td { padding:12px 16px;font-size:13px;border-bottom:1px solid var(--adm-border);color:var(--adm-navy);vertical-align:middle; }
.adm-zone-table tr:last-child td { border-bottom:none; }
.adm-zone-table tbody tr:hover td { background:var(--adm-blue-faint); }

/* ── LOADER ── */
.adm-loader { display:flex;align-items:center;justify-content:center;min-height:400px; }
.adm-loader__ring { width:40px;height:40px;border-radius:50%;border:3px solid #dbeafe;border-top-color:#2563eb;animation:admSpin .8s linear infinite;margin:0 auto 14px; }

@keyframes admFadeIn { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
@keyframes admSpin   { to{transform:rotate(360deg);} }
@keyframes admFadeUp { from{opacity:0;transform:translateY(18px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);} }

.adm-fade-1 { animation:admFadeIn .4s var(--adm-ease) both; }
.adm-fade-2 { animation:admFadeIn .4s .06s var(--adm-ease) both; }
.adm-fade-3 { animation:admFadeIn .4s .12s var(--adm-ease) both; }
.adm-stg-1  { animation:admFadeUp .5s cubic-bezier(.2,.9,.4,1) .04s both; }
.adm-stg-2  { animation:admFadeUp .5s cubic-bezier(.2,.9,.4,1) .10s both; }
.adm-stg-3  { animation:admFadeUp .5s cubic-bezier(.2,.9,.4,1) .16s both; }
.adm-stg-4  { animation:admFadeUp .5s cubic-bezier(.2,.9,.4,1) .22s both; }
.recharts-wrapper { animation:admFadeIn .5s var(--adm-ease); }

@media (max-width:1280px) { .adm-stats-grid{grid-template-columns:repeat(2,1fr);} .adm-three-col{grid-template-columns:1fr 1fr;} }
@media (max-width:960px)  { .adm-banner{flex-direction:column;align-items:flex-start;} .adm-banner__kpi-panel{display:none;} .adm-three-col{grid-template-columns:1fr;} }
@media (max-width:640px)  { .adm-stats-grid{grid-template-columns:1fr 1fr;gap:14px;} .adm-page{padding:14px 16px;} .adm-banner{padding:18px 20px;border-radius:16px;} }
`;

const STATUS_COLORS = {
  DEMANDE_EN_COURS:           '#7c3aed',
  DEMANDE_ACCEPTE:            '#059669',
  DEMANDE_REJETE:             '#e11d48',
  PLAN_EN_COURS:              '#2563eb',
  PLAN_EN_ATTENTE_VALIDATION: '#d97706',
  PLAN_VALIDE:                '#059669',
  PLAN_REJETE:                '#e11d48',
  PLAN_TESTE:                 '#6d28d9',
};
const STATUS_LABELS = {
  DEMANDE_EN_COURS:           'Demande en cours',
  DEMANDE_ACCEPTE:            'Demande acceptée',
  DEMANDE_REJETE:             'Demande rejetée',
  PLAN_EN_COURS:              'Plan en cours',
  PLAN_EN_ATTENTE_VALIDATION: 'En attente validation',
  PLAN_VALIDE:                'Plan validé',
  PLAN_REJETE:                'Plan rejeté',
  PLAN_TESTE:                 'Plan testé',
};
const MONTH_LABELS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'];

const STAT_PALETTES = [
  { solid:'#2563eb', bg:'linear-gradient(135deg,#eff6ff 0%,#dbeafe 100%)', text:'#2563eb', delta:'up' },
  { solid:'#059669', bg:'linear-gradient(135deg,#f0fdfa 0%,#ccfbf1 100%)', text:'#059669', delta:'up' },
  { solid:'#7c3aed', bg:'linear-gradient(135deg,#f5f3ff 0%,#ede9fe 100%)', text:'#7c3aed', delta:'neu' },
  { solid:'#d97706', bg:'linear-gradient(135deg,#fffbeb 0%,#fef3c7 100%)', text:'#d97706', delta:'neu' },
];

/* ── Live clock ── */
function LiveClock() {
  const [t, setT] = useState(new Date());
  useEffect(() => { const id = setInterval(() => setT(new Date()), 1000); return () => clearInterval(id); }, []);
  const p = n => String(n).padStart(2, '0');
  return (
    <div className="adm-clock">
      <div className="adm-clock__dot" />
      <span className="adm-clock__time">{p(t.getHours())}:{p(t.getMinutes())}<span style={{ opacity:.5 }}>:{p(t.getSeconds())}</span></span>
      <span className="adm-clock__date">· {t.toLocaleDateString('fr-FR', { weekday:'short', day:'numeric', month:'short' })}</span>
    </div>
  );
}

/* ── Animated counter ── */
function useCounter(target, delay = 0) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!target || target <= 0) { setVal(target || 0); return; }
    const to = setTimeout(() => {
      let cur = 0;
      const step = 16, inc = target / (1100 / step);
      const id = setInterval(() => {
        cur += inc;
        if (cur >= target) { setVal(target); clearInterval(id); }
        else setVal(Math.floor(cur));
      }, step);
      return () => clearInterval(id);
    }, delay);
    return () => clearTimeout(to);
  }, [target, delay]);
  return val;
}

/* ── Stat card ── */
function StatCard({ label, value, icon, delta, deltaLabel, idx }) {
  const p = STAT_PALETTES[idx % 4];
  const display = useCounter(value, idx * 80);
  const cardRef = useRef(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });
  return (
    <div
      ref={cardRef}
      className={`adm-stat-card adm-stg-${idx + 1}`}
      style={{ '--adm-sc-solid': p.solid,
        transform: `perspective(700px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)` }}
      onMouseMove={e => {
        const r = cardRef.current?.getBoundingClientRect();
        if (!r) return;
        setTilt({ rx: -((e.clientY - r.top) / r.height - .5) * 12, ry: ((e.clientX - r.left) / r.width - .5) * 12 });
      }}
      onMouseLeave={() => setTilt({ rx: 0, ry: 0 })}
    >
      <div className="adm-stat-shine" />
      <div className="adm-stat-body">
        <div className="adm-stat-top">
          <div className="adm-stat-icon" style={{ background: p.bg }}>
            <span style={{ color: p.text }}>{icon}</span>
          </div>
          <div className="adm-stat-label">{label}</div>
        </div>
        <div className="adm-stat-val" style={{ color: p.solid }}>{display.toLocaleString('fr-FR')}</div>
        <div className={`adm-stat-delta adm-stat-delta--${delta || 'neu'}`}>
          {delta === 'up' && <span style={{ fontSize: 9 }}>▲</span>}
          <span>{deltaLabel || 'Statistique'}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Custom tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background:'#fff', padding:'10px 14px', borderRadius:12, color:'#0f172a',
      border:'1px solid #e2e8f0', boxShadow:'0 4px 6px rgba(15,23,42,.05),0 12px 32px rgba(15,23,42,.10)',
      fontFamily:"'Inter',sans-serif", fontSize:12, minWidth:110 }}>
      {label && <div style={{ fontSize:10, color:'#94a3b8', marginBottom:6, textTransform:'uppercase', letterSpacing:'.09em', fontWeight:600 }}>{label}</div>}
      {payload.map((p, i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:7, marginTop: i > 0 ? 4 : 0 }}>
          <span style={{ width:8, height:8, borderRadius:'50%', background:p.color, display:'inline-block' }} />
          <span style={{ fontWeight:700, color:'#0f172a' }}>{p.value}</span>
          {p.name && <span style={{ color:'#94a3b8', fontSize:10 }}>{STATUS_LABELS[p.name] || p.name}</span>}
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════
   ADMIN DASHBOARD
══════════════════════════════════════════ */
function AdminDashboard({ stats, user }) {
  const navigate = useNavigate();
  const s = stats || {};
  const totalPlans = s.totalPlans || 0;
  const valides = s.plansValides || 0;
  const tauxValidation = totalPlans > 0 ? Math.round((valides / totalPlans) * 100) : 0;

  /* StatCards */
  const statCards = [
    { label:'Total plans',       value: s.totalPlans      || 0, icon:'📋', deltaLabel:`${s.plansDemandeEnCours || 0} demande(s) en cours`, delta:'up' },
    { label:'Plans validés',     value: s.plansValides    || 0, icon:'✅', deltaLabel:`${tauxValidation}% du total`,                        delta:'up' },
    { label:'Utilisateurs',      value: s.totalUtilisateurs||0, icon:'👥', deltaLabel:`${s.totalZones || 0} zones couvertes`,               delta:'neu' },
    { label:'Équipements',       value: s.totalEquipements||0,  icon:'⚙️', deltaLabel:'Parc industriel',                                     delta:'neu' },
  ];

  /* Pie data */
  const pieData = [
    { statut:'DEMANDE_EN_COURS',           count: s.plansDemandeEnCours        || 0 },
    { statut:'DEMANDE_ACCEPTE',            count: s.plansDemandeAccepte        || 0 },
    { statut:'DEMANDE_REJETE',             count: s.plansDemandeRejete         || 0 },
    { statut:'PLAN_EN_COURS',              count: s.plansEnCours               || 0 },
    { statut:'PLAN_EN_ATTENTE_VALIDATION', count: s.plansEnAttenteValidation   || 0 },
    { statut:'PLAN_VALIDE',               count: s.plansValides               || 0 },
    { statut:'PLAN_REJETE',               count: s.plansRejetes               || 0 },
    { statut:'PLAN_TESTE',                count: s.plansTestes                || 0 },
  ].filter(d => d.count > 0);

  /* Bar data (zones) */
  const barData = (s.statsParZone || []).map(z => ({ zone: z.zoneCode, total: z.totalPlans, valides: z.plansValides }));

  /* Area data (monthly) */
  const areaData = Object.entries(s.plansParMois || {}).map(([k, v]) => {
    const [, m] = k.split('-');
    return { month: MONTH_LABELS[(parseInt(m, 10) - 1)] || k, count: v };
  });

  return (
    <div className="adm-page">

      {/* ══ BANNER ══ */}
      <div className="adm-banner adm-fade-1">
        <div className="adm-banner__orb adm-banner__orb--1" />
        <div className="adm-banner__orb adm-banner__orb--2" />
        <div className="adm-banner__orb adm-banner__orb--3" />
        <div className="adm-banner__grid" />

        <div className="adm-banner__content">
          <LiveClock />
          <div className="adm-banner__eyebrow">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity:.7 }}>
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>
            </svg>
            Espace Administrateur
          </div>
          <h1 className="adm-banner__greeting">
            Bonjour, <span className="adm-banner__greeting-name">{user?.prenom} {user?.nom}</span>
          </h1>
          <div className="adm-banner__badges">
            <span className="adm-banner__badge adm-banner__badge--green">
              <span className="adm-banner__badge-dot" style={{ background:'#4ade80' }} />
              Système opérationnel
            </span>
            <span className="adm-banner__badge adm-banner__badge--gold">
              <span className="adm-banner__badge-dot" style={{ background:'#fbbf24', animationDelay:'.4s' }} />
              {totalPlans} plan{totalPlans !== 1 ? 's' : ''} actifs
            </span>
            <span className="adm-banner__badge adm-banner__badge--blue">
              <span className="adm-banner__badge-dot" style={{ background:'rgba(255,255,255,.88)', animationDelay:'.8s' }} />
              {tauxValidation}% validés
            </span>
          </div>
        </div>

        <div className="adm-banner__kpi-panel">
          <div className="adm-banner__kpi-head">
            <span>Résumé</span>
            <span className="adm-kpi-live"><span className="adm-kpi-live-dot" />Temps réel</span>
          </div>
          <div className="adm-banner__kpi-rows">
            <div className="adm-banner__kpi-row">
              <span className="adm-banner__kpi-lbl">Total plans</span>
              <span className="adm-banner__kpi-val">{totalPlans}</span>
            </div>
            <div className="adm-banner__kpi-sep" />
            <div className="adm-banner__kpi-row">
              <span className="adm-banner__kpi-lbl">Validés</span>
              <span className="adm-banner__kpi-val" style={{ color:'#4ade80' }}>{valides}</span>
            </div>
            <div className="adm-banner__kpi-sep" />
            <div className="adm-banner__kpi-row">
              <span className="adm-banner__kpi-lbl">Taux</span>
              <span className="adm-banner__kpi-val" style={{ color:'#fbbf24' }}>{tauxValidation}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* ══ STAT CARDS ══ */}
      <div className="adm-stats-section adm-fade-2">
        <div className="adm-stats-header">
          <div className="adm-stats-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Indicateurs clés
          </div>
          <div className="adm-stats-badge">
            <span className="adm-stats-badge-dot" />Synchronisé
          </div>
        </div>
        <div className="adm-stats-grid">
          {statCards.map((sc, i) => <StatCard key={i} {...sc} idx={i} />)}
        </div>
      </div>

      {/* ══ CHARTS ══ */}
      <div className="adm-three-col adm-fade-3">

        {/* Pie — Plans par statut */}
        <div className="adm-card">
          <div className="adm-card__head">
            <div className="adm-card__head-l">
              <span className="adm-card__head-icon adm-card__head-icon--blue">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>
                </svg>
              </span>
              <span className="adm-card__title">Plans par statut</span>
            </div>
            {totalPlans > 0 && <span className="adm-card__total">{totalPlans} plans</span>}
          </div>
          {pieData.length > 0 ? (
            <div style={{ padding:'12px 0 8px' }}>
              <ResponsiveContainer width="100%" height={190}>
                <PieChart>
                  <Pie data={pieData} dataKey="count" nameKey="statut" cx="50%" cy="50%" outerRadius={80} innerRadius={48} paddingAngle={3} animationBegin={0} animationDuration={900}>
                    {pieData.map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry.statut] || '#94a3b8'} stroke="#fff" strokeWidth={2} />)}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div style={{ padding:'0 16px 12px', display:'flex', flexWrap:'wrap', gap:'6px 12px' }}>
                {pieData.map((item, i) => (
                  <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
                    <div style={{ width:8, height:8, borderRadius:3, background:STATUS_COLORS[item.statut]||'#94a3b8', flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#64748b', fontWeight:500 }}>
                      {STATUS_LABELS[item.statut] || item.statut}
                      <strong style={{ color:'#0f172a', marginLeft:4 }}>{item.count}</strong>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : <div style={{ padding:'40px 20px', textAlign:'center', color:'#94a3b8', fontSize:13, fontStyle:'italic' }}>Aucune donnée</div>}
        </div>

        {/* Bar — Plans par zone */}
        <div className="adm-card">
          <div className="adm-card__head">
            <div className="adm-card__head-l">
              <span className="adm-card__head-icon adm-card__head-icon--amber">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
                </svg>
              </span>
              <span className="adm-card__title">Plans par zone</span>
            </div>
          </div>
          {barData.length > 0 ? (
            <div style={{ padding:'12px 0 8px' }}>
              <ResponsiveContainer width="100%" height={190}>
                <BarChart data={barData} barSize={22} layout="vertical" margin={{ left:16, right:24, top:4, bottom:4 }}>
                  <CartesianGrid horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="zone" tick={{ fontSize:11, fill:'#64748b', fontWeight:500 }} width={60} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar dataKey="total" radius={[0,8,8,0]} fill="#2563eb" />
                  <Bar dataKey="valides" radius={[0,8,8,0]} fill="#059669" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : <div style={{ padding:'40px 20px', textAlign:'center', color:'#94a3b8', fontSize:13, fontStyle:'italic' }}>Aucune donnée</div>}
        </div>

        {/* Area — Évolution mensuelle */}
        <div className="adm-card">
          <div className="adm-card__head">
            <div className="adm-card__head-l">
              <span className="adm-card__head-icon adm-card__head-icon--green">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
                </svg>
              </span>
              <span className="adm-card__title">Évolution mensuelle</span>
            </div>
          </div>
          {areaData.length > 0 ? (
            <div style={{ padding:'12px 0 8px' }}>
              <ResponsiveContainer width="100%" height={190}>
                <AreaChart data={areaData} margin={{ left:0, right:16, top:4, bottom:4 }}>
                  <defs>
                    <linearGradient id="admAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#2563eb" stopOpacity={0.20} />
                      <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="4 4" />
                  <XAxis dataKey="month" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} width={28} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area type="monotone" dataKey="count" stroke="#2563eb" strokeWidth={2.5} fill="url(#admAreaGrad)" dot={{ r:3, fill:'#2563eb', strokeWidth:0 }} activeDot={{ r:5, fill:'#2563eb', stroke:'#eff6ff', strokeWidth:2 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : <div style={{ padding:'40px 20px', textAlign:'center', color:'#94a3b8', fontSize:13, fontStyle:'italic' }}>Aucune donnée mensuelle</div>}
        </div>
      </div>

      {/* ══ BACKUP DES PLANS ══ */}
      <div className="adm-three-col adm-fade-3" style={{ marginTop: 20 }}>
        <BackupPanel />
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════
   NON-ADMIN DASHBOARD (Chargé / Chargé Travaux)
══════════════════════════════════════════ */

/* Jauge circulaire SVG */
function RadialGauge({ pct, color, size = 110, stroke = 10, label }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = Math.min(pct, 100) / 100 * circ;
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:6 }}>
      <div style={{ position:'relative', width:size, height:size }}>
        <svg width={size} height={size} style={{ transform:'rotate(-90deg)' }}>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f0ece3" strokeWidth={stroke}/>
          <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition:'stroke-dasharray 1.2s cubic-bezier(.4,0,.2,1)' }}/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <span style={{ fontSize:22, fontWeight:800, color, lineHeight:1 }}>{Math.round(pct)}%</span>
          <span style={{ fontSize:9, color:'#94a3b8', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase', marginTop:2 }}>taux</span>
        </div>
      </div>
      {label && <span style={{ fontSize:11, fontWeight:700, color:'#64748b', textAlign:'center' }}>{label}</span>}
    </div>
  );
}

/* KPI card */
function ChgKpi({ label, value, color, bg, border }) {
  return (
    <div style={{ background:bg||'#fff', border:`1.5px solid ${border||'#e8e4dc'}`, borderRadius:12, padding:'14px 16px',
      display:'flex', flexDirection:'column', gap:4, transition:'all .2s', cursor:'default', position:'relative', overflow:'hidden' }}
      onMouseEnter={e=>{ e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow='0 6px 20px rgba(0,0,0,.08)'; }}
      onMouseLeave={e=>{ e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow=''; }}>
      <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:color, borderRadius:'12px 12px 0 0', opacity:.7 }}/>
      <span style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700 }}>{label}</span>
      <span style={{ fontSize:28, fontWeight:800, color, letterSpacing:'-.03em', lineHeight:1 }}>{value ?? '—'}</span>
    </div>
  );
}

/* Section header */
function ChgSection({ title, color }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'20px 0 10px' }}>
      <div style={{ width:3, height:16, background:color, borderRadius:2 }}/>
      <span style={{ fontSize:10, fontWeight:700, color:'#64748b', textTransform:'uppercase', letterSpacing:'.12em' }}>{title}</span>
    </div>
  );
}

function ChargeDashboard({ stats, user }) {
  const s = stats || {};
  const total         = s.totalPlans              || 0;
  const demEnCours    = s.plansDemandeEnCours     || 0;
  const demAccepte    = s.plansDemandeAccepte     || 0;
  const demRejete     = s.plansDemandeRejete      || 0;
  const planEnCours   = s.plansEnCours            || 0;
  const planAttente   = s.plansEnAttenteValidation|| 0;
  const planValide    = s.plansValides            || 0;
  const planRejete    = s.plansRejetes            || 0;
  const planTeste     = s.plansTestes             || 0;
  const tauxVal       = total > 0 ? (planValide / total) * 100 : 0;
  const tauxRej       = total > 0 ? (planRejete / total) * 100 : 0;
  const tauxSoumis    = total > 0 ? (planAttente / total) * 100 : 0;

  const isTravaux = user?.role === 'CHARGE_TRAVAUX';
  const roleLabel = isTravaux ? 'Chargé des Travaux' : 'Chargé de Consignation';

  const areaData = Object.entries(s.plansParMois || {}).map(([k, v]) => {
    const [, m] = k.split('-');
    return { month: MONTH_LABELS[(parseInt(m, 10) - 1)] || k, count: v };
  });

  return (
    <div style={{ padding:'24px 28px', fontFamily:"'Inter',sans-serif", background:'#f4f2ee', minHeight:'100vh' }}>

      {/* ── BANNER ── */}
      <div style={{ background:'linear-gradient(135deg,#0f1e35 0%,#162844 50%,#1e3558 100%)', borderRadius:18, padding:'24px 30px', marginBottom:22, position:'relative', overflow:'hidden', border:'1px solid rgba(201,168,76,.15)', boxShadow:'0 8px 32px rgba(15,30,53,.18)' }}>
        <div style={{ position:'absolute', top:0, left:'8%', right:'8%', height:1, background:'linear-gradient(90deg,transparent,rgba(201,168,76,.35),transparent)' }}/>
        <div style={{ position:'absolute', right:-40, top:-40, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle,rgba(201,168,76,.08) 0%,transparent 70%)', pointerEvents:'none' }}/>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:20 }}>
          <div>
            <div style={{ fontSize:9.5, color:'rgba(201,168,76,.65)', fontFamily:'monospace', letterSpacing:'.16em', textTransform:'uppercase', marginBottom:8 }}>
              {new Date().toLocaleDateString('fr-FR',{weekday:'long',day:'numeric',month:'long'})}
            </div>
            <div style={{ fontSize:21, fontWeight:800, color:'#fff', letterSpacing:'-.03em', marginBottom:5 }}>
              Bonjour, <span style={{ color:'#c9a84c' }}>{user?.prenom} {user?.nom}</span>
            </div>
            <div style={{ fontSize:12.5, color:'rgba(255,255,255,.38)' }}>{roleLabel} · {user?.zoneCode || 'Zone non assignée'}</div>
            <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
              {planValide > 0 && <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(16,185,129,.12)', color:'#34d399', border:'1px solid rgba(16,185,129,.22)' }}>✓ {planValide} validé{planValide>1?'s':''}</span>}
              {planAttente > 0 && <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(37,99,235,.12)', color:'#60a5fa', border:'1px solid rgba(37,99,235,.22)' }}>⏳ {planAttente} en attente</span>}
              {demEnCours > 0 && <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:20, fontSize:11, fontWeight:600, background:'rgba(255,255,255,.07)', color:'rgba(255,255,255,.55)', border:'1px solid rgba(255,255,255,.12)' }}>📋 {demEnCours} demande{demEnCours>1?'s':''}</span>}
            </div>
          </div>
          {/* mini-panel */}
          <div style={{ flexShrink:0, background:'rgba(255,255,255,.06)', border:'1px solid rgba(255,255,255,.10)', borderRadius:14, padding:'14px 18px', minWidth:160, backdropFilter:'blur(12px)' }}>
            <div style={{ fontSize:9, color:'rgba(255,255,255,.3)', textTransform:'uppercase', letterSpacing:'.12em', fontWeight:700, marginBottom:10 }}>Vue d'ensemble</div>
            {[
              { lbl:'Total',      val:total,      col:'rgba(255,255,255,.8)' },
              { lbl:'Validés',    val:planValide, col:'#34d399' },
              { lbl:'En cours',   val:planEnCours,col:'#fbbf24' },
              { lbl:'Équipements',val:s.totalEquipements||0, col:'rgba(255,255,255,.5)' },
            ].map((r,i) => (
              <div key={i}>
                {i>0 && <div style={{ height:1, background:'rgba(255,255,255,.05)', margin:'5px 0' }}/>}
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'4px 0' }}>
                  <span style={{ fontSize:11, color:'rgba(255,255,255,.38)' }}>{r.lbl}</span>
                  <span style={{ fontSize:15, fontWeight:800, color:r.col }}>{r.val}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── TOTAL ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr', marginBottom:2 }}>
        <ChgKpi label="Total plans" value={total} color="#0f1e35" border="#e8e4dc"/>
      </div>

      {/* ── DEMANDES ── */}
      <ChgSection title="Demandes (3 statuts)" color="#7c3aed"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:12 }}>
        <ChgKpi label="Demande en cours"  value={demEnCours}  color="#475569" bg="rgba(71,85,105,.04)"  border="rgba(71,85,105,.18)"/>
        <ChgKpi label="Demande acceptée"  value={demAccepte}  color="#059669" bg="rgba(5,150,105,.04)"  border="rgba(5,150,105,.18)"/>
        <ChgKpi label="Demande rejetée"   value={demRejete}   color="#e11d48" bg="rgba(225,29,72,.04)"  border="rgba(225,29,72,.18)"/>
      </div>

      {/* ── PLANS ── */}
      <ChgSection title="Plans de consignation (5 statuts)" color="#2563eb"/>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        <ChgKpi label="Plan en cours"      value={planEnCours}  color="#d97706" bg="rgba(217,119,6,.04)"   border="rgba(217,119,6,.18)"/>
        <ChgKpi label="Soumis validation"  value={planAttente}  color="#2563eb" bg="rgba(37,99,235,.04)"  border="rgba(37,99,235,.18)"/>
        <ChgKpi label="Plan validé"        value={planValide}   color="#059669" bg="rgba(5,150,105,.04)"  border="rgba(5,150,105,.18)"/>
        <ChgKpi label="Plan rejeté"        value={planRejete}   color="#e11d48" bg="rgba(225,29,72,.04)"  border="rgba(225,29,72,.18)"/>
        <ChgKpi label="Plan testé"         value={planTeste}    color="#6d28d9" bg="rgba(109,40,217,.04)" border="rgba(109,40,217,.18)"/>
      </div>

      {/* ── GRAPHIQUES ── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:14, marginTop:20 }}>

        {/* Jauge validation */}
        <div style={{ background:'#fff', border:'1.5px solid #e8e4dc', borderRadius:14, padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#0f1e35', textTransform:'uppercase', letterSpacing:'.09em' }}>Taux de validation</span>
          <RadialGauge pct={tauxVal} color="#059669" label="Plans validés / total"/>
        </div>

        {/* Jauge rejet */}
        <div style={{ background:'#fff', border:'1.5px solid #e8e4dc', borderRadius:14, padding:'20px 16px', display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#0f1e35', textTransform:'uppercase', letterSpacing:'.09em' }}>Taux en attente</span>
          <RadialGauge pct={tauxSoumis} color="#2563eb" label="Plans soumis / total"/>
          <div style={{ width:'100%', marginTop:4 }}>
            <div style={{ display:'flex', justifyContent:'space-between', fontSize:10.5, color:'#64748b', marginBottom:4 }}>
              <span>Rejet</span><span style={{ fontWeight:700, color:'#e11d48' }}>{Math.round(tauxRej)}%</span>
            </div>
            <div style={{ height:4, background:'#f0ece3', borderRadius:3, overflow:'hidden' }}>
              <div style={{ height:'100%', width:`${tauxRej}%`, background:'#e11d48', borderRadius:3, transition:'width 1s ease' }}/>
            </div>
          </div>
        </div>

        {/* Évolution mensuelle */}
        <div style={{ background:'#fff', border:'1.5px solid #e8e4dc', borderRadius:14, padding:'20px 16px' }}>
          <span style={{ fontSize:11, fontWeight:700, color:'#0f1e35', textTransform:'uppercase', letterSpacing:'.09em', display:'block', marginBottom:12 }}>Évolution mensuelle</span>
          {areaData.length > 0 ? (
            <ResponsiveContainer width="100%" height={130}>
              <AreaChart data={areaData} margin={{ left:0, right:4, top:4, bottom:0 }}>
                <defs>
                  <linearGradient id="chgGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0f1e35" stopOpacity={0.15}/>
                    <stop offset="100%" stopColor="#0f1e35" stopOpacity={0.01}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" tick={{ fontSize:9, fill:'#94a3b8' }} axisLine={false} tickLine={false}/>
                <Tooltip content={<ChartTooltip />}/>
                <Area type="monotone" dataKey="count" stroke="#c9a84c" strokeWidth={2.5} fill="url(#chgGrad)" dot={{ r:3, fill:'#c9a84c' }} activeDot={{ r:5 }}/>
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height:130, display:'flex', alignItems:'center', justifyContent:'center', color:'#94a3b8', fontSize:12 }}>Aucune donnée</div>
          )}
        </div>
      </div>

    </div>
  );
}

/* ══════════════════════════════════════════
   ROOT EXPORT
══════════════════════════════════════════ */
export default function DashboardPage() {
  const { user, isAdmin, isChargeTravaux } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    dashboardService.getStats()
      .then(setStats)
      .catch(err => {
        // 401 = session invalide : l'intercepteur global (services/api.js) nettoie déjà
        // sessionStorage et redirige vers /login — afficher une erreur stats ici serait
        // trompeur (le vrai problème n'est pas "les statistiques", c'est l'authentification).
        if (err.response?.status !== 401) {
          setError('Impossible de charger les statistiques.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <style>{ADM_CSS}</style>
        <div className="adm-loader">
          <div style={{ textAlign:'center' }}>
            <div className="adm-loader__ring" />
            <div style={{ fontSize:13, color:'#94a3b8', fontWeight:500 }}>Chargement du tableau de bord…</div>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <style>{ADM_CSS}</style>
        <div style={{ padding:28 }}>
          <div style={{ background:'#fef2f2', color:'#b91c1c', padding:16, borderRadius:12, border:'1px solid #fca5a5' }}>⚠ {error}</div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{ADM_CSS}</style>
      {isAdmin()
        ? <AdminDashboard stats={stats} user={user} />
        : <ChargeDashboard stats={stats} user={user} />}
    </>
  );
}
