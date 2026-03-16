// App.js
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { LucideUsers, LucideActivity, LucidePieChart, LucideRadio } from 'lucide-react';

import CollapsibleList from './components/CollapsibleList/CollapsibleList';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import ProfileView from './components/ProfileView/ProfileView';
import Layout from './components/Layout/Layout';
import AnalyticsCard from './components/Layout/AnalyticsCard';
import QuickFilterBuilder from './components/Sidebar/QuickFilterBuilder';
import DataSourceBanner from './components/DataSourceBanner/DataSourceBanner';
import { fetchUsers, fetchVariables } from './services/userApi';
import { mockUsers } from './data/mockData';
import { mockVariables } from './data/mockVariables';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { ThemeControlProvider, useThemeControl } from './context/ThemeContext';
import { Toaster, toast } from 'react-hot-toast';
import EmailModal from './components/EmailModal/EmailModal';
import ConfirmationModal from './components/ConfirmationModal/ConfirmationModal';
import './styles/App.less';

/**
 * Inner app shell — rendered only when authenticated.
 */
function AppContent() {
  const { user, isAuthenticated, isLoading, handleOAuthSuccess } = useAuth();
  const { mode } = useThemeControl();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'

  // ── Handle OAuth Success Redirect ──────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken && window.location.pathname.includes('/login-success')) {
      handleOAuthSuccess(accessToken, refreshToken);
      // Clean up URL to keep it pretty
      window.history.replaceState({}, document.title, "/");
    }
  }, [handleOAuthSuccess]);

  // ── Handle Global Data Connection State ─────────────────
  const [isLive, setIsLive] = useState(null);
  const [users, setUsers] = useState([]);
  const [variables, setVariables] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const dataFetchedRef = useRef(false);

  // ── Handle Global Filtering State ───────────────────────
  const [query, setQuery] = useState({
    combinator: 'and',
    rules: [],
  });

  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  const handleResetQuery = useCallback(() => {
    setQuery({
      combinator: 'and',
      rules: [],
    });
  }, []);

  // ── Modal State & Handlers ──────────────────────────────
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailRecipients, setEmailRecipients] = useState([]);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState([]);

  const handleBulkDeleteRequested = useCallback((ids) => {
    setItemsToDelete(ids);
    setIsConfirmModalOpen(true);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    const ids = itemsToDelete;
    setUsers(prev => prev.filter((user, idx) => {
      const userId = user.id ?? idx;
      return !ids.includes(userId);
    }));
    
    toast.success(`${ids.length} ${ids.length === 1 ? 'item' : 'items'} deleted successfully.`, {
      icon: '🗑️',
      style: {
        background: mode === 'dark' ? '#0f172a' : '#fff',
        color: mode === 'dark' ? '#fff' : '#1e293b',
        border: mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
      }
    });
    setIsConfirmModalOpen(false);
    setItemsToDelete([]);
  }, [itemsToDelete, mode]);

  const handleBulkEmailRequested = useCallback((ids) => {
    const selectedUsers = users.filter((user, idx) => {
      const userId = user.id ?? idx;
      return ids.includes(userId);
    });
    setEmailRecipients(selectedUsers);
    setIsEmailModalOpen(true);
  }, [users]);

  const handleSendEmail = useCallback((emailData) => {
    console.log('Sending bulk email:', {
      recipients: emailRecipients.map(u => u.email || u.name),
      ...emailData
    });
    toast.success(`Email sent to ${emailRecipients.length} recipients!`, {
      icon: '🚀',
      style: {
        background: mode === 'dark' ? '#0f172a' : '#fff',
        color: mode === 'dark' ? '#fff' : '#1e293b',
        border: mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
      }
    });
    setIsEmailModalOpen(false);
  }, [emailRecipients, mode]);

  useEffect(() => {
    if (!isAuthenticated || dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    setIsDataLoading(true);
    Promise.all([fetchUsers(), fetchVariables()])
      .then(([usersData, variablesData]) => {
        setUsers(usersData);
        setVariables(variablesData);
        setIsLive(true);
      })
      .catch(() => {
        setUsers(mockUsers);
        setVariables(mockVariables);
        setIsLive(false);
      })
      .finally(() => {
        setIsDataLoading(false);
      });
  }, [isAuthenticated]);

  // ── Early Returns ─────────────────────────────────────
  if (isLoading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: mode === 'light'
            ? 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            : 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
        }}
      >
        <CircularProgress sx={{ color: '#7c69ef' }} size={48} />
      </Box>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  // ── Authenticated → Compute Analytics ────────────────────
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.status === 'Active').length;
  const activePercentage = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0;

  // Calculate age distribution brackets
  const ageDistribution = [
    { name: '18-24', count: users.filter(u => u.age >= 18 && u.age <= 24).length },
    { name: '25-34', count: users.filter(u => u.age >= 25 && u.age <= 34).length },
    { name: '35-44', count: users.filter(u => u.age >= 35 && u.age <= 44).length },
    { name: '45-54', count: users.filter(u => u.age >= 45 && u.age <= 54).length },
    { name: '55+', count: users.filter(u => u.age >= 55).length }
  ];

  // Calculate status distribution
  const statusDistribution = [
    { name: 'Act', count: users.filter(u => u.status === 'Active').length },
    { name: 'Ina', count: users.filter(u => u.status === 'Inactive').length },
    { name: 'Pen', count: users.filter(u => u.status === 'Pending').length },
    { name: 'Arch', count: users.filter(u => u.status === 'Archived').length }
  ];

  // Calculate online avatars
  const onlineUsers = users.filter(u => u.isOnline === true);
  const onlineAvatars = onlineUsers.map(u =>
    u.avatar || `https://ui-avatars.com/api/?name=${u.firstName}+${u.lastName}&background=7c69ef&color=fff`
  );

  const analytics = (
    <>
      <AnalyticsCard title="Total Users" value={totalUsers.toLocaleString()} icon={LucideUsers} trend trendValue="12%" />
      <AnalyticsCard
        title="Users by Status"
        value=""
        icon={LucideActivity}
        color="primary"
        chartData={statusDistribution}
        chartType="bar"
        dataKey="count"
      />
      <AnalyticsCard
        title="Age Range"
        value=""
        icon={LucidePieChart}
        color="warning"
        chartData={ageDistribution}
        chartType="pie"
        dataKey="count"
      />
      <AnalyticsCard
        title="Currently Online"
        value={onlineUsers.length}
        icon={LucideRadio}
        color="success"
        avatars={onlineAvatars}
      />
    </>
  );

  const banner = isLive !== null ? (
    <DataSourceBanner
      isLive={isLive}
      duration={Number(import.meta.env.VITE_BANNER_DURATION) || 3000}
    />
  ) : null;

  const modals = (
    <>
      <EmailModal 
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        recipients={emailRecipients}
        onSend={handleSendEmail}
      />
      <ConfirmationModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Items"
        message={`Are you sure you want to delete ${itemsToDelete.length} ${itemsToDelete.length === 1 ? 'item' : 'items'}? This action cannot be undone.`}
        confirmText="Confirm Delete"
      />
    </>
  );

  return (
    <Layout
      analyticsContent={analytics}
      sidebarContent={
        <QuickFilterBuilder
          query={query}
          onQueryChange={handleQueryChange}
        />
      }
      bannerContent={banner}
      modalsContent={modals}
    >
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={
            <CollapsibleList
              users={users}
              variables={variables}
              isDataLoading={isDataLoading}
              query={query}
              onQueryChange={handleQueryChange}
              onResetQuery={handleResetQuery}
              onBulkDelete={handleBulkDeleteRequested}
              onBulkEmail={handleBulkEmailRequested}
            />
          } />
          <Route path="/settings/account" element={<ProfileView />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

// App — top-level component wrapped in AuthProvider.
function App() {
  return (
    <ThemeControlProvider>
      <AuthProvider>
        <BrowserRouter>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e293b',
                color: '#fff',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)'
              },
            }}
          />
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeControlProvider>
  );
}

export default App;
