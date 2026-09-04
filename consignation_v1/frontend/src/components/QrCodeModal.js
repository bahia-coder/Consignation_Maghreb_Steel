/**
 * QrCodeModal.js
 * Affiche le QR code d'un équipement + lien ngrok
 * URL encodée : https://9cb5-102-53-9-195.ngrok-free.app/equipement/{id}
 */
import React, { useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';

const NGROK_BASE = 'https://0e63-102-53-9-195.ngrok-free.app';
// URL format : {NGROK_BASE}/qr/equipement/{id}  →  page publique plans validés

const CSS = `
.qrm-overlay {
  position:fixed; inset:0; background:rgba(10,18,35,.55);
  backdrop-filter:blur(6px); z-index:2000;
  display:flex; align-items:center; justify-content:center;
  animation:qrmFade .2s ease;
  font-family:'Plus Jakarta Sans','Inter',system-ui,sans-serif;
}
@keyframes qrmFade { from{opacity:0} to{opacity:1} }

.qrm-modal {
  background:#fff; border-radius:22px; width:400px; max-width:calc(100vw - 32px);
  box-shadow:0 24px 80px rgba(10,18,35,.25); border:1px solid #e8e3da;
  animation:qrmUp .25s cubic-bezier(.34,1.2,.64,1);
  overflow:hidden;
}
@keyframes qrmUp { from{opacity:0;transform:translateY(18px) scale(.97)} to{opacity:1;transform:translateY(0) scale(1)} }

/* Header */
.qrm-head {
  background:linear-gradient(135deg,#0c1829 0%,#14243e 100%);
  padding:16px 20px; display:flex; align-items:center; gap:12px;
  position:relative; overflow:hidden;
}
.qrm-head::after { content:''; position:absolute; top:-40px; right:-30px; width:130px; height:130px; border-radius:50%; background:radial-gradient(circle,rgba(201,168,76,.12) 0%,transparent 70%); pointer-events:none; }
.qrm-head__icon {
  width:38px; height:38px; border-radius:10px; flex-shrink:0;
  background:rgba(201,168,76,.12); border:1.5px solid rgba(201,168,76,.3);
  display:flex; align-items:center; justify-content:center; color:#c9a84c;
  position:relative; z-index:1;
}
.qrm-head__info { flex:1; min-width:0; position:relative; z-index:1; }
.qrm-head__title { font-size:14px; font-weight:700; color:#fff; line-height:1.2; display:block; }
.qrm-head__code  { font-size:11px; color:rgba(255,255,255,.45); margin-top:2px; font-family:'DM Mono',monospace; display:block; letter-spacing:.04em; }
.qrm-close {
  width:30px; height:30px; border-radius:8px; flex-shrink:0;
  border:1px solid rgba(255,255,255,.12); background:rgba(255,255,255,.07);
  cursor:pointer; display:flex; align-items:center; justify-content:center;
  color:rgba(255,255,255,.55); transition:all .18s; position:relative; z-index:1;
}
.qrm-close:hover { border-color:rgba(239,68,68,.4); color:#f87171; background:rgba(239,68,68,.1); }

/* Body */
.qrm-body { padding:24px 20px 20px; display:flex; flex-direction:column; align-items:center; gap:18px; }

/* QR wrapper */
.qrm-qr-wrap {
  background:#f8f7f3; border:2px solid #e8e3da; border-radius:16px;
  padding:18px; display:flex; align-items:center; justify-content:center;
  box-shadow:0 2px 12px rgba(15,30,53,.06); position:relative;
}
.qrm-qr-wrap::before {
  content:''; position:absolute; inset:8px;
  border:1.5px dashed rgba(201,168,76,.3); border-radius:10px; pointer-events:none;
}

/* Info */
.qrm-info { width:100%; }
.qrm-url-wrap {
  background:#f4f2ee; border:1.5px solid #e8e3da; border-radius:10px;
  padding:10px 14px; display:flex; align-items:center; gap:8px;
}
.qrm-url {
  flex:1; font-family:'DM Mono',monospace; font-size:11px; color:#5a6a7e;
  word-break:break-all; line-height:1.45;
}
.qrm-copy {
  flex-shrink:0; padding:6px 12px; border-radius:7px; border:none;
  background:#0f1e35; color:#c9a84c; font-size:11px; font-weight:700;
  cursor:pointer; transition:all .18s; font-family:inherit; white-space:nowrap;
}
.qrm-copy:hover { background:#162844; transform:translateY(-1px); }
.qrm-copy--ok { background:#059669; color:#fff; }

/* Actions */
.qrm-actions { display:flex; gap:10px; width:100%; }
.qrm-btn {
  flex:1; padding:11px 16px; border-radius:11px; border:none;
  font-family:inherit; font-size:13px; font-weight:600; cursor:pointer;
  display:flex; align-items:center; justify-content:center; gap:7px;
  transition:all .2s;
}
.qrm-btn--primary {
  background:linear-gradient(135deg,#0f1e35,#162844); color:#c9a84c;
  box-shadow:0 3px 12px rgba(15,30,53,.2);
}
.qrm-btn--primary:hover { transform:translateY(-1px); box-shadow:0 5px 18px rgba(15,30,53,.28); }
.qrm-btn--ghost {
  background:#f4f2ee; color:#5a6a7e;
  border:1.5px solid #e8e3da;
}
.qrm-btn--ghost:hover { border-color:#c9a84c; color:#b8892a; }

/* Scan note */
.qrm-note {
  display:flex; align-items:flex-start; gap:8px; padding:10px 14px;
  background:rgba(201,168,76,.06); border:1px solid rgba(201,168,76,.2);
  border-radius:9px; font-size:11.5px; color:#5a6a7e; line-height:1.5;
  width:100%;
}
.qrm-note b { color:#b8892a; }
`;

export default function QrCodeModal({ equipement, onClose }) {
  const qrRef   = useRef(null);
  const [copied, setCopied] = React.useState(false);

  const url = `${NGROK_BASE}/qr/equipement/${equipement.id}`;

  /* ── Copier le lien ── */
  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      const el = document.createElement('textarea');
      el.value = url; document.body.appendChild(el); el.select();
      document.execCommand('copy'); document.body.removeChild(el);
      setCopied(true); setTimeout(() => setCopied(false), 2000);
    }
  };

  /* ── Télécharger le QR code en PNG ── */
  const downloadQR = () => {
    const svg = document.getElementById('qrm-svg');
    if (!svg) return;
    const serializer  = new XMLSerializer();
    const svgStr      = serializer.serializeToString(svg);
    const canvas      = document.createElement('canvas');
    const ctx         = canvas.getContext('2d');
    const img         = new Image();
    canvas.width = 320; canvas.height = 320;
    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 320, 320);
      ctx.drawImage(img, 0, 0, 320, 320);
      const link = document.createElement('a');
      link.download = `qr-equipement-${equipement.code || equipement.id}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svgStr);
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="qrm-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="qrm-modal">

          {/* Header */}
          <div className="qrm-head">
            <div className="qrm-head__icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
                <rect x="3" y="14" width="7" height="7" rx="1"/>
                <path d="M14 14h.01M14 17h3M17 14h3M17 17h3M20 20v.01M17 20v.01M14 20v.01"/>
              </svg>
            </div>
            <div className="qrm-head__info">
              <span className="qrm-head__title">QR Code — {equipement.code}</span>
              <span className="qrm-head__code">{equipement.description || 'Équipement industriel'}</span>
            </div>
            <button className="qrm-close" onClick={onClose}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          {/* Body */}
          <div className="qrm-body">

            {/* QR Code */}
            <div className="qrm-qr-wrap">
              <QRCodeSVG
                id="qrm-svg"
                ref={qrRef}
                value={url}
                size={220}
                level="H"
                includeMargin={false}
                bgColor="#f8f7f3"
                fgColor="#0f1e35"
                imageSettings={{
                  src: '', x: undefined, y: undefined,
                  height: 0, width: 0, excavate: false,
                }}
              />
            </div>

            {/* Lien + copie */}
            <div className="qrm-info">
              <div className="qrm-url-wrap">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                <span className="qrm-url">{url}</span>
                <button className={`qrm-copy${copied ? ' qrm-copy--ok' : ''}`} onClick={copyUrl}>
                  {copied ? '✓ Copié' : 'Copier'}
                </button>
              </div>
            </div>

            {/* Note */}
            <div className="qrm-note">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0,marginTop:1}}><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
              <div>Scannez avec l'appareil photo. Affiche les <b>plans validés</b> de l'équipement <b>{equipement.code}</b> avec téléchargement PDF. Connexion requise.</div>
            </div>

            {/* Actions */}
            <div className="qrm-actions">
              <button className="qrm-btn qrm-btn--ghost" onClick={onClose}>Fermer</button>
              <button className="qrm-btn qrm-btn--primary" onClick={downloadQR}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Télécharger PNG
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
