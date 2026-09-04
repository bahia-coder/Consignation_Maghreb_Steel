import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authService } from '../services/api';

/* ── Icons ── */
const Ic = {
  Layers: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  Lock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      <circle cx="12" cy="16" r="1" fill="currentColor"/>
    </svg>
  ),
  Badge: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2"/>
      <path d="M9 9h6M9 13h6M9 17h4"/><path d="M3 8h2M3 12h2M3 16h2"/>
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>
    </svg>
  ),
  EyeOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  Alert: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <circle cx="12" cy="16" r=".5" fill="currentColor"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Session: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const LOGOUT_REASON_LABELS = {
  idle: 'Vous avez été déconnecté après 15 minutes d\'inactivité.',
  network: 'Connexion au serveur perdue — vous avez été déconnecté par sécurité.',
  invalid: 'Votre session n\'est plus valide, veuillez vous reconnecter.',
};

export default function LoginPage() {
  const [matricule, setMatricule] = useState('');
  const [password,  setPassword]  = useState('');
  const [showPwd,   setShowPwd]   = useState(false);
  const [status,    setStatus]    = useState('idle');
  const [errMsg,    setErrMsg]    = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const overlayRef = useRef(null);

  const { login } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();

  useEffect(() => {
    const reason = sessionStorage.getItem('auth_logout_reason');
    if (reason) {
      setSessionNotice(LOGOUT_REASON_LABELS[reason] || '');
      sessionStorage.removeItem('auth_logout_reason');
    }
  }, []);

  const resetErr = () => {
    if (status === 'error') { setStatus('idle'); setErrMsg(''); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matricule.trim() || !password.trim()) return;
    setStatus('loading');
    setErrMsg('');
    try {
      const data = await authService.login(matricule.trim(), password);
      login({
        userId:    data.userId,
        matricule: data.matricule,
        username:  data.username,
        nom:       data.nom,
        prenom:    data.prenom,
        role:      data.role,
        zoneId:    data.zoneId,
        zoneCode:  data.zoneCode,
        zoneNom:   data.zoneNom,
      }, data.token);
      setStatus('success');
      const returnTo = location.state?.returnTo || '/dashboard';
      setTimeout(() => navigate(returnTo, { replace: true }), 900);
    } catch {
      setStatus('error');
      setErrMsg('Identifiants incorrects. Veuillez réessayer.');
    }
  };

  const isLoading = status === 'loading';
  const isSuccess = status === 'success';

  return (
    <>
      <style>{`
        .lm-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(4,10,18,0.75);
          backdrop-filter: blur(8px);
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: lm-fade 0.22s ease;
        }
        @keyframes lm-fade { from { opacity: 0; } to { opacity: 1; } }

        .lm-modal {
          display: flex; width: 100%; max-width: 840px;
          border-radius: 18px; overflow: hidden;
          box-shadow: 0 40px 100px rgba(0,0,0,0.40), 0 0 0 1px rgba(255,255,255,0.04);
          animation: lm-up 0.30s cubic-bezier(0.22,1,0.36,1);
        }
        @keyframes lm-up {
          from { opacity:0; transform: translateY(24px) scale(0.97); }
          to   { opacity:1; transform: translateY(0)    scale(1);    }
        }

        .lm-left {
          width: 330px; flex-shrink: 0;
          background: #07101c;
          display: flex; flex-direction: column; justify-content: space-between;
          padding: 44px 36px;
          position: relative; overflow: hidden;
        }
        .lm-left::before {
          content:""; position:absolute; top:0; left:0; right:0; height:3px;
          background: linear-gradient(90deg,#7a5c1e,#c9a84c,#f0d080,#c9a84c,#7a5c1e);
        }
        .lm-left-dots {
          position:absolute; inset:0; pointer-events:none;
          background-image: radial-gradient(rgba(201,168,76,0.10) 1px, transparent 1px);
          background-size: 26px 26px;
        }
        .lm-left-glow1 {
          position:absolute; top:-80px; right:-80px; width:260px; height:260px;
          border-radius:50%;
          background: radial-gradient(circle, rgba(201,168,76,0.13) 0%, transparent 70%);
          pointer-events:none;
        }
        .lm-left-glow2 {
          position:absolute; bottom:-80px; left:-60px; width:240px; height:240px;
          border-radius:50%;
          background: radial-gradient(circle, rgba(60,100,200,0.09) 0%, transparent 70%);
          pointer-events:none;
        }
        .lm-brand {
          display:flex; align-items:center; gap:10px; position:relative; z-index:1;
        }
        .lm-brand-mark {
          width:36px; height:36px; border-radius:9px;
          background:#c9a84c;
          display:flex; align-items:center; justify-content:center; flex-shrink:0;
        }
        .lm-brand-mark svg { width:18px; height:18px; stroke:#07101c; }
        .lm-brand-name {
          font-size:19px; font-weight:700; color:#fff; letter-spacing:-0.4px;
        }
        .lm-brand-name em { font-style:normal; color:#c9a84c; }

        .lm-left-body { position:relative; z-index:1; margin-top:36px; flex:1; }
        .lm-eyebrow-left {
          display:flex; align-items:center; gap:8px;
          font-size:10px; font-weight:700; letter-spacing:2px;
          text-transform:uppercase; color:#c9a84c; margin-bottom:14px;
        }
        .lm-eyebrow-left::before {
          content:""; width:20px; height:1px; background:#c9a84c; flex-shrink:0;
        }
        .lm-left-headline {
          font-size:28px; font-weight:800; color:#fff;
          line-height:1.22; margin:0 0 14px; letter-spacing:-0.6px;
        }
        .lm-left-headline span { color:#c9a84c; }
        .lm-left-body > p {
          font-size:13px; color:rgba(255,255,255,0.35); line-height:1.7; margin:0 0 28px;
        }

        .lm-left-foot {
          position:relative; z-index:1; margin-top:36px;
          padding-top:20px; border-top:1px solid rgba(255,255,255,0.07);
        }
        .lm-company {
          font-size:11px; color:rgba(255,255,255,0.25); line-height:1.55;
        }
        .lm-company strong { color:rgba(255,255,255,0.45); font-weight:500; }

        .lm-right {
          flex:1; background:#f7f8fa;
          display:flex; flex-direction:column;
          position:relative;
        }
        .lm-right::before {
          content:""; position:absolute; top:0; left:0; right:0; height:3px;
          background:rgba(201,168,76,0.15);
        }

        .lm-form-wrap {
          flex:1; display:flex; flex-direction:column; justify-content:center;
          padding:52px 48px;
        }

        .lm-form-head { margin-bottom:30px; }
        .lm-form-title {
          font-size:26px; font-weight:800; color:#0c1520;
          letter-spacing:-0.6px; margin:0 0 6px;
        }
        .lm-form-sub { font-size:13.5px; color:#6b7685; margin:0; line-height:1.6; }

        .lm-alert {
          display:flex; align-items:flex-start; gap:10px;
          border-radius:10px; padding:12px 14px;
          margin-bottom:18px; font-size:13px; line-height:1.5;
        }
        .lm-alert svg { width:16px; height:16px; flex-shrink:0; margin-top:1px; }
        .lm-alert--error  { background:#fff5f5; border:1px solid #fecaca; color:#b91c1c; }
        .lm-alert--success{ background:#f0fdf4; border:1px solid #86efac; color:#15803d; }

        .lm-form { display:flex; flex-direction:column; gap:18px; }
        .lm-field { display:flex; flex-direction:column; gap:7px; }
        .lm-lbl {
          font-size:11.5px; font-weight:700; color:#374151;
          text-transform:uppercase; letter-spacing:0.8px;
        }
        .lm-input-wrap { position:relative; display:flex; align-items:center; }
        .lm-input-icon {
          position:absolute; left:14px; pointer-events:none;
          display:flex; align-items:center; color:#aab0bb;
        }
        .lm-input-icon svg { width:15px; height:15px; }
        .lm-input {
          width:100%; height:48px; box-sizing:border-box;
          background:#fff; border:1.5px solid #dde2eb; border-radius:11px;
          padding:0 44px 0 44px;
          font-size:14.5px; color:#0c1520; outline:none;
          transition:border-color 0.18s, box-shadow 0.18s;
          font-family:inherit;
        }
        .lm-input::placeholder { color:#b0b8c4; }
        .lm-input:focus {
          border-color:#c9a84c;
          box-shadow:0 0 0 3px rgba(201,168,76,0.13);
        }
        .lm-input--err { border-color:#fca5a5 !important; }
        .lm-input--err:focus { box-shadow:0 0 0 3px rgba(239,68,68,0.10) !important; }
        .lm-input:disabled { opacity:0.5; cursor:not-allowed; background:#f3f4f6; }

        .lm-eye {
          position:absolute; right:12px;
          background:none; border:none; cursor:pointer; padding:4px;
          color:#aab0bb; display:flex; align-items:center;
          transition:color 0.15s;
        }
        .lm-eye:hover { color:#4b5563; }
        .lm-eye svg { width:15px; height:15px; }

        .lm-row {
          display:flex; align-items:center; justify-content:space-between;
          margin-top:-4px;
        }
        .lm-remember {
          display:flex; align-items:center; gap:8px;
          cursor:pointer; font-size:13px; color:#4b5563;
          user-select:none;
        }
        .lm-remember input { display:none; }
        .lm-chk {
          width:18px; height:18px; border-radius:5px;
          border:1.5px solid #d1d5db; background:#fff; flex-shrink:0;
          display:flex; align-items:center; justify-content:center;
          transition:background 0.15s, border-color 0.15s;
        }
        .lm-chk--on { background:#c9a84c; border-color:#c9a84c; }
        .lm-chk svg { width:10px; height:10px; color:#fff; }

        .lm-btn {
          height:50px; border-radius:11px; border:none; cursor:pointer;
          font-size:14.5px; font-weight:700; letter-spacing:0.1px;
          display:flex; align-items:center; justify-content:center; gap:8px;
          transition:background 0.18s, box-shadow 0.18s, transform 0.12s, opacity 0.15s;
          margin-top:4px; font-family:inherit;
        }
        .lm-btn--idle { background:#0c1520; color:#fff; }
        .lm-btn--idle:hover:not(:disabled) {
          background:#18273a;
          box-shadow:0 8px 24px rgba(12,21,32,0.28);
        }
        .lm-btn--idle:active:not(:disabled) { transform:scale(0.985); }
        .lm-btn--idle:disabled { opacity:0.38; cursor:not-allowed; }
        .lm-btn--loading { background:#0c1520; color:rgba(255,255,255,0.65); cursor:wait; }
        .lm-btn--success { background:#15803d; color:#fff; }
        .lm-btn svg { width:16px; height:16px; }
        .lm-spinner {
          width:18px; height:18px; border-radius:50%;
          border:2px solid rgba(255,255,255,0.22); border-top-color:#fff;
          animation:lm-spin 0.7s linear infinite;
        }
        @keyframes lm-spin { to { transform:rotate(360deg); } }

        .lm-roles {
          display:flex; align-items:center; gap:8px;
          margin-top:22px; padding-top:18px;
          border-top:1px solid #eaecf0;
        }
        .lm-roles-lbl {
          font-size:10.5px; font-weight:700; color:#9aa5b4;
          text-transform:uppercase; letter-spacing:1px; margin-right:4px;
        }
        .lm-role {
          font-size:11px; font-weight:600; padding:3px 10px; border-radius:5px;
        }
        .lm-role--admin   { background:#fef9ec; color:#92600a; border:1px solid #fde68a; }
        .lm-role--manager { background:#eff6ff; color:#1d4ed8; border:1px solid #bfdbfe; }
        .lm-role--charge  { background:#f0fdf4; color:#166534; border:1px solid #86efac; }

        .lm-security {
          display:flex; align-items:center; gap:7px;
          margin-top:12px; font-size:11.5px; color:#9aa5b4;
        }
        .lm-security svg { width:13px; height:13px; flex-shrink:0; color:#c9a84c; }

        .lm-session-info {
          display:flex; align-items:center; gap:6px;
          margin-top:8px; font-size:11px; color:#b0b8c4;
        }
        .lm-session-info svg { width:12px; height:12px; flex-shrink:0; color:#b0b8c4; }

        @media (max-width: 640px) {
          .lm-left { display:none; }
          .lm-form-wrap { padding:36px 24px; }
        }
      `}</style>

      <div className="lm-overlay" role="dialog" aria-modal="true" aria-labelledby="lm-title">
        <div className="lm-modal">

          {/* ══ LEFT PANEL ══ */}
          <div className="lm-left">
            <div className="lm-left-dots" />
            <div className="lm-left-glow1" />
            <div className="lm-left-glow2" />

            <div className="lm-brand">
              <div className="lm-brand-mark"><Ic.Layers /></div>
              <span className="lm-brand-name">Consign<em>App</em></span>
            </div>

            <div className="lm-left-body">
              <div className="lm-eyebrow-left">Accès sécurisé</div>
              <h2 className="lm-left-headline">
                Sécurité &amp;<br/><span>Traçabilité</span><br/>industrielle
              </h2>
              <p>
                Connectez-vous à votre espace personnel pour gérer
                vos plans de consignation de façon digitale et sécurisée.
              </p>
            </div>

            <div className="lm-left-foot">
              <div className="lm-company">
                <strong>Maghreb Steel</strong><br/>
                Département Maintenance
              </div>
            </div>
          </div>

          {/* ══ RIGHT PANEL ══ */}
          <div className="lm-right">
            <div className="lm-form-wrap">

              <div className="lm-form-head">
                <h2 className="lm-form-title" id="lm-title">Connexion</h2>
                <p className="lm-form-sub">
                  Entrez vos identifiants professionnels pour accéder à la plateforme.
                </p>
              </div>

              {sessionNotice && status !== 'error' && (
                <div className="lm-alert lm-alert--error" role="status">
                  <Ic.Alert /><span>{sessionNotice}</span>
                </div>
              )}
              {status === 'error' && errMsg && (
                <div className="lm-alert lm-alert--error" role="alert">
                  <Ic.Alert /><span>{errMsg}</span>
                </div>
              )}
              {isSuccess && (
                <div className="lm-alert lm-alert--success" role="status">
                  <Ic.Check /><span>Connexion réussie — Redirection en cours…</span>
                </div>
              )}

              <form className="lm-form" onSubmit={handleSubmit} noValidate>

                <div className="lm-field">
                  <label className="lm-lbl" htmlFor="lm-mat">Matricule employé</label>
                  <div className="lm-input-wrap">
                    <span className="lm-input-icon"><Ic.Badge /></span>
                    <input
                      id="lm-mat" type="text"
                      className={`lm-input${status === 'error' ? ' lm-input--err' : ''}`}
                      placeholder="ex: MS-ADM-001"
                      value={matricule}
                      onChange={e => { setMatricule(e.target.value); resetErr(); }}
                      required autoFocus autoComplete="username"
                      disabled={isLoading || isSuccess}
                    />
                  </div>
                </div>

                <div className="lm-field">
                  <label className="lm-lbl" htmlFor="lm-pwd">Mot de passe</label>
                  <div className="lm-input-wrap">
                    <span className="lm-input-icon"><Ic.Lock /></span>
                    <input
                      id="lm-pwd" type={showPwd ? 'text' : 'password'}
                      className={`lm-input${status === 'error' ? ' lm-input--err' : ''}`}
                      placeholder="••••••••"
                      value={password}
                      onChange={e => { setPassword(e.target.value); resetErr(); }}
                      autoComplete="current-password" required
                      disabled={isLoading || isSuccess}
                    />
                    <button
                      type="button" className="lm-eye"
                      onClick={() => setShowPwd(p => !p)}
                      tabIndex={-1}
                      aria-label={showPwd ? 'Masquer' : 'Afficher'}
                    >
                      {showPwd ? <Ic.EyeOff /> : <Ic.Eye />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className={`lm-btn lm-btn--${isLoading ? 'loading' : isSuccess ? 'success' : 'idle'}`}
                  disabled={isLoading || isSuccess || !matricule.trim() || !password.trim()}
                >
                  {isLoading ? (
                    <><span className="lm-spinner" /><span>Connexion en cours…</span></>
                  ) : isSuccess ? (
                    <><Ic.Check /><span>Connexion réussie</span></>
                  ) : (
                    <><span>Accéder à la plateforme</span><Ic.ArrowRight /></>
                  )}
                </button>

              </form>

              <div className="lm-roles">
                <span className="lm-roles-lbl">Profils</span>
                <span className="lm-role lm-role--admin">Admin</span>
                <span className="lm-role lm-role--manager">Manager</span>
                <span className="lm-role lm-role--charge">Chargé de Consignation</span>
                <span className="lm-role lm-role--charge">Chargé des Travaux</span>
              </div>

              <div className="lm-security">
                <Ic.Lock />
                <span>Réservé au personnel autorisé de Maghreb Steel</span>
              </div>

              <div className="lm-session-info">
                <Ic.Session />
                <span>Session valable pour cet onglet — indépendante des autres fenêtres ouvertes</span>
              </div>

            </div>
          </div>

        </div>
      </div>
    </>
  );
}
