import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LayoutProvider, useLayout } from './context/LayoutContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ReportView from './components/ReportView';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Donors from './pages/Donors';
import Inventory from './pages/Inventory';
import Hospitals from './pages/Hospitals';
import Requests from './pages/Requests';
import Appointments from './pages/Appointments';
import Donations from './pages/Donations';
import Profile from './pages/Profile';
import Users from './pages/Users';

const AppLayout = () => {
  const { user } = useAuth();
  const { sidebarCollapsed, mobileSidebarOpen, closeMobileSidebar } = useLayout();

  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const layoutClass = [
    'app-container',
    sidebarCollapsed ? 'sidebar-collapsed' : '',
    mobileSidebarOpen ? 'sidebar-mobile-open' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={layoutClass}>
      {mobileSidebarOpen && (
        <button type="button" className="sidebar-backdrop" onClick={closeMobileSidebar} aria-label="Close menu" />
      )}
      <Sidebar />
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/donors" element={<ProtectedRoute><Donors /></ProtectedRoute>} />
          <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
          <Route path="/hospitals" element={<ProtectedRoute><Hospitals /></ProtectedRoute>} />
          <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
          <Route path="/appointments" element={<ProtectedRoute><Appointments /></ProtectedRoute>} />
          <Route path="/donations" element={<ProtectedRoute><Donations /></ProtectedRoute>} />
          <Route path="/reports" element={<Navigate to="/reports/donations" replace />} />
          <Route path="/reports/donations" element={<ProtectedRoute><ReportView type="donations" /></ProtectedRoute>} />
          <Route path="/reports/inventory" element={<ProtectedRoute><ReportView type="inventory" /></ProtectedRoute>} />
          <Route path="/reports/requests" element={<ProtectedRoute><ReportView type="requests" /></ProtectedRoute>} />
          <Route path="/reports/hospitals" element={<ProtectedRoute><ReportView type="hospitals" /></ProtectedRoute>} />
          <Route path="/users" element={<AdminRoute><Users /></AdminRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LayoutProvider>
          <AppLayout />
        </LayoutProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
