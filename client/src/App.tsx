import React, { useState, useEffect } from 'react';
import { GuestUploadPage } from './pages/GuestUploadPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { PrintQRCodePage } from './pages/PrintQRCodePage';
import { WeddingSettings } from './types';
import { api } from './services/api';

type ViewMode = 'guest' | 'admin-login' | 'admin-dashboard' | 'print-qr';

export const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('guest');
  const [adminToken, setAdminToken] = useState<string | null>(null);
  const [settings, setSettings] = useState<WeddingSettings | null>(null);

  // Sync initial route based on window.location.pathname or search
  useEffect(() => {
    const token = localStorage.getItem('wedding_admin_token');
    if (token) {
      setAdminToken(token);
    }

    const checkRoute = () => {
      const path = window.location.pathname;
      const search = window.location.search;

      if (path.startsWith('/admin/print') || search.includes('print=true')) {
        setView('print-qr');
      } else if (path.startsWith('/admin') || search.includes('oauth=')) {
        if (token) {
          setView('admin-dashboard');
        } else {
          setView('admin-login');
        }
      } else {
        setView('guest');
      }
    };

    checkRoute();
    window.addEventListener('popstate', checkRoute);
    return () => window.removeEventListener('popstate', checkRoute);
  }, []);

  // Fetch settings for QR printing when in admin or print view
  useEffect(() => {
    if (adminToken && (view === 'admin-dashboard' || view === 'print-qr')) {
      api.getAdminSettings(adminToken)
        .then((s) => setSettings(s))
        .catch(() => {});
    }
  }, [adminToken, view]);

  const handleLoginSuccess = (token: string) => {
    setAdminToken(token);
    setView('admin-dashboard');
    window.history.pushState({}, '', '/admin');
  };

  const handleLogout = () => {
    localStorage.removeItem('wedding_admin_token');
    setAdminToken(null);
    setView('admin-login');
    window.history.pushState({}, '', '/admin');
  };

  const handleNavigateToAdmin = () => {
    if (adminToken) {
      setView('admin-dashboard');
    } else {
      setView('admin-login');
    }
    window.history.pushState({}, '', '/admin');
  };

  const handleNavigateToGuest = () => {
    setView('guest');
    window.history.pushState({}, '', '/');
  };

  const handleNavigateToPrintQR = () => {
    setView('print-qr');
    window.history.pushState({}, '', '/admin/print');
  };

  const guestUrl = settings?.websiteUrl || window.location.origin;

  if (view === 'print-qr') {
    return (
      <PrintQRCodePage
        settings={settings}
        guestUrl={guestUrl}
        onBack={() => {
          setView('admin-dashboard');
          window.history.pushState({}, '', '/admin');
        }}
      />
    );
  }

  if (view === 'admin-dashboard' && adminToken) {
    return (
      <AdminDashboardPage
        token={adminToken}
        onLogout={handleLogout}
        onBackToGuest={handleNavigateToGuest}
        onNavigateToPrintQR={handleNavigateToPrintQR}
      />
    );
  }

  if (view === 'admin-login' || (view === 'admin-dashboard' && !adminToken)) {
    return (
      <AdminLoginPage
        onSuccess={handleLoginSuccess}
        onBackToGuest={handleNavigateToGuest}
      />
    );
  }

  return <GuestUploadPage onNavigateToAdmin={handleNavigateToAdmin} />;
};

export default App;
