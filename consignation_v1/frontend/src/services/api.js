import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Injecte le token JWT dans chaque requête.
// sessionStorage (et non localStorage) : chaque onglet/fenêtre a son propre stockage,
// ce qui permet à deux comptes différents de rester connectés indépendamment dans
// deux fenêtres du même navigateur (localStorage est partagé entre tous les onglets).
api.interceptors.request.use(config => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redirige vers /login si le token est expiré, ou si le serveur devient injoignable
api.interceptors.response.use(
  response => response,
  error => {
    // 401 = token expiré / invalide / utilisateur inexistant → déconnexion
    // 403 = accès refusé (rôle insuffisant) → NE PAS déconnecter
    // Pas de réponse du tout (error.response undefined) = serveur injoignable
    // (backend arrêté, réseau coupé) → déconnecte CETTE fenêtre uniquement, et
    // seulement si une session y était active (sinon rien à déconnecter — ne pas
    // rediriger les pages publiques comme /qr/equipement/:id).
    const serverUnreachable = !error.response;
    const hadSession = !!sessionStorage.getItem('auth_token');

    if (error.response?.status === 401 || (serverUnreachable && hadSession)) {
      if (window.location.pathname !== '/login') {
        sessionStorage.setItem('auth_logout_reason', serverUnreachable ? 'network' : 'invalid');
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: (matricule, password) =>
    api.post('/auth/login', { matricule, password }).then(r => r.data),
  me: () => api.get('/auth/me').then(r => r.data),
};

export const zoneService = {
  findAll: () => api.get('/zones').then(r => r.data),
  findById: (id) => api.get(`/zones/${id}`).then(r => r.data),
};

export const equipementService = {
  findRacines: () => api.get('/equipements/racines').then(r => r.data),
  findRacinesParZone: (zoneId) => api.get(`/equipements/zone/${zoneId}/racines`).then(r => r.data),
  findAllByZone: (zoneId) => api.get(`/equipements/zone/${zoneId}`).then(r => r.data),
  findById: (id) => api.get(`/equipements/${id}`).then(r => r.data),
  findNiveau: (id) => api.get(`/equipements/${id}/niveau`).then(r => r.data),
};

export const planService = {
  findByEquipement: (equipementId) => api.get(`/plans/equipement/${equipementId}`).then(r => r.data),
  findByZone: (zoneId) => api.get(`/plans/zone/${zoneId}`).then(r => r.data),
  findById: (id) => api.get(`/plans/${id}`).then(r => r.data),
  creerDemande: (data) => api.post('/plans/demande', data).then(r => r.data),
  modifierInfos: (id, data) => api.put(`/plans/${id}/infos`, data).then(r => r.data),
  accepterDemande: (id) => api.patch(`/plans/${id}/accepter-demande`).then(r => r.data),
  rejeterDemande: (id, commentaire) => api.patch(`/plans/${id}/rejeter-demande`, null, { params: { commentaire } }).then(r => r.data),
  soumettreValidation: (id) => api.patch(`/plans/${id}/soumettre-validation`).then(r => r.data),
  valider: (id, data) => api.post(`/plans/${id}/valider`, data).then(r => r.data),
  testerPlan: (id) => api.patch(`/plans/${id}/tester`).then(r => r.data),
  supprimerPlan: (id) => api.delete(`/plans/${id}`).then(r => r.data),
  getPdfBlob: async (id) => {
    const response = await api.get(`/plans/${id}/pdf`, { responseType: 'blob' });
    return new Blob([response.data], { type: 'application/pdf' });
  },
  telechargerPdf: async (id, reference) => {
    const response = await api.get(`/plans/${id}/pdf?avecDate=true`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `plan-consignation-${reference}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

export const backupService = {
  getStatus: () => api.get('/admin/backup/status').then(r => r.data),
  runNow: () => api.post('/admin/backup/run').then(r => r.data),
  retry: () => api.post('/admin/backup/retry').then(r => r.data),
};

export { api };

export const energieService = {
  findByPlan: (planId) => api.get(`/energies/plan/${planId}`).then(r => r.data),
  ajouterBatch: (planId, items) => api.post(`/energies/batch/${planId}`, items).then(r => r.data),
  sync: (planId, items) => api.put(`/energies/sync/${planId}`, items).then(r => r.data),
  modifier: (id, data) => api.put(`/energies/${id}`, data).then(r => r.data),
  supprimer: (id) => api.delete(`/energies/${id}`).then(r => r.data),
  monter: (id) => api.patch(`/energies/${id}/monter`).then(r => r.data),
  descendre: (id) => api.patch(`/energies/${id}/descendre`).then(r => r.data),
};

export const approbationService = {
  findByPlan: (planId) => api.get(`/approbations/plan/${planId}`).then(r => r.data),
  approuver: (planId) => api.post(`/approbations/plan/${planId}/approuver`).then(r => r.data),
};

export const historiqueService = {
  findByPlan: (planId) => api.get(`/historique/plan/${planId}`).then(r => r.data),
};

export const dispositifService = {
  findAll: () => api.get('/dispositifs').then(r => r.data),
  create: (data) => api.post('/dispositifs', data).then(r => r.data),
  update: (id, data) => api.put(`/dispositifs/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/dispositifs/${id}`).then(r => r.data),
};

export const utilisateurService = {
  findAll: () => api.get('/utilisateurs').then(r => r.data),
  findById: (id) => api.get(`/utilisateurs/${id}`).then(r => r.data),
  getMonEquipe: () => api.get('/utilisateurs/mon-equipe').then(r => r.data),
  create: (data) => api.post('/utilisateurs', data).then(r => r.data),
  update: (id, data) => api.put(`/utilisateurs/${id}`, data).then(r => r.data),
  delete: (id) => api.delete(`/utilisateurs/${id}`).then(r => r.data),
};

/* ══════════════════════════════════════════════════════════════
   ASSISTANT AI
   POST /api/chatbot/ask   { question, userRole, userId, zoneId, type, history }
   GET  /api/chatbot/suggestions?role=&type=
══════════════════════════════════════════════════════════════ */
export const assistantService = {
  ask: (payload) =>
    api.post('/chatbot/ask', payload).then(r => r.data),

  getSuggestions: (role, type = 'DB') =>
    api.get(`/chatbot/suggestions?role=${role}&type=${type}`).then(r => r.data),
};

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats').then(r => r.data),
  getStatsByZone: (zoneId) => api.get(`/dashboard/stats/zone/${zoneId}`).then(r => r.data),
};

/* ══════════════════════════════════════════════════════════════
   MESSAGERIE  —  stockage localStorage (offline-first)
   Clés : msg_convs  |  msg_msgs_{convId}  |  msg_unread_{userId}
══════════════════════════════════════════════════════════════ */
const MSG_CONVS_KEY  = 'msg_convs';
const msgMsgsKey     = id  => `msg_msgs_${id}`;
const msgUnreadKey   = uid => `msg_unread_${uid}`;

function lsGet(key, def = []) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function lsSet(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
  window.dispatchEvent(new StorageEvent('storage', { key, newValue: JSON.stringify(val) }));
}

export const messagerie = {
  /* ── Conversations ── */
  getConversations: () => lsGet(MSG_CONVS_KEY, []),

  saveConversation: (conv) => {
    const convs = lsGet(MSG_CONVS_KEY, []);
    const idx = convs.findIndex(c => c.id === conv.id);
    if (idx >= 0) convs[idx] = { ...convs[idx], ...conv };
    else convs.unshift(conv);
    lsSet(MSG_CONVS_KEY, convs);
    return conv;
  },

  /* Crée une conv si elle n'existe pas encore.
     Si elle existe mais n'a pas participantUsers, on les injecte. */
  ensureConversation: (conv) => {
    const convs = lsGet(MSG_CONVS_KEY, []);
    const idx = convs.findIndex(c => c.id === conv.id);
    if (idx < 0) {
      convs.unshift(conv);
      lsSet(MSG_CONVS_KEY, convs);
      return conv;
    }
    // Mettre à jour participantUsers si fournis et manquants
    if (conv.participantUsers && !convs[idx].participantUsers) {
      convs[idx] = { ...convs[idx], participantUsers: conv.participantUsers };
      lsSet(MSG_CONVS_KEY, convs);
    }
    return convs[idx];
  },

  /* ── Messages ── */
  getMessages: (convId) => lsGet(msgMsgsKey(convId), []),

  sendMessage: (convId, msg) => {
    const msgs = lsGet(msgMsgsKey(convId), []);
    const newMsg = { ...msg, id: Date.now(), timestamp: new Date().toISOString() };
    msgs.push(newMsg);
    lsSet(msgMsgsKey(convId), msgs);

    // Mettre à jour lastMessage + unreadCount dans la conv
    const convs = lsGet(MSG_CONVS_KEY, []);
    const idx = convs.findIndex(c => c.id === convId);
    if (idx >= 0) {
      convs[idx].lastMessage  = { contenu: msg.contenu, senderNom: msg.senderNom, timestamp: newMsg.timestamp };
      convs[idx].updatedAt    = newMsg.timestamp;
      // Incrémenter unread pour tous les participants sauf l'expéditeur
      convs[idx].participantIds.forEach(pid => {
        if (pid !== msg.senderId) {
          const k = msgUnreadKey(pid);
          lsSet(k, (lsGet(k, 0) || 0) + 1);
        }
      });
      lsSet(MSG_CONVS_KEY, convs);
    }
    return newMsg;
  },

  markRead: (convId, userId) => {
    // remettre unread à 0 pour cet utilisateur dans cette conv
    const k = msgUnreadKey(userId);
    const total = Math.max(0, (lsGet(k, 0) || 0) - 0); // sera recalculé
    // Compter vrais unread
    const convs = lsGet(MSG_CONVS_KEY, []);
    let totalUnread = 0;
    convs.forEach(c => {
      if (c.id !== convId && c.participantIds?.includes(userId)) {
        const msgs = lsGet(msgMsgsKey(c.id), []);
        totalUnread += msgs.filter(m => m.senderId !== userId && !m.readBy?.includes(userId)).length;
      }
    });
    lsSet(k, totalUnread);
    // Marquer les messages comme lus
    const msgs = lsGet(msgMsgsKey(convId), []);
    const updated = msgs.map(m =>
      m.senderId !== userId ? { ...m, readBy: [...(m.readBy || []), userId].filter((v,i,a) => a.indexOf(v)===i) } : m
    );
    lsSet(msgMsgsKey(convId), updated);
  },

  getTotalUnread: (userId) => {
    let count = 0;
    const convs = lsGet(MSG_CONVS_KEY, []);
    convs.forEach(c => {
      if (c.participantIds?.includes(userId)) {
        const msgs = lsGet(msgMsgsKey(c.id), []);
        count += msgs.filter(m => m.senderId !== userId && !(m.readBy || []).includes(userId)).length;
      }
    });
    return count;
  },

  clearAll: () => {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('msg_'));
    keys.forEach(k => localStorage.removeItem(k));
  },
};
