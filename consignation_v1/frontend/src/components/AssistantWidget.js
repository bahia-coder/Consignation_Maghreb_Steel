/**
 * AssistantWidget.js  —  Assistant IA 100% frontend
 * Onglet DB   : interroge les APIs existantes (dashboardService, planService…)
 * Onglet Guide: base de connaissances embarquée (FAQ ConsignApp)
 * Accès filtré par zone pour CHARGE/MANAGER, illimité pour ADMIN
 */
import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  dashboardService, planService, zoneService,
  utilisateurService, equipementService, dispositifService,
} from '../services/api';
import { useAuth } from '../context/AuthContext';

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */
const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;

const COLORS = ['#c9a84c','#0f1e35','#059669','#2563eb','#e11d48','#7c3aed','#0891b2','#d97706','#10b981','#f59e0b'];

/* ─────────────────────────────────────────
   NORMALISATION (supprime accents, met en minuscule)
───────────────────────────────────────── */
function normalize(str) {
  return str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '') // supprime accents
    .replace(/['']/g, "'");
}

/* ─────────────────────────────────────────
   BASE DE CONNAISSANCES  (Guide)
   keys = mots-clés normalisés (sans accents)
───────────────────────────────────────── */
const GUIDE_KB = [
  {
    keys: ['plan','creer','creation','demande','nouveau plan','etape','etablir','faire un plan','comment plan'],
    answer: `**Créer un plan de consignation — étapes**\n\n1. Allez dans **Équipements** dans le menu latéral\n2. Sélectionnez l'**équipement** concerné dans l'arbre hiérarchique\n3. Cliquez sur **"+ Nouveau plan"** (bouton bleu en haut à droite)\n4. Remplissez la **description de l'intervention**\n5. Confirmez → plan créé avec statut **Brouillon/Demande**\n\n✅ Le plan est transmis automatiquement au Manager pour traitement.\n\n**Rappel des rôles :**\n- Chargé : crée la demande et saisit les énergies\n- Manager : prend en traitement et soumet pour validation\n- Admin/Manager : valide ou rejette le plan`,
  },
  {
    keys: ['energie','energies','saisir energie','dangereuse','point de consignation','ajouter energie','electrique','hydraulique','pneumatique'],
    answer: `**Saisir les énergies dangereuses**\n\n1. Ouvrez le plan concerné (statut **En traitement**)\n2. Allez dans l'onglet **⚡ Énergies**\n3. Cliquez **"+ Ajouter une énergie"**\n4. Pour chaque énergie, précisez :\n   - **Type** (électrique, hydraulique, pneumatique…)\n   - **Dispositif d'isolation** utilisé\n   - **Localisation** du point de consignation\n   - **Mesures de vérification**\n5. Tous les participants doivent **approuver l'ordre** avant soumission\n\n⚠️ Un plan ne peut être soumis que si **tous les participants ont approuvé**.`,
  },
  {
    keys: ['valider','validation','approuver plan','comment valider','qui valide','valide'],
    answer: `**Valider un plan (Manager / Admin)**\n\n1. Ouvrez le plan en statut **"En attente de validation"**\n2. Consultez l'onglet **Informations** et **Énergies**\n3. Cliquez sur **"✍ Valider le plan"**\n4. Saisissez votre **décision** (Validé ou Rejeté) et un **commentaire**\n5. Confirmez\n\n✅ Plan **Validé** → PDF officiel disponible avec cachet\n❌ Plan **Rejeté** → commentaire transmis au Chargé`,
  },
  {
    keys: ['rejete','rejet','plan rejete','corriger','correction','refus','que faire rejete'],
    answer: `**Mon plan a été rejeté — que faire ?**\n\n1. Ouvrez le plan rejeté (statut **Rejeté** ❌)\n2. Lisez le **commentaire du validateur** dans l'onglet Informations\n3. Demandez à l'Admin de **remettre en demande** : bouton "↩ Remettre en demande"\n4. Corrigez les informations et/ou les énergies\n5. Re-soumettez pour validation\n\nℹ️ Tout l'historique des actions est conservé dans l'onglet **Historique**.`,
  },
  {
    keys: ['pdf','telecharger','imprimer','export','document','telechargement'],
    answer: `**Télécharger le PDF d'un plan**\n\n1. Ouvrez le plan\n2. Allez dans l'onglet **📄 Téléchargement PDF**\n3. Cliquez sur **"Télécharger le PDF"**\n\n✅ Plan **validé** → PDF avec cachet officiel et signature\n⚠️ Plan en cours → brouillon sans cachet (non officiel)\n❌ Plan rejeté → PDF avec mention de rejet et commentaire`,
  },
  {
    keys: ['utilisateur','creer utilisateur','ajouter utilisateur','nouveau utilisateur','compte','inscription','enregistrer'],
    answer: `**Créer un utilisateur (Admin uniquement)**\n\n1. Allez dans **Utilisateurs** dans le menu\n2. Cliquez sur **"+ Nouvel utilisateur"**\n3. Remplissez : matricule, nom, prénom\n4. Choisissez le **rôle** : Admin / Manager / Chargé\n5. Assignez une **zone**\n6. Définissez un mot de passe\n7. Validez\n\n✅ La **messagerie** (groupe + conv privée) est créée automatiquement selon la zone.`,
  },
  {
    keys: ['messagerie','message','communication','contacter','groupe','envoyer message','chat'],
    answer: `**Messagerie interne**\n\n• Cliquez sur **"Messagerie"** dans la sidebar (icône bulle)\n• Deux types de conversations :\n  - 👥 **Groupe de zone** : tous les membres de votre zone\n  - 🔒 **Message privé** : Chargé ↔ Manager (1 pour 1)\n\n**Utilisation :**\n- Tapez votre message → **Entrée** pour envoyer\n- Shift+Entrée = nouvelle ligne\n- Bouton 🎤 = message vocal\n- Les messages sont synchronisés en temps réel entre onglets`,
  },
  {
    keys: ['dispositif','cadenas','isolation','materiel','stock','consignation materiel'],
    answer: `**Gérer les dispositifs d'isolation (Admin)**\n\n1. Menu → **Dispositifs**\n2. Cliquez **"+ Nouveau dispositif"**\n3. Renseignez : désignation, photo, **nombre en stock**\n4. Sauvegardez\n\nLes dispositifs sont disponibles pour tous les plans de consignation.\nLe badge de stock (🟢 vert = disponible, 🔴 rouge = rupture) est visible sur chaque carte.`,
  },
  {
    keys: ['historique','action','tracabilite','log','journal','qui a fait'],
    answer: `**Consulter l'historique d'un plan**\n\n1. Ouvrez le plan\n2. Allez dans l'onglet **🕑 Historique**\n\nVous verrez :\n- Demande créée\n- Passage en traitement\n- Énergies ajoutées / modifiées\n- Ordre des énergies modifié\n- Soumission pour validation\n- Validation / Rejet\n\nChaque action est **horodatée** et associée à l'utilisateur responsable.`,
  },
  {
    keys: ['statut','etat','workflow','processus','cycle','etapes du plan','vie du plan','comment fonctionne'],
    answer: `**Cycle de vie d'un plan de consignation**\n\n1. 📝 **Demande** → créé par le Chargé\n2. ⚙️ **En traitement** → Manager prend en charge, Chargé saisit les énergies\n3. ⏳ **En attente de validation** → soumis après approbation de l'ordre par tous\n4. ✅ **Validé** → approuvé, PDF officiel disponible\n5. ❌ **Rejeté** → refusé avec commentaire, corrections nécessaires\n\nSeul un Admin peut remettre un plan en demande après rejet.`,
  },
  {
    keys: ['zone','equipement','hierarchie','arbre','n1','n2','n3','structure','organisation'],
    answer: `**Structure des équipements (hiérarchie)**\n\nLes équipements sont organisés en zones puis en équipements/sous-équipements imbriqués, sur autant de niveaux que nécessaire (N1, N2, N3, N4...) — par exemple :\n- 🔵 **N1** : Ligne principale (ex: Ligne Four à Arc Électrique)\n- 🟢 **N2** : Sous-système (ex: Station de brassage)\n- 🟡 **N3** : Composant (ex: Pompe hydraulique)\n- ⚪ **N4 et +** : sous-composants plus profonds si besoin\n\n**Navigation :**\n- Menu → Équipements\n- Onglets par zone en haut\n- Arbre hiérarchique à gauche → cliquez pour voir les plans`,
  },
  {
    keys: ['role','permission','droit','qui peut','admin','manager','charge','difference'],
    answer: `**Rôles et permissions**\n\n| Rôle | Permissions |\n|------|------------|\n| **Admin** | Tout : utilisateurs, toutes zones, validation, dispositifs |\n| **Manager** | Sa zone : traitement, validation des plans, supervision équipe |\n| **Chargé** | Sa zone : créer plans, saisir énergies, messagerie |\n\n**Résumé :**\n- Admin = accès global\n- Manager = limité à sa zone, valide les plans\n- Chargé = limité à sa zone, ne peut pas valider`,
  },
  {
    keys: ['connexion','login','mot de passe','se connecter','identifiant','matricule','oublier mot de passe'],
    answer: `**Se connecter à ConsignApp**\n\n1. Accédez à l'application\n2. Saisissez votre **matricule**\n3. Saisissez votre **mot de passe**\n4. Cliquez **Connexion**\n\nEn cas de problème :\n- Vérifiez votre matricule (format exact)\n- Contactez votre **Admin** pour réinitialiser le mot de passe\n- L'Admin peut modifier un compte via le menu Utilisateurs`,
  },
  {
    keys: ['approbation','approuver ordre','ordre energie','signature','accord'],
    answer: `**Approbation de l'ordre des énergies**\n\nAvant de soumettre un plan pour validation, **chaque participant** doit approuver l'ordre des énergies :\n\n1. Le Chargé saisit toutes les énergies dans l'onglet **Énergies**\n2. Chaque participant reçoit une notification d'approbation\n3. Chacun clique **"✓ Approuver cet ordre"**\n4. Une fois **tous** les participants approuvés → le Chargé peut soumettre\n\n⚠️ Sans approbation complète, la soumission est bloquée.`,
  },
  {
    keys: ['dashboard','tableau de bord','accueil','vue ensemble','resume'],
    answer: `**Tableau de bord**\n\nLe tableau de bord affiche :\n- 📊 **KPIs** : total plans, validés, en cours, soumis, brouillons, rejetés\n- 🗺️ **Onglets zones** : filtrez par zone géographique\n- 🌳 **Arbre équipements** : naviguez dans la hiérarchie\n- 📋 **Plans** : cartes cliquables avec statut, référence, date\n\n**Accès rapide :**\n- Cliquez sur un KPI pour filtrer les plans\n- Cliquez sur un équipement → plans associés apparaissent à droite`,
  },
];

/* ─── Détection : la question ressemble-t-elle à une question guide ? ─── */
const GUIDE_INDICATORS = ['comment','etape','etapes','faire','utiliser','creer','creation','ajouter',
  'expliquer','expliquer moi','procedure','processus','guide','aide','aide moi',
  'que faire','quoi faire','comment faire','fonctionne','marche'];

function isGuideQuestion(q) {
  const n = normalize(q);
  return GUIDE_INDICATORS.some(k => n.includes(k));
}

function searchGuide(question) {
  const q = normalize(question);
  // Score = nombre de mots-clés correspondants + bonus longueur du mot-clé
  const scored = GUIDE_KB.map(entry => ({
    ...entry,
    score: entry.keys.reduce((s, k) => s + (q.includes(normalize(k)) ? 1 + k.length*0.05 : 0), 0),
  })).filter(e => e.score > 0).sort((a,b) => b.score - a.score);
  if (scored.length === 0) return null;
  return scored[0].answer;
}

/* ─────────────────────────────────────────
   MOTEUR DB  (analyse + appels API)
───────────────────────────────────────── */
async function queryDB(question, user) {
  const q = normalize(question);
  const isAdmin = user?.role === 'ADMIN';
  const zoneId  = user?.zoneId;

  /* ── Statistiques globales / par zone ── */
  if (q.match(/stat|total|combien|nombre|resume|bilan|apercu|vue|dashboard/)) {
    const stats = isAdmin
      ? await dashboardService.getStats()
      : await dashboardService.getStatsByZone(zoneId);

    const total   = stats.totalPlans   || 0;
    const valides = stats.plansValides || 0;
    const rejetes = stats.plansRejetes || 0;
    const attente = stats.plansEnAttenteValidation || 0;
    const traite  = stats.plansEnTraitement || 0;
    const demande = stats.plansDemande || 0;
    const eqs     = stats.totalEquipements || 0;

    const tauxV = total ? Math.round(valides/total*100) : 0;
    const tauxR = total ? Math.round(rejetes/total*100) : 0;

    return {
      answer: `**Bilan${isAdmin ? ' global' : ' de votre zone'}**\n\n• Plans total : **${total}**\n• ✅ Validés : **${valides}** (${tauxV}%)\n• 🔄 En traitement : **${traite}**\n• ⏳ En attente de validation : **${attente}**\n• 📝 Brouillons/Demandes : **${demande}**\n• ❌ Rejetés : **${rejetes}** (${tauxR}%)\n• 🏭 Équipements : **${eqs}**`,
      chartData: {
        type: 'pie',
        title: 'Répartition des plans',
        data: [
          {name:'Validés',    value:valides, color:'#059669'},
          {name:'En traitement', value:traite, color:'#d97706'},
          {name:'En attente', value:attente, color:'#2563eb'},
          {name:'Demandes',   value:demande, color:'#64748b'},
          {name:'Rejetés',    value:rejetes, color:'#e11d48'},
        ].filter(d=>d.value>0),
      },
    };
  }

  /* ── Plans par zone (admin) ── */
  if (q.match(/zone|par zone|repartition.*zone|zone.*plan/) && isAdmin) {
    const zones = await zoneService.findAll();
    const statsArr = await Promise.all(
      zones.map(z => dashboardService.getStatsByZone(z.id).then(s=>({...s,zoneName:z.nom||z.code})).catch(()=>({zoneName:z.nom||z.code,totalPlans:0})))
    );
    statsArr.sort((a,b)=>(b.totalPlans||0)-(a.totalPlans||0));
    const rows = statsArr.map(z=>`• **${z.zoneName}** : ${z.totalPlans||0} plans (✅ ${z.plansValides||0} validés)`).join('\n');
    return {
      answer: `**Plans par zone**\n\n${rows}`,
      chartData: {
        type: 'bar',
        title: 'Plans par zone',
        data: statsArr.map((z,i)=>({name:z.zoneName, value:z.totalPlans||0, color:COLORS[i%COLORS.length]})),
      },
    };
  }

  /* ── Taux de validation ── */
  if (q.match(/taux|pourcentage|performance|efficacite/)) {
    const stats = isAdmin
      ? await dashboardService.getStats()
      : await dashboardService.getStatsByZone(zoneId);
    const total   = stats.totalPlans || 0;
    const valides = stats.plansValides || 0;
    const rejetes = stats.plansRejetes || 0;
    const tauxV   = total ? Math.round(valides/total*100) : 0;
    const tauxR   = total ? Math.round(rejetes/total*100) : 0;
    return {
      answer: `**Taux de performance${isAdmin?'':' de votre zone'}**\n\n• Taux de validation : **${tauxV}%** (${valides}/${total})\n• Taux de rejet : **${tauxR}%** (${rejetes}/${total})\n• Plans en attente : **${stats.plansEnAttenteValidation||0}**\n\n${tauxV >= 70 ? '✅ Performance satisfaisante' : tauxV >= 50 ? '⚠️ Performance correcte, à améliorer' : '❌ Performance faible, action requise'}`,
      chartData: {
        type: 'pie',
        title: 'Taux de validation',
        data: [
          {name:`Validés (${tauxV}%)`, value:valides, color:'#059669'},
          {name:`Rejetés (${tauxR}%)`, value:rejetes, color:'#e11d48'},
          {name:'En cours', value:(stats.totalPlans||0)-valides-rejetes, color:'#64748b'},
        ].filter(d=>d.value>0),
      },
    };
  }

  /* ── Utilisateurs (admin uniquement) ── */
  if (q.match(/utilisateur|user|equipe|personnel|membre/) && isAdmin) {
    const users = await utilisateurService.findAll();
    const admins   = users.filter(u=>u.role==='ADMIN').length;
    const managers = users.filter(u=>u.role==='MANAGER').length;
    const charges  = users.filter(u=>u.role==='CHARGE').length;
    return {
      answer: `**Utilisateurs enregistrés**\n\n• Total : **${users.length}**\n• 🟣 Administrateurs : **${admins}**\n• 🟡 Managers : **${managers}**\n• 🔵 Chargés de consignation : **${charges}**`,
      chartData: {
        type: 'pie',
        title: 'Répartition des rôles',
        data: [
          {name:'Admins',    value:admins,   color:'#7c3aed'},
          {name:'Managers',  value:managers, color:'#c9a84c'},
          {name:'Chargés',   value:charges,  color:'#2563eb'},
        ].filter(d=>d.value>0),
      },
    };
  }

  /* ── Équipements ── */
  if (q.match(/equipement|machine|installation|materiel/) && !q.match(/comment|creer|ajouter|etape/)) {
    if (isAdmin) {
      const zones = await zoneService.findAll();
      const eqsByZone = await Promise.all(
        zones.map(z => equipementService.findAllByZone(z.id).then(eqs=>({zone:z.nom||z.code, count:eqs.length})).catch(()=>({zone:z.nom||z.code,count:0})))
      );
      const total = eqsByZone.reduce((s,z)=>s+z.count,0);
      return {
        answer: `**Équipements par zone (Admin)**\n\nTotal : **${total}** équipements\n\n` + eqsByZone.map(z=>`• **${z.zone}** : ${z.count}`).join('\n'),
        chartData: {
          type: 'bar', title: 'Équipements par zone',
          data: eqsByZone.map((z,i)=>({name:z.zone, value:z.count, color:COLORS[i%COLORS.length]})),
        },
      };
    } else {
      const eqs = await equipementService.findAllByZone(zoneId);
      return { answer: `**Équipements de votre zone**\n\nTotal : **${eqs.length}** équipements dans votre zone.` };
    }
  }

  /* ── Dispositifs ── */
  if (q.match(/dispositif|cadenas|stock|materiel de consignation/)) {
    const disps = await dispositifService.findAll();
    const totalStock = disps.reduce((s,d)=>s+(d.quantiteStock||0),0);
    const enStock = disps.filter(d=>(d.quantiteStock||0)>0).length;
    return {
      answer: `**Dispositifs d'isolation**\n\n• Types répertoriés : **${disps.length}**\n• Disponibles en stock : **${enStock}** types\n• Unités totales : **${totalStock}** en stock\n\nTop 5 :\n` +
        disps.slice(0,5).map(d=>`• ${d.designation} : **${d.quantiteStock||0}** unités`).join('\n'),
      chartData: disps.length > 0 ? {
        type: 'bar', title: 'Stock par dispositif',
        data: disps.slice(0,8).map((d,i)=>({name:d.designation.slice(0,20), value:d.quantiteStock||0, color:COLORS[i%COLORS.length]})),
      } : null,
    };
  }

  /* ── Plans en attente de validation ── */
  if (q.match(/attente|validation en attente|a valider|soumis/) && !q.match(/comment|etape/)) {
    const stats = isAdmin
      ? await dashboardService.getStats()
      : await dashboardService.getStatsByZone(zoneId);
    const n = stats.plansEnAttenteValidation || 0;
    return {
      answer: `**Plans en attente de validation**\n\n• Nombre : **${n}** plan${n>1?'s':''} en attente\n${n>0?'\n⚠️ Action requise : ces plans nécessitent votre validation.':'✅ Aucun plan en attente.'}`,
    };
  }

  /* ── Plans rejetés ── */
  if (q.match(/rejet|refus|rejete/) && !q.match(/comment|etape|que faire/)) {
    const stats = isAdmin
      ? await dashboardService.getStats()
      : await dashboardService.getStatsByZone(zoneId);
    return {
      answer: `**Plans rejetés${isAdmin?'':' dans votre zone'}**\n\n• Total rejetés : **${stats.plansRejetes||0}**\n• Sur **${stats.totalPlans||0}** plans au total\n\nUn plan rejeté peut être remis en demande par l'Admin pour correction.`,
    };
  }

  /* ── Zones (admin) ── */
  if (q.match(/zones|liste.*zone|toutes.*zones|toutes les zones/) && isAdmin) {
    const zones = await zoneService.findAll();
    return {
      answer: `**Zones industrielles**\n\n${zones.length} zones configurées :\n` + zones.map(z=>`• **${z.code}** — ${z.nom||'(sans nom)'}`).join('\n'),
    };
  }

  return null; // pas de réponse trouvée
}

/* ─────────────────────────────────────────
   MESSAGES DE BIENVENUE & SUGGESTIONS
───────────────────────────────────────── */
const WELCOME = {
  DB: {
    ADMIN:   '👋 Bonjour ! Je suis votre assistant statistiques.\n\nJe peux analyser **toutes les zones** : plans, équipements, utilisateurs, taux de validation… Que souhaitez-vous savoir ?',
    MANAGER: '👋 Bonjour ! Je suis votre assistant statistiques.\n\nJe peux vous donner des données sur **votre zone** : état des plans, performance, taux de validation. Comment puis-je vous aider ?',
    CHARGE:  '👋 Bonjour ! Je suis votre assistant statistiques.\n\nJe peux vous informer sur les **plans et équipements de votre zone**. Que souhaitez-vous savoir ?',
  },
  GUIDE: {
    ADMIN:   '📖 Bonjour ! Je suis votre guide d\'utilisation ConsignApp.\n\nJe peux vous expliquer toutes les fonctionnalités. Quelle est votre question ?',
    MANAGER: '📖 Bonjour ! Je suis votre guide d\'utilisation.\n\nJe peux vous aider sur les plans, la validation, la messagerie et plus encore.',
    CHARGE:  '📖 Bonjour ! Je suis votre guide d\'utilisation.\n\nJe peux vous expliquer comment créer un plan, saisir les énergies ou corriger un plan rejeté.',
  },
};

const SUGGESTIONS = {
  DB: {
    ADMIN:   ['Bilan global','Plans par zone','Taux de validation','Utilisateurs','Dispositifs en stock'],
    MANAGER: ['Bilan de ma zone','Plans en attente','Taux de validation','Équipements'],
    CHARGE:  ['Bilan de ma zone','Plans en attente','Équipements de ma zone'],
  },
  GUIDE: {
    ADMIN:   ['Comment créer un utilisateur ?','Cycle de vie d\'un plan','Comment gérer les dispositifs ?'],
    MANAGER: ['Comment valider un plan ?','Comment utiliser la messagerie ?','Statuts des plans'],
    CHARGE:  ['Comment créer un plan ?','Comment saisir les énergies ?','Mon plan est rejeté, que faire ?'],
  },
};

/* ─────────────────────────────────────────
   CSS
───────────────────────────────────────── */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
:root {
  --ai-navy:#0f1e35; --ai-navy2:#162844;
  --ai-gold:#c9a84c; --ai-gold-dim:rgba(201,168,76,.12); --ai-gold-bdr:rgba(201,168,76,.3);
  --ai-bg:#f8f7fb; --ai-white:#fff; --ai-border:rgba(0,0,0,.08);
  --ai-muted:#94a3b8; --ai-text:#0f172a;
  --ai-err-bg:#fef2f2; --ai-err:#991b1b;
  --ai-w:400px; --ai-h:600px;
  --ai-shadow:0 20px 60px rgba(10,18,35,.24);
}
.aiw-float {
  position:fixed; z-index:9000; bottom:24px; right:24px;
  display:flex; flex-direction:column; align-items:flex-end; gap:10px;
  font-family:'Plus Jakarta Sans',system-ui,sans-serif;
}
.aiw-window {
  width:var(--ai-w); height:var(--ai-h);
  background:var(--ai-white); border-radius:18px;
  box-shadow:var(--ai-shadow); border:1px solid var(--ai-border);
  display:flex; flex-direction:column; overflow:hidden;
  animation:aiwUp .22s cubic-bezier(.34,1.2,.64,1);
}
@keyframes aiwUp{from{opacity:0;transform:translateY(14px) scale(.97)}to{opacity:1;transform:translateY(0) scale(1)}}
/* HEAD */
.aiw-head {
  background:linear-gradient(135deg,#0c1829 0%,#14243e 100%);
  padding:14px 16px 0; flex-shrink:0; position:relative; overflow:hidden; cursor:grab;
}
.aiw-head:active{cursor:grabbing;}
.aiw-head::after{content:'';position:absolute;top:-50px;right:-30px;width:150px;height:150px;border-radius:50%;background:radial-gradient(circle,rgba(201,168,76,.1) 0%,transparent 70%);pointer-events:none;}
.aiw-head-top{display:flex;align-items:center;gap:10px;margin-bottom:12px;}
.aiw-head__av{width:34px;height:34px;border-radius:10px;flex-shrink:0;background:var(--ai-gold-dim);border:1.5px solid var(--ai-gold-bdr);display:flex;align-items:center;justify-content:center;color:var(--ai-gold);position:relative;z-index:1;}
.aiw-head__info{flex:1;min-width:0;position:relative;z-index:1;}
.aiw-head__title{font-size:13px;font-weight:700;color:#fff;line-height:1.2;display:block;}
.aiw-head__sub{font-size:10px;color:rgba(255,255,255,.45);margin-top:1px;display:block;}
.aiw-head__acts{display:flex;gap:5px;position:relative;z-index:1;}
.aiw-ibtn{width:26px;height:26px;border-radius:7px;border:none;background:rgba(255,255,255,.12);color:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;}
.aiw-ibtn:hover{background:rgba(255,255,255,.22);}
/* TABS */
.aiw-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.08);position:relative;z-index:1;padding:0 4px;}
.aiw-tab{flex:1;padding:9px 6px;border:none;background:transparent;cursor:pointer;font-family:inherit;font-size:11.5px;font-weight:600;color:rgba(255,255,255,.45);transition:all .18s;border-bottom:2.5px solid transparent;margin-bottom:-1px;display:flex;align-items:center;justify-content:center;gap:5px;}
.aiw-tab:hover{color:rgba(255,255,255,.75);}
.aiw-tab.active{color:var(--ai-gold);border-bottom-color:var(--ai-gold);}
/* BADGE ZONE */
.aiw-zbadge{display:flex;align-items:center;gap:6px;padding:5px 12px;margin:8px 12px 0;background:rgba(201,168,76,.08);border:1px solid var(--ai-gold-bdr);border-radius:20px;font-size:10.5px;font-weight:600;color:var(--ai-gold);flex-shrink:0;}
.aiw-zbadge--admin{background:rgba(124,58,237,.08);border-color:rgba(124,58,237,.25);color:#7c3aed;}
/* MESSAGES */
.aiw-msgs{flex:1;overflow-y:auto;padding:12px 14px;display:flex;flex-direction:column;gap:10px;background:var(--ai-bg);scrollbar-width:thin;scrollbar-color:#ddd transparent;}
.aiw-msgs::-webkit-scrollbar{width:4px;}
.aiw-msgs::-webkit-scrollbar-thumb{background:#ddd;border-radius:2px;}
/* MESSAGE */
.aiw-msg{display:flex;gap:7px;align-items:flex-end;}
.aiw-msg--u{flex-direction:row-reverse;}
.aiw-av{width:26px;height:26px;border-radius:8px;flex-shrink:0;background:var(--ai-gold-dim);border:1px solid var(--ai-gold-bdr);color:var(--ai-gold);font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center;}
.aiw-av--u{background:#e0e7ff;border-color:#c7d2fe;color:#4338ca;}
.aiw-mbody{display:flex;flex-direction:column;gap:4px;max-width:80%;}
.aiw-msg--u .aiw-mbody{align-items:flex-end;}
.aiw-bubble{padding:9px 12px;border-radius:13px;border-bottom-left-radius:4px;font-size:12.5px;line-height:1.6;word-break:break-word;background:var(--ai-white);border:1px solid rgba(0,0,0,.06);color:var(--ai-text);}
.aiw-msg--u .aiw-bubble{background:linear-gradient(135deg,var(--ai-navy),var(--ai-navy2));color:#fff;border:none;border-bottom-right-radius:4px;border-bottom-left-radius:13px;}
.aiw-bubble--err{background:var(--ai-err-bg);color:var(--ai-err);border-color:#fca5a5;}
.aiw-bubble strong{font-weight:700;}
.aiw-bubble ol,.aiw-bubble ul{padding-left:16px;margin:4px 0;}
.aiw-bubble li{margin:2px 0;}
.aiw-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:20px;font-size:10px;margin-top:2px;}
.aiw-badge--db{background:rgba(201,168,76,.08);border:1px solid var(--ai-gold-bdr);color:#a07c30;}
.aiw-badge--guide{background:rgba(37,99,235,.07);border:1px solid rgba(37,99,235,.2);color:#1d4ed8;}
.aiw-badge--zone{background:rgba(239,68,68,.07);border:1px solid rgba(239,68,68,.2);color:#b91c1c;}
/* TYPING */
.aiw-typing{display:flex;align-items:center;gap:4px;padding:10px 12px;}
.aiw-dot{width:6px;height:6px;border-radius:50%;background:var(--ai-muted);animation:aiwDot 1.2s infinite;}
.aiw-dot:nth-child(2){animation-delay:.2s}.aiw-dot:nth-child(3){animation-delay:.4s}
@keyframes aiwDot{0%,80%,100%{opacity:.25;transform:scale(.9)}40%{opacity:1;transform:scale(1)}}
/* CHART */
.aiw-chart{margin-top:6px;background:var(--ai-white);border:1px solid rgba(0,0,0,.06);border-radius:10px;padding:8px 4px 6px;}
.aiw-chart__ttl{font-size:10.5px;font-weight:600;color:var(--ai-muted);text-align:center;margin:0 0 4px;padding:0 8px;}
/* SUGGS */
.aiw-suggs{display:flex;flex-wrap:wrap;gap:5px;padding:8px 12px;border-top:1px solid rgba(0,0,0,.06);background:var(--ai-white);flex-shrink:0;}
.aiw-sugg{padding:4px 10px;border:1px solid rgba(0,0,0,.1);border-radius:20px;background:var(--ai-white);color:#5a6a7e;font-size:11px;cursor:pointer;transition:all .15s;font-family:inherit;text-align:left;}
.aiw-sugg:hover{background:var(--ai-gold-dim);border-color:var(--ai-gold-bdr);color:#a07c30;}
/* INPUT */
.aiw-bar{display:flex;gap:7px;padding:9px 11px;border-top:1px solid rgba(0,0,0,.06);background:var(--ai-white);flex-shrink:0;}
.aiw-inp{flex:1;padding:8px 12px;border:1.5px solid rgba(0,0,0,.1);border-radius:10px;background:var(--ai-bg);font-family:inherit;font-size:12.5px;color:var(--ai-text);outline:none;transition:border-color .15s;}
.aiw-inp:focus{border-color:var(--ai-gold);box-shadow:0 0 0 2px var(--ai-gold-dim);}
.aiw-inp::placeholder{color:var(--ai-muted);}
.aiw-send{width:34px;height:34px;border-radius:9px;border:none;background:linear-gradient(135deg,var(--ai-navy),var(--ai-navy2));color:var(--ai-gold);cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;transition:all .18s;}
.aiw-send:hover:not(:disabled){transform:translateY(-1px);box-shadow:0 3px 10px rgba(15,30,53,.2);}
.aiw-send:disabled{opacity:.4;cursor:not-allowed;transform:none;}
.aiw-mic{width:34px;height:34px;border-radius:9px;border:1.5px solid rgba(0,0,0,.1);background:var(--ai-bg);color:#5a6a7e;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .15s;}
.aiw-mic:hover:not(:disabled){border-color:var(--ai-gold-bdr);color:var(--ai-gold);}
.aiw-mic--rec{background:#fef2f2;border-color:#fca5a5;color:#dc2626;animation:aiwMic 1.2s infinite;}
@keyframes aiwMic{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.3)}50%{box-shadow:0 0 0 5px rgba(220,38,38,0)}}
/* FAB */
.aiw-fab{display:flex;align-items:center;gap:8px;padding:11px 18px;border-radius:28px;border:none;background:linear-gradient(135deg,var(--ai-navy),var(--ai-navy2));color:var(--ai-gold);cursor:pointer;box-shadow:0 6px 24px rgba(10,18,35,.25);font-size:13px;font-weight:600;font-family:inherit;transition:all .2s;white-space:nowrap;}
.aiw-fab:hover{transform:translateY(-2px);box-shadow:0 10px 30px rgba(10,18,35,.3);}
.aiw-fab--open{border-radius:50%;padding:11px;}
`;

/* ─────────────────────────────────────────
   Markdown léger → HTML
───────────────────────────────────────── */
function fmt(t) {
  if (!t) return '';
  let h = t.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  const lines = h.split('\n'); const out=[]; let inOl=false,inUl=false;
  lines.forEach(l=>{
    const ol=l.match(/^(\d+)\.\s(.+)$/), ul=l.match(/^[-•]\s(.+)$/);
    if(ol){if(!inOl){out.push('<ol>');inOl=true;} out.push(`<li>${ol[2]}</li>`);}
    else if(ul){if(!inUl){out.push('<ul>');inUl=true;} out.push(`<li>${ul[1]}</li>`);}
    else{if(inOl){out.push('</ol>');inOl=false;} if(inUl){out.push('</ul>');inUl=false;} out.push(l===''?'<br/>':l+'<br/>');}
  });
  if(inOl)out.push('</ol>'); if(inUl)out.push('</ul>');
  return out.join('');
}

/* ─────────────────────────────────────────
   Graphique
───────────────────────────────────────── */
function AIChart({ cd }) {
  if (!cd?.data?.length) return null;
  const data = cd.type==='pie' ? cd.data.filter(d=>d.value>0) : cd.data;
  if (!data.length) return null;
  const h = cd.type==='pie' ? 200 : Math.max(160,data.length*30);
  return (
    <div className="aiw-chart">
      {cd.title && <p className="aiw-chart__ttl">{cd.title}</p>}
      <ResponsiveContainer width="100%" height={h}>
        {cd.type==='pie' ? (
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70}
              label={({value,percent})=>percent>0.04?value:null} labelLine={false}>
              {data.map((d,i)=><Cell key={i} fill={d.color||COLORS[i%COLORS.length]}/>)}
            </Pie>
            <Tooltip formatter={(v,n)=>[v,n]}/><Legend iconSize={9} wrapperStyle={{fontSize:10}}/>
          </PieChart>
        ):(
          <BarChart data={data} layout="vertical" margin={{top:4,right:28,left:50,bottom:4}}>
            <XAxis type="number" tick={{fontSize:9}} allowDecimals={false}/>
            <YAxis type="category" dataKey="name" tick={{fontSize:9}} width={48}/>
            <Tooltip formatter={v=>[v]}/>
            <Bar dataKey="value" radius={[0,4,4,0]} barSize={16}>
              {data.map((d,i)=><Cell key={i} fill={d.color||COLORS[i%COLORS.length]}/>)}
            </Bar>
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

/* ─────────────────────────────────────────
   Bulle
───────────────────────────────────────── */
function Bubble({ msg, initials }) {
  const bot = msg.role==='assistant';
  return (
    <div className={`aiw-msg${bot?'':' aiw-msg--u'}`}>
      {bot && <div className="aiw-av"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>}
      <div className="aiw-mbody">
        <div className={`aiw-bubble${msg.isError?' aiw-bubble--err':''}`} dangerouslySetInnerHTML={{__html:fmt(msg.content)}}/>
        {bot && msg.chartData && <AIChart cd={msg.chartData}/>}
        {bot && msg.tab==='DB' && !msg.isWelcome && !msg.isError && (
          <span className="aiw-badge aiw-badge--db">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
            {msg.isLimited ? 'Données zone uniquement' : 'Base de données — accès global'}
          </span>
        )}
        {bot && msg.tab==='GUIDE' && !msg.isWelcome && !msg.isError && (
          <span className="aiw-badge aiw-badge--guide">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Guide d'utilisation
          </span>
        )}
      </div>
      {!bot && <div className="aiw-av aiw-av--u">{initials}</div>}
    </div>
  );
}

/* ─────────────────────────────────────────
   Voice hook
───────────────────────────────────────── */
function useVoice(onText) {
  const [on, setOn]   = useState(false);
  const [ok, setOk]   = useState(false);
  const rec           = useRef(null);
  useEffect(()=>{
    const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(!SR) return; setOk(true);
    const r=new SR(); r.lang='fr-FR'; r.continuous=false; r.interimResults=false;
    r.onresult=e=>{onText(e.results[0][0].transcript);setOn(false);};
    r.onerror=()=>setOn(false); r.onend=()=>setOn(false); rec.current=r;
  },[]); // eslint-disable-line
  const toggle=useCallback(()=>{
    if(!rec.current) return;
    if(on){rec.current.stop();setOn(false);}
    else{try{rec.current.start();setOn(true);}catch{setOn(false);}}
  },[on]);
  return {on,ok,toggle};
}

/* ─────────────────────────────────────────
   WIDGET PRINCIPAL
───────────────────────────────────────── */
export default function AssistantWidget() {
  const { user }  = useAuth();
  const role      = user?.role || 'CHARGE';
  const isAdmin   = role === 'ADMIN';

  const [open,    setOpen]    = useState(false);
  const [tab,     setTab]     = useState('DB');
  const [msgs,    setMsgs]    = useState({DB:[],GUIDE:[]});
  const [suggs,   setSuggs]   = useState({DB:[],GUIDE:[]});
  const [loading, setLoading] = useState(false);
  const [input,   setInput]   = useState('');
  const wrapRef  = useRef(null);
  const endRef   = useRef(null);
  const inputRef = useRef(null);
  const drag     = useRef({on:false,mx:0,my:0,ex:0,ey:0});

  const initials = user ? `${(user.prenom||'').charAt(0)}${(user.nom||'').charAt(0)}`.toUpperCase() : '?';
  const roleLabel = {ADMIN:'Administrateur',MANAGER:'Manager',CHARGE:'Chargé de Consignation',CHARGE_TRAVAUX:'Chargé des Travaux'}[role]||role;

  /* ── init ── */
  useEffect(()=>{
    const mk = (t) => ({ id:uid(), role:'assistant', content:WELCOME[t][role]||WELCOME[t].CHARGE, isWelcome:true, tab:t });
    setMsgs({ DB:[mk('DB')], GUIDE:[mk('GUIDE')] });
    setSuggs({ DB:SUGGESTIONS.DB[role]||[], GUIDE:SUGGESTIONS.GUIDE[role]||[] });
  },[role]);

  useEffect(()=>{ endRef.current?.scrollIntoView({behavior:'smooth'}); },[msgs,loading]);
  useEffect(()=>{ if(open) setTimeout(()=>inputRef.current?.focus(),120); },[open]);

  /* ── send ── */
  const send = useCallback(async (question) => {
    if (!question?.trim() || loading) return;
    setSuggs(p=>({...p,[tab]:[]}));
    setMsgs(p=>({...p,[tab]:[...p[tab],{id:uid(),role:'user',content:question.trim()}]}));
    setInput(''); setLoading(true);

    try {
      let answer, chartData=null;

      if (tab === 'GUIDE') {
        /* ── Guide : recherche dans la base de connaissances ── */
        const found = searchGuide(question);
        if (found) {
          answer = found;
        } else {
          // Essai partiel : chercher des mots-clés individuels
          const words = normalize(question).split(/\s+/).filter(w => w.length > 3);
          const partial = GUIDE_KB.find(e => e.keys.some(k => words.some(w => normalize(k).includes(w) || w.includes(normalize(k)))));
          answer = partial
            ? partial.answer
            : `Je n'ai pas trouvé de réponse précise pour **"${question}"**.\n\nEssayez des sujets comme :\n- **Plan** : créer, étapes, validation, rejet\n- **Énergies** : saisir, approuver\n- **Utilisateurs** : créer, rôles\n- **Messagerie**, **PDF**, **Historique**, **Statuts**`;
        }
      } else {
        /* ── DB : interroger les APIs ── */
        const result = await queryDB(question, user);
        if (result) {
          answer = result.answer;
          chartData = result.chartData || null;
        } else {
          // 🔄 Détection croisée : question guide posée dans l'onglet DB
          const guideAnswer = isGuideQuestion(question) ? searchGuide(question) : null;
          if (guideAnswer) {
            answer = `💡 *Cette question concerne l'utilisation de l'application. Voici la réponse depuis le Guide :*\n\n${guideAnswer}\n\n---\n*Basculez sur l'onglet **📖 Guide d'utilisation** pour ce type de questions.*`;
          } else {
            answer = `Je n'ai pas pu analyser cette question dans les données.\n\nPour des **statistiques**, essayez :\n**Bilan global** · **Plans par zone** · **Taux de validation** · **Utilisateurs** · **Équipements** · **Dispositifs**\n\nPour des **questions d'utilisation**, utilisez l'onglet **📖 Guide d'utilisation**.`;
          }
        }
      }

      const botMsg = {
        id:uid(), role:'assistant', content:answer, chartData,
        tab, isLimited: !isAdmin && tab==='DB',
      };
      setMsgs(p=>({...p,[tab]:[...p[tab], botMsg]}));
      setSuggs(p=>({...p,[tab]:SUGGESTIONS[tab][role]||[]}));
    } catch(e) {
      setMsgs(p=>({...p,[tab]:[...p[tab],{id:uid(),role:'assistant',isError:true,content:`❌ Erreur : ${e.message||'Impossible de récupérer les données.'}`}]}));
    } finally { setLoading(false); }
  },[loading,tab,user,role,isAdmin]);

  const handleSubmit = e => { e?.preventDefault(); send(input); };

  /* ── voice ── */
  const {on:listening, ok:sttOk, toggle:toggleMic} = useVoice(t=>setInput(t));

  /* ── drag ── */
  const startDrag = useCallback(e=>{
    if(e.target.closest('button,input')) return;
    const el=wrapRef.current; if(!el) return;
    if(!el.style.left){ const r=el.getBoundingClientRect(); el.style.position='fixed'; el.style.right='auto'; el.style.bottom='auto'; el.style.left=r.left+'px'; el.style.top=r.top+'px'; }
    drag.current={on:true,mx:e.clientX,my:e.clientY,ex:parseFloat(el.style.left)||0,ey:parseFloat(el.style.top)||0};
    document.body.style.userSelect='none'; document.body.style.cursor='grabbing';
  },[]); // eslint-disable-line

  useEffect(()=>{
    const mm=e=>{ if(!drag.current.on) return; const el=wrapRef.current; if(!el) return; const dx=e.clientX-drag.current.mx,dy=e.clientY-drag.current.my; const mx=window.innerWidth-el.offsetWidth-8,my=window.innerHeight-el.offsetHeight-8; el.style.left=Math.max(8,Math.min(mx,drag.current.ex+dx))+'px'; el.style.top=Math.max(8,Math.min(my,drag.current.ey+dy))+'px'; };
    const mu=()=>{ if(!drag.current.on) return; drag.current.on=false; document.body.style.userSelect=''; document.body.style.cursor=''; };
    window.addEventListener('mousemove',mm); window.addEventListener('mouseup',mu);
    return ()=>{ window.removeEventListener('mousemove',mm); window.removeEventListener('mouseup',mu); };
  },[]);

  const reset = () => {
    const mk = () => ({id:uid(),role:'assistant',content:WELCOME[tab][role]||WELCOME[tab].CHARGE,isWelcome:true,tab});
    setMsgs(p=>({...p,[tab]:[mk()]}));
    setSuggs(p=>({...p,[tab]:SUGGESTIONS[tab][role]||[]}));
  };

  const curMsgs  = msgs[tab]  || [];
  const curSuggs = suggs[tab] || [];

  return (
    <>
      <style>{CSS}</style>
      <div ref={wrapRef} className="aiw-float">

        {open && (
          <div className="aiw-window">
            {/* HEAD */}
            <div className="aiw-head" onMouseDown={startDrag}>
              <div className="aiw-head-top">
                <svg style={{opacity:.4,flexShrink:0}} width="10" height="14" viewBox="0 0 10 14" fill="rgba(255,255,255,.6)">
                  <circle cx="2.5" cy="2.5" r="1.5"/><circle cx="7.5" cy="2.5" r="1.5"/>
                  <circle cx="2.5" cy="7" r="1.5"/><circle cx="7.5" cy="7" r="1.5"/>
                  <circle cx="2.5" cy="11.5" r="1.5"/><circle cx="7.5" cy="11.5" r="1.5"/>
                </svg>
                <div className="aiw-head__av">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>
                </div>
                <div className="aiw-head__info">
                  <span className="aiw-head__title">Assistant ConsignApp</span>
                  <span className="aiw-head__sub">{roleLabel} · {tab==='DB'?'Base de données':'Guide d\'utilisation'}</span>
                </div>
                <div className="aiw-head__acts">
                  <button className="aiw-ibtn" onClick={reset} title="Réinitialiser">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3"/></svg>
                  </button>
                  <button className="aiw-ibtn" onClick={()=>setOpen(false)} title="Fermer">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>
              {/* TABS */}
              <div className="aiw-tabs">
                <button className={`aiw-tab${tab==='DB'?' active':''}`} onClick={()=>setTab('DB')}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4.03 3-9 3S3 13.66 3 12"/><path d="M3 5v14c0 1.66 4.03 3 9 3s9-1.34 9-3V5"/></svg>
                  Base de données
                </button>
                <button className={`aiw-tab${tab==='GUIDE'?' active':''}`} onClick={()=>setTab('GUIDE')}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  Guide d'utilisation
                </button>
              </div>
            </div>

            {/* BADGE ZONE */}
            {tab==='DB' && (
              <div className={`aiw-zbadge${isAdmin?' aiw-zbadge--admin':''}`}>
                {isAdmin ? (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>Accès global — toutes les zones</>
                ) : (
                  <><svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>Zone {user?.zoneCode||user?.zoneId||'—'} uniquement</>
                )}
              </div>
            )}

            {/* MESSAGES */}
            <div className="aiw-msgs">
              {curMsgs.map(m=><Bubble key={m.id} msg={m} initials={initials}/>)}
              {loading && (
                <div className="aiw-msg">
                  <div className="aiw-av"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg></div>
                  <div className="aiw-bubble aiw-typing"><span className="aiw-dot"/><span className="aiw-dot"/><span className="aiw-dot"/></div>
                </div>
              )}
              <div ref={endRef}/>
            </div>

            {/* SUGGESTIONS */}
            {curSuggs.length>0 && !loading && (
              <div className="aiw-suggs">
                {curSuggs.slice(0,4).map((s,i)=>(
                  <button key={i} className="aiw-sugg" onClick={()=>send(s)}>{s}</button>
                ))}
              </div>
            )}

            {/* INPUT */}
            <form className="aiw-bar" onSubmit={handleSubmit}>
              {sttOk && (
                <button type="button" className={`aiw-mic${listening?' aiw-mic--rec':''}`} onClick={toggleMic} disabled={loading}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill={listening?'currentColor':'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
                    <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
                    <line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>
                  </svg>
                </button>
              )}
              <input
                ref={inputRef} className="aiw-inp"
                placeholder={listening?'Écoute…':`${tab==='DB'?'Demandez des données…':'Posez une question…'}`}
                value={input} onChange={e=>setInput(e.target.value)}
                disabled={loading||listening} autoComplete="off"
              />
              <button type="submit" className="aiw-send" disabled={loading||!input.trim()||listening}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
              </button>
            </form>
          </div>
        )}

        {/* FAB */}
        <button className={`aiw-fab${open?' aiw-fab--open':''}`} onClick={()=>setOpen(v=>!v)} aria-label="Assistant IA">
          {open
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            : <><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg><span>Assistant IA</span></>
          }
        </button>
      </div>
    </>
  );
}
