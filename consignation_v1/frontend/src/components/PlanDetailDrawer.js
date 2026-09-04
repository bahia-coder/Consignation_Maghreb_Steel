import React, { useEffect, useState } from 'react';
import { planService, historiqueService, approbationService } from '../services/api';
import EnergiesPanel from './EnergiesPanel';
import ValidationModal from './ValidationModal';
import { useAuth } from '../context/AuthContext';

/* ── CSS ──────────────────────────────────────────────────────────────── */
const DRAWER_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

  :root {
    --pd-navy:#0f1e35; --pd-navy2:#162844;
    --pd-gold:#c9a84c; --pd-gold-dim:rgba(201,168,76,0.10); --pd-gold-bdr:rgba(201,168,76,0.28);
    --pd-cream:#f7f5f0; --pd-border:#e8e4dc;
    --pd-text:#0f1e35; --pd-sub:#5a6a7e; --pd-muted:#94a3b8;
    --pd-bg:#f4f2ee;
  }

  .pd-overlay {
    position:fixed; inset:0; background:rgba(10,20,40,0.55);
    backdrop-filter:blur(5px); z-index:1000; animation:pdFadeOv .2s ease;
  }
  @keyframes pdFadeOv { from{opacity:0} to{opacity:1} }

  .pd-drawer {
    position:fixed; top:0; right:0; bottom:0; width:680px;
    background:var(--pd-bg); z-index:1001; display:flex; flex-direction:column;
    box-shadow:-24px 0 64px rgba(10,20,40,0.22);
    animation:pdSlide .3s cubic-bezier(0.4,0,0.2,1);
    font-family:'Sora',sans-serif;
  }
  @keyframes pdSlide { from{transform:translateX(105%)} to{transform:translateX(0)} }
  @media (max-width:800px) { .pd-drawer { width:100%; } }

  /* ══ HEAD ══ */
  .pd-head {
    background:linear-gradient(135deg,#0c1829 0%,#14243e 60%,#0a1f38 100%);
    padding:0; flex-shrink:0; position:relative; overflow:hidden;
  }
  .pd-head::after {
    content:''; position:absolute; top:-80px; right:-60px;
    width:260px; height:260px; border-radius:50%;
    background:radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 65%);
    pointer-events:none;
  }
  .pd-head-inner {
    padding:18px 22px 16px; display:flex; align-items:flex-start;
    justify-content:space-between; gap:14px; position:relative; z-index:1;
  }
  .pd-head__meta {
    display:flex; align-items:center; gap:8px; margin-bottom:8px; flex-wrap:wrap;
  }
  .pd-head__ref {
    font-family:'DM Mono',monospace; font-size:10.5px; font-weight:600;
    color:rgba(201,168,76,0.85); letter-spacing:.06em;
    max-width:340px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
    background:rgba(201,168,76,0.08); border:1px solid rgba(201,168,76,0.18);
    padding:3px 9px; border-radius:6px;
  }
  .pd-head__title {
    font-size:17px; font-weight:800; color:#fff; line-height:1.25;
    letter-spacing:-.02em; margin-bottom:6px;
  }
  .pd-head__sub {
    font-size:11.5px; color:rgba(255,255,255,0.38); display:flex; align-items:center; gap:6px;
    max-width:420px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  }
  .pd-head__eq-badge {
    font-family:'DM Mono',monospace; font-size:10px; font-weight:700;
    background:rgba(201,168,76,0.12); color:#c9a84c; border:1px solid rgba(201,168,76,0.22);
    padding:2px 8px; border-radius:5px; flex-shrink:0;
  }
  .pd-close {
    width:34px; height:34px; border-radius:9px; flex-shrink:0;
    border:1px solid rgba(255,255,255,0.12); background:rgba(255,255,255,0.06);
    cursor:pointer; display:flex; align-items:center; justify-content:center;
    color:rgba(255,255,255,0.6); font-size:15px; transition:all .2s;
  }
  .pd-close:hover { border-color:rgba(239,68,68,0.45); color:#ef4444; background:rgba(239,68,68,0.1); }

  /* ── Status strip ── */
  .pd-status-strip {
    padding:10px 22px 14px; display:flex; align-items:center; gap:10px;
    border-top:1px solid rgba(255,255,255,0.06); position:relative; z-index:1;
  }
  .pd-status-label { font-size:10px; color:rgba(255,255,255,0.3); text-transform:uppercase; letter-spacing:.1em; font-family:'DM Mono',monospace; }
  .pd-status-line { flex:1; height:3px; border-radius:2px; background:rgba(255,255,255,0.07); overflow:hidden; }
  .pd-status-progress { height:100%; border-radius:2px; transition:width .4s ease; }

  /* ══ TABS ══ */
  .pd-tabs {
    background:#fff; border-bottom:1.5px solid var(--pd-border);
    display:flex; flex-shrink:0; padding:0 14px; gap:2px;
  }
  .pd-tab {
    padding:12px 16px; font-size:12.5px; font-weight:500; color:var(--pd-muted);
    border:none; background:transparent; cursor:pointer;
    border-bottom:2.5px solid transparent; transition:all .15s;
    font-family:'Sora',sans-serif; display:flex; align-items:center; gap:5px;
    margin-bottom:-1.5px;
  }
  .pd-tab:hover { color:var(--pd-text); }
  .pd-tab.active { color:var(--pd-navy); border-bottom-color:var(--pd-gold); font-weight:700; }
  .pd-tab-dot {
    width:5px; height:5px; border-radius:50%; background:var(--pd-gold); opacity:0; transition:opacity .15s;
  }
  .pd-tab.active .pd-tab-dot { opacity:1; }

  /* ══ BODY ══ */
  .pd-body { flex:1; overflow-y:auto; padding:18px 20px; }
  .pd-body::-webkit-scrollbar { width:4px; }
  .pd-body::-webkit-scrollbar-thumb { background:#d8d4cc; border-radius:2px; }

  /* ══ CARDS ══ */
  .pd-card {
    background:#fff; border:1.5px solid var(--pd-border); border-radius:14px;
    overflow:hidden; margin-bottom:12px;
    box-shadow:0 1px 4px rgba(15,30,53,0.04);
  }
  .pd-card__hd {
    padding:12px 16px; background:#faf8f4;
    border-bottom:1px solid var(--pd-border);
    display:flex; align-items:center; gap:7px;
    font-size:10px; font-weight:700; color:var(--pd-sub);
    text-transform:uppercase; letter-spacing:.1em; font-family:'DM Mono',monospace;
  }
  .pd-card__hd-icon {
    width:22px; height:22px; border-radius:6px; background:var(--pd-gold-dim);
    display:flex; align-items:center; justify-content:center; font-size:12px;
  }
  .pd-card__body { padding:16px; }

  /* ══ FIELD GRID ══ */
  .pd-grid { display:grid; grid-template-columns:1fr 1fr; gap:12px 24px; }
  .pd-field__lbl {
    font-size:10px; font-weight:700; color:var(--pd-muted);
    text-transform:uppercase; letter-spacing:.07em;
    font-family:'DM Mono',monospace; margin-bottom:3px;
  }
  .pd-field__val { font-size:13px; color:var(--pd-text); font-weight:500; line-height:1.4; }

  /* ══ BADGE ══ */
  .pd-badge { display:inline-flex; align-items:center; gap:5px; padding:4px 11px; border-radius:20px; font-size:11px; font-weight:700; }
  .pd-badge--gray  { background:#f0ece3; color:#5a6a7e; border:1px solid var(--pd-border); }
  .pd-badge--amber { background:rgba(217,119,6,0.1); color:#b45309; border:1px solid rgba(217,119,6,0.2); }
  .pd-badge--blue  { background:rgba(37,99,235,0.1); color:#1d4ed8; border:1px solid rgba(37,99,235,0.2); }
  .pd-badge--green { background:rgba(5,150,105,0.1); color:#047857; border:1px solid rgba(5,150,105,0.2); }
  .pd-badge--red   { background:rgba(225,29,72,0.1); color:#be123c; border:1px solid rgba(225,29,72,0.2); }

  /* ══ APPROBATION ══ */
  .pd-appro { background:rgba(5,150,105,0.04); border:1px solid rgba(5,150,105,0.15); border-radius:10px; padding:12px 14px; }
  .pd-appro__hd { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .pd-appro__title { font-size:12px; font-weight:700; color:#047857; display:flex; align-items:center; gap:5px; }
  .pd-appro__row {
    display:flex; align-items:center; gap:8px;
    background:#fff; border-radius:7px; padding:7px 10px;
    border:1px solid rgba(5,150,105,0.1); font-size:12px; margin-bottom:5px;
  }
  .pd-appro__row:last-of-type { margin-bottom:0; }
  .pd-appro__name { font-weight:600; color:var(--pd-text); flex:1; }
  .pd-appro__mat { font-family:'DM Mono',monospace; font-size:10px; background:var(--pd-cream); color:var(--pd-sub); padding:1px 6px; border-radius:4px; }

  /* ══ ACTIONS ══ */
  .pd-actions { display:flex; gap:8px; flex-wrap:wrap; }
  .pd-btn {
    padding:9px 18px; border-radius:9px; border:none; cursor:pointer;
    font-family:'Sora',sans-serif; font-size:13px; font-weight:600;
    display:inline-flex; align-items:center; gap:6px; transition:all .18s;
  }
  .pd-btn--primary { background:#0f1e35; color:#fff; }
  .pd-btn--primary:hover { background:#162844; transform:translateY(-1px); box-shadow:0 4px 14px rgba(15,30,53,0.25); }
  .pd-btn--blue  { background:#2563eb; color:#fff; }
  .pd-btn--blue:hover { background:#1d4ed8; transform:translateY(-1px); box-shadow:0 4px 14px rgba(37,99,235,0.3); }
  .pd-btn--amber { background:#d97706; color:#fff; }
  .pd-btn--amber:hover { background:#b45309; transform:translateY(-1px); box-shadow:0 4px 14px rgba(217,119,6,0.3); }
  .pd-btn--green { background:#059669; color:#fff; }
  .pd-btn--green:hover { background:#047857; transform:translateY(-1px); box-shadow:0 4px 14px rgba(5,150,105,0.3); }
  .pd-btn--purple { background:#6d28d9; color:#fff; }
  .pd-btn--purple:hover { background:#5b21b6; transform:translateY(-1px); box-shadow:0 4px 14px rgba(109,40,217,0.3); }
  .pd-btn--ghost { background:transparent; color:var(--pd-sub); border:1.5px solid var(--pd-border); }
  .pd-btn--ghost:hover { border-color:var(--pd-gold); color:var(--pd-gold); }
  .pd-btn:disabled { opacity:.45; cursor:not-allowed; transform:none !important; box-shadow:none !important; }

  /* ══ DECISION ══ */
  .pd-decision { border-radius:10px; padding:14px 16px; }
  .pd-decision--valide { background:rgba(5,150,105,0.05); border:1px solid rgba(5,150,105,0.18); }
  .pd-decision--rejete { background:rgba(225,29,72,0.05); border:1px solid rgba(225,29,72,0.18); }

  /* ══ TIMELINE ══ */
  .pd-hist-wrap {
    background:#fff; border:1.5px solid var(--pd-border); border-radius:14px;
    overflow:hidden; box-shadow:0 1px 4px rgba(15,30,53,0.04);
  }
  .pd-hist-head {
    padding:14px 18px; background:linear-gradient(135deg,#f9f7f3,#f4f2ee);
    border-bottom:1.5px solid var(--pd-border);
    display:flex; align-items:center; gap:10px;
  }
  .pd-hist-head__icon {
    width:32px; height:32px; border-radius:9px;
    background:rgba(15,30,53,0.07); border:1px solid rgba(15,30,53,0.1);
    display:flex; align-items:center; justify-content:center; color:#0f1e35;
    flex-shrink:0;
  }
  .pd-hist-head__title { font-size:13px; font-weight:800; color:#0f1e35; letter-spacing:-.01em; }
  .pd-hist-head__count {
    margin-left:auto; font-family:'DM Mono',monospace; font-size:10px;
    background:rgba(201,168,76,0.12); color:#b8892a; border:1px solid rgba(201,168,76,0.25);
    padding:2px 9px; border-radius:10px; font-weight:700;
  }
  .pd-timeline { display:flex; flex-direction:column; padding:18px 18px 6px; }
  .pd-tl-item {
    display:flex; gap:14px; padding-bottom:0;
    position:relative; padding:16px 0;
  }
  .pd-tl-item:not(:last-child) {
    border-bottom:1px solid #f4f2ee;
  }
  .pd-tl-left { display:flex; flex-direction:column; align-items:center; flex-shrink:0; width:40px; }
  .pd-tl-dot {
    width:40px; height:40px; border-radius:12px; flex-shrink:0;
    display:flex; align-items:center; justify-content:center;
    z-index:1;
  }
  .pd-tl-connector {
    width:2px; flex:1; min-height:12px; border-radius:1px;
    background:linear-gradient(to bottom,var(--dot-color,#e8e3da) 0%,transparent 100%);
    opacity:.3; margin-top:4px;
  }
  .pd-tl-item:last-child .pd-tl-connector { display:none; }
  .pd-tl-content { flex:1; min-width:0; padding-top:4px; }
  .pd-tl-label { font-size:13px; font-weight:700; line-height:1.2; margin-bottom:4px; }
  .pd-tl-desc  { font-size:12px; color:var(--pd-sub); line-height:1.55; margin-bottom:6px; }
  .pd-tl-foot  { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
  .pd-tl-user  {
    display:inline-flex; align-items:center; gap:5px;
    background:rgba(37,99,235,0.07); color:#1d4ed8;
    border:1px solid rgba(37,99,235,0.15);
    border-radius:20px; padding:3px 10px; font-size:11px; font-weight:600;
  }
  .pd-tl-date  {
    display:inline-flex; align-items:center; gap:5px;
    font-size:10.5px; color:var(--pd-muted);
    font-family:'DM Mono',monospace; font-style:italic;
  }

  /* ══ PDF TAB ══ */
  .pd-pdf-wrap { max-width:540px; margin:0 auto; padding:4px 0; }
  .pd-pdf-hero {
    background:linear-gradient(135deg,#0c1829,#14243e,#0a1d35);
    border-radius:14px; padding:22px 22px 18px;
    display:flex; align-items:center; gap:18px;
    margin-bottom:14px; position:relative; overflow:hidden;
    border:1px solid rgba(201,168,76,0.1);
  }
  .pd-pdf-hero::after {
    content:''; position:absolute; top:-50px; right:-30px;
    width:180px; height:180px; border-radius:50%;
    background:radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 70%);
    pointer-events:none;
  }
  .pd-pdf-icon {
    width:48px; height:48px; border-radius:12px; flex-shrink:0;
    background:rgba(239,68,68,0.12); border:1px solid rgba(239,68,68,0.22);
    display:flex; align-items:center; justify-content:center;
  }
  .pd-pdf-hero-title { font-size:16px; font-weight:700; color:#fff; margin-bottom:3px; }
  .pd-pdf-hero-sub { font-size:11.5px; color:rgba(255,255,255,0.35); margin-bottom:12px; }
  .pd-pdf-tags { display:flex; flex-wrap:wrap; gap:6px; }
  .pd-pdf-tag {
    display:inline-flex; align-items:center; gap:4px;
    padding:3px 10px; border-radius:20px; font-size:10.5px; font-weight:600;
    background:rgba(255,255,255,0.07); color:rgba(255,255,255,0.5);
    border:1px solid rgba(255,255,255,0.1);
  }
  .pd-pdf-tag--ok   { background:rgba(16,185,129,0.12); color:#34d399; border-color:rgba(16,185,129,0.2); }
  .pd-pdf-tag--warn { background:rgba(245,158,11,0.12); color:#fbbf24; border-color:rgba(245,158,11,0.2); }

  /* Meta rows */
  .pd-pdf-meta { display:flex; flex-direction:column; gap:8px; margin-bottom:14px; }
  .pd-pdf-row {
    background:#fff; border:1.5px solid var(--pd-border); border-radius:10px;
    padding:10px 14px; display:flex; align-items:center; gap:12px;
  }
  .pd-pdf-row__lbl {
    font-size:10px; font-weight:700; color:var(--pd-muted);
    text-transform:uppercase; letter-spacing:.07em;
    font-family:'DM Mono',monospace; min-width:130px; flex-shrink:0;
  }
  .pd-pdf-row__val {
    font-size:12.5px; font-weight:600; color:var(--pd-text);
    overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1;
  }

  .pd-pdf-btn {
    width:100%; padding:13px 20px; border-radius:12px;
    background:linear-gradient(135deg,#1a3c7a,#2563eb);
    color:#fff; border:none; cursor:pointer;
    font-family:'Sora',sans-serif; font-size:14px; font-weight:700;
    display:flex; align-items:center; justify-content:center; gap:10px;
    box-shadow:0 4px 20px rgba(37,99,235,0.3); transition:all .2s;
    margin-bottom:10px;
  }
  .pd-pdf-btn:hover:not(:disabled) {
    background:linear-gradient(135deg,#1e3f85,#1d4ed8);
    box-shadow:0 6px 24px rgba(37,99,235,0.4); transform:translateY(-1px);
  }
  .pd-pdf-btn:disabled { opacity:.6; cursor:wait; transform:none; box-shadow:none; }

  .pd-pdf-notice {
    display:flex; align-items:flex-start; gap:8px;
    padding:10px 14px; border-radius:9px; font-size:11.5px; line-height:1.55;
  }
  .pd-pdf-notice--warn { background:rgba(245,158,11,0.07); border:1px solid rgba(245,158,11,0.18); color:#78350f; }
  .pd-pdf-notice--info { background:rgba(37,99,235,0.05); border:1px solid rgba(37,99,235,0.14); color:#1e3a8a; }
  .pd-pdf-notice--ok   { background:rgba(5,150,105,0.05); border:1px solid rgba(5,150,105,0.16); color:#064e3b; }

  .pd-pdf-spin {
    width:15px; height:15px; border:2px solid rgba(255,255,255,0.3);
    border-top-color:#fff; border-radius:50%; animation:pdSpin .7s linear infinite; flex-shrink:0;
  }

  /* ══ MISC ══ */
  .pd-empty { padding:48px 24px; text-align:center; color:var(--pd-muted); }
  .pd-empty__icon { font-size:34px; opacity:.18; margin-bottom:10px; }
  @keyframes pdSpin { to{transform:rotate(360deg)} }
  .pd-spinner {
    width:34px; height:34px; border:3px solid var(--pd-border);
    border-top-color:var(--pd-gold); border-radius:50%;
    animation:pdSpin .8s linear infinite; margin:40px auto;
  }
`;

/* ── Action icons SVG ────────────────────────────────────────────────── */
const ActIcons = {
  DEMANDE_CREEE:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>,
  EN_TRAITEMENT:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
  ENERGIE_AJOUTEE:   <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  ENERGIE_MODIFIEE:  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  ENERGIE_SUPPRIMEE: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>,
  ORDRE_MODIFIE:     <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 3 21 3 21 8"/><line x1="4" y1="20" x2="21" y2="3"/><polyline points="21 16 21 21 16 21"/><line x1="15" y1="15" x2="21" y2="21"/></svg>,
  SOUMIS_VALIDATION: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>,
  VALIDE:            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  REJETE:            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  DEFAULT:           <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
};

/* ── Action config ────────────────────────────────────────────────────── */
const ACTION_CFG = {
  DEMANDE_CREEE:    { label: 'Demande créée',              color: '#2563eb', bg: 'rgba(37,99,235,.1)',   border: 'rgba(37,99,235,.2)'   },
  DEMANDE_ACCEPTEE: { label: 'Demande acceptée',            color: '#059669', bg: 'rgba(5,150,105,.1)',   border: 'rgba(5,150,105,.2)'   },
  DEMANDE_REJETEE:  { label: 'Demande rejetée',             color: '#e11d48', bg: 'rgba(225,29,72,.1)',   border: 'rgba(225,29,72,.2)'   },
  PLAN_EN_COURS:    { label: 'Plan en cours',               color: '#d97706', bg: 'rgba(217,119,6,.1)',   border: 'rgba(217,119,6,.2)'   },
  ENERGIE_AJOUTEE:  { label: 'Énergie(s) ajoutée(s)',       color: '#059669', bg: 'rgba(5,150,105,.1)',   border: 'rgba(5,150,105,.2)'   },
  ENERGIE_MODIFIEE: { label: 'Énergie modifiée',            color: '#7c3aed', bg: 'rgba(124,58,237,.1)',  border: 'rgba(124,58,237,.2)'  },
  ENERGIE_SUPPRIMEE:{ label: 'Énergie supprimée',           color: '#e11d48', bg: 'rgba(225,29,72,.1)',   border: 'rgba(225,29,72,.2)'   },
  ORDRE_MODIFIE:    { label: 'Ordre des énergies modifié',  color: '#0891b2', bg: 'rgba(8,145,178,.1)',   border: 'rgba(8,145,178,.2)'   },
  SOUMIS_VALIDATION:{ label: 'Soumis pour validation',      color: '#b45309', bg: 'rgba(180,83,9,.1)',    border: 'rgba(180,83,9,.2)'    },
  PLAN_VALIDE:      { label: 'Plan validé',                 color: '#047857', bg: 'rgba(4,120,87,.1)',    border: 'rgba(4,120,87,.2)'    },
  PLAN_REJETE:      { label: 'Plan rejeté',                 color: '#be123c', bg: 'rgba(190,18,60,.1)',   border: 'rgba(190,18,60,.2)'   },
  PLAN_TESTE:       { label: 'Plan testé',                  color: '#6d28d9', bg: 'rgba(109,40,217,.1)',  border: 'rgba(109,40,217,.2)'  },
};
function getAct(t) {
  return ACTION_CFG[t] || { label: t || 'Action', color: '#64748b', bg: 'rgba(100,116,139,.1)', border: 'rgba(100,116,139,.2)' };
}
function getActIcon(t) { return ActIcons[t] || ActIcons.DEFAULT; }

/* ── Statut badge helper ──────────────────────────────────────────────── */
const STATUT_BADGES = {
  DEMANDE_EN_COURS:           { label: 'Demande en cours',        cls: 'pd-badge--gray'  },
  DEMANDE_ACCEPTE:            { label: 'Demande acceptée',         cls: 'pd-badge--green' },
  DEMANDE_REJETE:             { label: 'Demande rejetée',          cls: 'pd-badge--red'   },
  PLAN_EN_COURS:              { label: 'Plan en cours',            cls: 'pd-badge--amber' },
  PLAN_EN_ATTENTE_VALIDATION: { label: 'En attente valid.',        cls: 'pd-badge--blue'  },
  PLAN_VALIDE:                { label: 'Plan validé',              cls: 'pd-badge--green' },
  PLAN_REJETE:                { label: 'Plan rejeté',              cls: 'pd-badge--red'   },
  PLAN_TESTE:                 { label: 'Plan testé',               cls: 'pd-badge--purple'},
};
function StatutBadge({ statut }) {
  const cfg = STATUT_BADGES[statut] || { label: statut, cls: 'pd-badge--gray' };
  return <span className={`pd-badge ${cfg.cls}`}><span style={{width:6,height:6,borderRadius:'50%',background:'currentColor',display:'inline-block',opacity:.7}}/>{cfg.label}</span>;
}

const STATUT_LABELS = {
  DEMANDE_EN_COURS:           'Demande en cours',
  DEMANDE_ACCEPTE:            'Demande acceptée',
  DEMANDE_REJETE:             'Demande rejetée',
  PLAN_EN_COURS:              'Plan en cours',
  PLAN_EN_ATTENTE_VALIDATION: 'En attente de validation',
  PLAN_VALIDE:                'Plan validé',
  PLAN_REJETE:                'Plan rejeté',
  PLAN_TESTE:                 'Plan testé',
};
const statutLabel = (s) => STATUT_LABELS[s] || (s || '').replace(/_/g, ' ').toLowerCase().replace(/^\w/, c => c.toUpperCase());

/* ── Tabs definition ──────────────────────────────────────────────────── */
const TABS = [
  { key: 'infos',     label: 'Informations', icon: '📋' },
  { key: 'energies',  label: 'Énergies',     icon: '⚡' },
  { key: 'historique',label: 'Historique',   icon: '🕑' },
  { key: 'pdf',       label: 'Téléchargement PDF', icon: '📄' },
];

/* ── Main component ───────────────────────────────────────────────────── */
export default function PlanDetailDrawer({ planId, onClose, onPlanChanged }) {
  const { user, canValidate, canSaisirEnergies, isManager, isAdmin, isCharge } = useAuth();
  const [tab, setTab]                       = useState('infos');
  const [plan, setPlan]                     = useState(null);
  const [loading, setLoading]               = useState(true);
  const [approbations, setApprobations]     = useState([]);
  const [historique, setHistorique]         = useState([]);
  const [histLoading, setHistLoading]       = useState(false);
  const [histLoaded, setHistLoaded]         = useState(false);
  const [actionLoading, setActionLoading]   = useState(false);
  const [approuvLoading, setApprouveLoading]= useState(false);
  const [pdfLoading, setPdfLoading]         = useState(false);
  const [showValidation, setShowValidation] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTab('infos');
    Promise.all([
      planService.findById(planId),
      approbationService.findByPlan(planId),
    ]).then(([p, appr]) => {
      setPlan(p);
      setApprobations(appr);
    }).finally(() => setLoading(false));
  }, [planId]);

  const refreshAppro = () => approbationService.findByPlan(planId).then(setApprobations);

  const handleTabChange = (t) => {
    setTab(t);
    if (t === 'historique' && !histLoaded) {
      setHistLoading(true);
      historiqueService.findByPlan(planId)
        .then(data => { setHistorique(data); setHistLoaded(true); })
        .catch(() => setHistorique([]))
        .finally(() => setHistLoading(false));
    }
  };

  const accepterDemande = async () => {
    setActionLoading(true);
    try {
      const u = await planService.accepterDemande(planId);
      setPlan(p => ({ ...p, ...u }));
      onPlanChanged?.(u);
    } finally { setActionLoading(false); }
  };

  const soumettreValidation = async () => {
    setActionLoading(true);
    try {
      const u = await planService.soumettreValidation(planId);
      setPlan(p => ({ ...p, ...u }));
      onPlanChanged?.(u);
    } finally { setActionLoading(false); }
  };

  const testerPlan = async () => {
    setActionLoading(true);
    try {
      const u = await planService.testerPlan(planId);
      setPlan(p => ({ ...p, ...u }));
      onPlanChanged?.(u);
    } finally { setActionLoading(false); }
  };

  const handleApprouverOrdre = async () => {
    setApprouveLoading(true);
    try {
      const updated = await approbationService.approuver(planId);
      setApprobations(prev => prev.map(a => a.id === updated.id ? updated : a));
    } finally { setApprouveLoading(false); }
  };

  const handleValidation = async (planMisAJour) => {
    setPlan(planMisAJour);
    setShowValidation(false);
    onPlanChanged?.(planMisAJour);
    if (histLoaded) {
      const hist = await historiqueService.findByPlan(planId);
      setHistorique(hist);
    }
  };

  const handleTelechargerPdf = async () => {
    if (!plan) return;
    setPdfLoading(true);
    try { await planService.telechargerPdf(planId, plan.reference); }
    catch { alert('Erreur lors de la génération du PDF.'); }
    finally { setPdfLoading(false); }
  };

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—';
  const fmtDateTime = (d) => d ? new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  /* Derived flags */
  const canAccepter   = plan && plan.statut === 'DEMANDE_EN_COURS' && (isManager() || isAdmin());
  const canValider    = plan && plan.statut === 'PLAN_EN_ATTENTE_VALIDATION' && canValidate();
  const canTester     = plan && plan.statut === 'PLAN_VALIDE' && isCharge();
  const isParticipant = approbations.some(a => a.utilisateurId === user?.userId);
  const allApproved   = approbations.length === 0 || approbations.every(a => a.approuve);
  const myApproval    = approbations.find(a => a.utilisateurId === user?.userId);
  const needsMyApproval = isParticipant && myApproval && !myApproval.approuve;
  const showSoumettre = plan && plan.statut === 'PLAN_EN_COURS' && ((approbations.length === 0 && canSaisirEnergies()) || isParticipant);
  const canSoumettre  = showSoumettre && allApproved;

  return (
    <>
      <style>{DRAWER_CSS}</style>
      <div className="pd-overlay" onClick={onClose} />

      <div className="pd-drawer">
        {/* ── Head ── */}
        <div className="pd-head">
          <div className="pd-head-inner">
            <div style={{ flex:1, minWidth:0 }}>
              <div className="pd-head__meta">
                {plan && <StatutBadge statut={plan.statut} />}
                <span className="pd-head__ref" title={plan?.reference}>{plan?.reference || '…'}</span>
              </div>
              <div className="pd-head__title">
                {loading ? 'Chargement…' : (plan?.descriptionIntervention || 'Plan de consignation')}
              </div>
              {plan && (
                <div className="pd-head__sub">
                  <span className="pd-head__eq-badge">{plan.equipementCode}</span>
                  <span title={plan.equipementDescription}
                    style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:240 }}>
                    {plan.equipementDescription}
                  </span>
                </div>
              )}
            </div>
            <button className="pd-close" onClick={onClose}>✕</button>
          </div>
          {/* Barre de progression statut */}
          {plan && (
            <div className="pd-status-strip">
              {['DEMANDE_EN_COURS','DEMANDE_ACCEPTE','PLAN_EN_COURS','PLAN_EN_ATTENTE_VALIDATION','PLAN_VALIDE','PLAN_TESTE'].map((s, i) => {
                const steps = ['DEMANDE_EN_COURS','DEMANDE_ACCEPTE','PLAN_EN_COURS','PLAN_EN_ATTENTE_VALIDATION','PLAN_VALIDE','PLAN_TESTE'];
                const isRejete = plan.statut === 'DEMANDE_REJETE' || plan.statut === 'PLAN_REJETE';
                const cur = steps.indexOf(plan.statut);
                const done = !isRejete && i <= cur;
                const colors = ['#64748b','#059669','#d97706','#2563eb','#059669','#7c3aed'];
                return (
                  <React.Fragment key={s}>
                    <span style={{ fontSize:9, color: done ? colors[i] : 'rgba(255,255,255,0.22)', fontWeight:700, fontFamily:'DM Mono,monospace', textTransform:'uppercase', letterSpacing:'.06em', flexShrink:0 }}>
                      {['Demande','Acceptée','En cours','Soumis','Validé','Testé'][i]}
                    </span>
                    {i < 5 && (
                      <div className="pd-status-line">
                        <div className="pd-status-progress" style={{ width: done ? '100%':'0%', background:colors[i] }} />
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Tabs ── */}
        <div className="pd-tabs">
          {TABS.map(t => (
            <button key={t.key} className={`pd-tab${tab === t.key ? ' active' : ''}`} onClick={() => handleTabChange(t.key)}>
              <span className="pd-tab-dot" />
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="pd-body">
          {loading ? (
            <div className="pd-spinner" />
          ) : tab === 'infos' ? (
            <TabInfos
              plan={plan}
              approbations={approbations}
              isParticipant={isParticipant}
              allApproved={allApproved}
              needsMyApproval={needsMyApproval}
              approuvLoading={approuvLoading}
              actionLoading={actionLoading}
              canAccepter={canAccepter}
              canValider={canValider}
              canTester={canTester}
              showSoumettre={showSoumettre}
              canSoumettre={canSoumettre}
              onApprouver={handleApprouverOrdre}
              onAccepter={accepterDemande}
              onSoumettre={soumettreValidation}
              onValider={() => setShowValidation(true)}
              onTester={testerPlan}
              fmtDate={fmtDate}
            />
          ) : tab === 'energies' ? (
            <div>
              <EnergiesPanel
                plan={plan}
                isParticipant={isParticipant}
                onEnergiesChange={(energies) => { setPlan(p => ({ ...p, energies })); refreshAppro(); }}
              />
            </div>
          ) : tab === 'historique' ? (
            <TabHistorique
              historique={historique}
              loading={histLoading}
              fmtDateTime={fmtDateTime}
            />
          ) : (
            <TabPdf
              plan={plan}
              pdfLoading={pdfLoading}
              onDownload={handleTelechargerPdf}
              fmtDate={fmtDate}
            />
          )}
        </div>
      </div>

      {showValidation && plan && (
        <ValidationModal plan={plan} onClose={() => setShowValidation(false)} onValidated={handleValidation} />
      )}
    </>
  );
}

/* ── Tab: Informations ────────────────────────────────────────────────── */
function TabInfos({ plan, approbations, isParticipant, allApproved, needsMyApproval, approuvLoading, actionLoading, canAccepter, canValider, canTester, showSoumettre, canSoumettre, onApprouver, onAccepter, onSoumettre, onValider, onTester, fmtDate }) {
  return (
    <div>
      {/* ── Infos générales ── */}
      <div className="pd-card">
        <div className="pd-card__hd">
          <span className="pd-card__hd-icon">📋</span>
          Informations générales
        </div>
        <div className="pd-card__body">
          <div className="pd-grid">
            <div>
              <div className="pd-field__lbl">Description de l'intervention</div>
              <div className="pd-field__val" style={{ gridColumn:'1/-1' }}>{plan.descriptionIntervention || '—'}</div>
            </div>
            <div>
              <div className="pd-field__lbl">Demandeur</div>
              <div className="pd-field__val" style={{ fontWeight:600 }}>{plan.demandeurNom || '—'}</div>
            </div>
            <div>
              <div className="pd-field__lbl">Date de création</div>
              <div className="pd-field__val">{fmtDate(plan.dateCreation)}</div>
            </div>
            {plan.dateValidation && (
              <div>
                <div className="pd-field__lbl">Date de validation</div>
                <div className="pd-field__val" style={{ color:'#047857', fontWeight:600 }}>{fmtDate(plan.dateValidation)}</div>
              </div>
            )}
          </div>
          <div style={{ marginTop:12, paddingTop:12, borderTop:'1px solid var(--pd-border)' }}>
            <div className="pd-field__lbl" style={{ marginBottom:5 }}>Équipement concerné</div>
            <div style={{ display:'flex', alignItems:'center', gap:8 }}>
              <span style={{ fontFamily:'DM Mono,monospace', fontSize:12, fontWeight:700, color:'#c9a84c', background:'rgba(201,168,76,0.1)', border:'1px solid rgba(201,168,76,0.22)', borderRadius:6, padding:'3px 10px' }}>
                {plan.equipementCode}
              </span>
              {plan.equipementDescription && (
                <span style={{ fontSize:12.5, color:'var(--pd-sub)' }}>{plan.equipementDescription}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Approbations ── */}
      {plan.statut === 'PLAN_EN_COURS' && approbations.length > 0 && (
        <div className="pd-card">
          <div className="pd-card__hd">
            <span className="pd-card__hd-icon">✅</span>
            Approbation de l'ordre des énergies
          </div>
          <div className="pd-card__body">
            <div className="pd-appro">
              <div className="pd-appro__hd">
                <div className="pd-appro__title">
                  {allApproved ? '✅ Tous les participants ont approuvé' : '⏳ En attente d\'approbation'}
                </div>
                <span style={{ fontSize:10.5, fontWeight:700, padding:'2px 9px', borderRadius:20,
                  background: allApproved ? 'rgba(5,150,105,0.1)' : '#fffbeb',
                  color: allApproved ? '#047857' : '#b45309',
                  border: `1px solid ${allApproved ? 'rgba(5,150,105,0.2)' : 'rgba(217,119,6,0.22)'}` }}>
                  {approbations.filter(a => a.approuve).length}/{approbations.length}
                </span>
              </div>
              {approbations.map(a => (
                <div key={a.id} className="pd-appro__row">
                  <span style={{ fontSize:14 }}>{a.approuve ? '✅' : '⏳'}</span>
                  <span className="pd-appro__name">{a.utilisateurNom}</span>
                  <span className="pd-appro__mat">{a.utilisateurMatricule}</span>
                  {a.approuve
                    ? <span style={{ fontSize:10.5, color:'#047857', fontWeight:600 }}>{new Date(a.dateApprobation).toLocaleDateString('fr-FR')}</span>
                    : <span style={{ fontSize:10.5, color:'#b45309', fontStyle:'italic' }}>En attente</span>}
                </div>
              ))}
              {needsMyApproval && (
                <button className="pd-btn pd-btn--green" style={{ marginTop:10, width:'100%', justifyContent:'center' }} onClick={onApprouver} disabled={approuvLoading}>
                  {approuvLoading ? '…' : '✓ Approuver cet ordre'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Décision de validation ── */}
      {plan.validation && (
        <div className="pd-card">
          <div className="pd-card__hd">
            <span className="pd-card__hd-icon">⚖️</span>
            Décision de validation
          </div>
          <div className="pd-card__body">
            <div className={`pd-decision pd-decision--${plan.validation.decision === 'VALIDE' ? 'valide' : 'rejete'}`}>
              <div className="pd-grid">
                <div>
                  <div className="pd-field__lbl">Décision</div>
                  <div className="pd-field__val" style={{ color: plan.validation.decision === 'VALIDE' ? '#047857' : '#be123c', fontWeight:700, fontSize:14 }}>
                    {plan.validation.decision === 'VALIDE' ? '✅ Validé' : '❌ Rejeté'}
                  </div>
                </div>
                <div>
                  <div className="pd-field__lbl">Date</div>
                  <div className="pd-field__val">{new Date(plan.validation.dateValidation).toLocaleDateString('fr-FR')}</div>
                </div>
                {plan.validation.commentaire && (
                  <div style={{ gridColumn:'1/-1' }}>
                    <div className="pd-field__lbl">Commentaire</div>
                    <div className="pd-field__val" style={{ background:'rgba(0,0,0,0.03)', padding:'8px 12px', borderRadius:8, marginTop:4 }}>{plan.validation.commentaire}</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Actions ── */}
      {(canAccepter || showSoumettre || canValider || canTester) && (
        <div className="pd-card">
          <div className="pd-card__hd"><span className="pd-card__hd-icon">⚡</span>Actions disponibles</div>
          <div className="pd-card__body">
            <div className="pd-actions">
              {canAccepter && (
                <button className="pd-btn pd-btn--green" onClick={onAccepter} disabled={actionLoading}>
                  {actionLoading ? '…' : '✅ Accepter la demande'}
                </button>
              )}
              {showSoumettre && (
                <button className="pd-btn pd-btn--amber" onClick={onSoumettre}
                  disabled={actionLoading || !allApproved}
                  title={!allApproved ? "En attente d'approbation de tous les participants" : ''}>
                  {actionLoading ? '…' : '📤 Envoyer pour validation'}
                </button>
              )}
              {canValider && (
                <button className="pd-btn pd-btn--green" onClick={onValider}>✍ Valider le plan</button>
              )}
              {canTester && (
                <button className="pd-btn pd-btn--purple" onClick={onTester} disabled={actionLoading}>
                  {actionLoading ? '…' : '🧪 Tester le plan'}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Tab: PDF ─────────────────────────────────────────────────────────── */
function TabPdf({ plan, pdfLoading, onDownload, fmtDate }) {
  const [viewerUrl,    setViewerUrl]    = useState(null);
  const [viewLoading,  setViewLoading]  = useState(false);

  const isValide     = plan?.statut === 'PLAN_VALIDE' || plan?.statut === 'PLAN_TESTE';
  const isRejete     = plan?.statut === 'PLAN_REJETE' || plan?.statut === 'DEMANDE_REJETE';
  const energiesCount= (plan?.energies || []).length;
  const statColor    = isValide ? '#047857' : isRejete ? '#be123c' : '#b45309';

  const handleVisualiser = async () => {
    if (!plan) return;
    setViewLoading(true);
    try {
      const blob = await planService.getPdfBlob(plan.id);
      const url  = URL.createObjectURL(blob);
      setViewerUrl(url);
    } catch { alert('Erreur lors de la génération du PDF.'); }
    finally  { setViewLoading(false); }
  };

  const handleCloseViewer = () => {
    if (viewerUrl) URL.revokeObjectURL(viewerUrl);
    setViewerUrl(null);
  };

  /* Visionneuse modale */
  if (viewerUrl) return (
    <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,.75)', display:'flex', flexDirection:'column' }}>
      {/* Barre du haut */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 18px', background:'#0f1e35', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style={{ color:'#fff', fontSize:13, fontWeight:600 }}>Plan de consignation — {plan.reference}</span>
          <span style={{ background:'rgba(201,168,76,.12)', color:'#c9a84c', border:'1px solid rgba(201,168,76,.25)', borderRadius:6, fontSize:10, padding:'2px 8px', fontWeight:700 }}>APERÇU</span>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button onClick={onDownload} disabled={pdfLoading}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'8px 16px', borderRadius:8, background:'linear-gradient(135deg,#1a3c7a,#2563eb)', color:'#fff', border:'none', cursor:'pointer', fontSize:12, fontWeight:700, fontFamily:'Sora,sans-serif', boxShadow:'0 4px 14px rgba(37,99,235,.3)' }}>
            {pdfLoading ? <div style={{ width:12,height:12,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'#fff',borderRadius:'50%',animation:'pdSpin .7s linear infinite' }}/> : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>}
            Télécharger
            <span style={{ fontSize:9, opacity:.6, fontStyle:'italic' }}>(+ date)</span>
          </button>
          <button onClick={handleCloseViewer}
            style={{ display:'flex', alignItems:'center', gap:5, padding:'8px 14px', borderRadius:8, background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.8)', border:'1px solid rgba(255,255,255,.12)', cursor:'pointer', fontSize:12, fontWeight:600 }}>
            ✕ Fermer
          </button>
        </div>
      </div>
      {/* iframe PDF */}
      <iframe src={viewerUrl} title="Aperçu PDF" style={{ flex:1, border:'none', background:'#525659' }}/>
      {/* Pied de page */}
      <div style={{ padding:'8px 18px', background:'#0f1e35', fontSize:11, color:'rgba(255,255,255,.3)', display:'flex', alignItems:'center', gap:8 }}>
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        La date de téléchargement sera automatiquement ajoutée au bas du document lors du téléchargement.
      </div>
    </div>
  );

  return (
    <div className="pd-pdf-wrap">

      {/* Hero */}
      <div className="pd-pdf-hero">
        <div className="pd-pdf-icon" style={{ position:'relative', zIndex:1 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="9" y1="13" x2="15" y2="13"/>
            <line x1="9" y1="17" x2="12" y2="17"/>
          </svg>
        </div>
        <div style={{ flex:1, minWidth:0, position:'relative', zIndex:1 }}>
          <div className="pd-pdf-hero-title">Plan de consignation</div>
          <div className="pd-pdf-hero-sub">Document officiel · Format PDF</div>
          <div className="pd-pdf-tags">
            <span className="pd-pdf-tag">📄 PDF</span>
            {isValide
              ? <span className="pd-pdf-tag pd-pdf-tag--ok">✓ Avec cachet officiel</span>
              : !isRejete && <span className="pd-pdf-tag pd-pdf-tag--warn">⚠ Brouillon</span>}
            <span className="pd-pdf-tag">🗓 {fmtDate(plan?.dateCreation)}</span>
          </div>
        </div>
      </div>

      {/* Méta */}
      <div className="pd-pdf-meta">
        <div className="pd-pdf-row">
          <span className="pd-pdf-row__lbl">Référence</span>
          <span className="pd-pdf-row__val" style={{ color:'#c9a84c', fontFamily:'DM Mono,monospace' }} title={plan?.reference}>{plan?.reference}</span>
        </div>
        <div className="pd-pdf-row">
          <span className="pd-pdf-row__lbl">Équipement</span>
          <span className="pd-pdf-row__val" style={{ fontFamily:'DM Mono,monospace' }} title={plan?.equipementCode}>{plan?.equipementCode}</span>
        </div>
        <div className="pd-pdf-row">
          <span className="pd-pdf-row__lbl">Statut actuel</span>
          <span className="pd-pdf-row__val" style={{ color: statColor, fontFamily:'Sora,sans-serif' }}>
            {isValide ? '✅ Validé' : isRejete ? '❌ Rejeté' : `● ${statutLabel(plan?.statut)}`}
          </span>
        </div>
        <div className="pd-pdf-row">
          <span className="pd-pdf-row__lbl">Énergies saisies</span>
          <span className="pd-pdf-row__val" style={{ color: energiesCount > 0 ? '#0f1e35' : '#94a3b8', fontFamily:'Sora,sans-serif' }}>
            {energiesCount > 0 ? `${energiesCount} point${energiesCount > 1 ? 's' : ''} de consignation` : 'Aucune énergie saisie'}
          </span>
        </div>
        {plan?.demandeurNom && (
          <div className="pd-pdf-row">
            <span className="pd-pdf-row__lbl">Demandeur</span>
            <span className="pd-pdf-row__val" style={{ fontFamily:'Sora,sans-serif' }}>{plan.demandeurNom}</span>
          </div>
        )}
        {plan?.dateValidation && (
          <div className="pd-pdf-row">
            <span className="pd-pdf-row__lbl">Validé le</span>
            <span className="pd-pdf-row__val" style={{ color:'#047857', fontFamily:'Sora,sans-serif' }}>{fmtDate(plan.dateValidation)}</span>
          </div>
        )}
      </div>

      {/* Boutons : Visualiser + Télécharger */}
      <button className="pd-pdf-btn" onClick={handleVisualiser} disabled={viewLoading}
        style={{ background:'linear-gradient(135deg,#0f1e35,#1e3558)', marginBottom:8 }}>
        {viewLoading
          ? <><div className="pd-pdf-spin"/>Chargement…</>
          : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
            </svg>Visualiser le PDF</>}
      </button>

      <button className="pd-pdf-btn" onClick={onDownload} disabled={pdfLoading}>
        {pdfLoading
          ? <><div className="pd-pdf-spin"/>Génération en cours…</>
          : <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>Télécharger le PDF<span style={{ fontSize:10, opacity:.7, marginLeft:4 }}>(+ date)</span></>}
      </button>

      {/* Notice */}
      {isValide
        ? <div className="pd-pdf-notice pd-pdf-notice--ok">✅ <span>Plan <strong>validé</strong> — le PDF inclut le cachet officiel et la signature.</span></div>
        : isRejete
        ? <div className="pd-pdf-notice pd-pdf-notice--warn">⚠ <span>Plan <strong>rejeté</strong> — le PDF inclut la mention de rejet et le commentaire.</span></div>
        : <div className="pd-pdf-notice pd-pdf-notice--info">ℹ <span>Plan en cours — PDF généré <strong>sans cachet de validation</strong>, non officiel.</span></div>}
      <div className="pd-pdf-notice pd-pdf-notice--info" style={{ marginTop:6 }}>
        ℹ <span>La <strong>date de téléchargement</strong> est automatiquement ajoutée en bas du PDF lors du téléchargement.</span>
      </div>
    </div>
  );
}

/* ── Tab: Historique ──────────────────────────────────────────────────── */
function TabHistorique({ historique, loading, fmtDateTime }) {
  if (loading) return <div className="pd-spinner" />;

  if (historique.length === 0) return (
    <div className="pd-hist-wrap">
      <div className="pd-hist-head">
        <div className="pd-hist-head__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div className="pd-hist-head__title">Historique des actions</div>
      </div>
      <div className="pd-empty" style={{ padding:'40px 24px' }}>
        <div className="pd-empty__icon">🕑</div>
        <div style={{ fontSize:13, fontWeight:600, color:'#5a6a7e' }}>Aucun historique disponible</div>
      </div>
    </div>
  );

  return (
    <div className="pd-hist-wrap">
      {/* Header */}
      <div className="pd-hist-head">
        <div className="pd-hist-head__icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
        </div>
        <div className="pd-hist-head__title">Historique des actions</div>
        <span className="pd-hist-head__count">{historique.length} événement{historique.length > 1 ? 's' : ''}</span>
      </div>

      {/* Timeline */}
      <div className="pd-timeline">
        {historique.map((h, i) => {
          const cfg = getAct(h.typeAction);
          const icon = getActIcon(h.typeAction);
          return (
            <div className="pd-tl-item" key={h.id || i}>
              {/* Icône + connecteur */}
              <div className="pd-tl-left" style={{ '--dot-color': cfg.color }}>
                <div
                  className="pd-tl-dot"
                  style={{
                    background: cfg.bg,
                    border: `1.5px solid ${cfg.border}`,
                    color: cfg.color,
                  }}
                >
                  {icon}
                </div>
                {i < historique.length - 1 && (
                  <div className="pd-tl-connector" style={{ background: `linear-gradient(to bottom,${cfg.color}40 0%,transparent 100%)` }} />
                )}
              </div>

              {/* Contenu */}
              <div className="pd-tl-content">
                <div className="pd-tl-label" style={{ color: cfg.color }}>{cfg.label}</div>
                {h.description && (
                  <div className="pd-tl-desc">{h.description}</div>
                )}
                <div className="pd-tl-foot">
                  {h.realiseeParNom && (
                    <span className="pd-tl-user">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {h.realiseeParNom}
                    </span>
                  )}
                  {h.dateAction && (
                    <span className="pd-tl-date">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                      {fmtDateTime(h.dateAction)}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
