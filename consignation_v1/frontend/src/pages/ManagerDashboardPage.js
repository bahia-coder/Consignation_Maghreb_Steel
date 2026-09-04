import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { dashboardService, equipementService } from '../services/api';
import MessageriePanel from '../components/MessageriePanel';
import AssistantWidget from '../components/AssistantWidget';

/* ════════════════════════════════════════════
   CSS COMPLET — layout sidebar + contenu
════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

:root {
  --navy:#0f1e35; --navy2:#162844; --navy3:#1e3558;
  --gold:#c9a84c; --gold-dim:rgba(201,168,76,0.12); --gold-bdr:rgba(201,168,76,0.30);
  --cream:#f7f5f0; --border:#e2ddd4;
  --text:#0f1e35; --sub:#5a6a7e; --muted:#94a3b8;
  --green:#10b981; --red:#ef4444; --blue:#3b82f6; --amber:#f59e0b; --purple:#8b5cf6;
  --shadow:0 4px 18px rgba(15,30,53,0.09);
}

body { font-family:'Inter',sans-serif; background:#f0f2f5; }

/* ── LAYOUT ── */
.mgr-layout { display:flex; min-height:100vh; }

/* ── SIDEBAR ── */
.mgr-sb {
  width:242px; flex-shrink:0;
  background:var(--navy);
  display:flex; flex-direction:column;
  position:sticky; top:0; height:100vh;
  overflow-y:auto;
}
.mgr-sb::-webkit-scrollbar { width:0; }

.mgr-sb__brand {
  padding:26px 22px 22px;
  border-bottom:1px solid var(--navy3);
  display:flex; align-items:center; gap:12px;
}
.mgr-sb__logo {
  width:38px; height:38px; border-radius:9px; flex-shrink:0;
  border:1.5px solid var(--gold); display:flex; align-items:center; justify-content:center;
  color:var(--gold);
}
.mgr-sb__appname { font-size:16px; font-weight:700; color:#fff; letter-spacing:-.02em; }
.mgr-sb__appname span { color:var(--gold); }

.mgr-sb__section {
  font-size:10px; font-family:'DM Mono',monospace; letter-spacing:.13em;
  text-transform:uppercase; color:rgba(255,255,255,0.22);
  padding:20px 22px 8px;
}

.mgr-sb__nav { padding:0 10px; display:flex; flex-direction:column; gap:2px; flex:1; }

.mgr-nav-item {
  display:flex; align-items:center; gap:10px;
  padding:10px 12px; border-radius:8px; cursor:pointer;
  border:1px solid transparent; font-size:13px;
  color:rgba(255,255,255,0.48); font-weight:400;
  background:none; width:100%; text-align:left;
  font-family:'Sora',sans-serif; transition:all .15s;
}
.mgr-nav-item:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.85); }
.mgr-nav-item.active {
  background:var(--gold-dim); border-color:var(--gold-bdr);
  color:var(--gold); font-weight:600;
}
.mgr-nav-item__icon { width:18px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
.mgr-nav-item__badge {
  margin-left:auto; background:var(--red); color:#fff;
  font-size:10px; font-weight:700; padding:1px 6px; border-radius:10px;
  font-family:'DM Mono',monospace;
}

.mgr-sb__divider { height:1px; background:var(--navy3); margin:10px 12px; }

.mgr-sb__user {
  margin:10px; padding:12px 14px;
  background:var(--navy2); border:1px solid var(--navy3);
  border-radius:10px; display:flex; align-items:center; gap:10px;
}
.mgr-sb__avatar {
  width:34px; height:34px; border-radius:50%; flex-shrink:0;
  background:var(--gold-dim); border:1.5px solid var(--gold-bdr);
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:700; color:var(--gold);
}
.mgr-sb__uname { font-size:12px; font-weight:600; color:#fff; line-height:1.3; }
.mgr-sb__urole { font-size:11px; color:rgba(255,255,255,0.32); }
.mgr-sb__msg {
  margin:0 10px 6px; padding:10px 13px;
  display:flex; align-items:center; gap:9px;
  border:1px solid rgba(201,168,76,.22); border-radius:10px;
  background:rgba(201,168,76,.07); cursor:pointer; transition:all .18s;
  font-size:12.5px; font-weight:600; color:var(--gold);
  font-family:'Sora',sans-serif; width:calc(100% - 20px);
}
.mgr-sb__msg:hover { background:rgba(201,168,76,.15); border-color:rgba(201,168,76,.4); transform:translateY(-1px); }
.mgr-sb__msg-badge {
  margin-left:auto; min-width:18px; height:18px; border-radius:9px; padding:0 5px;
  background:#e11d48; color:#fff; font-size:10px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
}

/* ── MAIN ── */
.mgr-main { flex:1; min-width:0; display:flex; flex-direction:column; background:#f0f2f5; }

/* ── TOPBAR ── */
.mgr-topbar {
  height:60px; background:#fff; border-bottom:1px solid #e9ecef;
  padding:0 28px; display:flex; align-items:center; justify-content:space-between;
  position:sticky; top:0; z-index:50;
  box-shadow:0 1px 3px rgba(0,0,0,0.04);
}
.mgr-topbar__title { font-size:15px; font-weight:700; color:var(--navy); letter-spacing:-.02em; }
.mgr-topbar__sub   { font-size:11px; color:var(--muted); margin-top:1px; }
.mgr-topbar__right { display:flex; align-items:center; gap:12px; }
.mgr-topbar__date  { font-size:11px; color:var(--muted); font-family:'DM Mono',monospace; }
.mgr-topbar__logout {
  display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px;
  background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.18);
  color:#ef4444; cursor:pointer; font-size:12px; font-weight:600;
  font-family:'Sora',sans-serif; transition:all .15s;
}
.mgr-topbar__logout:hover { background:rgba(239,68,68,0.13); }

/* ── PAGE ── */
.mgr-page { padding:24px 28px 40px; flex:1; }

/* ── BANNER ── */
.mgr-banner {
  position:relative; overflow:hidden;
  background:linear-gradient(130deg,#0b1828 0%,#0f1e35 38%,#132d50 70%,#0d2040 100%);
  border-radius:18px; padding:28px 32px; margin-bottom:20px;
  display:flex; align-items:center; justify-content:space-between; gap:20px;
  border:1px solid rgba(201,168,76,0.10);
  box-shadow:0 16px 50px rgba(10,20,40,0.20);
}
.mgr-banner__shimmer {
  position:absolute; inset:0; pointer-events:none; border-radius:inherit;
  background:linear-gradient(105deg,transparent 35%,rgba(255,255,255,0.02) 50%,transparent 65%);
  background-size:200% 100%; animation:mgrShimmer 4s ease-in-out infinite;
}
@keyframes mgrShimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
.mgr-banner__orb1{position:absolute;right:-60px;top:-60px;width:260px;height:260px;border-radius:50%;background:radial-gradient(circle,rgba(59,130,246,0.11) 0%,transparent 65%);pointer-events:none;}
.mgr-banner__orb2{position:absolute;left:38%;bottom:-50px;width:180px;height:180px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,0.09) 0%,transparent 65%);pointer-events:none;animation:mgrOrb 7s ease-in-out infinite;}
.mgr-banner__grid{position:absolute;inset:0;border-radius:inherit;pointer-events:none;background-image:linear-gradient(rgba(255,255,255,0.018) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.018) 1px,transparent 1px);background-size:40px 40px;}
@keyframes mgrOrb{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
.mgr-banner__left{position:relative;z-index:2;flex:1;}
.mgr-banner__eye{
  display:inline-flex;align-items:center;gap:6px;font-size:10px;
  color:rgba(201,168,76,0.65);text-transform:uppercase;letter-spacing:.18em;
  font-weight:600;margin-bottom:10px;
}
.mgr-banner__eye-line{width:22px;height:1px;background:rgba(201,168,76,0.35);}
.mgr-banner__title{font-size:22px;font-weight:700;color:#fff;letter-spacing:-.025em;line-height:1.25;margin-bottom:7px;}
.mgr-banner__name{color:var(--gold);}
.mgr-banner__sub{font-size:12px;color:rgba(255,255,255,0.35);font-weight:300;margin-bottom:14px;}
.mgr-banner__badges{display:flex;gap:8px;flex-wrap:wrap;}
.mgr-bdg-green{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(16,185,129,0.13);color:#34d399;border:1px solid rgba(16,185,129,0.22);}
.mgr-bdg-blue {display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:600;background:rgba(59,130,246,0.13); color:#60a5fa;border:1px solid rgba(59,130,246,0.22);}
.mgr-bdg-ghost{display:inline-flex;align-items:center;gap:5px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:400;background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.42);border:1px solid rgba(255,255,255,0.08);}
.mgr-banner__kpi-panel{
  position:relative;z-index:2;flex-shrink:0;min-width:200px;
  background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);
  border-radius:13px;padding:15px 18px;backdrop-filter:blur(12px);
}
.mgr-banner__kpi-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;font-size:9.5px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:.13em;font-weight:600;}
.mgr-live{display:flex;align-items:center;gap:5px;color:#34d399;font-size:9px;}
.mgr-live-dot{width:6px;height:6px;border-radius:50%;background:#34d399;animation:mgrPulse 2s ease-in-out infinite;}
@keyframes mgrPulse{0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(52,211,153,.4)}50%{opacity:.7;box-shadow:0 0 0 5px rgba(52,211,153,0)}}
.mgr-kpi-rows{display:flex;flex-direction:column;gap:1px;}
.mgr-kpi-row{display:flex;align-items:center;justify-content:space-between;padding:5px 0;}
.mgr-kpi-sep{height:1px;background:rgba(255,255,255,0.07);margin:2px 0;}
.mgr-kpi-lbl{font-size:11px;color:rgba(255,255,255,0.4);}
.mgr-kpi-val{font-size:14px;font-weight:700;font-variant-numeric:tabular-nums;}
.mgr-kpi-val--g{color:#34d399;} .mgr-kpi-val--b{color:#60a5fa;} .mgr-kpi-val--a{color:#fbbf24;} .mgr-kpi-val--w{color:rgba(255,255,255,0.7);}

/* ── Section header ── */
.mgr-shdr{display:flex;align-items:center;gap:10px;margin:20px 0 12px;}
.mgr-shdr__bar{width:4px;height:18px;border-radius:3px;background:linear-gradient(180deg,var(--gold),#e6c060);flex-shrink:0;box-shadow:0 2px 8px rgba(201,168,76,0.35);}
.mgr-shdr__title{font-size:12px;font-weight:700;color:var(--navy);text-transform:uppercase;letter-spacing:.09em;}
.mgr-shdr__badge{display:inline-flex;align-items:center;padding:2px 9px;border-radius:10px;font-size:10px;font-weight:700;background:rgba(16,185,129,0.10);color:#10b981;border:1px solid rgba(16,185,129,0.20);text-transform:uppercase;}

/* ── KPI GRID ── */
.mgr-kpi-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:12px;margin-bottom:6px;}
.mgr-kpi-card{
  background:#fff;border:1.5px solid #e8e2d8;border-radius:14px;padding:18px 15px 14px;
  position:relative;overflow:hidden;cursor:default;
  transition:all .22s cubic-bezier(0.4,0,0.2,1);
}
.mgr-kpi-card__bar{position:absolute;top:0;left:0;right:0;height:3px;border-radius:14px 14px 0 0;transform:scaleX(0);transform-origin:left;transition:transform .3s ease;}
.mgr-kpi-card:hover{border-color:rgba(201,168,76,0.3);box-shadow:0 8px 28px rgba(15,30,53,0.09);transform:translateY(-3px);}
.mgr-kpi-card:hover .mgr-kpi-card__bar{transform:scaleX(1);}
.mgr-kpi-card__top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:13px;}
.mgr-kpi-card__icon{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 2px 8px rgba(0,0,0,0.06);}
.mgr-kpi-card__label{font-size:10px;color:#7a8899;text-transform:uppercase;letter-spacing:.07em;font-weight:600;line-height:1.3;text-align:right;max-width:72px;}
.mgr-kpi-card__value{font-size:26px;font-weight:800;letter-spacing:-.04em;line-height:1;margin-bottom:4px;font-variant-numeric:tabular-nums;}
.mgr-kpi-card__sub{font-size:10.5px;color:#a0aec0;}

/* ── Rows ── */
.mgr-row2{display:grid;grid-template-columns:320px 1fr;gap:14px;margin-bottom:14px;}
.mgr-row2b{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-bottom:14px;}

/* ── Card ── */
.mgr-card{background:#fff;border:1.5px solid var(--border);border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(15,30,53,0.05);}
.mgr-card__head{display:flex;align-items:center;gap:10px;padding:14px 16px;border-bottom:1px solid rgba(226,221,212,0.6);background:linear-gradient(to bottom,rgba(247,245,240,0.6),transparent);}
.mgr-card__head-icon{width:30px;height:30px;border-radius:8px;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.mgr-card__head-title{flex:1;font-size:13px;font-weight:700;color:var(--navy);letter-spacing:-.01em;}
.mgr-card__head-meta{font-size:10.5px;color:var(--muted);background:rgba(226,221,212,0.5);padding:2px 8px;border-radius:6px;}

/* ── Gauge circulaire ── */
.mgr-rates-list{display:flex;flex-direction:column;}
.mgr-rate-item{display:flex;align-items:center;gap:12px;padding:11px 15px;border-bottom:1px solid rgba(226,221,212,0.4);transition:background .15s;}
.mgr-rate-item:last-child{border-bottom:none;}
.mgr-rate-item:hover{background:rgba(247,245,240,0.8);}
.mgr-rate-gauge{position:relative;flex-shrink:0;display:flex;align-items:center;justify-content:center;}
.mgr-rate-gauge-inner{position:absolute;display:flex;align-items:center;justify-content:center;}
.mgr-rate-info{flex:1;min-width:0;}
.mgr-rate-label{font-size:12px;font-weight:700;color:var(--navy);margin-bottom:2px;}
.mgr-rate-desc{font-size:10.5px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.mgr-rate-bar-wrap{width:100%;height:4px;background:rgba(226,221,212,0.8);border-radius:3px;margin-top:5px;overflow:hidden;}
.mgr-rate-bar-fill{height:100%;border-radius:3px;transition:width 1.2s cubic-bezier(0.4,0,0.2,1);}

/* ── Équipe ── */
.mgr-team-row{display:flex;align-items:center;gap:11px;padding:10px 16px;border-bottom:1px solid rgba(226,221,212,0.4);transition:background .12s;cursor:default;}
.mgr-team-row:last-child{border-bottom:none;}
.mgr-team-row:hover{background:rgba(247,245,240,0.9);}
.mgr-avatar{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;color:var(--gold);background:var(--gold-dim);border:1.5px solid var(--gold-bdr);flex-shrink:0;}
.mgr-team-name{font-size:12.5px;font-weight:600;color:var(--navy);}
.mgr-team-role{font-size:11px;color:var(--muted);}
.mgr-team-mat{font-size:10px;font-family:'DM Mono',monospace;color:var(--muted);background:rgba(226,221,212,0.5);padding:2px 7px;border-radius:5px;margin-left:auto;flex-shrink:0;}

/* ── Plans récents ── */
.mgr-plan-row{display:flex;align-items:center;gap:10px;padding:9px 16px;border-bottom:1px solid rgba(226,221,212,0.4);transition:background .12s;cursor:pointer;}
.mgr-plan-row:last-child{border-bottom:none;}
.mgr-plan-row:hover{background:rgba(247,245,240,0.8);}
.mgr-plan-ref{font-family:'DM Mono',monospace;font-size:10.5px;font-weight:700;color:var(--gold);background:var(--gold-dim);padding:2px 7px;border-radius:5px;border:1px solid var(--gold-bdr);flex-shrink:0;}
.mgr-plan-desc{font-size:12px;color:#374151;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.mgr-plan-date{font-size:10px;font-family:'DM Mono',monospace;color:var(--muted);flex-shrink:0;}

/* ── Stat barres ── */
.mgr-stat-row{margin-bottom:11px;}
.mgr-stat-row:last-child{margin-bottom:0;}
.mgr-stat-meta{display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;}
.mgr-pbar-track{height:5px;background:rgba(226,221,212,0.8);border-radius:3px;overflow:hidden;}
.mgr-pbar-fill{height:100%;border-radius:3px;transition:width 1s cubic-bezier(0.4,0,0.2,1);}

/* ── Security ── */
.mgr-security{background:linear-gradient(135deg,#0f1e35,#1a3260);border-radius:13px;padding:17px;border:1px solid rgba(201,168,76,0.12);}
.mgr-security__head{display:flex;align-items:center;gap:8px;margin-bottom:10px;}
.mgr-security__icon{width:28px;height:28px;background:rgba(201,168,76,0.15);border-radius:8px;display:flex;align-items:center;justify-content:center;color:var(--gold);}
.mgr-security__title{font-size:12px;font-weight:700;color:#fff;}
.mgr-security__body{font-size:11.5px;color:rgba(255,255,255,0.40);line-height:1.65;}
.mgr-security__body strong{color:rgba(255,255,255,0.68);}

/* ── Loader ── */
.mgr-loader{display:flex;align-items:center;justify-content:center;padding:28px;color:var(--muted);font-size:12px;gap:8px;}
.mgr-loader::before{content:'';width:14px;height:14px;border:2px solid #e2ddd4;border-top-color:var(--gold);border-radius:50%;animation:mgrSpin .7s linear infinite;}
@keyframes mgrSpin{to{transform:rotate(360deg)}}

/* ── Fade in ── */
.mgr-f1{animation:mgrFade .4s ease both;}
.mgr-f2{animation:mgrFade .4s .08s ease both;}
.mgr-f3{animation:mgrFade .4s .16s ease both;}
.mgr-f4{animation:mgrFade .4s .22s ease both;}
@keyframes mgrFade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}

/* ── Responsive ── */
@media(max-width:1400px){.mgr-kpi-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:1100px){.mgr-row2{grid-template-columns:1fr}}
@media(max-width:900px) {.mgr-kpi-grid{grid-template-columns:repeat(2,1fr)}.mgr-row2b{grid-template-columns:1fr}.mgr-sb{display:none}}
`;

/* ════════════════════════════════════════════
   ICÔNES SVG
════════════════════════════════════════════ */
const I = {
  Home:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>,
  Equip:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>,
  Users:   <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  File:    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  Logout:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  Shield:  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  Check:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
  X:       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>,
  Clock:   <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  Target:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  Layers:  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  Pie:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></svg>,
  Wave:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  Bar:     <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  List:    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>,
  UsersSmall:<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  Mgr:     <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><polyline points="9 12 11 14 15 10"/></svg>,
  Gear:    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

/* ════════════════════════════════════════════
   COMPOSANTS RÉUTILISABLES
════════════════════════════════════════════ */

/* Gauge circulaire SVG */
function CircleGauge({ pct, color, size = 68, stroke = 6 }) {
  const r    = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform:'rotate(-90deg)', flexShrink:0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#ede9e0" strokeWidth={stroke}/>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition:'stroke-dasharray 1.1s cubic-bezier(0.4,0,0.2,1)' }}
      />
    </svg>
  );
}

/* Rate item avec gauge */
function RateItem({ label, desc, pct, color }) {
  return (
    <div className="mgr-rate-item">
      <div className="mgr-rate-gauge">
        <CircleGauge pct={pct} color={color} />
        <div className="mgr-rate-gauge-inner">
          <span style={{ color, fontSize:11, fontWeight:700 }}>{Math.round(pct)}%</span>
        </div>
      </div>
      <div className="mgr-rate-info">
        <div className="mgr-rate-label">{label}</div>
        <div className="mgr-rate-desc">{desc}</div>
        <div className="mgr-rate-bar-wrap">
          <div className="mgr-rate-bar-fill" style={{ width:`${Math.min(pct,100)}%`, background:color }}/>
        </div>
      </div>
    </div>
  );
}

/* KPI Card */
function KpiCard({ icon, label, value, sub, color, bg }) {
  return (
    <div className="mgr-kpi-card">
      <div className="mgr-kpi-card__bar" style={{ background:color }}/>
      <div className="mgr-kpi-card__top">
        <div className="mgr-kpi-card__icon" style={{ background:bg, color }}>{icon}</div>
        <div className="mgr-kpi-card__label">{label}</div>
      </div>
      <div className="mgr-kpi-card__value" style={{ color }}>{value}</div>
      {sub && <div className="mgr-kpi-card__sub">{sub}</div>}
    </div>
  );
}

/* Section header */
function SHdr({ title, badge }) {
  return (
    <div className="mgr-shdr">
      <div className="mgr-shdr__bar"/>
      <span className="mgr-shdr__title">{title}</span>
      {badge && <span className="mgr-shdr__badge">{badge}</span>}
    </div>
  );
}

/* SVG Area Chart pur */
function AreaChart({ data, color='#3b82f6', height=180 }) {
  const [tip, setTip] = useState(null);
  const W=460, H=height, PAD={t:8,r:8,b:26,l:24};
  const iW=W-PAD.l-PAD.r, iH=H-PAD.t-PAD.b;
  const maxVal=Math.max(...data.map(d=>d.count),1);
  const pts=data.map((d,i)=>({ x:PAD.l+i*(iW/Math.max(data.length-1,1)), y:PAD.t+iH-(d.count/maxVal)*iH, d }));
  const line=pts.map((p,i)=>{
    if(i===0) return `M${p.x},${p.y}`;
    const pv=pts[i-1]; const cx1=pv.x+(p.x-pv.x)*0.5; const cx2=p.x-(p.x-pv.x)*0.5;
    return `C${cx1},${pv.y} ${cx2},${p.y} ${p.x},${p.y}`;
  }).join(' ');
  const area=line+` L${pts[pts.length-1].x},${PAD.t+iH} L${PAD.l},${PAD.t+iH} Z`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} style={{overflow:'visible'}}>
      <defs>
        <linearGradient id="mgrGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.22"/><stop offset="100%" stopColor={color} stopOpacity="0.01"/>
        </linearGradient>
      </defs>
      {[0,.25,.5,.75,1].map((f,i)=><line key={i} x1={PAD.l} x2={PAD.l+iW} y1={PAD.t+iH*f} y2={PAD.t+iH*f} stroke="#f0ece3" strokeWidth="1" strokeDasharray="3 3"/>)}
      <path d={area} fill="url(#mgrGrad)"/>
      <path d={line} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {pts.map((p,i)=>(
        <g key={i}>
          <circle cx={p.x} cy={p.y} r={p.d.count>0?5:3} fill={p.d.count>0?color:'#fff'} stroke={p.d.count>0?'#fff':'#cbd5e1'} strokeWidth="2"/>
          <circle cx={p.x} cy={p.y} r={12} fill="transparent" onMouseEnter={()=>setTip(p)} onMouseLeave={()=>setTip(null)} style={{cursor:'crosshair'}}/>
          <text x={p.x} y={H-4} textAnchor="middle" fontSize="9.5" fill="#94a3b8" fontFamily="Inter,sans-serif">{p.d.month}</text>
        </g>
      ))}
      {tip && (
        <g>
          <rect x={tip.x-28} y={tip.y-40} width={56} height={26} rx={6} fill="#0f1e35" opacity="0.95"/>
          <text x={tip.x} y={tip.y-22} textAnchor="middle" fontSize="12" fontWeight="700" fill="#c9a84c" fontFamily="Sora,sans-serif">{tip.d.count}</text>
          <text x={tip.x} y={tip.y-10} textAnchor="middle" fontSize="8" fill="rgba(255,255,255,0.5)" fontFamily="Inter,sans-serif">{tip.d.month}</text>
        </g>
      )}
    </svg>
  );
}

/* ════════════════════════════════════════════
   STATUT CONFIG
════════════════════════════════════════════ */
const STATUT_CFG = {
  DEMANDE_EN_COURS:           { label:'Demande en cours',      color:'#475569', bg:'rgba(71,85,105,0.1)'   },
  DEMANDE_ACCEPTE:            { label:'Demande acceptée',      color:'#059669', bg:'rgba(5,150,105,0.1)'   },
  DEMANDE_REJETE:             { label:'Demande rejetée',       color:'#e11d48', bg:'rgba(225,29,72,0.1)'   },
  PLAN_EN_COURS:              { label:'Plan en cours',         color:'#b45309', bg:'rgba(180,83,9,0.1)'    },
  PLAN_EN_ATTENTE_VALIDATION: { label:'En attente valid.',     color:'#1d4ed8', bg:'rgba(29,78,216,0.1)'   },
  PLAN_VALIDE:                { label:'Plan validé',           color:'#065f46', bg:'rgba(6,95,70,0.1)'     },
  PLAN_REJETE:                { label:'Plan rejeté',           color:'#9f1239', bg:'rgba(159,18,57,0.1)'   },
  PLAN_TESTE:                 { label:'Plan testé',            color:'#6d28d9', bg:'rgba(109,40,217,0.1)'  },
};

/* ════════════════════════════════════════════
   PAGE PRINCIPALE
════════════════════════════════════════════ */
export default function ManagerDashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [stats,     setStats]     = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [activePage,setActivePage]= useState('dashboard');
  const [showMsg,   setShowMsg]   = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);

  const today = new Date().toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
  const initials = user ? `${(user.prenom||'').charAt(0)}${(user.nom||'').charAt(0)}`.toUpperCase() : '?';

  useEffect(() => {
    dashboardService.getStats()
      .then(data => setStats(data))
      .catch(err => console.error('Dashboard stats error:', err))
      .finally(() => setLoading(false));
  }, []);

  /* ── Calcul des stats depuis dashboardService.getStats() ── */
  const s            = stats || {};
  const totalPlans   = s.totalPlans   || 0;
  const plansValides = s.plansValides || 0;
  const plansRejetes = s.plansRejetes || 0;
  const plansAttente = s.plansEnAttenteValidation || 0;
  const plansTraite  = s.plansEnCours             || 0;
  const plansDemande = s.plansDemandeEnCours       || 0;

  // Taux calculés depuis les données réelles
  const base = totalPlans || 1;
  const tauxValidation = Math.round((plansValides / base) * 100);
  const tauxRejet      = Math.round((plansRejetes / base) * 100);
  const tauxAttente    = Math.round((plansAttente / base) * 100);
  const tauxTraitement = Math.round((plansTraite  / base) * 100);
  const tauxConformite = Math.max(0, tauxValidation - tauxRejet);

  /* ── Évolution : plans créés par mois (depuis plansParMois backend) ── */
  const evolutionData = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 6 }, (_, i) => {
      const d   = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const month = d.toLocaleString('fr-FR', { month: 'short' });
      const count = s.plansParMois ? (s.plansParMois[key] || 0) : 0;
      return { key, month, count };
    });
  }, [s.plansParMois]);

  const evoTotal = evolutionData.reduce((acc, d) => acc + d.count, 0);

  const handleLogout = () => { logout(); navigate('/login',{replace:true}); };

  const NAV_ITEMS = [
    { id:'dashboard', label:'Tableau de bord', icon:I.Home  },
    { id:'equip',     label:'Équipements',     icon:I.Equip },
  ];

  /* ── Nav click ── */
  const handleNav = async (id) => {
    if (id === 'equip') {
      const zoneId = user?.zoneId;
      if (!zoneId) return;
      try {
        const eqs = await equipementService.findRacinesParZone(zoneId);
        if (eqs.length > 0) navigate(`/manager-equip/${eqs[0].id}`);
      } catch {}
      return;
    }
    setActivePage(id);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="mgr-layout">

        {/* ════ SIDEBAR GAUCHE ════ */}
        <aside className="mgr-sb">
          {/* Brand */}
          <div className="mgr-sb__brand">
            <div className="mgr-sb__logo">{I.Gear}</div>
            <div className="mgr-sb__appname">Consign<span>App</span></div>
          </div>

          <div className="mgr-sb__section">Navigation</div>

          {/* Nav */}
          <nav className="mgr-sb__nav">
            {NAV_ITEMS.map(item => (
              <button key={item.id} className={`mgr-nav-item${activePage===item.id?' active':''}`} onClick={()=>handleNav(item.id)}>
                <span className="mgr-nav-item__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="mgr-sb__divider"/>

          {/* Messagerie */}
          <button className="mgr-sb__msg" onClick={() => setShowMsg(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Messagerie</span>
            {msgUnread > 0 && <span className="mgr-sb__msg-badge">{msgUnread > 9 ? '9+' : msgUnread}</span>}
          </button>

          {/* User card */}
          <div className="mgr-sb__user">
            <div className="mgr-sb__avatar">{initials}</div>
            <div style={{flex:1,minWidth:0}}>
              <div className="mgr-sb__uname">{user?.prenom} {user?.nom}</div>
              <div className="mgr-sb__urole">Manager</div>
            </div>
          </div>
        </aside>

        {/* ════ CONTENU PRINCIPAL ════ */}
        <div className="mgr-main">

          {/* Topbar */}
          <header className="mgr-topbar">
            <div>
              <div className="mgr-topbar__title">Tableau de bord</div>
              <div className="mgr-topbar__sub">Supervision des consignations industrielles</div>
            </div>
            <div className="mgr-topbar__right">
              <div className="mgr-topbar__date">{today}</div>
              <div style={{display:'flex',alignItems:'center',gap:6,fontSize:11,color:'#059669',fontWeight:500}}>
                <div style={{width:7,height:7,borderRadius:'50%',background:'#059669',boxShadow:'0 0 0 2px rgba(5,150,105,.2)'}}/>
                Opérationnel
              </div>
              <button className="mgr-topbar__logout" onClick={handleLogout}>
                {I.Logout} Déconnexion
              </button>
            </div>
          </header>

          {/* PAGE DASHBOARD */}
          {activePage === 'dashboard' && (
            <div className="mgr-page">

              {/* Banner */}
              <div className="mgr-banner mgr-f1">
                <div className="mgr-banner__shimmer"/>
                <div className="mgr-banner__orb1"/><div className="mgr-banner__orb2"/>
                <div className="mgr-banner__grid"/>
                <div className="mgr-banner__left">
                  <div className="mgr-banner__eye"><span className="mgr-banner__eye-line"/>{today}</div>
                  <div className="mgr-banner__title">Bonjour, <span className="mgr-banner__name">{user?.prenom} {user?.nom}</span></div>
                  <div className="mgr-banner__sub">Tableau de bord Manager — Supervision des consignations industrielles</div>
                  <div className="mgr-banner__badges">
                    {plansValides>0 && <span className="mgr-bdg-green">{I.Check} {plansValides} validé{plansValides>1?'s':''}</span>}
                    {plansAttente>0 && <span className="mgr-bdg-blue">{I.Clock} {plansAttente} en attente</span>}
                    <span className="mgr-bdg-ghost">{I.Mgr} Manager</span>
                  </div>
                </div>
                <div className="mgr-banner__kpi-panel">
                  <div className="mgr-banner__kpi-head">
                    Vue d'ensemble
                    <div className="mgr-live"><div className="mgr-live-dot"/>Live</div>
                  </div>
                  <div className="mgr-kpi-rows">
                    <div className="mgr-kpi-row"><span className="mgr-kpi-lbl">Total plans</span><span className="mgr-kpi-val mgr-kpi-val--b">{loading?'—':totalPlans}</span></div>
                    <div className="mgr-kpi-sep"/>
                    <div className="mgr-kpi-row"><span className="mgr-kpi-lbl">Validés</span><span className="mgr-kpi-val mgr-kpi-val--g">{loading?'—':plansValides}</span></div>
                    <div className="mgr-kpi-sep"/>
                    <div className="mgr-kpi-row"><span className="mgr-kpi-lbl">En attente</span><span className="mgr-kpi-val mgr-kpi-val--a">{loading?'—':plansAttente}</span></div>
                    <div className="mgr-kpi-sep"/>
                    <div className="mgr-kpi-row"><span className="mgr-kpi-lbl">Équipements</span><span className="mgr-kpi-val mgr-kpi-val--w">{loading?'—':(s.totalEquipements||0)}</span></div>
                  </div>
                </div>
              </div>

              {/* KPI Grid */}
              <SHdr title="Indicateurs clés de performance" badge="Live" />
              <div className="mgr-kpi-grid mgr-f2">
                <KpiCard icon={I.Check}  label="Taux validation"  value={loading?'—':`${tauxValidation}%`} sub="Plans validés / total"      color="#10b981" bg="rgba(16,185,129,0.10)"/>
                <KpiCard icon={I.X}      label="Taux de rejet"    value={loading?'—':`${tauxRejet}%`}      sub="Plans rejetés / total"       color="#ef4444" bg="rgba(239,68,68,0.10)"/>
                <KpiCard icon={I.Target} label="Conformité"       value={loading?'—':`${tauxConformite}%`} sub="Validation − rejet"          color="#3b82f6" bg="rgba(59,130,246,0.10)"/>
                <KpiCard icon={I.Clock}  label="En attente valid" value={loading?'—':`${tauxAttente}%`}    sub={`${plansAttente} plan(s)`}   color="#f59e0b" bg="rgba(245,158,11,0.10)"/>
                <KpiCard icon={I.Layers} label="En traitement"    value={loading?'—':plansTraite}           sub={`${tauxTraitement}% du total`} color="#8b5cf6" bg="rgba(139,92,246,0.10)"/>
                <KpiCard icon={I.File}   label="Demandes"         value={loading?'—':plansDemande}          sub="Nouvelles demandes"          color="#c9a84c" bg="rgba(201,168,76,0.10)"/>
              </div>

              {/* Taux + Évolution */}
              <SHdr title="Analyse des taux & évolution" />
              <div className="mgr-row2 mgr-f3">
                <div className="mgr-card">
                  <div className="mgr-card__head">
                    <div className="mgr-card__head-icon" style={{background:'rgba(201,168,76,0.10)',color:'#c9a84c'}}>{I.Pie}</div>
                    <span className="mgr-card__head-title">Vue d'ensemble des taux</span>
                  </div>
                  {loading ? <div className="mgr-loader">Chargement…</div> : (
                    <div className="mgr-rates-list">
                      <RateItem label="Taux de validation"  desc="Plans validés / total"            pct={tauxValidation}  color="#10b981"/>
                      <RateItem label="Taux de rejet"       desc="Plans rejetés / total"            pct={tauxRejet}       color="#ef4444"/>
                      <RateItem label="En attente valid."   desc="Plans soumis en attente"          pct={tauxAttente}     color="#f59e0b"/>
                      <RateItem label="En traitement"       desc="Plans en cours de traitement"     pct={tauxTraitement}  color="#8b5cf6"/>
                    </div>
                  )}
                </div>
                <div className="mgr-card">
                  <div className="mgr-card__head">
                    <div className="mgr-card__head-icon" style={{background:'rgba(59,130,246,0.10)',color:'#3b82f6'}}>{I.Wave}</div>
                    <span className="mgr-card__head-title">Plans créés par mois</span>
                    <span className="mgr-card__head-meta">6 derniers mois</span>
                  </div>
                  {loading ? <div className="mgr-loader">Chargement…</div> : (
                    <div style={{padding:'14px 10px 8px'}}>
                      <AreaChart data={evolutionData} color="#3b82f6" height={190}/>
                      <div style={{textAlign:'center',fontSize:10.5,color:'#94a3b8',marginTop:5,fontFamily:'Inter,sans-serif'}}>
                        {evoTotal===0?'Aucun plan créé sur les 6 derniers mois':`${evoTotal} plan${evoTotal>1?'s':''} créé${evoTotal>1?'s':''} sur 6 mois`}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Répartition + Sécurité */}
              <SHdr title="Répartition des plans & sécurité" />
              <div className="mgr-row2b">
                <div className="mgr-card">
                  <div className="mgr-card__head">
                    <div className="mgr-card__head-icon" style={{background:'rgba(37,99,235,0.08)',color:'#2563eb'}}>{I.Bar}</div>
                    <span className="mgr-card__head-title">Répartition par statut</span>
                    {totalPlans>0 && <span className="mgr-card__head-meta">{totalPlans} plans</span>}
                  </div>
                  <div style={{padding:'14px 18px 16px',display:'flex',flexDirection:'column',gap:11}}>
                    {[
                      {key:'DEMANDE_EN_COURS',           count: s.plansDemandeEnCours      ||0},
                      {key:'DEMANDE_ACCEPTE',            count: s.plansDemandeAccepte      ||0},
                      {key:'DEMANDE_REJETE',             count: s.plansDemandeRejete       ||0},
                      {key:'PLAN_EN_COURS',              count: s.plansEnCours             ||0},
                      {key:'PLAN_EN_ATTENTE_VALIDATION', count: s.plansEnAttenteValidation ||0},
                      {key:'PLAN_VALIDE',                count: s.plansValides             ||0},
                      {key:'PLAN_REJETE',                count: s.plansRejetes             ||0},
                      {key:'PLAN_TESTE',                 count: s.plansTestes              ||0},
                    ].filter(g=>g.count>0).map(g => {
                      const cfg=STATUT_CFG[g.key]; const pct=totalPlans>0?Math.round((g.count/totalPlans)*100):0;
                      return (
                        <div key={g.key} className="mgr-stat-row">
                          <div className="mgr-stat-meta">
                            <div style={{display:'flex',alignItems:'center',gap:7,fontSize:12,fontWeight:600,color:'#0f1e35'}}>
                              <span style={{width:8,height:8,borderRadius:'50%',background:cfg.color,display:'inline-block',flexShrink:0}}/>
                              {cfg.label}
                            </div>
                            <div style={{display:'flex',alignItems:'center',gap:7}}>
                              <span style={{fontFamily:'DM Mono,monospace',fontSize:11,fontWeight:700,color:cfg.color}}>{g.count}</span>
                              <span style={{fontSize:10,color:'#94a3b8',fontFamily:'DM Mono,monospace'}}>{pct}%</span>
                            </div>
                          </div>
                          <div className="mgr-pbar-track"><div className="mgr-pbar-fill" style={{width:`${pct}%`,background:cfg.color}}/></div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div style={{display:'flex',flexDirection:'column',gap:12}}>
                  <div className="mgr-security">
                    <div className="mgr-security__head">
                      <div className="mgr-security__icon">{I.Shield}</div>
                      <div className="mgr-security__title">Règles de sécurité</div>
                    </div>
                    <div className="mgr-security__body">
                      Toute consignation doit être <strong>validée</strong> avant toute intervention.
                      Vérifiez les habilitations et les EPI avant chaque opération sur site.
                    </div>
                  </div>
                  <div className="mgr-card" style={{padding:'14px'}}>
                    <div style={{fontSize:10,fontFamily:'DM Mono,monospace',color:'#94a3b8',textTransform:'uppercase',letterSpacing:'.09em',marginBottom:10}}>Actions rapides</div>
                    <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                      {[
                        {label:'Équipements', icon:I.Equip,  action:()=>handleNav('equip'), color:'#c9a84c'},
                        {label:'Utilisateurs',icon:I.Users,  action:()=>navigate('/utilisateurs'), color:'#3b82f6'},
                      ].map((btn,i)=>(
                        <button key={i} onClick={btn.action} style={{display:'flex',alignItems:'center',gap:8,padding:'9px 11px',background:'rgba(247,245,240,0.8)',border:'1.5px solid #e8e3da',borderRadius:8,cursor:'pointer',fontFamily:'Sora,sans-serif',fontSize:11.5,fontWeight:600,color:'#374151',transition:'all .15s'}}
                          onMouseEnter={e=>{e.currentTarget.style.borderColor=btn.color;e.currentTarget.style.color=btn.color;}}
                          onMouseLeave={e=>{e.currentTarget.style.borderColor='#e8e3da';e.currentTarget.style.color='#374151';}}>
                          <span style={{color:btn.color}}>{btn.icon}</span>{btn.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>
      </div>

      {showMsg && (
        <MessageriePanel
          onClose={() => setShowMsg(false)}
          onUnreadChange={setMsgUnread}
        />
      )}
      <AssistantWidget />
    </>
  );
}
