import React, { useEffect, useState, useMemo, useRef } from 'react';
import { dispositifService } from '../services/api';

/* ══════════════════════════════════════════
   CSS — PFE Dispositifs (copie exacte)
══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=Fraunces:wght@300;700&family=JetBrains+Mono:wght@400;500&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
:root{
  --dv-navy:#0f1e35;--dv-navy2:#162844;--dv-navy3:#1a2a4a;
  --dv-gold:#c9a84c;--dv-gold-d:#b8943a;--dv-gold-dim:rgba(201,168,76,.12);
  --dv-gold-glow:rgba(201,168,76,.25);--dv-gold-bdr:rgba(201,168,76,.3);
  --dv-cream:#f5f3ef;--dv-cream2:#ede9e0;--dv-cream3:#faf9f7;--dv-white:#fff;
  --dv-text:#0f1e35;--dv-sub:#4a5568;--dv-muted:#94a3b8;
  --dv-border:#e4dfd6;--dv-border2:#ede9e0;
  --dv-green:#059669;--dv-green-d:rgba(5,150,105,.1);
  --dv-red:#dc2626;--dv-red-d:rgba(220,38,38,.08);
  --dv-amber:#d97706;--dv-amber-d:rgba(217,119,6,.1);
  --dv-sh-xs:0 1px 2px rgba(15,30,53,.04);
  --dv-sh-sm:0 2px 8px rgba(15,30,53,.06);
  --dv-sh-md:0 8px 24px rgba(15,30,53,.08);
  --dv-sh-lg:0 16px 40px rgba(15,30,53,.12);
  --dv-sh-xl:0 24px 60px rgba(15,30,53,.16);
  --dv-sh-gold:0 8px 32px rgba(201,168,76,.18);
}

/* PAGE */
.dvp{font-family:'Plus Jakarta Sans',sans-serif;background:var(--dv-cream);color:var(--dv-text);padding:24px 32px;min-height:100vh;}

/* HEADER */
.dvp__hdr{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;flex-wrap:wrap;gap:20px;}
.dvp__hdr-l{display:flex;align-items:center;gap:18px;}
.dvp__icon{width:56px;height:56px;background:var(--dv-navy);border-radius:18px;display:flex;align-items:center;justify-content:center;color:var(--dv-gold);box-shadow:0 4px 16px rgba(15,30,53,.2);flex-shrink:0;position:relative;overflow:hidden;}
.dvp__icon::after{content:'';position:absolute;top:-50%;left:-50%;width:80%;height:80%;background:radial-gradient(circle,rgba(201,168,76,.3) 0%,transparent 70%);pointer-events:none;}
.dvp__eyebrow{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:var(--dv-gold);margin-bottom:4px;}
.dvp__title{font-family:'Fraunces',serif;font-size:26px;font-weight:700;letter-spacing:-.02em;color:var(--dv-navy);line-height:1.2;}
.dvp__sub{font-size:12.5px;color:var(--dv-muted);margin-top:5px;display:flex;align-items:center;gap:8px;}
.dvp__sub::before{content:'';width:4px;height:4px;border-radius:50%;background:var(--dv-gold);display:inline-block;}
.dvp__hdr-acts{display:flex;gap:10px;align-items:center;padding-top:6px;}

/* STATS */
.dvp__stats{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;margin-bottom:32px;}
.dvp__stat{background:var(--dv-white);border:1px solid var(--dv-border2);border-radius:22px;padding:28px 32px;display:flex;align-items:center;gap:22px;transition:all .35s cubic-bezier(.4,0,.2,1);position:relative;overflow:hidden;}
.dvp__stat::after{content:'';position:absolute;top:0;right:0;width:200px;height:100%;background:radial-gradient(ellipse at right center,var(--dv-gold-dim) 0%,transparent 70%);pointer-events:none;opacity:0;transition:opacity .4s;}
.dvp__stat:hover::after{opacity:1;}
.dvp__stat:hover{border-color:var(--dv-gold-bdr);transform:translateY(-4px);box-shadow:var(--dv-sh-lg);}
.dvp__stat-icon{width:64px;height:64px;background:linear-gradient(135deg,var(--dv-navy),var(--dv-navy3));border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--dv-gold);flex-shrink:0;box-shadow:0 4px 16px rgba(15,30,53,.15);transition:all .35s;}
.dvp__stat:hover .dvp__stat-icon{transform:scale(1.08) rotate(-3deg);box-shadow:0 6px 20px rgba(15,30,53,.22);}
.dvp__stat-lbl{font-size:11px;color:var(--dv-muted);text-transform:uppercase;letter-spacing:.12em;margin-bottom:6px;font-weight:600;}
.dvp__stat-val{font-family:'Fraunces',serif;font-size:44px;font-weight:700;letter-spacing:-.03em;line-height:1;}
.dvp__stat-trend{font-size:12px;font-weight:600;margin-top:6px;display:flex;align-items:center;gap:4px;}
.dvp__stat--total .dvp__stat-val{color:var(--dv-navy);}
.dvp__stat--qty .dvp__stat-val{color:var(--dv-gold-d);}

/* BUTTONS */
.dvp-btn-p,.dvp-btn-g{display:inline-flex;align-items:center;gap:8px;padding:11px 22px;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .3s cubic-bezier(.4,0,.2,1);white-space:nowrap;}
.dvp-btn-p{background:var(--dv-navy);color:var(--dv-gold);border:none;box-shadow:0 2px 12px rgba(15,30,53,.2);}
.dvp-btn-p:hover{transform:translateY(-2px);box-shadow:0 6px 20px rgba(15,30,53,.3);background:var(--dv-navy2);}
.dvp-btn-g{background:var(--dv-white);color:var(--dv-sub);border:1.5px solid var(--dv-border);box-shadow:var(--dv-sh-xs);}
.dvp-btn-g:hover{border-color:var(--dv-gold-bdr);color:var(--dv-gold-d);background:var(--dv-gold-dim);}

/* TOOLBAR */
.dvp__toolbar{display:flex;gap:14px;margin-bottom:20px;align-items:center;flex-wrap:wrap;}
.dvp__sw{flex:1;position:relative;min-width:300px;}
.dvp__si{position:absolute;left:16px;top:50%;transform:translateY(-50%);color:var(--dv-muted);pointer-events:none;transition:color .2s;}
.dvp__sw:focus-within .dvp__si{color:var(--dv-gold);}
.dvp__search{width:100%;padding:13px 18px 13px 46px;border:1.5px solid var(--dv-border);border-radius:16px;font-family:'Plus Jakarta Sans',sans-serif;font-size:13.5px;background:var(--dv-white);color:var(--dv-text);transition:all .25s;box-shadow:var(--dv-sh-xs);outline:none;}
.dvp__search::placeholder{color:var(--dv-muted);}
.dvp__search:focus{border-color:var(--dv-gold);box-shadow:0 0 0 4px var(--dv-gold-dim),var(--dv-sh-sm);}
.dvp__results{font-size:12.5px;color:var(--dv-muted);background:var(--dv-cream2);padding:9px 18px;border-radius:50px;font-weight:600;border:1px solid var(--dv-border2);white-space:nowrap;}
.dvp__results span{color:var(--dv-gold-d);font-weight:800;}

/* CONTENT CARD */
.dvp__content{background:var(--dv-cream3);border:1px solid var(--dv-border2);border-radius:28px;overflow:hidden;}

/* GRID */
.dvp__grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:20px;padding:20px;}

/* DISPOSITIF CARD */
.disp-card{position:relative;background:var(--dv-white);border:1px solid var(--dv-border2);border-radius:22px;overflow:hidden;cursor:pointer;transition:all .4s cubic-bezier(.34,1.56,.64,1);box-shadow:var(--dv-sh-xs);display:flex;flex-direction:column;}
.disp-card:hover{border-color:rgba(201,168,76,.45);transform:translateY(-8px) scale(1.01);box-shadow:var(--dv-sh-xl),0 0 0 1px var(--dv-gold-bdr);}
.disp-card__ribbon{position:absolute;top:14px;left:14px;z-index:3;background:var(--dv-navy);color:var(--dv-gold);font-size:10px;font-weight:800;letter-spacing:.1em;text-transform:uppercase;padding:4px 10px;border-radius:6px;opacity:0;transform:translateY(-4px);transition:all .3s ease .05s;}
.disp-card:hover .disp-card__ribbon{opacity:1;transform:translateY(0);}
.disp-card__image{position:relative;height:180px;background:linear-gradient(145deg,#f4f2ee 0%,#ece8e0 100%);overflow:hidden;display:flex;align-items:center;justify-content:center;flex-shrink:0;}
.disp-card__image::after{content:'';position:absolute;inset:0;background-image:radial-gradient(circle,rgba(15,30,53,.06) 1px,transparent 1px);background-size:18px 18px;pointer-events:none;opacity:.6;}
.disp-card__image img{width:100%;height:100%;object-fit:cover;transition:transform .6s cubic-bezier(.4,0,.2,1);position:relative;z-index:1;}
.disp-card:hover .disp-card__image img{transform:scale(1.1);}
.disp-card__image-overlay{position:absolute;inset:0;background:linear-gradient(to top,rgba(15,30,53,.35) 0%,transparent 55%);opacity:0;transition:opacity .4s;z-index:2;}
.disp-card:hover .disp-card__image-overlay{opacity:1;}
.disp-card__image-placeholder{display:flex;flex-direction:column;align-items:center;gap:12px;color:var(--dv-muted);transition:all .3s;position:relative;z-index:1;}
.disp-card__image-placeholder svg{opacity:.4;}
.disp-card__image-placeholder span{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.5;}
.disp-card:hover .disp-card__image-placeholder{color:var(--dv-gold);transform:scale(1.08);}
.disp-card__content{padding:18px 20px 0;flex:1;display:flex;flex-direction:column;}
.disp-card__category{font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--dv-gold-d);margin-bottom:6px;opacity:.8;}
.disp-card__name{font-size:14.5px;font-weight:700;color:var(--dv-text);line-height:1.45;transition:color .2s;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;flex:1;}
.disp-card:hover .disp-card__name{color:var(--dv-navy);}
.disp-card__ref{font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--dv-muted);margin-top:5px;}
.disp-card__footer{display:flex;justify-content:space-between;align-items:center;padding:14px 20px 18px;margin-top:14px;border-top:1px solid var(--dv-border2);gap:8px;}
.disp-card__cta{width:36px;height:36px;border-radius:12px;background:var(--dv-navy);display:flex;align-items:center;justify-content:center;color:var(--dv-gold);transition:all .35s cubic-bezier(.34,1.56,.64,1);flex-shrink:0;box-shadow:0 2px 8px rgba(15,30,53,.15);border:none;cursor:pointer;}
.disp-card:hover .disp-card__cta{background:var(--dv-gold);color:var(--dv-navy);transform:scale(1.1) rotate(5deg);box-shadow:var(--dv-sh-gold);}

/* PAGINATION */
.dvp__pag{display:flex;justify-content:space-between;align-items:center;padding:16px 24px;border-top:1px solid var(--dv-border2);background:var(--dv-white);}
.dvp__pag-info{font-size:12.5px;color:var(--dv-muted);font-weight:500;}
.dvp__pag-info span{font-weight:700;color:var(--dv-text);}
.dvp__pag-btns{display:flex;gap:6px;}
.dvp-pb{width:36px;height:36px;border-radius:10px;border:1.5px solid var(--dv-border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;color:var(--dv-sub);font-weight:600;font-size:13px;font-family:'Plus Jakarta Sans',sans-serif;}
.dvp-pb:hover:not(:disabled){border-color:var(--dv-gold);color:var(--dv-gold-d);background:var(--dv-gold-dim);}
.dvp-pb.active{background:var(--dv-navy);border-color:var(--dv-navy);color:var(--dv-gold);box-shadow:0 2px 8px rgba(15,30,53,.2);}
.dvp-pb:disabled{opacity:.35;cursor:not-allowed;}

/* ERROR */
.dvp__err{display:flex;align-items:center;gap:12px;padding:13px 18px;background:var(--dv-red-d);border:1px solid rgba(220,38,38,.2);border-radius:12px;margin-bottom:20px;}

/* LOADING */
.dvp__spin{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;gap:16px;color:var(--dv-muted);}
.dvp__ring{width:42px;height:42px;border:3px solid var(--dv-border);border-top-color:var(--dv-gold);border-radius:50%;animation:dvpSpin .8s linear infinite;}
@keyframes dvpSpin{to{transform:rotate(360deg);}}

/* EMPTY */
.dvp__empty{padding:60px 24px;text-align:center;}
.dvp__empty-icon{font-size:40px;margin-bottom:12px;opacity:.2;}
.dvp__empty-text{font-size:13.5px;color:var(--dv-muted);}

/* MODAL */
.dvp-overlay{position:fixed;inset:0;background:rgba(15,30,53,.55);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(4px);animation:dvpFadeOv .2s ease;}
@keyframes dvpFadeOv{from{opacity:0;}to{opacity:1;}}
.dvp-modal{background:var(--dv-white);border-radius:18px;width:560px;max-height:92vh;overflow-y:auto;box-shadow:0 20px 60px rgba(15,30,53,.25);font-family:'Plus Jakarta Sans',sans-serif;animation:dvpSlide .25s ease;}
@keyframes dvpSlide{from{opacity:0;transform:translateY(16px) scale(.98);}to{opacity:1;transform:translateY(0) scale(1);}}
.dvp-modal::-webkit-scrollbar{width:4px;}
.dvp-modal::-webkit-scrollbar-thumb{background:var(--dv-border);border-radius:2px;}
.dvp-modal__head{padding:20px 24px;border-bottom:1px solid var(--dv-border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--dv-white);z-index:2;}
.dvp-modal__title{font-size:16px;font-weight:800;letter-spacing:-.02em;color:var(--dv-navy);}
.dvp-modal__close{width:30px;height:30px;border-radius:7px;border:1px solid var(--dv-border);background:transparent;cursor:pointer;font-size:16px;color:var(--dv-sub);display:flex;align-items:center;justify-content:center;transition:all .15s;}
.dvp-modal__close:hover{border-color:var(--dv-red);color:var(--dv-red);}
.dvp-modal__body{padding:22px 24px;}
.dvp-modal__footer{padding:14px 24px;border-top:1px solid var(--dv-border);display:flex;justify-content:flex-end;gap:10px;position:sticky;bottom:0;background:var(--dv-white);}

/* FORM */
.dvp-sec{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:var(--dv-muted);font-weight:500;margin:0 0 14px;padding-bottom:8px;border-bottom:1px solid var(--dv-border);}
.dvp-grp{margin-bottom:14px;display:flex;flex-direction:column;gap:6px;}
.dvp-lbl{font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--dv-sub);font-weight:500;}
.dvp-inp{width:100%;padding:10px 14px;border:1.5px solid var(--dv-border);border-radius:9px;background:var(--dv-cream2);font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;color:var(--dv-text);outline:none;box-sizing:border-box;transition:all .2s;}
.dvp-inp:focus{border-color:var(--dv-gold);background:var(--dv-white);box-shadow:0 0 0 3px var(--dv-gold-dim);}
.dvp-inp::placeholder{color:var(--dv-muted);}
.dvp-dropzone{height:160px;border-radius:12px;border:2px dashed;display:flex;align-items:center;justify-content:center;cursor:pointer;transition:all .2s;position:relative;overflow:hidden;}
.dvp-remove-img{position:absolute;top:8px;right:8px;width:26px;height:26px;border-radius:6px;background:rgba(220,38,38,.85);color:#fff;border:none;cursor:pointer;font-size:13px;display:flex;align-items:center;justify-content:center;}
.dvp-img-btn{padding:7px 14px;border-radius:8px;border:1px solid var(--dv-border);background:#f7f5f0;font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:var(--dv-sub);cursor:pointer;transition:all .15s;}
.dvp-img-btn:hover{border-color:var(--dv-gold);color:var(--dv-gold-d);}
.dvp-img-btn-d{padding:7px 14px;border-radius:8px;border:1px solid rgba(220,38,38,.3);background:rgba(220,38,38,.06);font-family:'Plus Jakarta Sans',sans-serif;font-size:12px;color:var(--dv-red);cursor:pointer;}

/* CONFIRM */
.dvp-confirm{background:var(--dv-white);border-radius:18px;width:420px;padding:32px;box-shadow:0 20px 60px rgba(15,30,53,.2);text-align:center;animation:dvpSlide .2s ease;}
.dvp-confirm__icon{font-size:38px;margin-bottom:14px;}
.dvp-confirm__title{font-size:17px;font-weight:700;margin-bottom:10px;}
.dvp-confirm__text{font-size:13.5px;color:var(--dv-sub);line-height:1.65;margin-bottom:24px;}
.dvp-confirm__acts{display:flex;gap:10px;justify-content:center;}
.dvp-btn-d{display:inline-flex;align-items:center;gap:6px;padding:9px 20px;border-radius:9px;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:700;cursor:pointer;transition:all .2s;background:transparent;color:var(--dv-red);border:1.5px solid rgba(220,38,38,.3);}
.dvp-btn-d:hover{background:var(--dv-red);color:#fff;}

@keyframes dvpCardIn{from{opacity:0;transform:translateY(16px) scale(.97);}to{opacity:1;transform:translateY(0) scale(1);}}
@media(max-width:1024px){.dvp{padding:20px;}.dvp__stats{grid-template-columns:1fr;}}
@media(max-width:768px){.dvp__grid{grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:14px;}}
`;

const PAGE_SIZE = 9;
const EMPTY = { designation: '', reference: '', quantiteStock: 0, imageUrl: null };

/* ── Icons ── */
const IcLock    = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const IcRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IcPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcSearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
const IcChevL   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>;
const IcChevR   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>;
const IcArrow   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>;
const IcStack   = () => <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="6" width="18" height="12" rx="2"/><path d="M7 10h2M7 14h2"/></svg>;
const IcBox     = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>;
const IcPkg     = () => <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5M2 12l10 5 10-5"/></svg>;
const IcClose   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IcTrash   = () => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4h6v3"/></svg>;

/* ── Form Modal ── */
function FormModal({ dispositif, onClose, onSave }) {
  const fileRef = useRef(null);
  const isEdit  = Boolean(dispositif);
  const [form, setForm]         = useState(dispositif ? { ...EMPTY, ...dispositif } : { ...EMPTY });
  const [preview, setPreview]   = useState(dispositif?.imageUrl || null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving]     = useState(false);
  const [err, setErr]           = useState('');

  const readFile = (file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const r = new FileReader();
    r.onload = e => { setPreview(e.target.result); setForm(f => ({ ...f, imageUrl: e.target.result })); };
    r.readAsDataURL(file);
  };

  const removeImg = () => {
    setPreview(null); setForm(f => ({ ...f, imageUrl: null }));
    if (fileRef.current) fileRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true); setErr('');
    try { await onSave(form); }
    catch { setErr('Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="dvp-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="dvp-modal" onClick={e => e.stopPropagation()}>
        <div className="dvp-modal__head">
          <span className="dvp-modal__title">{isEdit ? 'Modifier le dispositif' : 'Nouveau dispositif'}</span>
          <button className="dvp-modal__close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="dvp-modal__body">
            {err && <div style={{ background:'rgba(220,38,38,.08)',border:'1px solid rgba(220,38,38,.2)',borderRadius:9,padding:'9px 14px',color:'#dc2626',fontSize:12.5,marginBottom:14 }}>⚠ {err}</div>}

            {/* IMAGE */}
            <div className="dvp-sec">Photo du dispositif</div>
            <div style={{ marginBottom:20 }}>
              <div
                className="dvp-dropzone"
                style={{ borderColor: dragOver ? '#c9a84c' : preview ? '#c9a84c' : '#e4dfd6', background: dragOver ? 'rgba(201,168,76,.06)' : preview ? '#fff' : '#f7f5f0' }}
                onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={e => { e.preventDefault(); setDragOver(false); readFile(e.dataTransfer.files[0]); }}
                onClick={() => !preview && fileRef.current?.click()}
              >
                {preview ? (
                  <>
                    <img src={preview} alt="Aperçu" style={{ width:'100%',height:'100%',objectFit:'contain',padding:8 }} />
                    <button type="button" className="dvp-remove-img" onClick={e => { e.stopPropagation(); removeImg(); }}>✕</button>
                  </>
                ) : (
                  <div style={{ textAlign:'center',pointerEvents:'none' }}>
                    <div style={{ fontSize:38,marginBottom:8,opacity:.3 }}>🔒</div>
                    <div style={{ fontSize:14,fontWeight:600,color:'#5a6a7e',marginBottom:4 }}>{dragOver ? "Déposez l'image ici" : 'Glissez une image ici'}</div>
                    <div style={{ fontSize:12,color:'#94a3b8' }}>ou cliquez pour parcourir</div>
                  </div>
                )}
              </div>
              <div style={{ display:'flex',gap:8,marginTop:10 }}>
                <button type="button" className="dvp-img-btn" onClick={() => fileRef.current?.click()}>📁 {preview ? 'Changer' : 'Choisir une image'}</button>
                {preview && <button type="button" className="dvp-img-btn-d" onClick={removeImg}>🗑 Supprimer</button>}
              </div>
              <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={e => readFile(e.target.files[0])} />
            </div>

            {/* INFOS */}
            <div className="dvp-sec">Informations générales</div>
            <div className="dvp-grp">
              <label className="dvp-lbl">Désignation *</label>
              <input className="dvp-inp" placeholder="Ex : Cadenas de consignation rouge 40mm" value={form.designation} onChange={e => setForm(f => ({...f, designation: e.target.value}))} required />
            </div>
            <div className="dvp-grp">
              <label className="dvp-lbl">Nombre en stock</label>
              <input className="dvp-inp" type="number" min="0" placeholder="0" value={form.quantiteStock??0} onChange={e => setForm(f => ({...f, quantiteStock: parseInt(e.target.value)||0}))} />
            </div>
          </div>
          <div className="dvp-modal__footer">
            <button type="button" className="dvp-btn-g" onClick={onClose}>Annuler</button>
            <button type="submit" className="dvp-btn-p" disabled={saving}>{saving ? 'Sauvegarde…' : isEdit ? 'Enregistrer' : 'Créer le dispositif'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Confirm Modal ── */
function ConfirmModal({ disp, onConfirm, onCancel }) {
  return (
    <div className="dvp-overlay">
      <div className="dvp-confirm">
        <div className="dvp-confirm__icon">🗑️</div>
        <div className="dvp-confirm__title">Supprimer ce dispositif ?</div>
        <div className="dvp-confirm__text">Vous allez supprimer <strong>« {disp.designation} »</strong>. Cette action est irréversible.</div>
        <div className="dvp-confirm__acts">
          <button className="dvp-btn-g" onClick={onCancel}>Annuler</button>
          <button className="dvp-btn-d" onClick={onConfirm}>Supprimer définitivement</button>
        </div>
      </div>
    </div>
  );
}

/* ── Main page ── */
export default function DispositifsAdminPage() {
  const [dispositifs, setDispositifs] = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [err,         setErr]         = useState('');
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [showForm,    setShowForm]    = useState(false);
  const [editDisp,    setEditDisp]    = useState(null);
  const [confirm,     setConfirm]     = useState(null);

  const load = () => {
    setLoading(true); setErr('');
    dispositifService.findAll()
      .then(setDispositifs)
      .catch(() => setErr('Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const total = dispositifs.length;
  const totalStock = dispositifs.reduce((s, d) => s + (d.quantiteStock ?? 0), 0);

  const filtered = useMemo(() =>
    dispositifs.filter(d =>
      `${d.designation||''} ${d.reference||''}`.toLowerCase().includes(search.toLowerCase())
    ), [dispositifs, search]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const openCreate = () => { setEditDisp(null); setShowForm(true); };
  const openEdit   = d  => { setEditDisp(d);    setShowForm(true); };

  const handleSave = async (form) => {
    const payload = { designation: form.designation.trim(), reference: form.reference?.trim()||null, quantiteStock: form.quantiteStock??0, imageUrl: form.imageUrl||null };
    const saved = editDisp ? await dispositifService.update(editDisp.id, payload) : await dispositifService.create(payload);
    setDispositifs(prev => editDisp ? prev.map(d => d.id===saved.id ? saved : d) : [...prev, saved]);
    setShowForm(false); setEditDisp(null);
  };

  const doDelete = async () => {
    const d = confirm; setConfirm(null);
    try { await dispositifService.delete(d.id); setDispositifs(prev => prev.filter(x => x.id !== d.id)); }
    catch { setErr('Erreur lors de la suppression.'); }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="dvp">

        {/* HEADER */}
        <div className="dvp__hdr">
          <div className="dvp__hdr-l">
            <div className="dvp__icon"><IcLock /></div>
            <div>
              <div className="dvp__eyebrow">Gestion du matériel</div>
              <div className="dvp__title">Dispositifs d'isolation</div>
              <div className="dvp__sub">{loading ? 'Chargement…' : `${total} dispositif${total>1?'s':''} · ${totalStock} en stock`}</div>
            </div>
          </div>
          <div className="dvp__hdr-acts">
            <button className="dvp-btn-g" onClick={load}><IcRefresh /><span>Actualiser</span></button>
            <button className="dvp-btn-p" onClick={openCreate}><IcPlus /><span>Nouveau dispositif</span></button>
          </div>
        </div>

        {/* ERROR */}
        {err && (
          <div className="dvp__err">
            <span style={{ flex:1,fontSize:13,color:'#dc2626' }}>⚠ {err}</span>
            <button style={{ background:'none',border:'none',cursor:'pointer',color:'#dc2626' }} onClick={() => setErr('')}><IcClose /></button>
          </div>
        )}

        {/* STATS */}
        {!loading && (
          <div className="dvp__stats">
            <div className="dvp__stat dvp__stat--total">
              <div className="dvp__stat-icon"><IcStack /></div>
              <div>
                <div className="dvp__stat-lbl">Références totales</div>
                <div className="dvp__stat-val">{total}</div>
                <div className="dvp__stat-trend" style={{ color:'#059669' }}>↑ Inventaire à jour</div>
              </div>
            </div>
            <div className="dvp__stat dvp__stat--qty">
              <div className="dvp__stat-icon">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#c9a84c" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <div>
                <div className="dvp__stat-lbl">Total en stock</div>
                <div className="dvp__stat-val">{totalStock}</div>
                <div className="dvp__stat-trend" style={{ color:'#d97706' }}>→ Unités disponibles</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="dvp__spin"><div className="dvp__ring" /><span>Chargement des dispositifs…</span></div>
        ) : (
          <>
            {/* TOOLBAR */}
            <div className="dvp__toolbar">
              <div className="dvp__sw">
                <span className="dvp__si"><IcSearch /></span>
                <input className="dvp__search" placeholder="Rechercher un dispositif…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
              </div>
              <div className="dvp__results"><span>{filtered.length}</span> résultat{filtered.length>1?'s':''}</div>
            </div>

            {/* GRID */}
            <div className="dvp__content">
              {filtered.length === 0 ? (
                <div className="dvp__empty">
                  <div className="dvp__empty-icon">📦</div>
                  <div className="dvp__empty-text">{search ? `Aucun résultat pour « ${search} »` : 'Aucun dispositif disponible'}</div>
                </div>
              ) : (
                <div className="dvp__grid">
                  {paginated.map((d, i) => (
                    <div key={d.id} className="disp-card" style={{ animationDelay:`${i*.06}s`, animation:'dvpCardIn .4s ease both' }} onClick={() => openEdit(d)}>
                      <div className="disp-card__ribbon">Modifier</div>

                      {/* Image */}
                      <div className="disp-card__image">
                        <div className="disp-card__image-overlay" />
                        {d.imageUrl ? (
                          <img src={d.imageUrl} alt={d.designation} />
                        ) : (
                          <div className="disp-card__image-placeholder">
                            <IcPkg />
                            <span>Aucune image</span>
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="disp-card__content">
                        <div className="disp-card__category">Dispositif de consignation</div>
                        <div className="disp-card__name">{d.designation}</div>
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                          <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'3px 10px', borderRadius:20, fontSize:11, fontWeight:700, background: (d.quantiteStock??0) > 0 ? 'rgba(5,150,105,.1)' : 'rgba(220,38,38,.08)', color: (d.quantiteStock??0) > 0 ? '#059669' : '#dc2626', border: `1px solid ${(d.quantiteStock??0) > 0 ? 'rgba(5,150,105,.2)' : 'rgba(220,38,38,.18)'}` }}>
                            <IcBox />
                            {d.quantiteStock??0} en stock
                          </span>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="disp-card__footer">
                        <button
                          style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'5px 12px',borderRadius:50,background:'rgba(220,38,38,.08)',border:'1px solid rgba(220,38,38,.2)',color:'#dc2626',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all .2s' }}
                          onClick={e => { e.stopPropagation(); setConfirm(d); }}
                          onMouseEnter={e => e.currentTarget.style.background='#dc2626'}
                          onMouseLeave={e => e.currentTarget.style.background='rgba(220,38,38,.08)'}
                        >
                          <IcTrash />
                        </button>
                        <button className="disp-card__cta" onClick={e => { e.stopPropagation(); openEdit(d); }}>
                          <IcArrow />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* PAGINATION */}
              {pageCount > 1 && (
                <div className="dvp__pag">
                  <div className="dvp__pag-info"><span>{(page-1)*PAGE_SIZE+1}</span> à <span>{Math.min(page*PAGE_SIZE,filtered.length)}</span> sur <span>{filtered.length}</span></div>
                  <div className="dvp__pag-btns">
                    <button className="dvp-pb" disabled={page===1} onClick={() => setPage(p=>p-1)}><IcChevL /></button>
                    {Array.from({length:Math.min(pageCount,5)},(_,i)=>{
                      let n = pageCount<=5?i+1:page<=3?i+1:page>=pageCount-2?pageCount-4+i:page-2+i;
                      return <button key={n} className={`dvp-pb${n===page?' active':''}`} onClick={()=>setPage(n)}>{n}</button>;
                    })}
                    <button className="dvp-pb" disabled={page===pageCount} onClick={()=>setPage(p=>p+1)}><IcChevR /></button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {showForm && <FormModal dispositif={editDisp} onClose={() => { setShowForm(false); setEditDisp(null); }} onSave={handleSave} />}
        {confirm  && <ConfirmModal disp={confirm} onConfirm={doDelete} onCancel={() => setConfirm(null)} />}
      </div>
    </>
  );
}
