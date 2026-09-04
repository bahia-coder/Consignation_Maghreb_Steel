import React, { useState, useEffect, useRef, useCallback } from 'react';
import { messagerie, utilisateurService, zoneService } from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ══════════════════════════════════════════════════════════════
   CSS
══════════════════════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

/* ── Overlay ── */
.msg-overlay {
  position:fixed; inset:0; background:rgba(10,18,35,0.42);
  backdrop-filter:blur(4px); z-index:1100;
  animation:msgFadeOv .2s ease;
}
@keyframes msgFadeOv { from{opacity:0} to{opacity:1} }

/* ── Panel ── */
.msg-panel {
  position:fixed; top:0; right:0; bottom:0; width:860px; max-width:100vw;
  background:#f4f6fa; z-index:1101;
  display:flex; flex-direction:column;
  box-shadow:-20px 0 60px rgba(10,18,35,.22);
  animation:msgSlide .28s cubic-bezier(.4,0,.2,1);
  font-family:'Plus Jakarta Sans',sans-serif;
}
@keyframes msgSlide { from{transform:translateX(110%)} to{transform:translateX(0)} }

/* ── Panel head ── */
.msg-panel-head {
  background:linear-gradient(135deg,#0c1829 0%,#14243e 60%,#0a1f38 100%);
  padding:18px 22px; display:flex; align-items:center; gap:14px;
  flex-shrink:0; position:relative; overflow:hidden;
}
.msg-panel-head::after {
  content:''; position:absolute; top:-60px; right:-40px; width:200px; height:200px;
  border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,.07) 0%,transparent 65%);
  pointer-events:none;
}
.msg-panel-head__icon {
  width:40px; height:40px; border-radius:12px; flex-shrink:0;
  background:rgba(201,168,76,.12); border:1.5px solid rgba(201,168,76,.3);
  display:flex; align-items:center; justify-content:center; color:#c9a84c;
}
.msg-panel-head__title { font-size:16px; font-weight:800; color:#fff; letter-spacing:-.02em; }
.msg-panel-head__sub   { font-size:11px; color:rgba(255,255,255,.38); margin-top:2px; }
.msg-close {
  margin-left:auto; width:32px; height:32px; border-radius:8px; flex-shrink:0;
  border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.06);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  color:rgba(255,255,255,.5); transition:all .18s; z-index:1;
}
.msg-close:hover { border-color:rgba(239,68,68,.4); color:#f87171; background:rgba(239,68,68,.1); }

/* ── Body (2 colonnes) ── */
.msg-body { display:flex; flex:1; overflow:hidden; }

/* ── Colonne gauche : conversations ── */
.msg-sidebar {
  width:280px; flex-shrink:0; background:#fff;
  border-right:1.5px solid #e8e3da;
  display:flex; flex-direction:column; overflow:hidden;
}
.msg-sb-head {
  padding:13px 14px 10px; border-bottom:1px solid #f0ece3; flex-shrink:0;
}
.msg-sb-search {
  position:relative;
}
.msg-sb-search input {
  width:100%; padding:8px 12px 8px 32px;
  border:1.5px solid #e8e3da; border-radius:9px;
  background:#f9f7f4; font-family:'Plus Jakarta Sans',sans-serif;
  font-size:12px; color:#0f1e35; outline:none; transition:all .15s;
  box-sizing:border-box;
}
.msg-sb-search input:focus { border-color:#c9a84c; background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,.1); }
.msg-sb-search__ic {
  position:absolute; left:10px; top:50%; transform:translateY(-50%);
  color:#94a3b8; pointer-events:none;
}
.msg-sb-section {
  font-size:9.5px; font-weight:700; color:#94a3b8; text-transform:uppercase;
  letter-spacing:.12em; padding:10px 14px 5px; font-family:'Plus Jakarta Sans',monospace;
}
.msg-sb-list { flex:1; overflow-y:auto; padding:4px 6px 8px; scrollbar-width:none; }
.msg-sb-list::-webkit-scrollbar { display:none; }

/* ── Conv item ── */
.msg-conv {
  display:flex; align-items:center; gap:10px;
  padding:9px 10px; border-radius:10px; cursor:pointer;
  transition:all .15s; border:1.5px solid transparent;
  margin-bottom:2px; position:relative;
}
.msg-conv:hover { background:#f5f2ec; }
.msg-conv.active { background:#0f1e35; border-color:rgba(201,168,76,.2); }
.msg-conv__avatar {
  width:38px; height:38px; border-radius:10px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; color:#fff;
  position:relative;
}
.msg-conv__online {
  position:absolute; bottom:-1px; right:-1px;
  width:9px; height:9px; border-radius:50%;
  background:#10b981; border:2px solid #fff;
}
.msg-conv.active .msg-conv__online { border-color:#0f1e35; }
.msg-conv__info { flex:1; min-width:0; }
.msg-conv__name { font-size:12.5px; font-weight:600; color:#0f1e35; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; line-height:1.3; }
.msg-conv.active .msg-conv__name { color:#fff; }
.msg-conv__last { font-size:11px; color:#94a3b8; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-top:1px; }
.msg-conv.active .msg-conv__last { color:rgba(255,255,255,.4); }
.msg-conv__right { display:flex; flex-direction:column; align-items:flex-end; gap:4px; flex-shrink:0; }
.msg-conv__time { font-size:10px; color:#94a3b8; }
.msg-conv.active .msg-conv__time { color:rgba(255,255,255,.35); }
.msg-conv__badge {
  min-width:18px; height:18px; border-radius:9px; padding:0 5px;
  background:#e11d48; color:#fff; font-size:10px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
}

/* ── Colonne droite : thread ── */
.msg-thread { flex:1; display:flex; flex-direction:column; overflow:hidden; min-width:0; }

/* Thread head */
.msg-thread-head {
  background:#fff; border-bottom:1.5px solid #e8e3da;
  padding:13px 18px; display:flex; align-items:center; gap:12px;
  flex-shrink:0;
}
.msg-thread-head__avatar {
  width:36px; height:36px; border-radius:10px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:13px; font-weight:700; color:#fff;
}
.msg-thread-head__name { font-size:13.5px; font-weight:700; color:#0f1e35; }
.msg-thread-head__sub  { font-size:11px; color:#94a3b8; margin-top:1px; display:flex; align-items:center; gap:5px; }
.msg-thread-head__dot  { width:7px; height:7px; border-radius:50%; background:#10b981; flex-shrink:0; }

/* Messages */
.msg-messages {
  flex:1; overflow-y:auto; padding:16px 18px;
  display:flex; flex-direction:column; gap:12px;
  scrollbar-width:thin; scrollbar-color:#ddd transparent;
}
.msg-messages::-webkit-scrollbar { width:4px; }
.msg-messages::-webkit-scrollbar-thumb { background:#ddd; border-radius:2px; }

/* Date divider */
.msg-date-sep {
  display:flex; align-items:center; gap:10px;
  font-size:10.5px; color:#94a3b8; font-weight:600;
  text-transform:uppercase; letter-spacing:.08em; margin:6px 0;
}
.msg-date-sep::before,.msg-date-sep::after {
  content:''; flex:1; height:1px; background:#f0ece3;
}

/* Bulle de message */
.msg-bubble-wrap { display:flex; gap:8px; align-items:flex-end; }
.msg-bubble-wrap.mine { flex-direction:row-reverse; }
.msg-bubble-avatar {
  width:28px; height:28px; border-radius:8px; flex-shrink:0;
  display:flex; align-items:center; justify-content:center;
  font-size:10px; font-weight:700; color:#fff;
  margin-bottom:2px;
}
.msg-bubble {
  max-width:62%; padding:10px 13px; border-radius:14px;
  font-size:13px; line-height:1.55; position:relative;
  word-break:break-word;
}
.msg-bubble.other {
  background:#fff; border:1.5px solid #e8e3da; border-bottom-left-radius:4px;
  color:#0f1e35; box-shadow:0 1px 4px rgba(15,30,53,.05);
}
.msg-bubble.mine {
  background:linear-gradient(135deg,#0f1e35,#1a3260);
  color:#fff; border-bottom-right-radius:4px;
  box-shadow:0 2px 8px rgba(15,30,53,.18);
}
.msg-bubble__sender {
  font-size:10px; font-weight:700; margin-bottom:3px; letter-spacing:.03em;
}
.msg-bubble.other .msg-bubble__sender { color:#c9a84c; }
.msg-bubble__time {
  font-size:10px; margin-top:4px; opacity:.55;
  text-align:right; font-family:'Plus Jakarta Sans',monospace;
}
.msg-bubble.mine .msg-bubble__time { color:rgba(255,255,255,.6); }
.msg-bubble.other .msg-bubble__time { color:#94a3b8; }

/* Zone de saisie */
.msg-input-wrap {
  background:#fff; border-top:1.5px solid #e8e3da;
  padding:12px 16px; display:flex; gap:10px; align-items:flex-end;
  flex-shrink:0;
}
.msg-input {
  flex:1; padding:10px 14px; border:1.5px solid #e8e3da; border-radius:12px;
  background:#f9f7f4; font-family:'Plus Jakarta Sans',sans-serif;
  font-size:13px; color:#0f1e35; outline:none; resize:none;
  min-height:40px; max-height:110px; transition:all .18s;
  line-height:1.5; box-sizing:border-box;
}
.msg-input:focus { border-color:#c9a84c; background:#fff; box-shadow:0 0 0 3px rgba(201,168,76,.1); }
.msg-input::placeholder { color:#94a3b8; }
.msg-send {
  width:40px; height:40px; border-radius:11px; flex-shrink:0;
  background:linear-gradient(135deg,#0f1e35,#1a3260);
  border:none; cursor:pointer;
  display:flex; align-items:center; justify-content:center;
  color:#c9a84c; transition:all .2s;
  box-shadow:0 2px 8px rgba(15,30,53,.18);
}
.msg-send:hover { transform:translateY(-1px); box-shadow:0 4px 14px rgba(15,30,53,.28); }
.msg-send:disabled { opacity:.4; cursor:not-allowed; transform:none; }

/* Empty states */
.msg-empty {
  flex:1; display:flex; flex-direction:column; align-items:center;
  justify-content:center; padding:40px; text-align:center; color:#94a3b8;
}
.msg-empty__icon { font-size:44px; opacity:.18; margin-bottom:14px; }
.msg-empty__text { font-size:13.5px; font-weight:600; color:#5a6a7e; margin-bottom:5px; }
.msg-empty__sub  { font-size:12px; color:#94a3b8; }

/* Loading */
.msg-spin { width:28px; height:28px; border:2.5px solid #e8e3da; border-top-color:#c9a84c; border-radius:50%; animation:msgSpin .7s linear infinite; margin:32px auto; }
@keyframes msgSpin { to{transform:rotate(360deg)} }

/* Tag de rôle */
.msg-role-tag {
  display:inline-flex; align-items:center;
  padding:2px 8px; border-radius:20px; font-size:10px; font-weight:700;
  letter-spacing:.04em;
}
.msg-role-tag--manager { background:rgba(201,168,76,.12); color:#b8892a; border:1px solid rgba(201,168,76,.25); }
.msg-role-tag--charge  { background:rgba(37,99,235,.1); color:#1d4ed8; border:1px solid rgba(37,99,235,.2); }
.msg-role-tag--admin   { background:rgba(124,58,237,.1); color:#6d28d9; border:1px solid rgba(124,58,237,.2); }
.msg-role-tag--groupe  { background:rgba(8,145,178,.1); color:#0e7490; border:1px solid rgba(8,145,178,.2); }
`;

/* ══════════════════════════════════════════════════════════════
   Helpers
══════════════════════════════════════════════════════════════ */
const ROLE_COLORS = { ADMIN:'#7c3aed', MANAGER:'#b8892a', CHARGE:'#2563eb', GROUPE:'#0891b2' };

function getInitials(nom, prenom) {
  return `${(prenom||'').charAt(0)}${(nom||'').charAt(0)}`.toUpperCase() || '?';
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 60000) return 'À l\'instant';
  if (diff < 3600000) return `${Math.floor(diff/60000)} min`;
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString('fr-FR', { hour:'2-digit', minute:'2-digit' });
  return d.toLocaleDateString('fr-FR', { day:'2-digit', month:'short' });
}

function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return 'Aujourd\'hui';
  const yest = new Date(now); yest.setDate(yest.getDate()-1);
  if (d.toDateString() === yest.toDateString()) return 'Hier';
  return d.toLocaleDateString('fr-FR', { weekday:'long', day:'numeric', month:'long' });
}

/* Retourne l'autre utilisateur d'une conv privée selon qui regarde */
function getOtherUser(conv, myUserId) {
  if (conv.type !== 'PRIVE') return null;
  // Priorité : participantUsers (neutral)
  if (conv.participantUsers && conv.participantUsers.length === 2) {
    return conv.participantUsers.find(u => u.id !== myUserId) || conv.participantUsers[0];
  }
  // Fallback : otherUser stocké (peut être incorrect si créé par admin)
  if (conv.otherUser && conv.otherUser.id !== myUserId) return conv.otherUser;
  return null;
}

function getConvDisplayName(conv, myUserId) {
  if (conv.type === 'GROUPE') return conv.name;
  const other = getOtherUser(conv, myUserId);
  return other ? `${other.prenom} ${other.nom}` : conv.name || '—';
}

function groupByDate(messages) {
  const groups = {};
  messages.forEach(m => {
    const key = new Date(m.timestamp).toDateString();
    if (!groups[key]) groups[key] = { date: m.timestamp, msgs: [] };
    groups[key].msgs.push(m);
  });
  return Object.values(groups);
}

/* ══════════════════════════════════════════════════════════════
   MessageriePanel
══════════════════════════════════════════════════════════════ */
export default function MessageriePanel({ onClose, onUnreadChange }) {
  const { user } = useAuth();
  const [loading,      setLoading]      = useState(true);
  const [convs,        setConvs]        = useState([]);
  const [activeConv,   setActiveConv]   = useState(null);
  const [messages,     setMessages]     = useState([]);
  const [input,        setInput]        = useState('');
  const [search,       setSearch]       = useState('');
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);
  const pollRef        = useRef(null);

  /* ── Charger les conversations au démarrage ──
     On purge les anciennes convs privées sans participantUsers pour corriger
     le bug "nom du chargé affiché à la place du manager"            */
  useEffect(() => {
    const convs = messagerie.getConversations();
    const hasBadConv = convs.some(c => c.type === 'PRIVE' && !c.participantUsers);
    if (hasBadConv) {
      // Purger uniquement les convs privées sans participantUsers
      const { lsGet: _get, ..._ } = {}; // unused
      const all = JSON.parse(localStorage.getItem('msg_convs') || '[]');
      const cleaned = all.filter(c => c.type !== 'PRIVE' || c.participantUsers);
      localStorage.setItem('msg_convs', JSON.stringify(cleaned));
    }
    initConversations();
  }, []); // eslint-disable-line

  /* ── Polling toutes les 2s pour les nouveaux messages ── */
  useEffect(() => {
    pollRef.current = setInterval(() => {
      refreshConvs();
      if (activeConv) refreshMessages(activeConv.id);
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [activeConv]); // eslint-disable-line

  /* ── Scroll en bas à chaque nouveau message ── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages]);

  /* ── Marquer comme lu quand on sélectionne une conv ── */
  useEffect(() => {
    if (activeConv && user?.userId) {
      messagerie.markRead(activeConv.id, user.userId);
      refreshConvs();
    }
  }, [activeConv]); // eslint-disable-line

  const refreshConvs = useCallback(() => {
    const all = messagerie.getConversations()
      .filter(c => c.participantIds?.includes(user?.userId))
      .sort((a, b) => new Date(b.updatedAt||0) - new Date(a.updatedAt||0));
    setConvs(all);
    const total = messagerie.getTotalUnread(user?.userId);
    onUnreadChange?.(total);
  }, [user?.userId, onUnreadChange]);

  const refreshMessages = useCallback((convId) => {
    setMessages(messagerie.getMessages(convId));
  }, []);

  /* ── Initialisation : créer les convs selon le rôle ── */
  const initConversations = async () => {
    setLoading(true);
    try {
      if (!user?.userId) return;

      const allUsers = await utilisateurService.findAll().catch(() => []);
      const zones    = await zoneService.findAll().catch(() => []);

      if (user.role === 'MANAGER' || user.role === 'ADMIN') {
        // Pour chaque zone, créer un groupe + convs privées avec les charges
        zones.forEach(zone => {
          const zid = String(zone.id);
          const chargesZone  = allUsers.filter(u => u.role === 'CHARGE'  && String(u.zoneId) === zid);
          const managersZone = allUsers.filter(u => u.role === 'MANAGER' && String(u.zoneId) === zid);
          const myZone = user.role === 'ADMIN' ||
            managersZone.some(m => m.id === user.userId) ||
            String(user.zoneId) === zid;

          if (!myZone && user.role !== 'ADMIN') return;

          // Groupe de la zone
          const groupParticipants = [
            ...managersZone.map(m => m.id),
            ...chargesZone.map(c => c.id),
          ];
          if (user.role === 'ADMIN') groupParticipants.push(user.userId);

          messagerie.ensureConversation({
            id: `groupe_zone_${zone.id}`,
            type: 'GROUPE',
            name: `Équipe ${zone.nom || zone.code}`,
            zoneId: zone.id,
            zoneName: zone.nom || zone.code,
            participantIds: [...new Set(groupParticipants)],
            lastMessage: null,
            updatedAt: new Date(0).toISOString(),
          });

          // Convs privées manager ↔ chaque charge
          chargesZone.forEach(charge => {
            managersZone.forEach(manager => {
              const convId = `prive_${Math.min(manager.id, charge.id)}_${Math.max(manager.id, charge.id)}`;
              messagerie.ensureConversation({
                id: convId,
                type: 'PRIVE',
                participantIds: [manager.id, charge.id],
                participantUsers: [
                  { id: manager.id, prenom: manager.prenom, nom: manager.nom, role: manager.role },
                  { id: charge.id,  prenom: charge.prenom,  nom: charge.nom,  role: charge.role  },
                ],
                lastMessage: null,
                updatedAt: new Date(0).toISOString(),
              });
            });
          });
        });

      } else if (user.role === 'CHARGE') {
        // Trouver le manager et la zone du charge
        const myZoneId = String(user.zoneId);
        const myZone   = zones.find(z => String(z.id) === myZoneId);
        const managers = allUsers.filter(u => u.role === 'MANAGER' && String(u.zoneId) === myZoneId);
        const charges  = allUsers.filter(u => u.role === 'CHARGE'  && String(u.zoneId) === myZoneId);

        if (myZone) {
          // Groupe zone
          const groupParticipants = [
            ...managers.map(m => m.id),
            ...charges.map(c => c.id),
          ];
          messagerie.ensureConversation({
            id: `groupe_zone_${myZone.id}`,
            type: 'GROUPE',
            name: `Équipe ${myZone.nom || myZone.code}`,
            zoneId: myZone.id,
            zoneName: myZone.nom || myZone.code,
            participantIds: [...new Set(groupParticipants)],
            lastMessage: null,
            updatedAt: new Date(0).toISOString(),
          });

          // Conv privée avec chaque manager
          managers.forEach(manager => {
            const convId = `prive_${Math.min(manager.id, user.userId)}_${Math.max(manager.id, user.userId)}`;
            messagerie.ensureConversation({
              id: convId,
              type: 'PRIVE',
              participantIds: [manager.id, user.userId],
              participantUsers: [
                { id: manager.id,   prenom: manager.prenom, nom: manager.nom, role: manager.role },
                { id: user.userId,  prenom: user.prenom,    nom: user.nom,    role: user.role    },
              ],
              lastMessage: null,
              updatedAt: new Date(0).toISOString(),
            });
          });
        }
      }

    } finally {
      refreshConvs();
      setLoading(false);
    }
  };

  const selectConv = (conv) => {
    setActiveConv(conv);
    refreshMessages(conv.id);
    messagerie.markRead(conv.id, user.userId);
    inputRef.current?.focus();
  };

  const sendMessage = () => {
    if (!input.trim() || !activeConv) return;
    messagerie.sendMessage(activeConv.id, {
      senderId:   user.userId,
      senderNom:  `${user.prenom} ${user.nom}`,
      senderRole: user.role,
      contenu:    input.trim(),
    });
    setInput('');
    refreshMessages(activeConv.id);
    refreshConvs();
    inputRef.current?.focus();
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  /* ── Filtrage ── */
  const filteredConvs = convs.filter(c =>
    !search || c.name?.toLowerCase().includes(search.toLowerCase())
  );
  const groupeConvs  = filteredConvs.filter(c => c.type === 'GROUPE');
  const priveConvs   = filteredConvs.filter(c => c.type === 'PRIVE');

  /* ── Unread count par conv ── */
  const getUnread = (conv) => {
    const msgs = messagerie.getMessages(conv.id);
    return msgs.filter(m => m.senderId !== user?.userId && !(m.readBy||[]).includes(user?.userId)).length;
  };

  const grouped = groupByDate(messages);

  return (
    <>
      <style>{CSS}</style>
      <div className="msg-overlay" onClick={onClose} />

      <div className="msg-panel">
        {/* ── En-tête ── */}
        <div className="msg-panel-head">
          <div className="msg-panel-head__icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <div>
            <div className="msg-panel-head__title">Messagerie</div>
            <div className="msg-panel-head__sub">Communication interne — {user?.prenom} {user?.nom}</div>
          </div>
          <button className="msg-close" onClick={onClose}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="msg-body">
          {/* ── Sidebar conversations ── */}
          <div className="msg-sidebar">
            <div className="msg-sb-head">
              <div className="msg-sb-search">
                <span className="msg-sb-search__ic">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input placeholder="Rechercher…" value={search} onChange={e => setSearch(e.target.value)} />
              </div>
            </div>

            {loading ? (
              <div className="msg-spin" />
            ) : (
              <div className="msg-sb-list">
                {/* Groupes */}
                {groupeConvs.length > 0 && (
                  <>
                    <div className="msg-sb-section">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:5}}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      Groupes d'équipe
                    </div>
                    {groupeConvs.map(conv => {
                      const unread = getUnread(conv);
                      const isActive = activeConv?.id === conv.id;
                      return (
                        <div key={conv.id} className={`msg-conv${isActive ? ' active' : ''}`} onClick={() => selectConv(conv)}>
                          <div className="msg-conv__avatar" style={{ background:'linear-gradient(135deg,#0891b2,#0e7490)', borderRadius:10 }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                          </div>
                          <div className="msg-conv__info">
                            <div className="msg-conv__name">{conv.name}</div>
                            <div className="msg-conv__last">
                              {conv.lastMessage
                                ? `${conv.lastMessage.senderNom?.split(' ')[0]}: ${conv.lastMessage.contenu}`
                                : 'Groupe d\'équipe'}
                            </div>
                          </div>
                          <div className="msg-conv__right">
                            {conv.lastMessage && <div className="msg-conv__time">{fmtTime(conv.lastMessage.timestamp)}</div>}
                            {unread > 0 && <div className="msg-conv__badge">{unread}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Privés */}
                {priveConvs.length > 0 && (
                  <>
                    <div className="msg-sb-section">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{marginRight:5}}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      Messages privés
                    </div>
                    {priveConvs.map(conv => {
                      const other    = getOtherUser(conv, user?.userId);
                      const dispName = getConvDisplayName(conv, user?.userId);
                      const unread   = getUnread(conv);
                      const isActive = activeConv?.id === conv.id;
                      const initials = other ? getInitials(other.nom, other.prenom) : dispName?.charAt(0)?.toUpperCase() || '?';
                      const color    = other ? ROLE_COLORS[other.role] || '#64748b' : '#64748b';
                      return (
                        <div key={conv.id} className={`msg-conv${isActive ? ' active' : ''}`} onClick={() => selectConv(conv)}>
                          <div className="msg-conv__avatar" style={{ background:`linear-gradient(135deg,${color},${color}cc)` }}>
                            {initials}
                            <span className="msg-conv__online" />
                          </div>
                          <div className="msg-conv__info">
                            <div className="msg-conv__name">{dispName}</div>
                            <div className="msg-conv__last">
                              {conv.lastMessage
                                ? conv.lastMessage.contenu
                                : other?.role === 'MANAGER' ? 'Manager de zone'
                                : other?.role === 'CHARGE' ? 'Chargé de Consignation'
                                : other?.role === 'CHARGE_TRAVAUX' ? 'Chargé des Travaux'
                                : other?.role}
                            </div>
                          </div>
                          <div className="msg-conv__right">
                            {conv.lastMessage && <div className="msg-conv__time">{fmtTime(conv.lastMessage.timestamp)}</div>}
                            {unread > 0 && <div className="msg-conv__badge">{unread}</div>}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {filteredConvs.length === 0 && (
                  <div style={{ padding:'24px 12px', textAlign:'center', color:'#94a3b8', fontSize:12 }}>
                    {search ? 'Aucun résultat' : 'Aucune conversation'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Thread ── */}
          <div className="msg-thread">
            {!activeConv ? (
              <div className="msg-empty">
                <div className="msg-empty__icon">
                  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                </div>
                <div className="msg-empty__text">Sélectionnez une conversation</div>
                <div className="msg-empty__sub">Choisissez un groupe ou un contact dans la liste</div>
              </div>
            ) : (
              <>
                {/* En-tête thread */}
                {(() => {
                  const threadOther    = getOtherUser(activeConv, user?.userId);
                  const threadDispName = getConvDisplayName(activeConv, user?.userId);
                  const threadColor    = threadOther ? ROLE_COLORS[threadOther.role] || '#64748b' : '#64748b';
                  return (
                    <div className="msg-thread-head">
                      {activeConv.type === 'GROUPE' ? (
                        <div className="msg-thread-head__avatar" style={{ background:'linear-gradient(135deg,#0891b2,#0e7490)' }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                        </div>
                      ) : (
                        <div className="msg-thread-head__avatar" style={{ background:`linear-gradient(135deg,${threadColor},${threadColor}cc)` }}>
                          {threadOther ? getInitials(threadOther.nom, threadOther.prenom) : '?'}
                        </div>
                      )}
                      <div>
                        <div className="msg-thread-head__name">{threadDispName}</div>
                        <div className="msg-thread-head__sub">
                          {activeConv.type === 'GROUPE' ? (
                            <>
                              <span className="msg-role-tag msg-role-tag--groupe">Groupe</span>
                              {activeConv.zoneName && <span>{activeConv.zoneName}</span>}
                              <span>{activeConv.participantIds?.length || 0} membres</span>
                            </>
                          ) : (
                            <>
                              <span className="msg-thread-head__dot" />
                              <span>En ligne</span>
                              <span className={`msg-role-tag msg-role-tag--${(threadOther?.role||'').toLowerCase()}`}>
                                {threadOther?.role === 'MANAGER' ? 'Manager' : threadOther?.role === 'CHARGE' ? 'Chargé' : threadOther?.role || ''}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Messages */}
                <div className="msg-messages">
                  {messages.length === 0 ? (
                    <div style={{ textAlign:'center', color:'#94a3b8', fontSize:12.5, padding:'32px 0' }}>
                      <div style={{ fontSize:36, opacity:.15, marginBottom:10 }}>💬</div>
                      Aucun message — soyez le premier à écrire !
                    </div>
                  ) : (
                    grouped.map((group, gi) => (
                      <React.Fragment key={gi}>
                        <div className="msg-date-sep">{fmtDate(group.date)}</div>
                        {group.msgs.map((msg, mi) => {
                          const isMine = msg.senderId === user?.userId;
                          const color  = ROLE_COLORS[msg.senderRole] || '#64748b';
                          const init   = msg.senderNom?.split(' ').map(w=>w[0]).join('').toUpperCase().slice(0,2) || '?';
                          return (
                            <div key={msg.id || mi} className={`msg-bubble-wrap${isMine ? ' mine' : ''}`}>
                              {!isMine && (
                                <div className="msg-bubble-avatar" style={{ background:`linear-gradient(135deg,${color},${color}cc)` }}>
                                  {init}
                                </div>
                              )}
                              <div className={`msg-bubble ${isMine ? 'mine' : 'other'}`}>
                                {!isMine && activeConv.type === 'GROUPE' && (
                                  <div className="msg-bubble__sender">{msg.senderNom}</div>
                                )}
                                {msg.contenu}
                                <div className="msg-bubble__time">
                                  {new Date(msg.timestamp).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'})}
                                  {isMine && ' ✓'}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </React.Fragment>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Zone de saisie */}
                <div className="msg-input-wrap">
                  <textarea
                    ref={inputRef}
                    className="msg-input"
                    placeholder={activeConv.type === 'GROUPE' ? `Écrire au groupe ${activeConv.name}…` : `Écrire à ${getConvDisplayName(activeConv, user?.userId)}…`}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    rows={1}
                  />
                  <button className="msg-send" onClick={sendMessage} disabled={!input.trim()}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13"/>
                      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
