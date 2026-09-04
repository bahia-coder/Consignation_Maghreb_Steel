import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  zoneService, equipementService,
  planService, dashboardService,
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import DemandePlanModal from '../components/DemandePlanModal';
import PlanDetailDrawer from '../components/PlanDetailDrawer';
import QrCodeModal from '../components/QrCodeModal';
import EquipmentIcon from '../components/icons/EquipmentIcon';

/* ══════════════════════════════════════════════════════════════
   STATUTS
══════════════════════════════════════════════════════════════ */
const STATUTS = {
  DEMANDE_EN_COURS:           { label:'Demande en cours',        short:'Demande',    color:'#475569', bg:'rgba(71,85,105,.08)',   border:'rgba(71,85,105,.18)',   dot:'#475569'  },
  DEMANDE_ACCEPTE:            { label:'Demande acceptée',         short:'Acceptée',   color:'#065f46', bg:'rgba(5,150,105,.06)',   border:'rgba(5,150,105,.18)',   dot:'#059669'  },
  DEMANDE_REJETE:             { label:'Demande rejetée',          short:'Rejetée',    color:'#9f1239', bg:'rgba(225,29,72,.06)',   border:'rgba(225,29,72,.18)',   dot:'#e11d48'  },
  PLAN_EN_COURS:              { label:'Plan en cours',            short:'En cours',   color:'#b45309', bg:'rgba(217,119,6,.08)',   border:'rgba(217,119,6,.2)',    dot:'#d97706'  },
  PLAN_EN_ATTENTE_VALIDATION: { label:'En attente de validation', short:'Soumis',     color:'#1d4ed8', bg:'rgba(37,99,235,.08)',   border:'rgba(37,99,235,.2)',    dot:'#3b82f6'  },
  PLAN_VALIDE:                { label:'Plan validé',              short:'Validé',     color:'#065f46', bg:'rgba(5,150,105,.08)',   border:'rgba(5,150,105,.2)',    dot:'#059669'  },
  PLAN_REJETE:                { label:'Plan rejeté',              short:'Rejeté',     color:'#9f1239', bg:'rgba(225,29,72,.08)',   border:'rgba(225,29,72,.2)',    dot:'#e11d48'  },
  PLAN_TESTE:                 { label:'Plan testé',               short:'Testé',      color:'#6d28d9', bg:'rgba(109,40,217,.07)', border:'rgba(109,40,217,.18)',  dot:'#7c3aed'  },
};
const getCfg = s => STATUTS[s] || { label:s, short:s, color:'#64748b', bg:'#f0ece3', border:'#e2ddd4', dot:'#64748b' };

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');

*,*::before,*::after{box-sizing:border-box;}
.hp2{font-family:'Sora',sans-serif;padding:24px 28px;background:#f0f2f5;min-height:calc(100vh - 64px);}

/* ── Page header ── */
.hp2-hdr{margin-bottom:20px;}
.hp2-hdr__eyebrow{font-family:'DM Mono',monospace;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:.14em;margin-bottom:5px;display:flex;align-items:center;gap:6px;}
.hp2-hdr__title{font-size:22px;font-weight:800;color:#0f172a;letter-spacing:-.025em;line-height:1.2;}
.hp2-hdr__sub{font-size:12px;color:#94a3b8;margin-top:4px;display:flex;align-items:center;gap:6px;}
.hp2-hdr__sub span{color:#c9a84c;font-weight:600;}

/* ── KPI strip ── */
.hp2-kpis{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;margin-bottom:18px;}
.hp2-kpi{
  background:#fff;border:1.5px solid #e8e3da;border-radius:14px;
  padding:16px 14px 14px;cursor:pointer;
  transition:all .2s cubic-bezier(.4,0,.2,1);
  position:relative;overflow:hidden;
  box-shadow:0 1px 4px rgba(15,30,53,.05);
}
.hp2-kpi::before{
  content:'';position:absolute;top:0;left:0;right:0;height:3px;
  border-radius:14px 14px 0 0;transition:opacity .2s;opacity:0;
}
.hp2-kpi:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(15,30,53,.08);}
.hp2-kpi:hover::before,.hp2-kpi.active::before{opacity:1;}
.hp2-kpi.active{border-color:transparent;box-shadow:0 6px 20px rgba(15,30,53,.09);}
.hp2-kpi__val{font-size:28px;font-weight:800;line-height:1;margin-bottom:3px;font-family:'Sora',sans-serif;}
.hp2-kpi__lbl{font-size:10.5px;color:#5a6a7e;font-weight:600;letter-spacing:.01em;text-transform:uppercase;}

/* ── Zone tabs ── */
.hp2-tabs{display:flex;gap:7px;margin-bottom:16px;flex-wrap:wrap;align-items:center;}
.hp2-tab-label{font-size:10px;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.12em;font-family:'DM Mono',monospace;margin-right:4px;white-space:nowrap;}
.hp2-tab{
  display:inline-flex;align-items:center;gap:6px;
  padding:7px 14px;border-radius:20px;border:1.5px solid #e2ddd4;
  background:#fff;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;
  color:#5a6a7e;cursor:pointer;transition:all .18s;white-space:nowrap;
}
.hp2-tab:hover{border-color:#c9a84c;color:#b8892a;}
.hp2-tab.active{background:#0f1e35;border-color:#0f1e35;color:#c9a84c;box-shadow:0 3px 12px rgba(15,30,53,.2);}
.hp2-tab__count{font-family:'DM Mono',monospace;font-size:10px;padding:1px 7px;border-radius:10px;background:rgba(201,168,76,.12);color:#c9a84c;font-weight:700;}
.hp2-tab.active .hp2-tab__count{background:rgba(201,168,76,.2);}

/* ── Body ── */
.hp2-body{display:grid;grid-template-columns:var(--tree-w,270px) 4px 1fr;gap:0;align-items:start;}

/* ── Resize handle ── */
.hp2-resize-handle{
  width:4px;cursor:col-resize;align-self:stretch;
  background:transparent;position:relative;z-index:10;
  transition:background .15s;margin:0 5px;
}
.hp2-resize-handle:hover,.hp2-resize-handle.dragging{background:rgba(201,168,76,.5);}

/* ── Tree panel ── */
.hp2-tree-panel{
  background:#fff;border:1.5px solid #e8e3da;border-radius:16px;
  display:flex;flex-direction:column;
  position:sticky;top:18px;height:calc(100vh - 310px);
  overflow:hidden;box-shadow:0 1px 4px rgba(15,30,53,.05);
}
.hp2-tree-head{
  padding:13px 14px 10px;border-bottom:1px solid #f0ece3;
  flex-shrink:0;background:#fff;
}
.hp2-tree-head__row{display:flex;align-items:center;gap:8px;}
.hp2-tree-head__zone{font-size:11px;font-weight:800;color:#0f1e35;letter-spacing:-.01em;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.hp2-tree-head__lbl{font-size:9.5px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.12em;font-family:'DM Mono',monospace;margin-top:2px;}
.hp2-tree-scroll{flex:1;overflow-y:auto;padding:6px 6px;scrollbar-width:none;}
.hp2-tree-scroll::-webkit-scrollbar{display:none;}

/* ── Tree nodes ── */
.hp2-node{
  display:flex;align-items:center;gap:5px;
  padding:6px 8px;border-radius:9px;cursor:pointer;
  transition:all .15s;margin:1px 0;position:relative;
}
.hp2-node:hover{background:#f5f2ec;}
.hp2-node.active{background:linear-gradient(135deg,#0f1e35 0%,#1a3260 100%);box-shadow:0 2px 10px rgba(15,30,53,.18);}
.hp2-node__arrow{
  width:16px;height:16px;flex-shrink:0;
  background:none;border:none;padding:0;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:#b0bec5;
  transition:transform .2s cubic-bezier(.4,0,.2,1);
}
.hp2-node.active .hp2-node__arrow{color:rgba(255,255,255,.35);}
.hp2-node__ico{
  width:20px;height:20px;border-radius:6px;flex-shrink:0;
  display:flex;align-items:center;justify-content:center;
  background:rgba(201,168,76,.1);
}
.hp2-node.active .hp2-node__ico{background:rgba(255,255,255,.1);}
.hp2-node__label{font-size:12px;font-weight:600;color:#374151;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;}
.hp2-node.active .hp2-node__label{color:#c9a84c;}
.hp2-node__badge{
  font-size:10px;font-weight:700;
  background:rgba(201,168,76,.12);color:#c9a84c;
  border-radius:20px;padding:1px 7px;border:1px solid rgba(201,168,76,.28);
  flex-shrink:0;font-family:'DM Mono',monospace;
}
.hp2-node.active .hp2-node__badge{background:rgba(201,168,76,.2);border-color:rgba(201,168,76,.4);}
.hp2-node__level{
  font-size:9px;font-weight:800;padding:1px 5px;border-radius:5px;
  font-family:'DM Mono',monospace;flex-shrink:0;
}
.hp2-node__level--n1{background:rgba(37,99,235,.1);color:#1d4ed8;border:1px solid rgba(37,99,235,.2);}
.hp2-node__level--n2{background:rgba(5,150,105,.1);color:#065f46;border:1px solid rgba(5,150,105,.2);}
.hp2-node__level--n3{background:rgba(201,168,76,.1);color:#b8892a;border:1px solid rgba(201,168,76,.22);}
.hp2-node__level--n4{background:rgba(100,116,139,.1);color:#475569;border:1px solid rgba(100,116,139,.22);}
.hp2-node__qr{
  width:20px;height:20px;border-radius:5px;flex-shrink:0;
  border:1px solid rgba(201,168,76,.25);background:rgba(201,168,76,.07);
  color:#b8892a;display:flex;align-items:center;justify-content:center;
  cursor:pointer;transition:all .15s;opacity:0;
}
.hp2-node:hover .hp2-node__qr{opacity:1;}
.hp2-node.active .hp2-node__qr{opacity:1;background:rgba(201,168,76,.18);border-color:rgba(201,168,76,.4);}
.hp2-node__qr:hover{background:rgba(201,168,76,.3)!important;transform:scale(1.1);}

/* ── Right panel ── */
.hp2-main{
  background:#fff;border:1.5px solid #e8e3da;border-radius:16px;
  display:flex;flex-direction:column;overflow:hidden;
  box-shadow:0 1px 4px rgba(15,30,53,.05);
  min-height:500px;
}
.hp2-main-head{
  padding:16px 20px;border-bottom:1px solid #f0ece3;
  display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;
}
.hp2-main-head__title{font-size:14px;font-weight:700;color:#0f1e35;letter-spacing:-.01em;}
.hp2-main-head__sub{font-size:11.5px;color:#94a3b8;margin-top:2px;}
.hp2-main-head__right{display:flex;align-items:center;gap:8px;flex-shrink:0;}
.hp2-count-badge{font-size:10px;font-weight:700;background:rgba(201,168,76,.1);color:#c9a84c;border:1px solid rgba(201,168,76,.22);border-radius:20px;padding:3px 10px;font-family:'DM Mono',monospace;}

/* Bouton nouveau plan */
.hp2-btn-new{
  display:inline-flex;align-items:center;gap:6px;
  padding:8px 16px;border-radius:9px;
  background:linear-gradient(135deg,#0f1e35,#1a3260);color:#fff;
  border:none;cursor:pointer;font-weight:700;font-size:12px;
  font-family:'Sora',sans-serif;
  box-shadow:0 2px 8px rgba(15,30,53,.2);
  transition:all .2s;white-space:nowrap;
}
.hp2-btn-new:hover{box-shadow:0 5px 16px rgba(15,30,53,.3);transform:translateY(-1px);}

/* Toolbar */
.hp2-toolbar{
  display:flex;gap:8px;align-items:center;
  padding:10px 16px;border-bottom:1px solid #f0ece3;background:#fbf9f6;flex-wrap:wrap;
}
.hp2-search-w{position:relative;flex:1;max-width:280px;}
.hp2-search-i{position:absolute;left:10px;top:50%;transform:translateY(-50%);pointer-events:none;}
.hp2-search{
  width:100%;padding:8px 12px 8px 32px;border:1.5px solid #e8e3da;border-radius:9px;
  background:#fff;font-family:'Sora',sans-serif;font-size:12px;color:#0f1e35;outline:none;transition:all .15s;
}
.hp2-search:focus{border-color:#c9a84c;box-shadow:0 0 0 3px rgba(201,168,76,.1);}
.hp2-rst{
  display:inline-flex;align-items:center;gap:5px;
  padding:7px 12px;border-radius:8px;border:1.5px solid #e8e3da;
  background:#fff;color:#5a6a7e;cursor:pointer;
  font-size:11.5px;font-family:'Sora',sans-serif;font-weight:600;transition:all .15s;
}
.hp2-rst:hover{border-color:#c9a84c;color:#b8892a;}
.hp2-pill{font-size:11px;color:#94a3b8;background:#f0ece3;padding:5px 12px;border-radius:20px;font-weight:600;margin-left:auto;white-space:nowrap;}
.hp2-pill b{color:#c9a84c;}

/* Plan cards grid */
.hp2-plans{padding:16px;display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:12px;}
.hp2-card{
  background:#fff;border:1.5px solid #e8e3da;border-radius:13px;
  cursor:pointer;transition:all .22s cubic-bezier(.4,0,.2,1);
  display:flex;flex-direction:column;position:relative;overflow:hidden;
  font-family:'Sora',sans-serif;text-align:left;width:100%;padding:0;
}
.hp2-card:hover{border-color:rgba(201,168,76,.4);transform:translateY(-3px);box-shadow:0 10px 28px rgba(15,30,53,.10);}
.hp2-card__stripe{position:absolute;top:0;left:0;right:0;height:3px;opacity:0;transition:opacity .22s;border-radius:13px 13px 0 0;}
.hp2-card:hover .hp2-card__stripe{opacity:1;}
.hp2-card__head{padding:13px 14px 0;}
.hp2-card__top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;}
.hp2-card__ref{
  font-family:'DM Mono',monospace;font-size:10.5px;font-weight:700;
  color:#c9a84c;background:rgba(201,168,76,.1);padding:3px 9px;border-radius:6px;
  border:1px solid rgba(201,168,76,.25);letter-spacing:.03em;
  max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;
}
.hp2-bdg{display:inline-flex;align-items:center;gap:5px;padding:3px 9px;border-radius:20px;font-size:11px;font-weight:600;}
.hp2-card__desc{font-size:11.5px;color:#5a6a7e;line-height:1.6;padding:0 14px 10px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;}
.hp2-card__foot{
  padding:8px 14px 12px;display:flex;align-items:center;gap:8px;flex-wrap:wrap;
  border-top:1px solid #f0ece3;margin-top:auto;font-size:11px;color:#94a3b8;
}
.hp2-card__meta{display:inline-flex;align-items:center;gap:4px;}
.hp2-card__eye{
  margin-left:auto;width:28px;height:28px;border-radius:7px;
  border:1px solid #e8e3da;background:#fff;
  display:flex;align-items:center;justify-content:center;
  cursor:pointer;color:#94a3b8;transition:all .18s;
}
.hp2-card__eye:hover{border-color:#c9a84c;color:#c9a84c;background:rgba(201,168,76,.06);}

/* Empty / loading */
.hp2-empty{padding:48px 20px;text-align:center;}
.hp2-empty__icon{opacity:.12;margin-bottom:12px;display:flex;justify-content:center;}
.hp2-empty__text{font-size:14px;color:#5a6a7e;font-weight:700;margin-bottom:5px;}
.hp2-empty__sub{font-size:12px;color:#94a3b8;}
.hp2-spin-wrap{padding:48px;display:flex;justify-content:center;}
.hp2-ring{width:34px;height:34px;border:3px solid #e2ddd4;border-top-color:#c9a84c;border-radius:50%;animation:hp2Spin .8s linear infinite;}
@keyframes hp2Spin{to{transform:rotate(360deg);}}

@media(max-width:960px){
  .hp2-body{grid-template-columns:1fr;}
  .hp2-tree-panel{display:none;}
  .hp2-kpis{grid-template-columns:repeat(3,1fr);}
}
@media(max-width:600px){.hp2-kpis{grid-template-columns:repeat(2,1fr);}}
`;

/* ══════════════════════════════════════════════════════════════
   SVG Icons
══════════════════════════════════════════════════════════════ */
const IcSearch   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
const IcPlus     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcChevDown = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcEye      = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>;
const IcUser     = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcCal      = () => <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
const IcClose    = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;
const IcTree     = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 0 0-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 0 1 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 0 1 9.288 0"/></svg>;
const IcMap      = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>;

/* ══════════════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════════════ */
function buildDescendantMap(allEqs) {
  const childrenOf = {};
  allEqs.forEach(eq => {
    if (eq.parentId) {
      if (!childrenOf[eq.parentId]) childrenOf[eq.parentId] = [];
      childrenOf[eq.parentId].push(eq.id);
    }
  });
  const getAllDesc = id => {
    const kids = childrenOf[id] || [];
    return kids.reduce((acc, kid) => [...acc, kid, ...getAllDesc(kid)], []);
  };
  const map = {};
  allEqs.forEach(eq => { map[eq.id] = getAllDesc(eq.id); });
  return map;
}

// Couleur du badge : cyclique sur 4 teintes (n1..n4 dans le CSS), réutilisées au-delà
// du 4e niveau. Le TEXTE du badge, lui, reflète toujours la profondeur réelle — voir
// le calcul de `level` dans TreeNode : aucune limite de niveaux n'est codée en dur ici.
const LEVEL_COLOR_CLASSES = ['n1','n2','n3','n4'];

/* ══════════════════════════════════════════════════════════════
   TreeNode
══════════════════════════════════════════════════════════════ */
const IcQr = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/>
    <path d="M14 14h.01M17 14h.01M20 14h.01M14 17h.01M17 17h.01M20 17h.01M14 20h.01M17 20h.01M20 20h.01"/>
  </svg>
);

function TreeNode({ eq, depth, activeId, plansByEq, descendantMap, nodeState, onSelect, onToggle, onQr }) {
  const state    = nodeState[eq.id] || {};
  const expanded = state.expanded ?? false;
  const children = state.children ?? [];
  const isFolder = eq.hasSousEquipements;
  const isActive = eq.id === activeId;
  const levelLabel      = `N${depth + 1}`;                                   // jamais plafonné : N5, N6, N7… si la hiérarchie va plus loin
  const levelColorClass = LEVEL_COLOR_CLASSES[Math.min(depth, LEVEL_COLOR_CLASSES.length - 1)];

  const allIds = [eq.id, ...(descendantMap[eq.id] || [])];
  const planCount = allIds.reduce((s, id) => s + (plansByEq[id]?.length || 0), 0);

  return (
    <div style={{ paddingLeft: depth > 0 ? 14 : 0 }}>
      <div className={`hp2-node${isActive ? ' active' : ''}`} onClick={() => onSelect(eq)}>
        {isFolder ? (
          <button
            className="hp2-node__arrow"
            style={{ transform: expanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
            onClick={e => { e.stopPropagation(); onToggle(eq); }}
          >
            <IcChevDown />
          </button>
        ) : (
          <span style={{ width:16, flexShrink:0 }} />
        )}
        <span className="hp2-node__ico">
          <EquipmentIcon size={11} />
        </span>
        <span className="hp2-node__label">{eq.code}</span>
        <span className={`hp2-node__level hp2-node__level--${levelColorClass}`}>{levelLabel}</span>
        {planCount > 0 && <span className="hp2-node__badge">{planCount}</span>}
        <button
          className="hp2-node__qr"
          title={`QR Code — ${eq.code}`}
          onClick={e => { e.stopPropagation(); onQr(eq); }}
        >
          <IcQr />
        </button>
      </div>
      {isFolder && expanded && children.length > 0 && (
        <div style={{ borderLeft:'1.5px solid #ede9e0', marginLeft:10, paddingLeft:2 }}>
          {children.map(child => (
            <TreeNode key={child.id} eq={child} depth={depth+1}
              activeId={activeId} plansByEq={plansByEq}
              descendantMap={descendantMap} nodeState={nodeState}
              onSelect={onSelect} onToggle={onToggle} onQr={onQr} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   KPI config
══════════════════════════════════════════════════════════════ */
const KPI_CFG = [
  { key:'all',                        label:'Total',              color:'#0f1e35', bar:'#c9a84c', group:null      },
  // ── Demande (3) ──
  { key:'DEMANDE_EN_COURS',           label:'Demande en cours',   color:'#475569', bar:'#64748b', group:'demande' },
  { key:'DEMANDE_ACCEPTE',            label:'Demande acceptée',   color:'#065f46', bar:'#059669', group:'demande' },
  { key:'DEMANDE_REJETE',             label:'Demande rejetée',    color:'#9f1239', bar:'#e11d48', group:'demande' },
  // ── Plan (5) ──
  { key:'PLAN_EN_COURS',              label:'Plan en cours',      color:'#d97706', bar:'#d97706', group:'plan'    },
  { key:'PLAN_EN_ATTENTE_VALIDATION', label:'Soumis validation',  color:'#2563eb', bar:'#2563eb', group:'plan'    },
  { key:'PLAN_VALIDE',                label:'Plan validé',        color:'#059669', bar:'#059669', group:'plan'    },
  { key:'PLAN_REJETE',                label:'Plan rejeté',        color:'#e11d48', bar:'#e11d48', group:'plan'    },
  { key:'PLAN_TESTE',                 label:'Plan testé',         color:'#6d28d9', bar:'#7c3aed', group:'plan'    },
];

/* ══════════════════════════════════════════════════════════════
   PAGE
══════════════════════════════════════════════════════════════ */
export default function HomePage() {
  const navigate = useNavigate();
  const { user, isAdmin, canCreerDemande } = useAuth();

  /* ── State ── */
  const [zones,         setZones]         = useState([]);
  const [globalStats,   setGlobalStats]   = useState(null);
  const [activeZoneId,  setActiveZoneId]  = useState(null);    // null = toutes
  const [activeZone,    setActiveZone]    = useState(null);
  const [rootEqs,       setRootEqs]       = useState([]);
  const [plansByEq,     setPlansByEq]     = useState({});
  const [descendantMap, setDescendantMap] = useState({});
  const [nodeState,     setNodeState]     = useState({});
  const [focusEq,       setFocusEq]       = useState(null);
  const [focusPlans,    setFocusPlans]    = useState([]);
  const [search,        setSearch]        = useState('');
  const [filterStat,    setFilterStat]    = useState('all');
  const [loadingZone,   setLoadingZone]   = useState(false);
  const [loadingPlans,  setLoadingPlans]  = useState(false);
  const [showDemande,   setShowDemande]   = useState(false);
  const [drawerPlanId,  setDrawerPlanId]  = useState(null);
  const [qrEquip,       setQrEquip]       = useState(null);
  const [pageLoading,   setPageLoading]   = useState(true);
  const [treeWidth,     setTreeWidth]     = useState(270);
  const resizingRef = useRef(false);

  /* ── Init : zones + global stats ── */
  useEffect(() => {
    Promise.all([
      zoneService.findAll(),
      dashboardService.getStats().catch(() => null),
    ]).then(([zs, stats]) => {
      // Filtrer les zones selon le rôle : non-admin limité à sa zone
      const filteredZones = isAdmin()
        ? zs
        : zs.filter(z => String(z.id) === String(user?.zoneId));
      setZones(filteredZones);
      setGlobalStats(stats);
      // Sélectionner la 1ère zone automatiquement
      if (filteredZones.length > 0) loadZone(filteredZones[0]);
    }).finally(() => setPageLoading(false));
  }, []); // eslint-disable-line

  /* ── Charger une zone ── */
  const loadZone = useCallback(async (zone) => {
    setLoadingZone(true);
    setActiveZoneId(zone.id);
    setActiveZone(zone);
    setFocusEq(null);
    setFocusPlans([]);
    setNodeState({});
    setPlansByEq({});
    setSearch('');
    setFilterStat('all');
    try {
      const [roots, allEqs, allPlans] = await Promise.all([
        equipementService.findRacinesParZone(zone.id),
        equipementService.findAllByZone(zone.id).catch(() => []),
        planService.findByZone(zone.id).catch(() => []),
      ]);
      setRootEqs(roots);
      setDescendantMap(buildDescendantMap(allEqs));
      const map = {};
      allPlans.forEach(p => {
        if (!map[p.equipementId]) map[p.equipementId] = [];
        map[p.equipementId].push(p);
      });
      setPlansByEq(map);
      if (roots.length > 0) {
        setFocusEq(roots[0]);
        setFocusPlans(map[roots[0].id] || []);
      }
    } finally { setLoadingZone(false); }
  }, []);

  /* ── Sélectionner un équipement ── */
  const handleSelectEq = useCallback(async eq => {
    setFocusEq(eq); setSearch(''); setLoadingPlans(true);
    try {
      let plans = plansByEq[eq.id];
      if (plans === undefined) {
        plans = await planService.findByEquipement(eq.id);
        setPlansByEq(prev => ({ ...prev, [eq.id]: plans }));
      }
      setFocusPlans(plans || []);
    } finally { setLoadingPlans(false); }
  }, [plansByEq]);

  /* ── Rafraîchit les KPI globaux après toute mutation de plan (création/statut) ──
     Sans ça, la bannière de stats reste figée sur l'état chargé au montage tant
     que la page n'est pas rechargée manuellement. ── */
  const refreshStats = useCallback(() => {
    dashboardService.getStats().then(setGlobalStats).catch(() => {});
  }, []);

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

  /* ── Toggle nœud arbre ── */
  const handleToggle = useCallback(async eq => {
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

  /* ── Counts KPI (plans de la zone active) ── */
  const counts = useMemo(() => {
    const allPlans = Object.values(plansByEq).flat();
    const c = { all: allPlans.length };
    Object.keys(STATUTS).forEach(k => { c[k] = allPlans.filter(p => p.statut === k).length; });
    return c;
  }, [plansByEq]);

  /* ── Plans filtrés ── */
  const filteredPlans = useMemo(() => {
    let list = filterStat === 'all' ? focusPlans : focusPlans.filter(p => p.statut === filterStat);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.reference?.toLowerCase().includes(q) ||
        p.descriptionIntervention?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [focusPlans, filterStat, search]);

  const fmtDate = d => d ? new Date(d).toLocaleDateString('fr-FR') : '';

  /* ── KPI display values ── */
  const kpiValues = useMemo(() => ({
    all:                        globalStats?.totalPlans               ?? counts.all,
    DEMANDE_EN_COURS:           globalStats?.plansDemandeEnCours      ?? counts.DEMANDE_EN_COURS,
    DEMANDE_ACCEPTE:            globalStats?.plansDemandeAccepte      ?? counts.DEMANDE_ACCEPTE,
    DEMANDE_REJETE:             globalStats?.plansDemandeRejete       ?? counts.DEMANDE_REJETE,
    PLAN_EN_COURS:              globalStats?.plansEnCours             ?? counts.PLAN_EN_COURS,
    PLAN_EN_ATTENTE_VALIDATION: globalStats?.plansEnAttenteValidation ?? counts.PLAN_EN_ATTENTE_VALIDATION,
    PLAN_VALIDE:                globalStats?.plansValides             ?? counts.PLAN_VALIDE,
    PLAN_REJETE:                globalStats?.plansRejetes             ?? counts.PLAN_REJETE,
    PLAN_TESTE:                 globalStats?.plansTestes              ?? counts.PLAN_TESTE,
  }), [globalStats, counts]);

  /* ════════════════════════════════════════════
     RENDER
  ════════════════════════════════════════════ */
  if (pageLoading) return (
    <>
      <style>{CSS}</style>
      <div className="hp2-spin-wrap" style={{ minHeight:'60vh', alignItems:'center' }}>
        <div className="hp2-ring" />
      </div>
    </>
  );

  return (
    <>
      <style>{CSS}</style>
      <div className="hp2">

        {/* ── En-tête page ── */}
        <div className="hp2-hdr">
          <div className="hp2-hdr__eyebrow">
            <IcMap />
            Gestion des équipements
          </div>
          <div className="hp2-hdr__title">Plans de consignation</div>
          <div className="hp2-hdr__sub">
            <span>Zone</span> → <span>Ligne</span> → <span>Équipements</span>
            <span style={{ color:'#94a3b8', fontWeight:400 }}>(hiérarchie sur autant de niveaux que nécessaire)</span>
          </div>
        </div>

        {/* ── KPI strip ── */}
        <div className="hp2-kpis">
          {KPI_CFG.map(k => (
            <div
              key={k.key}
              className={`hp2-kpi${filterStat === k.key ? ' active' : ''}`}
              style={{ '--bar': k.bar }}
              onClick={() => setFilterStat(prev => prev === k.key ? 'all' : k.key)}
            >
              <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:k.bar, borderRadius:'14px 14px 0 0', opacity: filterStat === k.key ? 1 : 0, transition:'opacity .2s' }} />
              <div className="hp2-kpi__val" style={{ color: k.color }}>{kpiValues[k.key] ?? 0}</div>
              <div className="hp2-kpi__lbl">{k.label}</div>
            </div>
          ))}
        </div>

        {/* ── Zone tabs ── */}
        <div className="hp2-tabs">
          <span className="hp2-tab-label">Zone :</span>
          {zones.map(z => {
            const zPlans = activeZoneId === z.id ? Object.values(plansByEq).flat().length : null;
            return (
              <button
                key={z.id}
                className={`hp2-tab${activeZoneId === z.id ? ' active' : ''}`}
                onClick={() => activeZoneId !== z.id && loadZone(z)}
              >
                {z.nom || z.code}
                {activeZoneId === z.id && zPlans !== null && (
                  <span className="hp2-tab__count">{zPlans}</span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Body ── */}
        {loadingZone ? (
          <div className="hp2-spin-wrap"><div className="hp2-ring" /></div>
        ) : (
          <div className="hp2-body" style={{ '--tree-w': treeWidth + 'px' }}>

            {/* ── Tree panel ── */}
            <div className="hp2-tree-panel">
              <div className="hp2-tree-head">
                <div className="hp2-tree-head__row">
                  <IcTree />
                  <div>
                    <div className="hp2-tree-head__zone">{activeZone?.nom || activeZone?.code || '—'}</div>
                    <div className="hp2-tree-head__lbl">Hiérarchie</div>
                  </div>
                </div>
              </div>
              <div className="hp2-tree-scroll">
                {rootEqs.length === 0 ? (
                  <div style={{ padding:'24px 12px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>
                    Aucun équipement dans cette zone
                  </div>
                ) : rootEqs.map(eq => (
                  <TreeNode
                    key={eq.id} eq={eq} depth={0}
                    activeId={focusEq?.id}
                    plansByEq={plansByEq}
                    descendantMap={descendantMap}
                    nodeState={nodeState}
                    onSelect={handleSelectEq}
                    onToggle={handleToggle}
                    onQr={setQrEquip}
                  />
                ))}
              </div>
            </div>

            {/* ── Resize handle ── */}
            <div
              className={`hp2-resize-handle${resizingRef.current ? ' dragging' : ''}`}
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

            {/* ── Main panel ── */}
            <div className="hp2-main">
              {!focusEq ? (
                <div className="hp2-empty" style={{ padding:'64px 20px' }}>
                  <div className="hp2-empty__icon"><IcTree /></div>
                  <div className="hp2-empty__text">Sélectionnez un équipement</div>
                  <div className="hp2-empty__sub">Cliquez dans la hiérarchie pour voir les plans</div>
                </div>
              ) : (
                <>
                  {/* Header équipement */}
                  <div className="hp2-main-head">
                    <div>
                      <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                        <span className="hp2-main-head__title">{focusEq.code}</span>
                        <span className="hp2-count-badge">{focusPlans.length} plan{focusPlans.length !== 1 ? 's' : ''}</span>
                        {filterStat !== 'all' && (() => {
                          const cfg = getCfg(filterStat);
                          return (
                            <span className="hp2-bdg" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}`, fontSize:11 }}>
                              <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, display:'inline-block' }} />
                              {cfg.label}
                            </span>
                          );
                        })()}
                      </div>
                      <div className="hp2-main-head__sub">{focusEq.description || 'Équipement industriel'}</div>
                    </div>
                    <div className="hp2-main-head__right">
                      <button
                        onClick={() => setQrEquip(focusEq)}
                        title="Afficher le QR Code"
                        style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'8px 13px',borderRadius:9,border:'1.5px solid #e8e3da',background:'#f9f7f4',color:'#5a6a7e',cursor:'pointer',fontSize:12,fontWeight:600,fontFamily:'inherit',transition:'all .18s' }}
                        onMouseEnter={e=>{e.currentTarget.style.borderColor='#c9a84c';e.currentTarget.style.color='#b8892a';}}
                        onMouseLeave={e=>{e.currentTarget.style.borderColor='#e8e3da';e.currentTarget.style.color='#5a6a7e';}}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h.01M17 14h3M14 17h.01M17 20h3M20 17v3"/></svg>
                        QR Code
                      </button>
                      {canCreerDemande() && (
                        <button className="hp2-btn-new" onClick={() => setShowDemande(true)}>
                          <IcPlus /> Nouveau plan
                        </button>
                      )}
                    </div>
                  </div>

                  {loadingPlans ? (
                    <div className="hp2-spin-wrap"><div className="hp2-ring" /></div>
                  ) : focusPlans.length === 0 ? (
                    <div className="hp2-empty">
                      <div className="hp2-empty__icon" style={{ fontSize:40 }}>📋</div>
                      <div className="hp2-empty__text">Aucun plan de consignation</div>
                      <div className="hp2-empty__sub" style={{ marginBottom:16 }}>Cet équipement n'a pas encore de plan</div>
                      {canCreerDemande() && (
                        <button className="hp2-btn-new" onClick={() => setShowDemande(true)}>
                          <IcPlus /> Créer une demande
                        </button>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Toolbar */}
                      <div className="hp2-toolbar">
                        <div className="hp2-search-w">
                          <span className="hp2-search-i"><IcSearch /></span>
                          <input
                            className="hp2-search"
                            placeholder="Rechercher un plan…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                          />
                        </div>
                        {(filterStat !== 'all' || search) && (
                          <button className="hp2-rst" onClick={() => { setFilterStat('all'); setSearch(''); }}>
                            <IcClose /> Tout afficher
                          </button>
                        )}
                        <div className="hp2-pill"><b>{filteredPlans.length}</b> / {focusPlans.length} plan{focusPlans.length > 1 ? 's' : ''}</div>
                      </div>

                      {/* Plan cards */}
                      {filteredPlans.length === 0 ? (
                        <div className="hp2-empty" style={{ padding:'32px 0' }}>
                          <div className="hp2-empty__icon"><IcSearch /></div>
                          <div className="hp2-empty__text">Aucun plan pour ce filtre</div>
                          <button onClick={() => { setFilterStat('all'); setSearch(''); }} style={{ marginTop:12, background:'none', border:'none', color:'#c9a84c', fontWeight:700, cursor:'pointer', fontSize:13, fontFamily:'Sora,sans-serif' }}>
                            Voir tous les plans →
                          </button>
                        </div>
                      ) : (
                        <div className="hp2-plans">
                          {filteredPlans.map((plan, i) => {
                            const cfg = getCfg(plan.statut);
                            return (
                              <button
                                key={plan.id}
                                className="hp2-card"
                                style={{ animation:`hp2FadeIn .3s ease ${i * .04}s both` }}
                                onClick={() => setDrawerPlanId(plan.id)}
                              >
                                <div className="hp2-card__stripe" style={{ background: cfg.dot }} />
                                <div className="hp2-card__head">
                                  <div className="hp2-card__top">
                                    <span className="hp2-card__ref">{plan.reference}</span>
                                    <span className="hp2-bdg" style={{ background:cfg.bg, color:cfg.color, border:`1px solid ${cfg.border}` }}>
                                      <span style={{ width:5, height:5, borderRadius:'50%', background:cfg.dot, display:'inline-block', flexShrink:0 }} />
                                      {cfg.short}
                                    </span>
                                  </div>
                                </div>
                                {plan.descriptionIntervention && (
                                  <div className="hp2-card__desc">{plan.descriptionIntervention}</div>
                                )}
                                <div className="hp2-card__foot">
                                  {plan.responsableIntervention && (
                                    <span className="hp2-card__meta">
                                      <IcUser /> {plan.responsableIntervention}
                                    </span>
                                  )}
                                  {plan.dateCreation && (
                                    <span className="hp2-card__meta">
                                      <IcCal /> {fmtDate(plan.dateCreation)}
                                    </span>
                                  )}
                                  <button
                                    className="hp2-card__eye"
                                    onClick={e => { e.stopPropagation(); setDrawerPlanId(plan.id); }}
                                    title="Voir le plan"
                                  >
                                    <IcEye />
                                  </button>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </>
                  )}
                </>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Modals */}
      {showDemande && focusEq && (
        <DemandePlanModal
          equipement={focusEq}
          onClose={() => setShowDemande(false)}
          onCreated={plan => {
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

      <style>{`@keyframes hp2FadeIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </>
  );
}
