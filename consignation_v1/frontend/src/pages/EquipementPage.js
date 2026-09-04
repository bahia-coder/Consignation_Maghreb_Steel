import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { equipementService, planService, zoneService, dashboardService } from '../services/api';

/** Construit une map { equipementId -> [ids de tous les descendants] } */
function buildDescendantMap(allEquipments) {
  const childrenOf = {};
  allEquipments.forEach(eq => {
    if (eq.parentId) {
      if (!childrenOf[eq.parentId]) childrenOf[eq.parentId] = [];
      childrenOf[eq.parentId].push(eq.id);
    }
  });
  const getAllDesc = (id) => {
    const kids = childrenOf[id] || [];
    return kids.reduce((acc, kid) => [...acc, kid, ...getAllDesc(kid)], []);
  };
  const map = {};
  allEquipments.forEach(eq => { map[eq.id] = getAllDesc(eq.id); });
  return map;
}
import DemandePlanModal from '../components/DemandePlanModal';
import PlanDetailDrawer from '../components/PlanDetailDrawer';
import QrCodeModal from '../components/QrCodeModal';
import EquipmentIcon from '../components/icons/EquipmentIcon';

const STATUT_CFG = {
  DEMANDE_EN_COURS:           { label:'Demande en cours',      short:'Demande',    color:'#475569', bg:'rgba(71,85,105,0.08)',   border:'rgba(71,85,105,0.18)',   dot:'#475569',  icon:'DEMANDE'   },
  DEMANDE_ACCEPTE:            { label:'Demande acceptée',      short:'Acceptée',   color:'#059669', bg:'rgba(5,150,105,0.06)',   border:'rgba(5,150,105,0.18)',   dot:'#059669',  icon:'VALIDE'    },
  DEMANDE_REJETE:             { label:'Demande rejetée',       short:'Rejetée',    color:'#e11d48', bg:'rgba(225,29,72,0.06)',   border:'rgba(225,29,72,0.18)',   dot:'#e11d48',  icon:'REJETE'    },
  PLAN_EN_COURS:              { label:'Plan en cours',         short:'En cours',   color:'#b45309', bg:'rgba(180,83,9,0.08)',    border:'rgba(180,83,9,0.18)',    dot:'#d97706',  icon:'TRAITEMENT'},
  PLAN_EN_ATTENTE_VALIDATION: { label:'En attente valid.',     short:'En attente', color:'#1d4ed8', bg:'rgba(29,78,216,0.08)',   border:'rgba(29,78,216,0.18)',   dot:'#3b82f6',  icon:'ATTENTE'   },
  PLAN_VALIDE:                { label:'Plan validé',           short:'Validé',     color:'#065f46', bg:'rgba(6,95,70,0.08)',     border:'rgba(6,95,70,0.18)',     dot:'#059669',  icon:'VALIDE'    },
  PLAN_REJETE:                { label:'Plan rejeté',           short:'Rejeté',     color:'#9f1239', bg:'rgba(159,18,57,0.08)',   border:'rgba(159,18,57,0.18)',   dot:'#e11d48',  icon:'REJETE'    },
  PLAN_TESTE:                 { label:'Plan testé',            short:'Testé',      color:'#6d28d9', bg:'rgba(109,40,217,0.07)', border:'rgba(109,40,217,0.18)',  dot:'#7c3aed',  icon:'ATTENTE'   },
};
const getCfg = (s) => STATUT_CFG[s] || { label:s, short:s, color:'#64748b', bg:'#f0ece3', border:'#e2ddd4', dot:'#64748b', icon:'DEMANDE' };

/* ── SVG Icons ── */
const Icon = ({ name, size=16, color='currentColor' }) => {
  const icons = {
    TOTAL: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
        <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
      </svg>
    ),
    DEMANDE: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/>
        <line x1="9" y1="15" x2="15" y2="15"/>
      </svg>
    ),
    TRAITEMENT: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
        <path d="M15.54 8.46a5 5 0 0 1 0 7.07M8.46 8.46a5 5 0 0 0 0 7.07"/>
      </svg>
    ),
    ATTENTE: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
    ),
    VALIDE: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
    ),
    REJETE: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10"/>
        <line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>
      </svg>
    ),
    TREE: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0"/>
      </svg>
    ),
    SEARCH: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
      </svg>
    ),
    PLUS: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    ),
    CHEVRON_DOWN: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    ),
    CALENDAR: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
        <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
      </svg>
    ),
    USER: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    ),
    ARROW_RIGHT: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
      </svg>
    ),
    CLOSE: (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    ),
  };
  return icons[name] || null;
};

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
:root {
  --gold:#c9a84c; --gold-dim:rgba(201,168,76,0.10); --gold-bdr:rgba(201,168,76,0.28);
  --navy:#0f1e35; --navy2:#162844; --bdr:#e8e3da; --sub:#5a6a7e; --muted:#94a3b8;
  --bg:#f8f6f2; --white:#ffffff;
  --shadow-sm:0 1px 4px rgba(15,30,53,0.06); --shadow-md:0 4px 18px rgba(15,30,53,0.09);
}

.ep { font-family:'Sora',sans-serif; margin:28px; }

/* ── Banner ── */
.ep-banner {
  background:linear-gradient(135deg,#0f1e35 0%,#162844 55%,#0d2a50 100%);
  border-radius:18px; padding:24px 30px; margin-bottom:20px;
  display:flex; align-items:center; justify-content:space-between; gap:20px;
  position:relative; overflow:hidden;
  box-shadow:0 6px 28px rgba(15,30,53,0.20);
}
.ep-banner::before {
  content:''; position:absolute; top:-80px; right:20px; width:280px; height:280px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(201,168,76,0.07) 0%,transparent 65%);
  pointer-events:none;
}
.ep-banner::after {
  content:''; position:absolute; bottom:-40px; right:160px; width:160px; height:160px;
  border-radius:50%;
  background:radial-gradient(circle,rgba(201,168,76,0.04) 0%,transparent 70%);
  pointer-events:none;
}
.ep-banner__eye {
  font-family:'DM Mono',monospace; font-size:10px; color:rgba(201,168,76,0.55);
  text-transform:uppercase; letter-spacing:.14em; margin-bottom:6px;
  display:flex; align-items:center; gap:6px;
}
.ep-banner__eye::before {
  content:''; width:20px; height:1px; background:rgba(201,168,76,0.35);
}
.ep-banner__title { font-size:22px; font-weight:800; color:#fff; letter-spacing:-.025em; line-height:1.2; }
.ep-banner__title span { color:#c9a84c; }
.ep-banner__sub { font-size:11.5px; color:rgba(255,255,255,0.28); margin-top:5px; }
.ep-kpis { display:flex; gap:10px; flex-shrink:0; }
.ep-kpi {
  background:rgba(255,255,255,0.06); border:1px solid rgba(255,255,255,0.09);
  border-radius:14px; padding:13px 20px; text-align:center; min-width:88px;
  backdrop-filter:blur(8px);
}
.ep-kpi__val { font-size:24px; font-weight:800; color:#c9a84c; line-height:1; }
.ep-kpi__lbl { font-size:10px; color:rgba(255,255,255,0.32); text-transform:uppercase; letter-spacing:.08em; margin-top:4px; }

/* ── Stats strip ── */
.ep-stats {
  display:grid; grid-template-columns:repeat(6,1fr);
  gap:10px; margin-bottom:20px;
}
.ep-stat {
  background:var(--white); border:1.5px solid var(--bdr); border-radius:14px;
  padding:16px 14px 14px; cursor:pointer;
  transition:all .2s cubic-bezier(0.4,0,0.2,1);
  position:relative; text-align:left; overflow:hidden;
  box-shadow:var(--shadow-sm);
}
.ep-stat::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  border-radius:14px 14px 0 0; opacity:0; transition:opacity .2s;
}
.ep-stat:hover { transform:translateY(-2px); box-shadow:var(--shadow-md); border-color:transparent; }
.ep-stat:hover::before { opacity:1; }
.ep-stat.active { border-color:transparent; box-shadow:var(--shadow-md); }
.ep-stat.active::before { opacity:1; }
.ep-stat__icon-wrap {
  width:36px; height:36px; border-radius:10px;
  display:flex; align-items:center; justify-content:center; margin-bottom:12px;
}
.ep-stat__val {
  font-size:26px; font-weight:800; line-height:1; margin-bottom:2px;
  font-family:'Sora',sans-serif;
}
.ep-stat__lbl {
  font-size:10.5px; color:var(--sub); font-weight:600; letter-spacing:.01em;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.ep-stat__count {
  font-size:10px; color:var(--muted); margin-top:4px;
  display:flex; align-items:center; gap:4px;
}
.ep-stat__count svg { flex-shrink:0; }

/* ── Body ── */
.ep-body { display:grid; grid-template-columns:var(--tree-w,268px) 4px 1fr; gap:0; align-items:start; }

/* ── Resize handle ── */
.ep-resize-handle {
  width:4px; cursor:col-resize; align-self:stretch;
  background:transparent; position:relative; z-index:10;
  transition:background .15s; margin:0 5px;
}
.ep-resize-handle:hover, .ep-resize-handle.dragging { background:rgba(201,168,76,.5); }

/* ── Sidebar ── */
.ep-sidebar {
  background:var(--white); border:1.5px solid var(--bdr); border-radius:16px;
  display:flex; flex-direction:column;
  position:sticky; top:18px; height:calc(100vh - 316px);
  overflow:hidden; box-shadow:var(--shadow-sm);
}
.ep-sidebar__head {
  padding:14px 14px 10px; border-bottom:1px solid var(--bdr);
  flex-shrink:0; background:var(--white);
}
.ep-sidebar__lbl-row { display:flex; align-items:center; gap:7px; }
.ep-sidebar__lbl {
  font-size:10px; font-weight:700; color:var(--muted);
  text-transform:uppercase; letter-spacing:.12em; font-family:'DM Mono',monospace;
}
.ep-sidebar__tree {
  flex:1; overflow-y:auto; padding:8px 6px;
  scrollbar-width:none; -ms-overflow-style:none;
}
.ep-sidebar__tree::-webkit-scrollbar { display:none; }

/* ── Tree nodes ── */
.ep-node {
  display:flex; align-items:center; gap:5px;
  padding:6px 8px; border-radius:9px; cursor:pointer;
  transition:all .15s; margin:1px 0; position:relative;
}
.ep-node:hover { background:#f5f2ec; }
.ep-node.active { background:linear-gradient(135deg,#0f1e35 0%,#1a3260 100%); box-shadow:0 2px 10px rgba(15,30,53,0.18); }
.ep-node__arrow {
  width:16px; height:16px; flex-shrink:0;
  background:none; border:none; padding:0;
  display:flex; align-items:center; justify-content:center;
  cursor:pointer; color:#b0bec5;
  transition:transform .2s cubic-bezier(0.4,0,0.2,1);
}
.ep-node.active .ep-node__arrow { color:rgba(255,255,255,0.35); }
.ep-node__icon {
  width:20px; height:20px; border-radius:6px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  background:rgba(201,168,76,0.1);
}
.ep-node.active .ep-node__icon { background:rgba(255,255,255,0.1); }
.ep-node__code {
  font-family:'DM Mono',monospace; font-weight:600; font-size:11.5px;
  color:#374151; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  flex:1; min-width:0;
}
.ep-node.active .ep-node__code { color:#c9a84c; }
.ep-node__n {
  font-size:10px; font-weight:700;
  background:rgba(201,168,76,0.12); color:#c9a84c;
  border-radius:20px; padding:1px 7px; border:1px solid rgba(201,168,76,0.28);
  flex-shrink:0; font-family:'DM Mono',monospace;
}
.ep-node.active .ep-node__n { background:rgba(201,168,76,0.18); border-color:rgba(201,168,76,0.4); }

/* ── Main panel ── */
.ep-main {
  background:var(--white); border:1.5px solid var(--bdr); border-radius:16px;
  display:flex; flex-direction:column; overflow:hidden; box-shadow:var(--shadow-sm);
}
.ep-main-head {
  padding:18px 22px; border-bottom:1px solid var(--bdr);
  display:flex; align-items:center; justify-content:space-between; gap:12px;
}
.ep-main-head__code { font-family:'DM Mono',monospace; font-size:15px; font-weight:700; color:var(--navy); }
.ep-main-head__desc { font-size:12px; color:var(--muted); margin-top:3px; }
.ep-btn {
  display:inline-flex; align-items:center; gap:7px;
  padding:9px 18px; border-radius:10px;
  font-family:'Sora',sans-serif;
  background:linear-gradient(135deg,#0f1e35,#1a3260); color:#fff;
  border:none; cursor:pointer; font-weight:700; font-size:12.5px;
  flex-shrink:0; transition:all .2s; white-space:nowrap;
  box-shadow:0 2px 8px rgba(15,30,53,0.2);
}
.ep-btn:hover { box-shadow:0 6px 18px rgba(15,30,53,0.28); transform:translateY(-1px); }
.ep-btn:active { transform:translateY(0); }
.ep-toolbar {
  display:flex; gap:8px; align-items:center;
  padding:11px 18px; border-bottom:1px solid var(--bdr); background:#fbf9f6;
}
.ep-sw { position:relative; flex:1; max-width:300px; }
.ep-si { position:absolute; left:11px; top:50%; transform:translateY(-50%); pointer-events:none; }
.ep-s {
  width:100%; padding:8px 12px 8px 34px; border:1.5px solid var(--bdr); border-radius:9px;
  background:var(--white); font-family:'Sora',sans-serif; font-size:12px; color:var(--navy);
  outline:none; transition:all .15s;
}
.ep-s:focus { border-color:var(--gold); box-shadow:0 0 0 3px var(--gold-dim); }
.ep-rb {
  display:inline-flex; align-items:center; gap:5px;
  padding:7px 12px; border-radius:8px; border:1.5px solid var(--bdr);
  background:var(--white); color:var(--sub); cursor:pointer;
  font-size:11.5px; font-family:'Sora',sans-serif; font-weight:600;
  transition:all .15s;
}
.ep-rb:hover { border-color:var(--gold); color:var(--gold); }
.ep-pill {
  font-size:11px; color:var(--muted); background:#f0ece3; padding:5px 13px;
  border-radius:20px; font-weight:600; margin-left:auto; white-space:nowrap;
}
.ep-pill b { color:#c9a84c; }
.ep-pa { padding:18px; flex:1; }
.ep-pg { display:grid; grid-template-columns:repeat(auto-fill,minmax(258px,1fr)); gap:13px; }

/* ── Plan cards ── */
.ep-card {
  background:var(--white); border:1.5px solid var(--bdr); border-radius:13px;
  cursor:pointer; transition:all .22s cubic-bezier(0.4,0,0.2,1);
  display:flex; flex-direction:column; position:relative; overflow:hidden;
  font-family:'Sora',sans-serif; text-align:left; width:100%; padding:0;
}
.ep-card::before {
  content:''; position:absolute; top:0; left:0; right:0; height:3px;
  opacity:0; transition:opacity .22s;
}
.ep-card:hover { border-color:rgba(201,168,76,0.4); transform:translateY(-3px); box-shadow:0 10px 28px rgba(15,30,53,0.10); }
.ep-card:hover::before { opacity:1; background:linear-gradient(90deg,#c9a84c,rgba(201,168,76,0.1)); }
.ep-card__head { padding:14px 15px 0; }
.ep-card__top { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:9px; }
.ep-card__ref {
  font-family:'DM Mono',monospace; font-size:11px; font-weight:700;
  color:var(--gold); background:var(--gold-dim); padding:3px 10px; border-radius:7px;
  border:1px solid var(--gold-bdr); letter-spacing:.03em;
  max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;
  display:inline-block;
}
.ep-card__desc { font-size:12px; color:var(--sub); line-height:1.6; padding:0 15px 10px; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
.ep-card__foot {
  padding:9px 15px 12px; display:flex; align-items:center; gap:10px; flex-wrap:wrap;
  border-top:1px solid #f0ece3; margin-top:auto; font-size:11px; color:var(--muted);
}
.ep-card__meta { display:inline-flex; align-items:center; gap:4px; }
.ep-bdg { display:inline-flex; align-items:center; gap:5px; padding:3px 10px; border-radius:20px; font-size:11px; font-weight:600; }
.ep-arr { margin-left:auto; opacity:0; transform:translateX(-5px); transition:all .2s; }
.ep-card:hover .ep-arr { opacity:1; transform:translateX(0); }

/* ── Empty states ── */
.ep-empty { padding:48px 20px; text-align:center; }
.ep-empty__icon { opacity:.12; margin-bottom:12px; display:flex; justify-content:center; }
.ep-empty__text { font-size:14px; color:var(--sub); font-weight:700; margin-bottom:5px; }
.ep-empty__sub { font-size:12px; color:var(--muted); }

@keyframes epSpin { to { transform:rotate(360deg); } }

@media (max-width:960px) {
  .ep { margin:16px; }
  .ep-body { grid-template-columns:1fr; }
  .ep-sidebar { display:none; }
  .ep-resize-handle { display:none; }
  .ep-stats { grid-template-columns:repeat(3,1fr); }
  .ep-kpis { display:none; }
}
@media (max-width:600px) {
  .ep-stats { grid-template-columns:repeat(2,1fr); }
}
`;

/* ── Stat Card accent colours (top bar + icon bg) ── */
const STAT_ACCENTS = {
  all:                        { bar:'#c9a84c', iconBg:'rgba(201,168,76,0.12)', iconColor:'#a07c30' },
  DEMANDE_EN_COURS:           { bar:'#64748b', iconBg:'rgba(100,116,139,0.1)', iconColor:'#475569' },
  DEMANDE_ACCEPTE:            { bar:'#059669', iconBg:'rgba(5,150,105,0.1)',   iconColor:'#065f46' },
  DEMANDE_REJETE:             { bar:'#e11d48', iconBg:'rgba(225,29,72,0.1)',   iconColor:'#9f1239' },
  PLAN_EN_COURS:              { bar:'#d97706', iconBg:'rgba(217,119,6,0.1)',   iconColor:'#b45309' },
  PLAN_EN_ATTENTE_VALIDATION: { bar:'#3b82f6', iconBg:'rgba(59,130,246,0.1)', iconColor:'#1d4ed8' },
  PLAN_VALIDE:                { bar:'#059669', iconBg:'rgba(5,150,105,0.1)',   iconColor:'#065f46' },
  PLAN_REJETE:                { bar:'#e11d48', iconBg:'rgba(225,29,72,0.1)',   iconColor:'#9f1239' },
  PLAN_TESTE:                 { bar:'#7c3aed', iconBg:'rgba(124,58,237,0.1)', iconColor:'#6d28d9' },
};

/* ── Tree node ── */
function TreeNode({ eq, depth = 0, activeEqId, activeFilter, plansByEq, descendantMap, nodeState, onSelect, onToggle, onQr }) {
  const state = nodeState[eq.id] || {};
  const expanded = state.expanded ?? false;
  const children = state.children ?? [];
  const loadingNode = state.loading ?? false;
  const isFolder = eq.hasSousEquipements;
  const isActive = eq.id === activeEqId;

  // Count récursif : plans de cet équipement + tous ses descendants
  const allIds = [eq.id, ...(descendantMap[eq.id] || [])];
  const matchCount = allIds.reduce((sum, id) => {
    const plans = plansByEq[id] || [];
    return sum + (activeFilter === 'all' ? plans.length : plans.filter(p => p.statut === activeFilter).length);
  }, 0);

  if (activeFilter !== 'all' && !isFolder && matchCount === 0) return null;

  return (
    <div style={{ paddingLeft: depth > 0 ? 12 : 0 }}>
      <div className={`ep-node${isActive ? ' active' : ''}`} onClick={() => onSelect(eq)}>
        {isFolder ? (
          <button
            className="ep-node__arrow"
            onClick={e => { e.stopPropagation(); onToggle(eq); }}
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
          >
            <Icon name="CHEVRON_DOWN" size={12} color={isActive ? 'rgba(255,255,255,0.45)' : '#94a3b8'} />
          </button>
        ) : (
          <span style={{ width:16, flexShrink:0 }} />
        )}
        <span className="ep-node__icon">
          <EquipmentIcon size={11} color={isActive ? '#c9a84c' : '#94a3b8'} />
        </span>
        <span className="ep-node__code">{eq.code}</span>
        {matchCount > 0 && <span className="ep-node__n">{matchCount}</span>}
        <button
          title="QR Code"
          onClick={e => { e.stopPropagation(); onQr && onQr(eq); }}
          style={{width:18,height:18,borderRadius:5,border:'1px solid rgba(201,168,76,.3)',background:'rgba(201,168,76,.08)',color:'#b8892a',display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',flexShrink:0,opacity:0,transition:'opacity .15s',padding:0}}
          onMouseEnter={e=>e.currentTarget.style.opacity='1'}
          onFocus={e=>e.currentTarget.style.opacity='1'}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/></svg>
        </button>
      </div>
      {isFolder && expanded && children.length > 0 && (
        <div style={{ borderLeft:'1.5px solid #ede9e0', marginLeft:8, paddingLeft:2 }}>
          {children.map(child => (
            <TreeNode
              key={child.id} eq={child} depth={depth + 1}
              activeEqId={activeEqId} activeFilter={activeFilter}
              plansByEq={plansByEq} descendantMap={descendantMap} nodeState={nodeState}
              onSelect={onSelect} onToggle={onToggle} onQr={onQr}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ── Page ── */
export default function EquipementPage() {
  const { equipementId } = useParams();
  const navigate = useNavigate();

  const [pageLoading,    setPageLoading]    = useState(true);
  const [zone,           setZone]           = useState(null);
  const [zoneEqs,        setZoneEqs]        = useState([]);
  const [plansByEq,      setPlansByEq]      = useState({});
  const [descendantMap,  setDescendantMap]  = useState({});
  const [zoneStats,      setZoneStats]      = useState(null);
  const [activeFilter,   setActiveFilter]   = useState('all');
  const [focusEq,      setFocusEq]      = useState(null);
  const [focusPlans,   setFocusPlans]   = useState([]);
  const [search,       setSearch]       = useState('');
  const [showDemande,  setShowDemande]  = useState(false);
  const [drawerPlanId, setDrawerPlanId] = useState(null);
  const [qrEquip,      setQrEquip]      = useState(null);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [nodeState,    setNodeState]    = useState({});
  const [treeWidth,    setTreeWidth]    = useState(268);
  const resizingRef = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const eq = await equipementService.findById(equipementId);
        if (!eq.zoneId) return;

        // Chargement parallèle : zone, racines, TOUS les équipements, TOUS les plans, stats
        const [z, rootEqs, allEqs, allPlans, stats] = await Promise.all([
          zoneService.findById(eq.zoneId),
          equipementService.findRacinesParZone(eq.zoneId),
          equipementService.findAllByZone(eq.zoneId).catch(() => []),
          planService.findByZone(eq.zoneId).catch(() => []),
          dashboardService.getStatsByZone(eq.zoneId).catch(() => null),
        ]);

        setZone(z);
        setZoneEqs(rootEqs);
        setZoneStats(stats);

        // Construire plansByEq depuis tous les plans de la zone
        const map = {};
        allPlans.forEach(p => {
          if (!map[p.equipementId]) map[p.equipementId] = [];
          map[p.equipementId].push(p);
        });
        setPlansByEq(map);

        // Construire la map descendant pour les counts récursifs
        setDescendantMap(buildDescendantMap(allEqs));

        const toSelect = rootEqs.find(re => re.id === eq.id) || rootEqs[0];
        if (toSelect) { setFocusEq(toSelect); setFocusPlans(map[toSelect.id] || []); }
      } finally { setPageLoading(false); }
    };
    init();
  }, [equipementId]);

  const handleSelectEq = useCallback(async (eq) => {
    setFocusEq(eq); setSearch(''); setLoadingPlans(true);
    try {
      let plans = plansByEq[eq.id];
      if (!plans) {
        plans = await planService.findByEquipement(eq.id);
        setPlansByEq(prev => ({ ...prev, [eq.id]: plans }));
      }
      setFocusPlans(plans);
    } finally { setLoadingPlans(false); }
  }, [plansByEq]);

  /* ── Rafraîchit les stats de zone après toute mutation de plan (création/statut) ──
     Sans ça, la bannière/les cartes de stats restent figées sur l'état chargé au
     montage tant que la page n'est pas rechargée manuellement. ── */
  const refreshStats = useCallback(() => {
    if (!zone) return;
    dashboardService.getStatsByZone(zone.id).then(setZoneStats).catch(() => {});
  }, [zone]);

  /* ── Propage un plan créé/modifié (drawer, validation) dans l'état local + les stats ── */
  const handlePlanChanged = useCallback(updatedPlan => {
    setPlansByEq(prev => {
      const eqId = updatedPlan.equipementId;
      const list = prev[eqId] || [];
      const idx = list.findIndex(p => p.id === updatedPlan.id);
      const newList = idx >= 0
        ? list.map(p => (p.id === updatedPlan.id ? updatedPlan : p))
        : [...list, updatedPlan];
      return { ...prev, [eqId]: newList };
    });
    setFocusPlans(prev => prev.map(p => (p.id === updatedPlan.id ? updatedPlan : p)));
    refreshStats();
  }, [refreshStats]);

  const handleToggleNode = useCallback(async (eq) => {
    const cur = nodeState[eq.id];
    if (cur) {
      setNodeState(prev => ({ ...prev, [eq.id]: { ...cur, expanded: !cur.expanded } }));
    } else {
      setNodeState(prev => ({ ...prev, [eq.id]: { expanded:false, children:[], loading:true } }));
      try {
        const data = await equipementService.findNiveau(eq.id);
        const children = data.filter(c => c.id !== eq.id);
        const childPlans = await Promise.all(children.map(c => planService.findByEquipement(c.id).catch(() => [])));
        const newMap = {};
        children.forEach((c, i) => { newMap[c.id] = childPlans[i]; });
        setPlansByEq(prev => ({ ...prev, ...newMap }));
        setNodeState(prev => ({ ...prev, [eq.id]: { expanded:true, children, loading:false } }));
      } catch {
        setNodeState(prev => ({ ...prev, [eq.id]: { expanded:false, children:[], loading:false } }));
      }
    }
  }, [nodeState]);

  // Priorité : stats réelles de la zone (backend), fallback sur plans localement chargés
  const zoneCounts = useMemo(() => {
    if (zoneStats) {
      return {
        all:                        zoneStats.totalPlans                 || 0,
        DEMANDE_EN_COURS:           zoneStats.plansDemandeEnCours        || 0,
        DEMANDE_ACCEPTE:            zoneStats.plansDemandeAccepte        || 0,
        DEMANDE_REJETE:             zoneStats.plansDemandeRejete         || 0,
        PLAN_EN_COURS:              zoneStats.plansEnCours               || 0,
        PLAN_EN_ATTENTE_VALIDATION: zoneStats.plansEnAttenteValidation   || 0,
        PLAN_VALIDE:                zoneStats.plansValides               || 0,
        PLAN_REJETE:                zoneStats.plansRejetes               || 0,
        PLAN_TESTE:                 zoneStats.plansTestes                || 0,
      };
    }
    // fallback : plans chargés localement
    const all = Object.values(plansByEq).flat();
    const c = { all: all.length };
    Object.keys(STATUT_CFG).forEach(k => { c[k] = all.filter(p => p.statut === k).length; });
    return c;
  }, [zoneStats, plansByEq]);

  const filteredPlans = useMemo(() => {
    let list = activeFilter === 'all' ? focusPlans : focusPlans.filter(p => p.statut === activeFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p => p.reference?.toLowerCase().includes(q) || p.descriptionIntervention?.toLowerCase().includes(q));
    }
    return list;
  }, [focusPlans, activeFilter, search]);

  const handleFilterClick = useCallback((key) => {
    setActiveFilter(prev => prev === key ? 'all' : key);
    setSearch('');
  }, []);

  const fmtDate = (d) => d ? new Date(d).toLocaleDateString('fr-FR') : '';
  const activeCfg = activeFilter !== 'all' ? STATUT_CFG[activeFilter] : null;

  /* ── Stat cards data ── */
  const statCards = useMemo(() => {
    const total = {
      key: 'all', label: 'Total plans', val: zoneCounts.all,
      sub: `${zoneEqs.length} équipement${zoneEqs.length > 1 ? 's' : ''}`,
      icon: 'TOTAL', accent: STAT_ACCENTS.all,
    };
    const others = Object.entries(STATUT_CFG).map(([key, cfg]) => {
      const eqCount = zoneEqs.filter(eq => (plansByEq[eq.id] || []).some(p => p.statut === key)).length;
      return {
        key, label: cfg.label, val: zoneCounts[key] || 0,
        sub: `${eqCount} équip. concern${eqCount > 1 ? 'és' : 'é'}`,
        icon: cfg.icon, accent: STAT_ACCENTS[key],
      };
    });
    return [total, ...others];
  }, [zoneCounts, zoneEqs, plansByEq]);

  if (pageLoading) return (
    <>
      <style>{`@keyframes epSpin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ padding:60, textAlign:'center', color:'#94a3b8', fontFamily:'Sora,sans-serif' }}>
        <div style={{ width:40, height:40, border:'3px solid #e2ddd4', borderTopColor:'#c9a84c', borderRadius:'50%', animation:'epSpin 0.8s linear infinite', margin:'0 auto 12px' }} />
        Chargement...
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="ep">

        {/* ── Banner ── */}
        <div className="ep-banner">
          <div>
            <div className="ep-banner__eye">Zone — {zone?.code}{zone?.nom ? ` · ${zone.nom}` : ''}</div>
            <div className="ep-banner__title">Équipements <span>{zone?.code}</span></div>
            <div className="ep-banner__sub">
              {activeCfg
                ? <span style={{ color: activeCfg.color }}>Filtre actif : {activeCfg.label}</span>
                : `${zoneEqs.length} équipements · ${zoneCounts.all} plans au total`}
            </div>
          </div>
          <div className="ep-kpis">
            <div className="ep-kpi">
              <div className="ep-kpi__val">{zoneStats?.totalEquipements ?? zoneEqs.length}</div>
              <div className="ep-kpi__lbl">Équipements</div>
            </div>
            <div className="ep-kpi">
              <div className="ep-kpi__val">{zoneCounts.all}</div>
              <div className="ep-kpi__lbl">Plans zone</div>
            </div>
          </div>
        </div>

        {/* ── Stats strip ── */}
        <div className="ep-stats">
          {statCards.map(card => (
            <div
              key={card.key}
              className={`ep-stat${activeFilter === card.key ? ' active' : ''}`}
              onClick={() => handleFilterClick(card.key)}
              style={{ '--bar': card.accent.bar }}
            >
              {/* top accent bar via inline style trick */}
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:card.accent.bar, borderRadius:'14px 14px 0 0', opacity: activeFilter === card.key ? 1 : 0, transition:'opacity .2s' }} />
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:card.accent.bar, borderRadius:'14px 14px 0 0', opacity:0, transition:'opacity .2s' }} className="ep-stat-bar-hover" />
              <div
                className="ep-stat__icon-wrap"
                style={{ background: card.accent.iconBg }}
              >
                <Icon name={card.icon} size={18} color={card.accent.iconColor} />
              </div>
              <div className="ep-stat__val" style={{ color: card.accent.bar }}>{card.val}</div>
              <div className="ep-stat__lbl">{card.label}</div>
              <div className="ep-stat__count">
                <Icon name="TREE" size={10} color="#94a3b8" />
                {card.sub}
              </div>
            </div>
          ))}
        </div>

        {/* ── Body ── */}
        <div className="ep-body" style={{ '--tree-w': treeWidth + 'px' }}>

          {/* Sidebar */}
          <div className="ep-sidebar">
            <div className="ep-sidebar__head">
              <div className="ep-sidebar__lbl-row">
                <Icon name="TREE" size={13} color="#94a3b8" />
                <span className="ep-sidebar__lbl">
                  {activeCfg ? `Filtre : ${activeCfg.label}` : 'Hiérarchie'}
                </span>
              </div>
            </div>
            <div className="ep-sidebar__tree">
              {zoneEqs.length === 0 ? (
                <div style={{ padding:'24px 12px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>Aucun équipement</div>
              ) : zoneEqs.map(eq => (
                <TreeNode
                  key={eq.id} eq={eq} depth={0}
                  activeEqId={focusEq?.id}
                  activeFilter={activeFilter}
                  plansByEq={plansByEq}
                  descendantMap={descendantMap}
                  nodeState={nodeState}
                  onSelect={handleSelectEq}
                  onToggle={handleToggleNode}
                  onQr={setQrEquip}
                />
              ))}
            </div>
          </div>

          {/* Resize handle */}
          <div
            className={`ep-resize-handle${resizingRef.current ? ' dragging' : ''}`}
            onMouseDown={e => {
              e.preventDefault();
              resizingRef.current = true;
              const startX = e.clientX;
              const startW = treeWidth;
              const onMove = ev => {
                const newW = Math.max(180, Math.min(520, startW + ev.clientX - startX));
                setTreeWidth(newW);
              };
              const onUp = () => {
                resizingRef.current = false;
                document.removeEventListener('mousemove', onMove);
                document.removeEventListener('mouseup', onUp);
              };
              document.addEventListener('mousemove', onMove);
              document.addEventListener('mouseup', onUp);
            }}
          />

          {/* Main */}
          <div className="ep-main">
            {!focusEq ? (
              <div className="ep-empty" style={{ padding:'64px 20px' }}>
                <div className="ep-empty__icon"><Icon name="TREE" size={44} color="#0f1e35" /></div>
                <div className="ep-empty__text">Sélectionnez un équipement</div>
                <div className="ep-empty__sub">Cliquez dans la hiérarchie pour voir les plans</div>
              </div>
            ) : (
              <>
                <div className="ep-main-head">
                  <div>
                    <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                      <span className="ep-main-head__code">{focusEq.code}</span>
                      {activeCfg && (
                        <span className="ep-bdg" style={{ background:activeCfg.bg, color:activeCfg.color, border:`1px solid ${activeCfg.border}` }}>
                          <span style={{ width:6, height:6, borderRadius:'50%', background:activeCfg.dot, display:'inline-block' }} />
                          {activeCfg.label}
                        </span>
                      )}
                      <span style={{ fontSize:10.5, fontWeight:700, background:'rgba(201,168,76,0.1)', color:'#c9a84c', border:'1px solid rgba(201,168,76,0.22)', borderRadius:20, padding:'2px 10px', fontFamily:'DM Mono,monospace' }}>
                        {focusPlans.length} plan{focusPlans.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <div className="ep-main-head__desc">{focusEq.description || 'Équipement industriel'}</div>
                  </div>
                  <button
                    onClick={() => setQrEquip(focusEq)}
                    style={{display:'inline-flex',alignItems:'center',gap:6,padding:'8px 13px',borderRadius:9,border:'1.5px solid #e8e3da',background:'#f9f7f4',color:'#5a6a7e',cursor:'pointer',fontSize:12,fontWeight:700,fontFamily:'Sora,sans-serif',transition:'all .18s'}}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='#c9a84c';e.currentTarget.style.color='#b8892a';}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='#e8e3da';e.currentTarget.style.color='#5a6a7e';}}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h.01M17 14h3"/></svg>
                    QR Code
                  </button>
                  <button className="ep-btn" onClick={() => setShowDemande(true)}>
                    <Icon name="PLUS" size={13} color="#fff" />
                    Demande de plan
                  </button>
                </div>

                {loadingPlans ? (
                  <div style={{ padding:48, textAlign:'center' }}>
                    <div style={{ width:34, height:34, border:'3px solid #e2ddd4', borderTopColor:'#c9a84c', borderRadius:'50%', animation:'epSpin 0.8s linear infinite', margin:'0 auto' }} />
                  </div>
                ) : focusPlans.length === 0 ? (
                  <div className="ep-empty">
                    <div className="ep-empty__icon"><Icon name="DEMANDE" size={38} color="#0f1e35" /></div>
                    <div className="ep-empty__text">Aucun plan de consignation</div>
                    <div className="ep-empty__sub" style={{ marginBottom:18 }}>Cet équipement n'a pas encore de plan</div>
                    <button className="ep-btn" onClick={() => setShowDemande(true)}>
                      <Icon name="PLUS" size={13} color="#fff" />
                      Créer une demande
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="ep-toolbar">
                      <div className="ep-sw">
                        <span className="ep-si"><Icon name="SEARCH" size={13} color="#94a3b8" /></span>
                        <input className="ep-s" placeholder="Rechercher par référence..." value={search} onChange={e => setSearch(e.target.value)} />
                      </div>
                      {(activeFilter !== 'all' || search) && (
                        <button className="ep-rb" onClick={() => { setActiveFilter('all'); setSearch(''); }}>
                          <Icon name="CLOSE" size={12} color="#5a6a7e" />
                          Tout afficher
                        </button>
                      )}
                      <div className="ep-pill"><b>{filteredPlans.length}</b> / {focusPlans.length} plan{focusPlans.length > 1 ? 's' : ''}</div>
                    </div>
                    <div className="ep-pa">
                      {filteredPlans.length === 0 ? (
                        <div className="ep-empty" style={{ padding:'32px 0' }}>
                          <div className="ep-empty__icon"><Icon name="SEARCH" size={30} color="#0f1e35" /></div>
                          <div className="ep-empty__text">Aucun plan pour ce filtre</div>
                          <button onClick={() => { setActiveFilter('all'); setSearch(''); }} style={{ marginTop:12, background:'none', border:'none', color:'#c9a84c', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Sora,sans-serif', display:'inline-flex', alignItems:'center', gap:5 }}>
                            <Icon name="CLOSE" size={12} color="#c9a84c" /> Voir tous les plans
                          </button>
                        </div>
                      ) : (
                        <div className="ep-pg">
                          {filteredPlans.map(plan => {
                            const cfg = getCfg(plan.statut);
                            return (
                              <button key={plan.id} className="ep-card" onClick={() => setDrawerPlanId(plan.id)}>
                                <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:cfg.dot, opacity:0, transition:'opacity .22s', borderRadius:'13px 13px 0 0' }} className="ep-card-bar" />
                                <div className="ep-card__head">
                                  <div className="ep-card__top">
                                    <span className="ep-card__ref">{plan.reference}</span>
                                    <span className="ep-bdg" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                                      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, display:'inline-block', flexShrink:0 }} />
                                      {cfg.short}
                                    </span>
                                  </div>
                                </div>
                                {plan.descriptionIntervention && (
                                  <div className="ep-card__desc">{plan.descriptionIntervention}</div>
                                )}
                                <div className="ep-card__foot">
                                  {plan.responsableIntervention && (
                                    <span className="ep-card__meta">
                                      <Icon name="USER" size={11} color="#94a3b8" />
                                      {plan.responsableIntervention}
                                    </span>
                                  )}
                                  {plan.dateCreation && (
                                    <span className="ep-card__meta">
                                      <Icon name="CALENDAR" size={11} color="#94a3b8" />
                                      {fmtDate(plan.dateCreation)}
                                    </span>
                                  )}
                                  <span className="ep-arr">
                                    <Icon name="ARROW_RIGHT" size={13} color="#c9a84c" />
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {showDemande && focusEq && (
        <DemandePlanModal
          equipement={focusEq}
          onClose={() => setShowDemande(false)}
          onCreated={(plan) => {
            setFocusPlans(prev => [...prev, plan]);
            setPlansByEq(prev => ({ ...prev, [focusEq.id]: [...(prev[focusEq.id] || []), plan] }));
            setShowDemande(false);
            refreshStats();
          }}
        />
      )}
      {drawerPlanId && (
        <PlanDetailDrawer planId={drawerPlanId} onClose={() => setDrawerPlanId(null)} onPlanChanged={handlePlanChanged} />
      )}
      {qrEquip && (
        <QrCodeModal equipement={qrEquip} onClose={() => setQrEquip(null)} />
      )}
    </>
  );
}
