import React, { useState, useRef, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MessageriePanel from './MessageriePanel';
import AssistantWidget from './AssistantWidget';

const PAGE_TITLES = {
  '/dashboard':    { title: 'Tableau de bord',         sub: 'Vue d\'ensemble des consignations' },
  '/equipements':  { title: 'Équipements',              sub: 'Gestion des équipements et zones' },
  '/utilisateurs': { title: 'Utilisateurs',             sub: 'Gestion des comptes utilisateurs' },
  '/dispositifs':  { title: 'Dispositifs d\'isolation', sub: 'Gestion du matériel de consignation' },
};

/* ── SVG Icons ── */
const IcShield = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    <polyline points="9 12 11 14 15 10"/>
  </svg>
);
const IcDashboard = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcEquipements = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
    <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 7.76a6 6 0 0 0 0 8.49"/>
  </svg>
);
const IcUsers = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcBell = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const IcChevronDown = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>
);
const IcLogout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IcUserCircle = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
    <circle cx="12" cy="7" r="4"/>
  </svg>
);

const TOPBAR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

:root {
  --tb-white:      #ffffff;
  --tb-bg:         #f8fafc;
  --tb-border:     #e2e8f0;
  --tb-text:       #0f172a;
  --tb-sub:        #64748b;
  --tb-muted:      #94a3b8;
  --tb-blue:       #2563eb;
  --tb-blue-dark:  #1e40af;
  --tb-blue-faint: #eff6ff;
  --tb-blue-mid:   #dbeafe;
  --tb-green:      #059669;
  --tb-green-bg:   rgba(5,150,105,0.08);
  --tb-red:        #e11d48;
  --tb-shadow:     0 1px 3px rgba(15,23,42,0.05), 0 1px 2px rgba(15,23,42,0.04);
  --tb-ease:       cubic-bezier(0.4, 0, 0.2, 1);
  --tb-ease-out:   cubic-bezier(0.22, 1, 0.36, 1);
}

.topbar {
  background: rgba(255,255,255,0.92);
  backdrop-filter: blur(20px) saturate(1.4);
  -webkit-backdrop-filter: blur(20px) saturate(1.4);
  border-bottom: 1px solid var(--tb-border);
  padding: 0 28px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: var(--tb-shadow);
  transition: all 0.2s var(--tb-ease);
  flex-shrink: 0;
}
.topbar::after {
  content: '';
  position: absolute; bottom: 0; left: 0; right: 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(37,99,235,0.18), rgba(13,148,136,0.14), transparent);
  opacity: 0.6;
}

.topbar__left {
  display: flex;
  align-items: flex-start;
  gap: 0;
}
.topbar__page-indicator {
  display: flex;
  align-items: center;
  gap: 14px;
}
.topbar__page-accent {
  width: 3px;
  height: 38px;
  border-radius: 2px;
  background: linear-gradient(180deg, var(--tb-blue-dark) 0%, var(--tb-blue) 100%);
  flex-shrink: 0;
  box-shadow: 0 0 10px rgba(37,99,235,0.35);
}
.topbar__page-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.topbar__title {
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: var(--tb-text);
  line-height: 1.15;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
}
.topbar__sub {
  font-size: 11px;
  color: var(--tb-muted);
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 5px;
  font-weight: 400;
  letter-spacing: 0.01em;
}
.topbar__sub-icon {
  display: flex; align-items: center;
  color: var(--tb-muted); opacity: 0.6;
}

.topbar__right {
  display: flex;
  align-items: center;
  gap: 10px;
}
.topbar__divider {
  width: 1px; height: 24px;
  background: var(--tb-border);
  flex-shrink: 0;
}

.topbar__status {
  display: flex; align-items: center; gap: 7px;
  padding: 6px 14px;
  background: rgba(5,150,105,0.07);
  border: 1px solid rgba(5,150,105,0.18);
  border-radius: 40px;
  font-size: 12px; font-weight: 600;
  color: var(--tb-green);
  transition: all 0.2s var(--tb-ease);
  white-space: nowrap;
}
.topbar__status:hover { background: rgba(5,150,105,0.12); transform: translateY(-1px); }
.topbar__status svg { width: 11px; height: 11px; }
.topbar__status-dot {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--tb-green);
  animation: topbarPulse 2s ease-in-out infinite;
  box-shadow: 0 0 0 2px rgba(5,150,105,0.18);
  flex-shrink: 0;
}
@keyframes topbarPulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%       { opacity: 0.55; transform: scale(1.2); }
}

.topbar__logout {
  display: flex; align-items: center; gap: 7px;
  padding: 8px 16px;
  background: transparent;
  color: var(--tb-sub);
  border: 1.5px solid var(--tb-border);
  border-radius: 10px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 12.5px; font-weight: 600;
  cursor: pointer;
  transition: all 0.2s var(--tb-ease-out);
  letter-spacing: 0.01em;
  white-space: nowrap;
}
.topbar__logout:hover {
  background: rgba(225,29,72,0.06);
  border-color: rgba(225,29,72,0.35);
  color: var(--tb-red);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(225,29,72,0.10);
}
.topbar__logout svg { transition: transform 0.2s var(--tb-ease); }
.topbar__logout:hover svg { transform: translateX(3px); }

.logout-overlay {
  position: fixed; inset: 0;
  background: rgba(15,23,42,0.45);
  backdrop-filter: blur(6px) saturate(0.9);
  -webkit-backdrop-filter: blur(6px) saturate(0.9);
  display: flex; align-items: center; justify-content: center;
  z-index: 9999;
  animation: fadeOverlay 0.2s ease both;
}
@keyframes fadeOverlay { from { opacity: 0; } to { opacity: 1; } }

.logout-modal {
  background: var(--tb-white);
  border-radius: 24px;
  width: 400px;
  padding: 34px;
  box-shadow: 0 4px 6px rgba(15,23,42,0.05), 0 24px 80px rgba(15,23,42,0.18);
  border: 1px solid var(--tb-border);
  text-align: center;
  animation: modalSlideUp 0.28s cubic-bezier(0.34, 1.2, 0.64, 1) both;
}
@keyframes modalSlideUp {
  from { opacity: 0; transform: translateY(24px) scale(0.97); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
}
.logout-modal__icon {
  width: 64px; height: 64px; border-radius: 50%;
  background: rgba(225,29,72,0.07);
  border: 2px solid rgba(225,29,72,0.14);
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px; color: var(--tb-red);
}
.logout-modal__title {
  font-size: 20px; font-weight: 700;
  color: var(--tb-text); letter-spacing: -0.02em; margin-bottom: 10px;
  font-family: 'Plus Jakarta Sans', 'Inter', system-ui, sans-serif;
}
.logout-modal__msg {
  font-size: 13.5px; color: var(--tb-sub);
  line-height: 1.65; margin-bottom: 22px;
}
.logout-modal__user {
  display: flex; align-items: center; gap: 12px;
  padding: 12px 16px;
  background: var(--tb-bg);
  border: 1px solid var(--tb-border);
  border-radius: 12px;
  text-align: left; margin-bottom: 26px;
}
.logout-modal__avatar {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; font-weight: 700; color: #fff;
  flex-shrink: 0; text-transform: uppercase;
  box-shadow: 0 3px 10px rgba(37,99,235,0.28);
}
.logout-modal__name { font-size: 13.5px; font-weight: 600; color: var(--tb-text); margin-bottom: 3px; }
.logout-modal__email { font-size: 11px; color: var(--tb-muted); }
.logout-modal__actions { display: flex; gap: 12px; }
.logout-modal__btn-cancel {
  flex: 1; padding: 12px;
  background: transparent; color: var(--tb-sub);
  border: 1.5px solid var(--tb-border); border-radius: 10px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s var(--tb-ease);
}
.logout-modal__btn-cancel:hover { border-color: var(--tb-blue-mid); color: var(--tb-blue); background: var(--tb-blue-faint); }
.logout-modal__btn-confirm {
  flex: 1; padding: 12px;
  background: var(--tb-red); color: #fff;
  border: none; border-radius: 10px;
  font-family: 'Inter', system-ui, sans-serif;
  font-size: 13px; font-weight: 600; cursor: pointer;
  transition: all 0.2s var(--tb-ease-out);
  box-shadow: 0 4px 14px rgba(225,29,72,0.28);
}
.logout-modal__btn-confirm:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(225,29,72,0.38); background: #be123c; }

@media (max-width: 768px) {
  .topbar { padding: 0 16px; height: 58px; }
  .topbar__status span, .topbar__logout span { display: none; }
  .topbar__logout { padding: 8px 10px; }
  .logout-modal { width: calc(100% - 32px); margin: 16px; padding: 24px; }
}
`;

const ROLE_LABELS = {
  ADMIN:   'Administrateur',
  MANAGER: 'Manager',
  CHARGE:         'Chargé de Consignation',
  CHARGE_TRAVAUX: 'Chargé des Travaux',
};

/* ── CSS global cd-* ── */
const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Sora:wght@600;700;800&display=swap');

  :root {
    --cd-navy:   #07111f;
    --cd-navy2:  #0f1e35;
    --cd-navy3:  #1a3352;
    --cd-gold:   #b8892a;
    --cd-gold2:  #c9a84c;
    --cd-gold3:  #e8c96a;
    --cd-bg:     #f0f2f5;
    --cd-white:  #ffffff;
    --cd-border: #e4e8ee;
    --cd-ink:    #0f172a;
    --cd-ink2:   #334155;
    --cd-ink3:   #64748b;
    --cd-ink4:   #94a3b8;
    --cd-blue:   #2563eb;
    --cd-green:  #059669;
    --cd-red:    #dc2626;
    --cd-amber:  #d97706;
  }

  body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; background: var(--cd-bg); }
  *, *::before, *::after { box-sizing: border-box; }
  ::-webkit-scrollbar { width: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #d4d0c8; border-radius: 3px; }

  @keyframes cdFadeUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
  @keyframes cdBarGrow { from { width: 0; } }
  @keyframes cdSpin { to { transform: rotate(360deg); } }
  @keyframes cdStripeShimmer { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
  @keyframes layoutFadeUp { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }

  .cd-fade-1 { animation: cdFadeUp .4s ease both; }
  .cd-fade-2 { animation: cdFadeUp .4s ease .06s both; }
  .cd-fade-3 { animation: cdFadeUp .4s ease .12s both; }
  .cd-fade-4 { animation: cdFadeUp .4s ease .18s both; }

  .cd-page {
    padding: 28px 32px;
    background: var(--cd-bg);
    min-height: calc(100vh - 72px);
    font-family: 'Inter', sans-serif;
  }

  /* ── Banner ── */
  .cd-banner {
    background: linear-gradient(135deg, var(--cd-navy) 0%, var(--cd-navy3) 60%, #0d2545 100%);
    border-radius: 16px; padding: 28px 32px; margin-bottom: 24px;
    position: relative; overflow: hidden;
    border: 1px solid rgba(201,168,76,0.12);
    display: flex; align-items: center; justify-content: space-between; gap: 20px;
  }
  .cd-banner__orb1 { position:absolute; right:-60px; top:-60px; width:280px; height:280px; border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,0.08) 0%,transparent 70%); pointer-events:none; }
  .cd-banner__orb2 { position:absolute; left:38%; bottom:-50px; width:200px; height:200px; border-radius:50%; background:radial-gradient(circle,rgba(37,99,235,0.06) 0%,transparent 70%); pointer-events:none; }
  .cd-banner__line { position:absolute; top:0; left:8%; right:8%; height:1px; background:linear-gradient(90deg,transparent,rgba(201,168,76,0.3),transparent); }
  .cd-banner__left { position:relative; z-index:1; }
  .cd-banner__date { font-size:10px; color:rgba(201,168,76,0.6); font-family:monospace; letter-spacing:.14em; text-transform:uppercase; margin-bottom:8px; }
  .cd-banner__title { font-family:'Sora',sans-serif; font-size:22px; font-weight:800; color:#fff; letter-spacing:-.03em; margin-bottom:6px; line-height:1.2; }
  .cd-banner__title span { color: var(--cd-gold3); }
  .cd-banner__sub { font-size:13px; color:rgba(255,255,255,.4); line-height:1.55; font-weight:300; }
  .cd-banner__right { display:flex; gap:10px; flex-shrink:0; position:relative; z-index:1; flex-wrap:wrap; justify-content:flex-end; }
  .cd-banner__btn {
    padding:11px 22px; border-radius:10px;
    background:linear-gradient(135deg,var(--cd-gold2),var(--cd-gold));
    color:var(--cd-navy); border:none; cursor:pointer;
    font-family:'Inter',sans-serif; font-size:13px; font-weight:700;
    box-shadow:0 4px 18px rgba(201,168,76,.3);
    display:flex; align-items:center; gap:7px; white-space:nowrap;
    transition:transform .2s, box-shadow .2s;
  }
  .cd-banner__btn:hover { transform:translateY(-1px); box-shadow:0 6px 24px rgba(201,168,76,.4); }
  .cd-banner__pills { display:flex; flex-wrap:wrap; gap:7px; margin-top:14px; }
  .cd-banner__pill { display:inline-flex; align-items:center; gap:5px; padding:4px 12px; border-radius:20px; font-size:11px; font-weight:600; border:1px solid transparent; }
  .cd-banner__pill--green { background:rgba(5,150,105,.12); color:#34d399; border-color:rgba(5,150,105,.20); }
  .cd-banner__pill--red   { background:rgba(220,38,38,.12); color:#f87171; border-color:rgba(220,38,38,.20); }
  .cd-banner__pill--amber { background:rgba(217,119,6,.14); color:#fbbf24; border-color:rgba(217,119,6,.22); }
  .cd-banner__pill--blue  { background:rgba(37,99,235,.14); color:#93c5fd; border-color:rgba(37,99,235,.22); }

  /* ── KPI v2 ── */
  .cd-kpi2-grid { display:grid; grid-template-columns:repeat(5,1fr); gap:12px; margin-bottom:24px; }
  .cd-kpi2-grid--6 { grid-template-columns:repeat(6,1fr); }
  .cd-kpi2 {
    background:var(--cd-white); border:1.5px solid var(--cd-border); border-radius:14px;
    padding:18px 16px 16px; position:relative; overflow:hidden;
    transition:all .22s cubic-bezier(.4,0,.2,1);
    display:flex; align-items:flex-start; gap:12px;
  }
  .cd-kpi2:hover { transform:translateY(-3px); box-shadow:0 8px 28px rgba(0,0,0,.07); }
  .cd-kpi2--pulse .cd-kpi2__stripe { animation:cdStripeShimmer 2s ease-in-out infinite; }
  .cd-kpi2__stripe { position:absolute; top:0; left:0; right:0; height:3px; }
  .cd-kpi2__icon { width:40px; height:40px; border-radius:11px; flex-shrink:0; display:flex; align-items:center; justify-content:center; margin-top:2px; }
  .cd-kpi2__body { flex:1; min-width:0; }
  .cd-kpi2__value { font-family:'Sora',sans-serif; font-size:26px; font-weight:800; letter-spacing:-.04em; line-height:1; margin-bottom:3px; }
  .cd-kpi2__label { font-size:10px; color:var(--cd-ink4); font-weight:700; text-transform:uppercase; letter-spacing:.08em; margin-bottom:2px; }
  .cd-kpi2__sub   { font-size:10px; color:var(--cd-ink4); font-weight:400; }

  /* ── Card ── */
  .cd-card { background:var(--cd-white); border:1px solid var(--cd-border); border-radius:14px; overflow:hidden; box-shadow:0 1px 4px rgba(10,20,40,.04); }
  .cd-card__head { padding:15px 20px; border-bottom:1px solid #f0f2f5; display:flex; align-items:center; justify-content:space-between; }
  .cd-card__title { display:flex; align-items:center; gap:9px; font-size:13.5px; font-weight:700; color:var(--cd-ink); }
  .cd-card__icon { width:28px; height:28px; border-radius:8px; display:flex; align-items:center; justify-content:center; }
  .cd-card__count { font-size:10px; color:var(--cd-ink4); background:#f0f2f5; padding:2px 9px; border-radius:10px; font-family:monospace; }
  .cd-card__link { font-size:11.5px; color:var(--cd-gold2); background:none; border:none; cursor:pointer; font-weight:700; font-family:'Inter',sans-serif; padding:5px 10px; border-radius:7px; transition:background .15s; }
  .cd-card__link:hover { background:rgba(201,168,76,.08); }

  /* ── Table ── */
  .cd-table { width:100%; border-collapse:collapse; }
  .cd-table thead tr { background:#f8f9fb; }
  .cd-table th { padding:9px 16px; text-align:left; font-size:9.5px; color:var(--cd-ink4); font-family:monospace; letter-spacing:.10em; border-bottom:1px solid #f0f2f5; text-transform:uppercase; font-weight:600; white-space:nowrap; }
  .cd-table td { padding:12px 16px; }
  .cd-table tbody tr { border-bottom:1px solid rgba(228,232,238,.7); cursor:pointer; transition:background .12s; }
  .cd-table tbody tr:hover { background:#f8f9fb; }
  .cd-table tbody tr:last-child { border-bottom:none; }

  .cd-plan-ref  { font-family:monospace; font-size:11.5px; color:var(--cd-gold2); font-weight:700; }
  .cd-plan-name { font-size:12.5px; color:var(--cd-ink); font-weight:500; line-height:1.3; }
  .cd-plan-loc  { font-size:10.5px; color:var(--cd-ink4); margin-top:2px; }
  .cd-plan-date { font-size:11px; color:var(--cd-ink4); font-family:monospace; white-space:nowrap; }

  /* ── Badge ── */
  .cd-badge { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
  .cd-badge__dot { width:5px; height:5px; border-radius:50%; flex-shrink:0; }

  /* ── Empty ── */
  .cd-empty { padding:52px 24px; text-align:center; }
  .cd-empty__icon { width:52px; height:52px; border-radius:14px; background:#f0f2f5; display:flex; align-items:center; justify-content:center; margin:0 auto 14px; color:var(--cd-ink4); }
  .cd-empty__title { font-size:13px; color:var(--cd-ink2); font-weight:600; margin-bottom:5px; }
  .cd-empty__sub   { font-size:11.5px; color:var(--cd-ink4); }

  /* ── Stat bars ── */
  .cd-stat-row { margin-bottom:12px; }
  .cd-stat-row:last-child { margin-bottom:0; }
  .cd-stat-meta { display:flex; justify-content:space-between; align-items:center; margin-bottom:5px; }
  .cd-stat-name { display:flex; align-items:center; gap:7px; font-size:11.5px; color:var(--cd-ink2); font-weight:500; }
  .cd-stat-dot  { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .cd-stat-val  { font-size:11px; font-weight:700; font-family:monospace; }
  .cd-bar-track { height:6px; background:#f0f2f5; border-radius:4px; overflow:hidden; }
  .cd-bar-fill  { height:100%; border-radius:4px; animation:cdBarGrow .7s cubic-bezier(.4,0,.2,1) both; }

  /* ── Loader ── */
  .cd-loader { display:flex; align-items:center; justify-content:center; min-height:calc(100vh - 72px); }
  .cd-loader__inner { text-align:center; }
  .cd-loader__ring { width:44px; height:44px; border-radius:50%; border:3px solid #e4e8ee; border-top-color:var(--cd-gold2); animation:cdSpin .8s linear infinite; margin:0 auto 14px; }
  .cd-loader__text { font-size:13px; color:var(--cd-ink4); font-weight:500; }

  /* ── Security block ── */
  .cd-security { background:linear-gradient(135deg,var(--cd-navy),var(--cd-navy3)); border-radius:14px; padding:18px; border:1px solid rgba(201,168,76,.12); }
  .cd-security__head { display:flex; align-items:center; gap:9px; margin-bottom:10px; }
  .cd-security__icon { width:30px; height:30px; border-radius:8px; background:rgba(201,168,76,.12); border:1px solid rgba(201,168,76,.2); display:flex; align-items:center; justify-content:center; color:var(--cd-gold2); }
  .cd-security__title { font-size:12px; font-weight:700; color:var(--cd-gold2); }
  .cd-security__body  { font-size:11.5px; color:rgba(255,255,255,.4); line-height:1.75; font-weight:300; }
  .cd-security__body strong { color:rgba(255,255,255,.6); font-weight:600; }

  /* ── Mini calendar ── */
  .cd-cal { padding:14px 16px 16px; font-family:'Inter',sans-serif; }
  .cd-cal__head { display:flex; align-items:center; justify-content:space-between; margin-bottom:14px; }
  .cd-cal__nav { width:28px; height:28px; border-radius:8px; border:1.5px solid var(--cd-border); background:var(--cd-white); cursor:pointer; display:flex; align-items:center; justify-content:center; color:var(--cd-ink3); transition:all .18s; }
  .cd-cal__nav:hover { background:#f0f2f5; color:var(--cd-ink); }
  .cd-cal__title { display:flex; flex-direction:column; align-items:center; }
  .cd-cal__month { font-size:13px; font-weight:700; color:var(--cd-ink); letter-spacing:-.02em; }
  .cd-cal__year  { font-size:10px; color:var(--cd-ink4); font-weight:500; letter-spacing:.06em; }
  .cd-cal__dow   { display:grid; grid-template-columns:repeat(7,1fr); margin-bottom:6px; }
  .cd-cal__dow-cell { text-align:center; font-size:9.5px; font-weight:700; color:var(--cd-ink4); padding:3px 0; text-transform:uppercase; letter-spacing:.06em; }
  .cd-cal__grid  { display:grid; grid-template-columns:repeat(7,1fr); gap:3px; }
  .cd-cal__cell  { aspect-ratio:1; border-radius:8px; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; transition:background .15s; }
  .cd-cal__cell--empty { pointer-events:none; }
  .cd-cal__cell:not(.cd-cal__cell--empty):not(.cd-cal__cell--today):hover { background:rgba(228,232,238,0.6); }
  .cd-cal__day   { font-size:11px; font-weight:500; color:var(--cd-ink2); line-height:1; }
  .cd-cal__cell--past .cd-cal__day { color:var(--cd-ink4); }
  .cd-cal__cell--today { background:linear-gradient(135deg,#0f1e35,#1a3352); border-radius:9px; }
  .cd-cal__cell--today .cd-cal__day { color:#fff; font-weight:800; font-size:12px; }
  .cd-cal__cell--plan:not(.cd-cal__cell--today) { background:rgba(201,168,76,.10); border:1.5px solid rgba(201,168,76,.25); }
  .cd-cal__cell--plan:not(.cd-cal__cell--today) .cd-cal__day { color:#b8892a; font-weight:700; }
  .cd-cal__dot   { position:absolute; bottom:3px; width:4px; height:4px; border-radius:50%; background:#c9a84c; }
  .cd-cal__legend { display:flex; justify-content:center; gap:16px; margin-top:12px; padding-top:10px; border-top:1px solid #f0f2f5; }
  .cd-cal__leg-item { display:flex; align-items:center; gap:5px; font-size:9.5px; color:var(--cd-ink4); font-weight:500; }
  .cd-cal__leg-dot  { width:8px; height:8px; border-radius:3px; flex-shrink:0; }
  .cd-cal__leg-dot--today { background:#0f1e35; }
  .cd-cal__leg-dot--plan  { background:rgba(201,168,76,.5); border:1.5px solid #c9a84c; }

  /* ── Donut ── */
  .cd-donut-section { padding:16px 20px; display:flex; align-items:center; gap:18px; }
  .cd-donut-legend  { flex:1; display:flex; flex-direction:column; gap:8px; }
  .cd-legend-row    { display:flex; align-items:center; gap:7px; font-size:11.5px; }
  .cd-legend-dot    { width:8px; height:8px; border-radius:50%; flex-shrink:0; }
  .cd-legend-label  { flex:1; color:var(--cd-ink2); font-weight:500; }
  .cd-legend-val    { font-weight:700; font-family:monospace; font-size:12px; }
  .cd-legend-pct    { font-size:10px; color:var(--cd-ink4); min-width:34px; text-align:right; font-family:monospace; }

  /* ── Zone table ── */
  .cd-zone-table { width:100%; border-collapse:collapse; font-size:12px; }
  .cd-zone-table th { padding:8px 12px; text-align:left; font-size:9px; color:var(--cd-ink4); font-family:monospace; letter-spacing:.1em; border-bottom:1px solid #f0f2f5; text-transform:uppercase; font-weight:600; }
  .cd-zone-table td { padding:9px 12px; border-bottom:1px solid rgba(228,232,238,.5); }
  .cd-zone-table tbody tr:last-child td { border-bottom:none; }
  .cd-zone-table tbody tr:hover td { background:#f8f9fb; }

  /* ── Responsive ── */
  @media (max-width:1280px) { .cd-kpi2-grid,.cd-kpi2-grid--6 { grid-template-columns:repeat(3,1fr); } }
  @media (max-width:900px)  { .cd-page { padding:16px; } .cd-kpi2-grid { grid-template-columns:repeat(2,1fr); } }
`;

const SIDEBAR_CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

.sb {
  width: 248px; background: #0f1e35; border-right: 1px solid rgba(201,168,76,.12);
  display: flex; flex-direction: column; flex-shrink: 0;
  position: sticky; top: 0; height: 100vh;
  overflow-y: auto; overflow-x: hidden;
  box-shadow: 1px 0 12px rgba(0,0,0,.18); z-index: 20;
  transition: width .22s cubic-bezier(.4,0,.2,1);
}
.sb::-webkit-scrollbar { width: 0; }
.sb::before {
  content: ''; position: absolute; top: 0; left: 0; right: 0; height: 200px;
  background: linear-gradient(180deg, rgba(201,168,76,.06) 0%, transparent 100%);
  pointer-events: none; z-index: 0;
}
.sb__brand {
  padding: 22px 20px 18px; border-bottom: 1px solid rgba(201,168,76,.12);
  display: flex; align-items: center; gap: 12px; flex-shrink: 0; position: relative; z-index: 1;
}
.sb__logo {
  width: 38px; height: 38px; border-radius: 10px;
  background: rgba(201,168,76,.12); border: 1.5px solid rgba(201,168,76,.35);
  display: flex; align-items: center; justify-content: center; font-size: 17px;
  flex-shrink: 0; color: #c9a84c;
  transition: all .2s cubic-bezier(.22,1,.36,1);
}
.sb__logo:hover { transform: scale(1.06) rotate(-3deg); background: rgba(201,168,76,.2); }
.sb__name { font-size: 15px; font-weight: 700; color: #fff; letter-spacing: -.02em; font-family: 'Plus Jakarta Sans',sans-serif; line-height: 1; }
.sb__name span { color: #c9a84c; }
.sb__section { font-size: 9.5px; letter-spacing: .14em; text-transform: uppercase; color: rgba(255,255,255,.25); padding: 18px 22px 7px; font-weight: 600; position: relative; z-index: 1; }
.sb__nav { padding: 4px 10px; display: flex; flex-direction: column; gap: 2px; flex: 1; position: relative; z-index: 1; }
.sb__item {
  display: flex; align-items: center; gap: 10px; padding: 10px 13px;
  border-radius: 10px; cursor: pointer; transition: all .18s cubic-bezier(.4,0,.2,1);
  border: 1px solid transparent; font-size: 13px; color: rgba(255,255,255,.5); font-weight: 400;
  background: none; width: 100%; text-align: left; font-family: 'Sora',system-ui,sans-serif;
  position: relative; white-space: nowrap; overflow: hidden;
}
.sb__item:hover { background: rgba(255,255,255,.07); color: rgba(255,255,255,.88); border-color: rgba(255,255,255,.06); transform: translateX(2px); }
.sb__item.active { background: rgba(201,168,76,.12); border-color: rgba(201,168,76,.3); color: #c9a84c; font-weight: 600; }
.sb__item.active::before {
  content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 3px;
  background: linear-gradient(180deg, #e8c96a, #c9a84c); border-radius: 0 3px 3px 0;
  box-shadow: 2px 0 8px rgba(201,168,76,.35);
}
.sb__item-icon { font-size: 15px; flex-shrink: 0; width: 18px; text-align: center; display: flex; align-items: center; justify-content: center; transition: transform .2s cubic-bezier(.22,1,.36,1); }
.sb__item.active .sb__item-icon, .sb__item:hover .sb__item-icon { transform: scale(1.15); }
.sb__user {
  margin: 10px; padding: 12px 14px;
  background: rgba(255,255,255,.04); border: 1px solid rgba(201,168,76,.15); border-radius: 12px;
  display: flex; align-items: center; gap: 10px; flex-shrink: 0;
  transition: all .18s cubic-bezier(.4,0,.2,1); cursor: pointer; position: relative; z-index: 1;
}
.sb__user:hover { border-color: rgba(201,168,76,.4); background: rgba(201,168,76,.08); transform: translateY(-1px); }
.sb__avatar {
  width: 34px; height: 34px; border-radius: 50%;
  background: rgba(201,168,76,.15); border: 1.5px solid rgba(201,168,76,.4);
  display: flex; align-items: center; justify-content: center;
  font-size: 12px; font-weight: 700; color: #c9a84c; flex-shrink: 0;
}
.sb__user-name { font-size: 12px; font-weight: 600; color: #fff; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 1.3; }
.sb__user-role { font-size: 10px; color: rgba(255,255,255,.35); letter-spacing: .04em; margin-top: 1px; }
.sb__online {
  width: 7px; height: 7px; border-radius: 50%;
  background: #10b981; border: 1.5px solid #0f1e35; flex-shrink: 0;
  box-shadow: 0 0 6px rgba(16,185,129,.5);
  animation: sbPulse 2s ease-in-out infinite;
}
@keyframes sbPulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:.5;transform:scale(.8);} }
.sb__logout {
  margin: 0 10px 10px; padding: 9px 14px;
  display: flex; align-items: center; gap: 8px;
  border: 1px solid rgba(255,255,255,.08); border-radius: 10px;
  background: transparent; cursor: pointer; transition: all .18s;
  font-size: 12.5px; font-weight: 600; color: rgba(255,255,255,.35); font-family: 'Inter',sans-serif;
  position: relative; z-index: 1;
}
.sb__logout:hover { background: rgba(239,68,68,.15); color: #f87171; border-color: rgba(239,68,68,.3); }

.sb__msg-btn {
  margin: 0 10px 6px; padding: 10px 14px;
  display: flex; align-items: center; gap: 9px;
  border: 1px solid rgba(201,168,76,.2); border-radius: 10px;
  background: rgba(201,168,76,.06); cursor: pointer; transition: all .18s;
  font-size: 12.5px; font-weight: 600; color: #c9a84c; font-family: 'Inter',sans-serif;
  position: relative; z-index: 1; width: calc(100% - 20px);
}
.sb__msg-btn:hover { background: rgba(201,168,76,.14); border-color: rgba(201,168,76,.4); transform: translateY(-1px); }
.sb__msg-badge {
  margin-left: auto; min-width: 18px; height: 18px; border-radius: 9px;
  background: #e11d48; color: #fff; font-size: 10px; font-weight: 700;
  display: flex; align-items: center; justify-content: center; padding: 0 5px;
  animation: sbPulse 2s ease-in-out infinite;
}

@media (max-width:768px) {
  .sb { width: 64px; }
  .sb__brand { padding: 18px 12px; justify-content: center; }
  .sb__name, .sb__section { display: none; }
  .sb__nav { padding: 4px 8px; }
  .sb__item { justify-content: center; padding: 11px; }
  .sb__item span:not(.sb__item-icon) { display: none; }
  .sb__user { justify-content: center; padding: 10px; }
  .sb__user-name, .sb__user-role, .sb__online { display: none; }
  .sb__logout { justify-content: center; }
  .sb__logout span { display: none; }
}
`;

export default function Layout() {
  const navigate    = useNavigate();
  const location    = useLocation();
  const { user, logout, canGererUtilisateurs } = useAuth();
  const [showProfile, setShowProfile] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showMsg, setShowMsg] = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);
  const profileRef = useRef(null);

  useEffect(() => {
    const h = (e) => { if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfile(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  const currentPage = Object.entries(PAGE_TITLES).find(([path]) =>
    path === '/dashboard' ? location.pathname === path : location.pathname.startsWith(path)
  );
  const pageTitle = currentPage ? currentPage[1].title : 'Consignation';
  const pageSub   = currentPage ? currentPage[1].sub   : today;
  const initials  = user ? `${(user.prenom||'').charAt(0)}${(user.nom||'').charAt(0)}`.toUpperCase() : '?';

  const navItems = [
    { path: '/dashboard',   label: 'Dashboard',    icon: <IcDashboard /> },
    { path: '/equipements', label: 'Équipements',  icon: <IcEquipements /> },
    ...(canGererUtilisateurs()
      ? [
          { path: '/utilisateurs', label: 'Utilisateurs', icon: <IcUsers /> },
          { path: '/dispositifs',  label: 'Dispositifs',  icon: (
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          )},
        ]
      : []),
  ];

  const isActive = (path) => {
    if (location.pathname === path) return true;
    if (path === '/equipements') {
      // actif aussi sur /equipement/:id, /zone/:id
      return location.pathname.startsWith('/equipement') || location.pathname.startsWith('/zone');
    }
    return path !== '/dashboard' && location.pathname.startsWith(path);
  };

  const roleLabel = ROLE_LABELS[user?.role] || user?.role || '';

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f1f5f9' }}>
      <style>{GLOBAL_CSS}</style>
      <style>{SIDEBAR_CSS}</style>
      <style>{TOPBAR_CSS}</style>

      {/* ══ SIDEBAR ══ */}
      <aside className="sb">
        {/* Brand */}
        <div className="sb__brand">
          <div className="sb__logo" onClick={() => navigate('/dashboard')} style={{ cursor:'pointer' }}>⚙</div>
          <div className="sb__name">Consign<span>App</span></div>
        </div>

        {/* Section label */}
        <div className="sb__section">Navigation</div>

        {/* Nav items */}
        <nav className="sb__nav">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`sb__item${isActive(item.path) ? ' active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="sb__item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Messagerie */}
        <button className="sb__msg-btn" onClick={() => setShowMsg(true)}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
          <span>Messagerie</span>
          {msgUnread > 0 && <span className="sb__msg-badge">{msgUnread > 9 ? '9+' : msgUnread}</span>}
        </button>

        {/* User section */}
        <div className="sb__user" onClick={() => setShowProfile(p => !p)}>
          <div className="sb__avatar">{initials}</div>
          <div style={{ flex:1, minWidth:0 }}>
            <div className="sb__user-name">{user?.prenom} {user?.nom}</div>
            <div className="sb__user-role">{roleLabel}{user?.zoneCode ? ` · ${user.zoneCode}` : ''}</div>
          </div>
          <div className="sb__online" />
        </div>

      </aside>

      {/* ══ MAIN CONTENT ══ */}
      <div style={{ flex:1, display:'flex', flexDirection:'column', minWidth:0, overflow:'auto' }}>

        {/* ── TOPBAR ── */}
        <header className="topbar">
          <div className="topbar__left">
            <div className="topbar__page-indicator">
              <div className="topbar__page-accent" />
              <div className="topbar__page-text">
                <div className="topbar__title">{pageTitle}</div>
                <div className="topbar__sub">
                  <span className="topbar__sub-icon">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                  </span>
                  {pageSub}
                </div>
              </div>
            </div>
          </div>

          <div className="topbar__right">
            {/* Statut système */}
            <div className="topbar__status">
              <div className="topbar__status-dot" />
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6" fill="currentColor"/></svg>
              <span>Système opérationnel</span>
            </div>

            {/* Bouton déconnexion */}
            <button className="topbar__logout" onClick={() => setShowLogoutModal(true)}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              <span>Déconnexion</span>
            </button>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>

      {/* ── ASSISTANT IA ── */}
      <AssistantWidget />

      {/* ── MESSAGERIE ── */}
      {showMsg && (
        <MessageriePanel
          onClose={() => setShowMsg(false)}
          onUnreadChange={setMsgUnread}
        />
      )}

      {/* ── MODAL DÉCONNEXION ── */}
      {showLogoutModal && (
        <div className="logout-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="logout-modal" onClick={e => e.stopPropagation()}>
            <div className="logout-modal__icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div className="logout-modal__title">Déconnexion</div>
            <div className="logout-modal__msg">
              Êtes-vous sûr de vouloir vous déconnecter ?<br />
              Vous devrez vous reconnecter pour accéder à votre compte.
            </div>
            {user && (
              <div className="logout-modal__user">
                <div className="logout-modal__avatar">{initials}</div>
                <div>
                  <div className="logout-modal__name">{user.prenom} {user.nom}</div>
                  <div className="logout-modal__email">{roleLabel}{user?.zoneCode ? ` · ${user.zoneCode}` : ''}</div>
                </div>
              </div>
            )}
            <div className="logout-modal__actions">
              <button className="logout-modal__btn-cancel" onClick={() => setShowLogoutModal(false)}>Annuler</button>
              <button className="logout-modal__btn-confirm" onClick={handleLogout}>Se déconnecter</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
