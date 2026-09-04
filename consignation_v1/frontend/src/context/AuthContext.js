import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext(null);

// Déconnexion automatique après 15 min sans interaction utilisateur dans cet onglet.
const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // loading = true tant que la session n'a pas été revalidée auprès du backend.
  // Aucune route protégée ne doit être rendue avant que ce flag repasse à false.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = sessionStorage.getItem('auth_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Le token peut être présent mais expiré, falsifié, ou correspondre à un
    // utilisateur supprimé depuis : on ne fait jamais confiance à sessionStorage
    // seul, on revalide toujours auprès du backend avant d'authentifier l'UI.
    authService.me()
      .then(currentUser => {
        setUser(currentUser);
        sessionStorage.setItem('auth_user', JSON.stringify(currentUser));
      })
      .catch(() => {
        sessionStorage.removeItem('auth_token');
        sessionStorage.removeItem('auth_user');
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback((userData, token) => {
    sessionStorage.removeItem('auth_logout_reason');
    sessionStorage.setItem('auth_token', token);
    sessionStorage.setItem('auth_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback((reason) => {
    if (reason) sessionStorage.setItem('auth_logout_reason', reason);
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    setUser(null);
  }, []);

  // Déconnexion automatique par inactivité — indépendante par onglet puisque
  // basée sur les événements de CE document et sur le state `user` de CET onglet.
  useEffect(() => {
    if (!user) return undefined;

    let timerId;
    const resetTimer = () => {
      clearTimeout(timerId);
      timerId = setTimeout(() => logout('idle'), IDLE_TIMEOUT_MS);
    };

    ACTIVITY_EVENTS.forEach(evt => window.addEventListener(evt, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timerId);
      ACTIVITY_EVENTS.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [user, logout]);

  const isAdmin = () => user?.role === 'ADMIN';
  const isManager = () => user?.role === 'MANAGER';
  const isCharge = () => user?.role === 'CHARGE';
  const isChargeTravaux = () => user?.role === 'CHARGE_TRAVAUX';

  const canValidate = () => user?.role === 'ADMIN' || user?.role === 'MANAGER';
  // Seul le Chargé de Consignation et Admin peuvent rédiger les énergies
  const canSaisirEnergies = () => user?.role === 'ADMIN' || user?.role === 'CHARGE';
  // Tous les rôles peuvent créer une demande de plan
  const canCreerDemande = () => ['ADMIN', 'MANAGER', 'CHARGE', 'CHARGE_TRAVAUX'].includes(user?.role);
  // Soumettre pour validation : uniquement Chargé de Consignation et Admin
  const canSoumettre = () => ['ADMIN', 'CHARGE'].includes(user?.role);
  const canGererUtilisateurs = () => user?.role === 'ADMIN';
  const getRoleLabel = () => {
    switch (user?.role) {
      case 'ADMIN':          return 'Administrateur';
      case 'MANAGER':        return 'Manager de Zone';
      case 'CHARGE':         return 'Chargé de Consignation';
      case 'CHARGE_TRAVAUX': return 'Chargé des Travaux';
      default: return user?.role || '';
    }
  };

  return (
    <AuthContext.Provider value={{
      user, loading, login, logout,
      isAdmin, isManager, isCharge, isChargeTravaux,
      canValidate, canSaisirEnergies, canCreerDemande, canSoumettre, canGererUtilisateurs, getRoleLabel,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
