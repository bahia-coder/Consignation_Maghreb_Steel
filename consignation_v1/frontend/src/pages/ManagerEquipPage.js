import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import EquipementPage from './EquipementPage';
import MessageriePanel from '../components/MessageriePanel';
import AssistantWidget from '../components/AssistantWidget';

/* ════════════════════════════════════════════
   CSS — layout manager (sidebar + main)
════════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Mono:wght@400;500&family=Inter:wght@300;400;500;600;700&display=swap');

*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}

body { font-family:'Inter',sans-serif; background:#f0f2f5; }

.meq-layout { display:flex; min-height:100vh; }

/* ── SIDEBAR ── */
.meq-sb {
  width:242px; flex-shrink:0;
  background:#0f1e35;
  display:flex; flex-direction:column;
  position:sticky; top:0; height:100vh;
  overflow-y:auto;
}
.meq-sb::-webkit-scrollbar { width:0; }

.meq-sb__brand {
  padding:26px 22px 22px;
  border-bottom:1px solid #1e3558;
  display:flex; align-items:center; gap:12px;
}
.meq-sb__logo {
  width:38px; height:38px; border-radius:9px; flex-shrink:0;
  border:1.5px solid #c9a84c; display:flex; align-items:center; justify-content:center;
  color:#c9a84c;
}
.meq-sb__appname { font-size:16px; font-weight:700; color:#fff; letter-spacing:-.02em; }
.meq-sb__appname span { color:#c9a84c; }

.meq-sb__section {
  font-size:10px; font-family:'DM Mono',monospace; letter-spacing:.13em;
  text-transform:uppercase; color:rgba(255,255,255,0.22);
  padding:20px 22px 8px;
}

.meq-sb__nav { padding:0 10px; display:flex; flex-direction:column; gap:2px; flex:1; }

.meq-nav-item {
  display:flex; align-items:center; gap:10px;
  padding:10px 12px; border-radius:8px; cursor:pointer;
  border:1px solid transparent; font-size:13px;
  color:rgba(255,255,255,0.48); font-weight:400;
  background:none; width:100%; text-align:left;
  font-family:'Sora',sans-serif; transition:all .15s;
}
.meq-nav-item:hover { background:rgba(255,255,255,0.05); color:rgba(255,255,255,0.85); }
.meq-nav-item.active {
  background:rgba(201,168,76,0.12); border-color:rgba(201,168,76,0.30);
  color:#c9a84c; font-weight:600;
}
.meq-nav-item__icon { width:18px; display:flex; align-items:center; justify-content:center; flex-shrink:0; }

.meq-sb__divider { height:1px; background:#1e3558; margin:10px 12px; }

.meq-sb__user {
  margin:10px; padding:12px 14px;
  background:#162844; border:1px solid #1e3558;
  border-radius:10px; display:flex; align-items:center; gap:10px;
}
.meq-sb__avatar {
  width:34px; height:34px; border-radius:50%; flex-shrink:0;
  background:rgba(201,168,76,0.12); border:1.5px solid rgba(201,168,76,0.30);
  display:flex; align-items:center; justify-content:center;
  font-size:12px; font-weight:700; color:#c9a84c;
}
.meq-sb__uname { font-size:12px; font-weight:600; color:#fff; line-height:1.3; }
.meq-sb__urole { font-size:11px; color:rgba(255,255,255,0.32); }
.meq-sb__msg {
  margin:0 10px 6px; padding:10px 13px;
  display:flex; align-items:center; gap:9px;
  border:1px solid rgba(201,168,76,.22); border-radius:10px;
  background:rgba(201,168,76,.07); cursor:pointer; transition:all .18s;
  font-size:12.5px; font-weight:600; color:rgba(201,168,76,1);
  font-family:'Sora',sans-serif; width:calc(100% - 20px);
}
.meq-sb__msg:hover { background:rgba(201,168,76,.15); border-color:rgba(201,168,76,.4); transform:translateY(-1px); }
.meq-sb__msg-badge {
  margin-left:auto; min-width:18px; height:18px; border-radius:9px; padding:0 5px;
  background:#e11d48; color:#fff; font-size:10px; font-weight:700;
  display:flex; align-items:center; justify-content:center;
}

/* ── MAIN ── */
.meq-main { flex:1; min-width:0; display:flex; flex-direction:column; background:#f0f2f5; }

/* ── TOPBAR ── */
.meq-topbar {
  height:60px; background:#fff; border-bottom:1px solid #e9ecef;
  padding:0 28px; display:flex; align-items:center; justify-content:space-between;
  position:sticky; top:0; z-index:50;
  box-shadow:0 1px 3px rgba(0,0,0,0.04);
  flex-shrink:0;
}
.meq-topbar__title { font-size:15px; font-weight:700; color:#0f1e35; letter-spacing:-.02em; }
.meq-topbar__sub   { font-size:11px; color:#94a3b8; margin-top:1px; }
.meq-topbar__right { display:flex; align-items:center; gap:12px; }
.meq-topbar__logout {
  display:flex; align-items:center; gap:6px; padding:7px 14px; border-radius:8px;
  background:rgba(239,68,68,0.07); border:1px solid rgba(239,68,68,0.18);
  color:#ef4444; cursor:pointer; font-size:12px; font-weight:600;
  font-family:'Sora',sans-serif; transition:all .15s;
}
.meq-topbar__logout:hover { background:rgba(239,68,68,0.13); }

/* ── Overrides EquipementPage pour s'intégrer dans le layout ── */
.meq-main .ep { margin: 22px 24px 0; }

@media(max-width:900px){ .meq-sb{ display:none; } }
`;

/* ── SVG Icons ── */
const IcGear = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
);
const IcHome = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcEquip = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/>
  </svg>
);
const IcLogout = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);

export default function ManagerEquipPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showMsg,   setShowMsg]   = useState(false);
  const [msgUnread, setMsgUnread] = useState(0);

  const initials = user
    ? `${(user.prenom || '').charAt(0)}${(user.nom || '').charAt(0)}`.toUpperCase()
    : '?';

  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  // Détecter si on est actif sur équipements (toujours true ici)
  const isEquipActive = location.pathname.startsWith('/manager-equip');

  const NAV = [
    { id: 'dashboard', label: 'Tableau de bord', icon: <IcHome />,  action: () => navigate('/manager-dashboard') },
    { id: 'equip',     label: 'Équipements',     icon: <IcEquip />, action: () => {} /* déjà ici */ },
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="meq-layout">

        {/* ════ SIDEBAR ════ */}
        <aside className="meq-sb">
          {/* Brand */}
          <div className="meq-sb__brand">
            <div className="meq-sb__logo"><IcGear /></div>
            <div className="meq-sb__appname">Consign<span>App</span></div>
          </div>

          <div className="meq-sb__section">Navigation</div>

          <nav className="meq-sb__nav">
            {NAV.map(item => (
              <button
                key={item.id}
                className={`meq-nav-item${item.id === 'equip' && isEquipActive ? ' active' : ''}`}
                onClick={item.action}
              >
                <span className="meq-nav-item__icon">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </nav>

          <div className="meq-sb__divider" />

          {/* Messagerie */}
          <button className="meq-sb__msg" onClick={() => setShowMsg(true)}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span>Messagerie</span>
            {msgUnread > 0 && <span className="meq-sb__msg-badge">{msgUnread > 9 ? '9+' : msgUnread}</span>}
          </button>

          {/* User card */}
          <div className="meq-sb__user">
            <div className="meq-sb__avatar">{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="meq-sb__uname">{user?.prenom} {user?.nom}</div>
              <div className="meq-sb__urole">Manager</div>
            </div>
          </div>
        </aside>

        {/* ════ MAIN ════ */}
        <div className="meq-main">

          {/* Topbar */}
          <header className="meq-topbar">
            <div>
              <div className="meq-topbar__title">Équipements</div>
              <div className="meq-topbar__sub">Gestion des équipements industriels</div>
            </div>
            <div className="meq-topbar__right">
              <div style={{ display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#059669', fontWeight:500 }}>
                <div style={{ width:7, height:7, borderRadius:'50%', background:'#059669', boxShadow:'0 0 0 2px rgba(5,150,105,.2)' }} />
                Opérationnel
              </div>
              <button className="meq-topbar__logout" onClick={handleLogout}>
                <IcLogout /> Déconnexion
              </button>
            </div>
          </header>

          {/* Contenu — EquipementPage s'intègre directement */}
          <EquipementPage />

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
