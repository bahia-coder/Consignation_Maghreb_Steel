import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ManagerDashboardPage from './pages/ManagerDashboardPage';
import ManagerEquipPage from './pages/ManagerEquipPage';
import HomePage from './pages/HomePage';
import ZonePage from './pages/ZonePage';
import EquipementPage from './pages/EquipementPage';
import PlanDetailPage from './pages/PlanDetailPage';
import UtilisateursPage from './pages/UtilisateursPage';
import DispositifsAdminPage from './pages/DispositifsAdminPage';
import PublicEquipPage from './pages/PublicEquipPage';

/* ── Redirige vers le bon dashboard selon le rôle ── */
function DashboardRouter() {
  const { isManager } = useAuth();
  return isManager()
    ? <Navigate to="/manager-dashboard" replace />
    : <DashboardPage />;
}


export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          {/* ── Route publique QR Code (sans authentification obligatoire) ── */}
          <Route path="/qr/equipement/:id" element={<PublicEquipPage />} />
          <Route path="/manager-dashboard" element={
            <ProtectedRoute roles={['MANAGER','ADMIN']}>
              <ManagerDashboardPage />
            </ProtectedRoute>
          } />
          <Route path="/manager-equip/:equipementId" element={
            <ProtectedRoute roles={['MANAGER','ADMIN']}>
              <ManagerEquipPage />
            </ProtectedRoute>
          } />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<DashboardRouter />} />
            <Route path="equipements" element={<HomePage />} />
            <Route path="zone/:zoneId" element={<ZonePage />} />
            <Route path="equipement/:equipementId" element={<EquipementPage />} />
            <Route path="utilisateurs" element={
              <ProtectedRoute roles={['ADMIN']}>
                <UtilisateursPage />
              </ProtectedRoute>
            } />
            <Route path="dispositifs" element={
              <ProtectedRoute roles={['ADMIN']}>
                <DispositifsAdminPage />
              </ProtectedRoute>
            } />
            <Route path="plan/:planId" element={<PlanDetailPage />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
