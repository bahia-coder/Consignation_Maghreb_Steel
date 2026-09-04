import React, { useEffect, useState, useMemo } from 'react';
import { utilisateurService, zoneService, messagerie } from '../services/api';

/* ══════════════════════════════════════════
   CSS PFE USERS STYLE
══════════════════════════════════════════ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
*, *::before, *::after { box-sizing:border-box; margin:0; padding:0; }
:root {
  --u-navy:#0f1e35; --u-navy2:#162844; --u-gold:#c9a84c;
  --u-gold-dim:rgba(201,168,76,.12); --u-gold-bdr:rgba(201,168,76,.3);
  --u-cream:#f7f5f0; --u-cream2:#f0ece3; --u-white:#ffffff;
  --u-text:#0f1e35; --u-sub:#5a6a7e; --u-muted:#94a3b8; --u-border:#e2ddd4;
  --u-green:#10b981; --u-green-d:rgba(16,185,129,.1);
  --u-red:#ef4444; --u-red-d:rgba(239,68,68,.1);
  --u-blue:#3b82f6; --u-blue-d:rgba(59,130,246,.1);
  --u-purple:#7c3aed; --u-purple-d:rgba(124,58,237,.1);
  --u-sh-md:0 4px 6px -1px rgba(0,0,0,.1);
}
.up { font-family:'Plus Jakarta Sans',sans-serif; color:var(--u-text); padding:24px 32px; }
.up__header { display:flex; justify-content:space-between; align-items:center; margin-bottom:28px; flex-wrap:wrap; gap:16px; }
.up__header-l { display:flex; align-items:center; gap:16px; }
.up__icon { width:52px;height:52px;background:linear-gradient(135deg,#0f1e35,#1a3260);border-radius:16px;display:flex;align-items:center;justify-content:center;color:var(--u-gold);box-shadow:0 4px 16px rgba(15,30,53,.25);flex-shrink:0; }
.up__title { font-size:22px;font-weight:800;letter-spacing:-.03em; }
.up__sub   { font-size:13px;color:var(--u-muted);margin-top:4px; }
.up__actions { display:flex;gap:12px; }
.up__stats { display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:28px; }
.up__stat { background:var(--u-white);border:1.5px solid var(--u-border);border-radius:16px;padding:18px 20px;display:flex;align-items:center;gap:16px;transition:all .2s; }
.up__stat:hover { border-color:var(--u-gold);transform:translateY(-2px);box-shadow:var(--u-sh-md); }
.up__stat-icon { width:44px;height:44px;border-radius:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.up__stat-lbl  { font-size:10.5px;color:var(--u-muted);text-transform:uppercase;letter-spacing:.07em;font-weight:700;margin-bottom:5px; }
.up__stat-val  { font-size:28px;font-weight:800;letter-spacing:-.03em;font-family:'JetBrains Mono',monospace;line-height:1; }
.up-btn-primary,.up-btn-ghost { display:inline-flex;align-items:center;gap:8px;padding:10px 20px;border-radius:10px;font-family:'Plus Jakarta Sans',sans-serif;font-size:13px;font-weight:600;cursor:pointer;transition:all .2s; }
.up-btn-primary { background:var(--u-navy);color:#fff;border:none; }
.up-btn-primary:hover { background:var(--u-navy2);transform:translateY(-1px);box-shadow:var(--u-sh-md); }
.up-btn-ghost { background:transparent;color:var(--u-sub);border:1.5px solid var(--u-border); }
.up-btn-ghost:hover { border-color:var(--u-gold);color:var(--u-text);background:var(--u-gold-dim); }
.up-btn-danger { display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:8px;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:all .2s;background:transparent;color:var(--u-red);border:1px solid rgba(239,68,68,.3); }
.up-btn-danger:hover { background:var(--u-red);color:#fff;border-color:var(--u-red); }
.up-btn-icon { width:32px;height:32px;border-radius:8px;border:1px solid var(--u-border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s; }
.up-btn-icon:hover { border-color:var(--u-gold);background:var(--u-gold-dim); }
.up__toolbar { display:flex;gap:12px;margin-bottom:20px;flex-wrap:wrap;align-items:center; }
.up__sw { flex:1;position:relative;min-width:240px; }
.up__si { position:absolute;left:12px;top:50%;transform:translateY(-50%);color:var(--u-muted); }
.up__search { width:100%;padding:10px 12px 10px 38px;border:1.5px solid var(--u-border);border-radius:10px;font-family:inherit;font-size:13px;background:var(--u-white);transition:all .2s;outline:none; }
.up__search:focus { border-color:var(--u-gold);box-shadow:0 0 0 3px var(--u-gold-dim); }
.up__filter { padding:9px 14px;border:1.5px solid var(--u-border);border-radius:10px;font-family:inherit;font-size:13px;background:var(--u-white);cursor:pointer;outline:none; }
.up__filter:focus { border-color:var(--u-gold); }
.up__results { font-size:12px;color:var(--u-muted);padding:0 8px; }
.up__results span { font-weight:700;color:var(--u-text); }
.up__layout { display:grid;gap:20px; }
.up__layout.has-detail { grid-template-columns:1fr 360px; }
.up__table-wrap { background:var(--u-white);border:1.5px solid var(--u-border);border-radius:16px;overflow:hidden; }
.up__table { width:100%;border-collapse:collapse; }
.up__table th { padding:11px 18px;text-align:left;font-size:10px;font-family:'JetBrains Mono',monospace;letter-spacing:.09em;color:var(--u-muted);background:var(--u-cream);border-bottom:1px solid var(--u-border);font-weight:500;text-transform:uppercase; }
.up__table td { padding:13px 18px;font-size:13px;border-bottom:1px solid var(--u-border);color:var(--u-text);vertical-align:middle; }
.up__table tr:last-child td { border-bottom:none; }
.up__table tbody tr:hover td { background:#faf9f5;cursor:pointer; }
.up-av { width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:800;flex-shrink:0; }
.up-av--gold   { background:var(--u-gold-dim);border:1.5px solid var(--u-gold-bdr);color:var(--u-gold); }
.up-av--blue   { background:var(--u-blue-d);border:1.5px solid rgba(59,130,246,.25);color:var(--u-blue); }
.up-av--green  { background:var(--u-green-d);border:1.5px solid rgba(16,185,129,.25);color:var(--u-green); }
.up-av--purple { background:var(--u-purple-d);border:1.5px solid rgba(124,58,237,.25);color:var(--u-purple); }
.up-role { display:inline-flex;align-items:center;gap:5px;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:600; }
.up-role--admin   { background:var(--u-gold-dim);color:var(--u-gold);border:1px solid var(--u-gold-bdr); }
.up-role--manager { background:var(--u-blue-d);color:var(--u-blue);border:1px solid rgba(59,130,246,.2); }
.up-role--charge  { background:var(--u-green-d);color:var(--u-green);border:1px solid rgba(16,185,129,.2); }
.up-role--charge-travaux { background:rgba(20,184,166,.1);color:#0d9488;border:1px solid rgba(20,184,166,.2); }
.up-av--teal { background:rgba(20,184,166,.1);border:1.5px solid rgba(20,184,166,.25);color:#0d9488; }
.up-detail { background:var(--u-white);border:1.5px solid var(--u-border);border-radius:16px;overflow:hidden;animation:upSlide .22s ease both; }
@keyframes upSlide { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:translateY(0);} }
.up-detail__head { padding:20px 22px;border-bottom:1px solid var(--u-border);display:flex;align-items:center;gap:14px; }
.up-detail__name { font-size:17px;font-weight:800;letter-spacing:-.02em; }
.up-detail__mat  { font-size:11.5px;color:var(--u-gold);margin-top:2px;font-family:'JetBrains Mono',monospace; }
.up-detail__body { padding:18px 22px; }
.up-detail__row  { display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--u-border); }
.up-detail__row:last-child { border-bottom:none; }
.up-detail__key { font-size:11.5px;color:var(--u-muted); }
.up-detail__val { font-size:13px;font-weight:600; }
.up-detail__acts { padding:14px 22px;border-top:1px solid var(--u-border);display:flex;gap:10px;flex-wrap:wrap; }
.up-overlay { position:fixed;inset:0;background:rgba(15,30,53,.5);display:flex;align-items:center;justify-content:center;z-index:1000;animation:upFadeOv .2s ease; }
@keyframes upFadeOv { from{opacity:0;}to{opacity:1;} }
.up-modal { background:var(--u-white);border-radius:16px;width:540px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(15,30,53,.2);animation:upSlide .25s ease; }
.up-modal__head { padding:20px 24px;border-bottom:1px solid var(--u-border);display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--u-white);z-index:2; }
.up-modal__title { font-size:16px;font-weight:800;letter-spacing:-.02em; }
.up-modal__close { width:32px;height:32px;border-radius:8px;border:1px solid var(--u-border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:15px;color:var(--u-sub);transition:all .15s; }
.up-modal__close:hover { border-color:var(--u-red);color:var(--u-red); }
.up-modal__body { padding:24px; }
.up-modal__footer { padding:16px 24px;border-top:1px solid var(--u-border);display:flex;justify-content:flex-end;gap:10px; }
.up-row2 { display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:14px; }
.up-grp  { display:flex;flex-direction:column;gap:6px;margin-bottom:14px; }
.up-lbl  { font-size:11px;letter-spacing:.08em;text-transform:uppercase;color:var(--u-sub);font-weight:600; }
.up-inp,.up-sel { padding:10px 14px;border:1.5px solid var(--u-border);border-radius:10px;background:var(--u-cream2);font-family:inherit;font-size:13px;color:var(--u-text);outline:none;transition:all .2s; }
.up-inp:focus,.up-sel:focus { border-color:var(--u-gold);background:var(--u-white);box-shadow:0 0 0 3px rgba(201,168,76,.08); }
.up-inp::placeholder { color:var(--u-muted); }
.up-inp:disabled,.up-sel:disabled { opacity:.5;cursor:not-allowed; }
.up-confirm { background:var(--u-white);border-radius:14px;width:400px;padding:28px;box-shadow:0 20px 60px rgba(15,30,53,.2);text-align:center;animation:upSlide .2s ease; }
.up-confirm__icon  { font-size:36px;margin-bottom:14px; }
.up-confirm__title { font-size:17px;font-weight:700;margin-bottom:10px; }
.up-confirm__text  { font-size:13.5px;color:var(--u-sub);line-height:1.65;margin-bottom:24px; }
.up-confirm__acts  { display:flex;gap:10px;justify-content:center; }
.up__page { display:flex;justify-content:space-between;align-items:center;padding:14px 20px;border-top:1px solid var(--u-border); }
.up__page-info { font-size:12.5px;color:var(--u-muted); }
.up__page-info span { font-weight:700;color:var(--u-text); }
.up__page-btns { display:flex;gap:6px; }
.up-pbtn { width:34px;height:34px;border-radius:8px;border:1px solid var(--u-border);background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:12px;color:var(--u-sub);transition:all .15s;font-family:inherit; }
.up-pbtn:hover:not(:disabled) { border-color:var(--u-gold);background:var(--u-gold-dim); }
.up-pbtn.active { background:var(--u-navy);border-color:var(--u-navy);color:#fff; }
.up-pbtn:disabled { opacity:.4;cursor:not-allowed; }
.up__spin { display:flex;flex-direction:column;align-items:center;justify-content:center;padding:60px 24px;gap:16px;color:var(--u-muted); }
.up__ring { width:40px;height:40px;border:3px solid var(--u-border);border-top-color:var(--u-gold);border-radius:50%;animation:upSpin .8s linear infinite; }
@keyframes upSpin { to{transform:rotate(360deg);} }
@media (max-width:1024px) { .up { padding:20px; } .up__stats { grid-template-columns:repeat(2,1fr); } .up__layout.has-detail { grid-template-columns:1fr; } }
@media (max-width:768px)  { .up__stats { grid-template-columns:1fr; } .up__header { flex-direction:column; } .up-row2 { grid-template-columns:1fr; } }
`;

const ROLES = ['ADMIN', 'MANAGER', 'CHARGE', 'CHARGE_TRAVAUX'];
const ROLE_CFG = {
  ADMIN:   { label:'Administrateur',        cls:'up-role--admin',   avCls:'up-av--gold',   icon:'🛡' },
  MANAGER: { label:'Manager de zone',       cls:'up-role--manager', avCls:'up-av--blue',   icon:'👔' },
  CHARGE:         { label:'Chargé de Consignation', cls:'up-role--charge',        avCls:'up-av--green',    icon:'⚙' },
  CHARGE_TRAVAUX: { label:'Chargé des Travaux',     cls:'up-role--charge-travaux', avCls:'up-av--teal',     icon:'🔧' },
};
const PAGE_SIZE = 10;
const EMPTY = { matricule:'', username:'', password:'', nom:'', prenom:'', role:'CHARGE', zoneId:'' };

function initials(u) { return ((u.prenom?.[0]||'')+(u.nom?.[0]||'')).toUpperCase()||'??'; }

const IcUsers   = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
const IcRefresh = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>;
const IcPlus    = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M12 5v14M5 12h14"/></svg>;
const IcSearch  = () => <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>;
const IcEdit    = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3l4 4-7 7H10v-4l7-7zM4 20h16"/></svg>;
const IcTrash   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M10 11v6M14 11v6M5 7l1 13a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-13M9 7V4h6v3"/></svg>;
const IcClose   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M18 6L6 18M6 6l12 12"/></svg>;
const IcChevL   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>;
const IcChevR   = () => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>;
const IcShield  = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2L3 7l9 5 9-5-9-5z"/><path d="M3 17l9 5 9-5M3 12l9 5 9-5"/></svg>;
const IcCharge  = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M20 7h-4.5M20 12h-4.5M20 17h-4.5M5 7h1.5M5 12h1.5M5 17h1.5"/><rect x="9" y="5" width="6" height="14" rx="1"/></svg>;
const IcManager = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;

export default function UtilisateursPage() {
  const [users,    setUsers]    = useState([]);
  const [zones,    setZones]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [err,      setErr]      = useState('');
  const [search,   setSearch]   = useState('');
  const [filterR,  setFilterR]  = useState('all');
  const [page,     setPage]     = useState(1);
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [form,     setForm]     = useState(EMPTY);
  const [saving,   setSaving]   = useState(false);
  const [formErr,  setFormErr]  = useState('');
  const [confirm,  setConfirm]  = useState(null);

  const load = () => {
    setLoading(true); setErr('');
    Promise.all([utilisateurService.findAll(), zoneService.findAll()])
      .then(([u, z]) => { setUsers(u); setZones(z); })
      .catch(() => setErr('Erreur de chargement'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const total    = users.length;
  const admins         = users.filter(u => u.role === 'ADMIN').length;
  const managers       = users.filter(u => u.role === 'MANAGER').length;
  const charges        = users.filter(u => u.role === 'CHARGE').length;
  const chargesTravaux = users.filter(u => u.role === 'CHARGE_TRAVAUX').length;

  // Zones ayant déjà un manager — une zone ne peut en avoir qu'un seul.
  const managedZoneIds = useMemo(() => new Set(
    users.filter(u => u.role === 'MANAGER' && u.zoneId != null).map(u => u.zoneId)
  ), [users]);

  // Quand le rôle sélectionné est Manager, ne proposer que les zones sans manager —
  // en gardant la zone actuelle de l'utilisateur en cours d'édition s'il en est déjà le manager.
  const zonesForSelect = useMemo(() => {
    if (form.role !== 'MANAGER') return zones;
    return zones.filter(z =>
      !managedZoneIds.has(z.id) || (editUser?.role === 'MANAGER' && editUser.zoneId === z.id)
    );
  }, [zones, form.role, managedZoneIds, editUser]);

  const filtered = useMemo(() => users.filter(u => {
    const q = `${u.prenom||''} ${u.nom||''} ${u.matricule||''} ${u.username||''}`.toLowerCase();
    return q.includes(search.toLowerCase()) && (filterR === 'all' || u.role === filterR);
  }), [users, search, filterR]);

  const pageCount = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page-1)*PAGE_SIZE, page*PAGE_SIZE);

  const openCreate = () => { setForm(EMPTY); setEditUser(null); setFormErr(''); setShowForm(true); };
  const openEdit   = u  => {
    setForm({ matricule:u.matricule||'', username:u.username||'', password:'', nom:u.nom||'', prenom:u.prenom||'', role:u.role||'CHARGE', zoneId:u.zoneId||'' });
    setEditUser(u); setFormErr(''); setShowForm(true);
  };

  const handleSave = async e => {
    e.preventDefault(); setSaving(true); setFormErr('');
    try {
      const payload = { ...form, zoneId: form.zoneId ? Number(form.zoneId) : null };
      const saved = editUser
        ? await utilisateurService.update(editUser.id, payload)
        : await utilisateurService.create(payload);

      setUsers(prev => editUser ? prev.map(u => u.id === saved.id ? saved : u) : [...prev, saved]);
      if (selected?.id === saved.id) setSelected(saved);

      // ── Créer les conversations à la création d'un nouvel utilisateur ──
      if (!editUser && saved.zoneId) {
        const allUsers   = await utilisateurService.findAll();
        const zone       = zones.find(z => z.id === saved.zoneId);
        const zoneName   = zone?.nom || zone?.code || `Zone ${saved.zoneId}`;
        const zid        = String(saved.zoneId);

        const managersZone = allUsers.filter(u => u.role === 'MANAGER' && String(u.zoneId) === zid);
        const chargesZone  = allUsers.filter(u => u.role === 'CHARGE'  && String(u.zoneId) === zid);

        // Tous les participants du groupe (managers + charges de la zone)
        const groupParticipants = [
          ...new Set([
            ...managersZone.map(m => m.id),
            ...chargesZone.map(c => c.id),
          ])
        ];

        // ── 1. Groupe de zone ──
        const existingGroup = messagerie.getConversations()
          .find(c => c.id === `groupe_zone_${saved.zoneId}`);

        if (existingGroup) {
          // Ajouter le nouvel utilisateur au groupe existant
          const updatedParticipants = [...new Set([...existingGroup.participantIds, saved.id])];
          messagerie.saveConversation({ ...existingGroup, participantIds: updatedParticipants });
        } else {
          // Créer le groupe
          messagerie.ensureConversation({
            id: `groupe_zone_${saved.zoneId}`,
            type: 'GROUPE',
            name: `Équipe ${zoneName}`,
            zoneId: saved.zoneId,
            zoneName,
            participantIds: groupParticipants,
            lastMessage: null,
            updatedAt: new Date(0).toISOString(),
          });
        }

        // ── 2. Conversations privées ──
        if (saved.role === 'CHARGE') {
          // Conv privée avec chaque manager de la zone
          managersZone.forEach(manager => {
            const convId = `prive_${Math.min(manager.id, saved.id)}_${Math.max(manager.id, saved.id)}`;
            messagerie.ensureConversation({
              id: convId,
              type: 'PRIVE',
              participantIds: [manager.id, saved.id],
              participantUsers: [
                { id: manager.id, prenom: manager.prenom, nom: manager.nom, role: manager.role },
                { id: saved.id,   prenom: saved.prenom,   nom: saved.nom,   role: saved.role   },
              ],
              lastMessage: null,
              updatedAt: new Date(0).toISOString(),
            });
          });
        }

        if (saved.role === 'MANAGER') {
          // Conv privée avec chaque charge de la zone
          chargesZone.forEach(charge => {
            const convId = `prive_${Math.min(saved.id, charge.id)}_${Math.max(saved.id, charge.id)}`;
            messagerie.ensureConversation({
              id: convId,
              type: 'PRIVE',
              participantIds: [saved.id, charge.id],
              participantUsers: [
                { id: saved.id,  prenom: saved.prenom,   nom: saved.nom,   role: saved.role  },
                { id: charge.id, prenom: charge.prenom,  nom: charge.nom,  role: charge.role },
              ],
              lastMessage: null,
              updatedAt: new Date(0).toISOString(),
            });
          });
        }
      }

      setShowForm(false); setEditUser(null);
    } catch (e) { setFormErr(e.response?.data?.message || 'Erreur lors de la sauvegarde.'); }
    finally { setSaving(false); }
  };

  const handleDelete = u => setConfirm({ user:u });
  const doDelete = async () => {
    const u = confirm.user; setConfirm(null);
    try {
      await utilisateurService.delete(u.id);
      setUsers(prev => prev.filter(x => x.id !== u.id));
      if (selected?.id === u.id) setSelected(null);
    } catch { setErr('Erreur lors de la suppression.'); }
  };

  return (
    <>
      <style>{CSS}</style>
      <div className="up">

        {/* HEADER */}
        <div className="up__header">
          <div className="up__header-l">
            <div className="up__icon"><IcUsers /></div>
            <div>
              <div className="up__title">Gestion des utilisateurs</div>
              <div className="up__sub">{loading ? 'Chargement…' : `${total} utilisateur${total>1?'s':''} · ConsignApp`}</div>
            </div>
          </div>
          <div className="up__actions">
            <button className="up-btn-ghost" onClick={load}><IcRefresh /><span>Actualiser</span></button>
            <button className="up-btn-primary" onClick={openCreate}><IcPlus /><span>Nouvel utilisateur</span></button>
          </div>
        </div>

        {err && (
          <div style={{ display:'flex',alignItems:'center',gap:12,padding:'12px 16px',background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:10,marginBottom:20 }}>
            <span style={{ flex:1,fontSize:13,color:'#ef4444' }}>⚠ {err}</span>
            <button style={{ background:'none',border:'none',cursor:'pointer',color:'#ef4444' }} onClick={() => setErr('')}><IcClose /></button>
          </div>
        )}

        {loading ? (
          <div className="up__spin"><div className="up__ring" /><span>Chargement des utilisateurs…</span></div>
        ) : (
          <>
            {/* STAT CARDS */}
            <div className="up__stats">
              <div className="up__stat">
                <div className="up__stat-icon" style={{ background:'rgba(15,30,53,.07)' }}><IcUsers /></div>
                <div><div className="up__stat-lbl">Total</div><div className="up__stat-val" style={{ color:'#0f1e35' }}>{total}</div></div>
              </div>
              <div className="up__stat">
                <div className="up__stat-icon" style={{ background:'rgba(201,168,76,.12)' }}><IcShield /></div>
                <div><div className="up__stat-lbl">Administrateurs</div><div className="up__stat-val" style={{ color:'#c9a84c' }}>{admins}</div></div>
              </div>
              <div className="up__stat">
                <div className="up__stat-icon" style={{ background:'rgba(59,130,246,.1)' }}><IcManager /></div>
                <div><div className="up__stat-lbl">Managers</div><div className="up__stat-val" style={{ color:'#3b82f6' }}>{managers}</div></div>
              </div>
              <div className="up__stat">
                <div className="up__stat-icon" style={{ background:'rgba(16,185,129,.1)' }}><IcCharge /></div>
                <div><div className="up__stat-lbl">Ch. Consignation</div><div className="up__stat-val" style={{ color:'#10b981' }}>{charges}</div></div>
              </div>
              <div className="up__stat">
                <div className="up__stat-icon" style={{ background:'rgba(20,184,166,.1)' }}><IcCharge /></div>
                <div><div className="up__stat-lbl">Ch. Travaux</div><div className="up__stat-val" style={{ color:'#0d9488' }}>{chargesTravaux}</div></div>
              </div>
            </div>

            <div className={`up__layout${selected ? ' has-detail' : ''}`}>
              <div>
                {/* TOOLBAR */}
                <div className="up__toolbar">
                  <div className="up__sw">
                    <span className="up__si"><IcSearch /></span>
                    <input className="up__search" placeholder="Rechercher par nom, matricule…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
                  </div>
                  <select className="up__filter" value={filterR} onChange={e => { setFilterR(e.target.value); setPage(1); }}>
                    <option value="all">Tous les rôles</option>
                    {ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r].label}</option>)}
                  </select>
                  <div className="up__results"><span>{filtered.length}</span> résultat{filtered.length>1?'s':''}</div>
                </div>

                {/* TABLE */}
                <div className="up__table-wrap">
                  <table className="up__table">
                    <thead><tr>{['Utilisateur','Matricule','Rôle','Zone','Actions'].map(h => <th key={h}>{h}</th>)}</tr></thead>
                    <tbody>
                      {paginated.length === 0
                        ? <tr><td colSpan={5} style={{ textAlign:'center',padding:'40px',color:'#94a3b8',fontStyle:'italic' }}>Aucun utilisateur trouvé</td></tr>
                        : paginated.map(u => {
                          const rc = ROLE_CFG[u.role] || ROLE_CFG.CHARGE;
                          return (
                            <tr key={u.id} onClick={() => setSelected(u.id === selected?.id ? null : u)}>
                              <td>
                                <div style={{ display:'flex',alignItems:'center',gap:12 }}>
                                  <div className={`up-av ${rc.avCls}`}>{initials(u)}</div>
                                  <div>
                                    <div style={{ fontWeight:700,fontSize:13.5 }}>{u.prenom} {u.nom}</div>
                                    <div style={{ fontSize:11,color:'#94a3b8',marginTop:2 }}>{u.username}</div>
                                  </div>
                                </div>
                              </td>
                              <td style={{ fontFamily:'JetBrains Mono,monospace',fontSize:12,color:'#c9a84c',fontWeight:700 }}>{u.matricule||'—'}</td>
                              <td><span className={`up-role ${rc.cls}`}>{rc.icon} {rc.label}</span></td>
                              <td style={{ fontSize:12.5,color:u.zoneCode?'#0f1e35':'#94a3b8',fontStyle:u.zoneCode?'normal':'italic' }}>
                                {u.zoneCode ? <><strong>{u.zoneCode}</strong> <span style={{ color:'#94a3b8' }}>— {u.zoneNom}</span></> : 'Toutes les zones'}
                              </td>
                              <td>
                                <div style={{ display:'flex',gap:6 }}>
                                  <button className="up-btn-icon" title="Modifier" onClick={e => { e.stopPropagation(); openEdit(u); }}><IcEdit /></button>
                                  <button className="up-btn-icon" title="Supprimer" style={{ borderColor:'rgba(239,68,68,.2)',color:'#ef4444' }} onClick={e => { e.stopPropagation(); handleDelete(u); }}><IcTrash /></button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                  {pageCount > 1 && (
                    <div className="up__page">
                      <div className="up__page-info"><span>{(page-1)*PAGE_SIZE+1}</span> à <span>{Math.min(page*PAGE_SIZE,filtered.length)}</span> sur <span>{filtered.length}</span></div>
                      <div className="up__page-btns">
                        <button className="up-pbtn" disabled={page===1} onClick={() => setPage(p=>p-1)}><IcChevL /></button>
                        {Array.from({length:Math.min(pageCount,5)},(_,i)=>{
                          let n = pageCount<=5?i+1:page<=3?i+1:page>=pageCount-2?pageCount-4+i:page-2+i;
                          return <button key={n} className={`up-pbtn${n===page?' active':''}`} onClick={()=>setPage(n)}>{n}</button>;
                        })}
                        <button className="up-pbtn" disabled={page===pageCount} onClick={()=>setPage(p=>p+1)}><IcChevR /></button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* DETAIL PANEL */}
              {selected && (
                <div className="up-detail">
                  <div className="up-detail__head">
                    <div className={`up-av ${(ROLE_CFG[selected.role]||ROLE_CFG.CHARGE).avCls}`} style={{ width:48,height:48,fontSize:14 }}>{initials(selected)}</div>
                    <div style={{ flex:1 }}>
                      <div className="up-detail__name">{selected.prenom} {selected.nom}</div>
                      <div className="up-detail__mat">{selected.matricule}</div>
                    </div>
                    <button className="up-btn-icon" onClick={() => setSelected(null)}><IcClose /></button>
                  </div>
                  <div className="up-detail__body">
                    {[
                      { k:'Rôle',     v:<span className={`up-role ${(ROLE_CFG[selected.role]||ROLE_CFG.CHARGE).cls}`}>{(ROLE_CFG[selected.role]||ROLE_CFG.CHARGE).label}</span> },
                      { k:'Zone',     v: selected.zoneCode ? `${selected.zoneCode} — ${selected.zoneNom}` : 'Toutes les zones' },
                      { k:'Matricule',v: <span style={{ fontFamily:'monospace',color:'#c9a84c' }}>{selected.matricule||'—'}</span> },
                      { k:'Username', v: selected.username },
                    ].map(row => (
                      <div key={row.k} className="up-detail__row">
                        <span className="up-detail__key">{row.k}</span>
                        <span className="up-detail__val">{row.v}</span>
                      </div>
                    ))}
                  </div>
                  <div className="up-detail__acts">
                    <button className="up-btn-primary" style={{ flex:1,justifyContent:'center' }} onClick={() => openEdit(selected)}><IcEdit /><span>Modifier</span></button>
                    <button className="up-btn-danger" onClick={() => handleDelete(selected)}><IcTrash /><span>Supprimer</span></button>
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {/* FORM MODAL */}
        {showForm && (
          <div className="up-overlay" onClick={() => setShowForm(false)}>
            <div className="up-modal" onClick={e => e.stopPropagation()}>
              <div className="up-modal__head">
                <h2 className="up-modal__title">{editUser ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}</h2>
                <button className="up-modal__close" onClick={() => setShowForm(false)}>✕</button>
              </div>
              <form onSubmit={handleSave}>
                <div className="up-modal__body">
                  {formErr && <div style={{ background:'rgba(239,68,68,.1)',border:'1px solid rgba(239,68,68,.3)',borderRadius:8,padding:'9px 12px',color:'#ef4444',fontSize:12.5,marginBottom:14 }}>⚠ {formErr}</div>}
                  <div className="up-row2">
                    <div className="up-grp"><label className="up-lbl">Prénom</label><input className="up-inp" value={form.prenom} onChange={e=>setForm(f=>({...f,prenom:e.target.value}))} required /></div>
                    <div className="up-grp"><label className="up-lbl">Nom</label><input className="up-inp" value={form.nom} onChange={e=>setForm(f=>({...f,nom:e.target.value}))} required /></div>
                  </div>
                  <div className="up-grp"><label className="up-lbl">Matricule</label><input className="up-inp" placeholder="Ex: MS-CHG-001" value={form.matricule} onChange={e=>setForm(f=>({...f,matricule:e.target.value}))} required /></div>
                  <div className="up-grp"><label className="up-lbl">Nom d'utilisateur</label><input className="up-inp" value={form.username} onChange={e=>setForm(f=>({...f,username:e.target.value}))} disabled={!!editUser} required /></div>
                  <div className="up-grp">
                    <label className="up-lbl">Mot de passe {editUser && <span style={{ fontWeight:400,color:'#94a3b8' }}>(vide = inchangé)</span>}</label>
                    <input type="password" className="up-inp" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} required={!editUser} />
                  </div>
                  <div className="up-row2">
                    <div className="up-grp">
                      <label className="up-lbl">Rôle</label>
                      <select className="up-sel" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value,zoneId:''}))}>
                        {ROLES.map(r => <option key={r} value={r}>{ROLE_CFG[r].label}</option>)}
                      </select>
                    </div>
                    <div className="up-grp">
                      <label className="up-lbl">Zone</label>
                      <select className="up-sel" value={form.zoneId} onChange={e=>setForm(f=>({...f,zoneId:e.target.value}))} disabled={form.role==='ADMIN'} required={form.role!=='ADMIN'}>
                        <option value="">{form.role==='ADMIN'?'Toutes zones':'— Sélectionner —'}</option>
                        {zonesForSelect.map(z => <option key={z.id} value={z.id}>{z.code} — {z.nom}</option>)}
                      </select>
                      {form.role === 'MANAGER' && zonesForSelect.length === 0 && (
                        <span style={{ fontSize:11.5, color:'#ef4444' }}>Toutes les zones ont déjà un manager.</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="up-modal__footer">
                  <button type="button" className="up-btn-ghost" onClick={() => setShowForm(false)}>Annuler</button>
                  <button type="submit" className="up-btn-primary" disabled={saving}>{saving?'Sauvegarde…':editUser?'Enregistrer':'Créer'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* CONFIRM */}
        {confirm && (
          <div className="up-overlay">
            <div className="up-confirm">
              <div className="up-confirm__icon">🗑️</div>
              <div className="up-confirm__title">Supprimer l'utilisateur ?</div>
              <div className="up-confirm__text">Vous allez supprimer le compte de <strong>{confirm.user.prenom} {confirm.user.nom}</strong>. Cette action est irréversible.</div>
              <div className="up-confirm__acts">
                <button className="up-btn-ghost" onClick={() => setConfirm(null)}>Annuler</button>
                <button className="up-btn-danger" onClick={doDelete}>Supprimer définitivement</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
