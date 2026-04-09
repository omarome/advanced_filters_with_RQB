// App.js
import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';
import { LucideZap, LucideSearch, LucideBell, LucideMoon, LucideSun, PanelLeftOpen, PanelLeftClose, LucideX, LucideLogOut, LucideUser } from 'lucide-react';

import CollapsibleList from './components/CollapsibleList/CollapsibleList';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import ProfileView from './components/ProfileView/ProfileView';
import Layout from './components/Layout/Layout';
import SidebarNavigation from './components/Sidebar/SidebarNavigation';

import QuickFilterBuilder from './components/Sidebar/QuickFilterBuilder';
import SalesSidebarSavedViews from './components/Sidebar/SalesSidebarSavedViews';
import OrganizationsList from './pages/Sales/OrganizationsList';
import ContactsList from './pages/Sales/ContactsList';
import OpportunitiesList from './pages/Sales/OpportunitiesList';
import PipelinePage from './pages/Sales/PipelinePage';
import SalesDashboard from './pages/Sales/SalesDashboard';
import CrmQueryPage from './pages/Segments/CrmQueryPage';
import AutomationsPage from './components/Automations/AutomationsPage';
import TeamPage from './pages/Team/TeamPage';
import UserGuidePage from './pages/Help/UserGuidePage';
import DataSourceBanner from './components/DataSourceBanner/DataSourceBanner';

import { mockUsers } from './data/mockData';
import { mockVariables } from './data/mockVariables';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { ThemeControlProvider, useThemeControl } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { Toaster, toast } from 'react-hot-toast';
import EmailModal from './components/EmailModal/EmailModal';
import ConfirmationModal from './components/ConfirmationModal/ConfirmationModal';
import SavedViewModal from './components/SavedViewModal/SavedViewModal';
import { fetchUsers, fetchVariables, saveView, fetchSavedViews, deleteSavedView } from './services/userApi';
import { useFcmToken } from './hooks/useFcmToken';
import './styles/App.less';

/**
 * Inner app shell — rendered only when authenticated.
 */
function AppContent() {
  const { user, isAuthenticated, isLoading, handleOAuthSuccess } = useAuth();
  const { mode } = useThemeControl();

  // Initialize FCM push notifications once authenticated
  useFcmToken(isAuthenticated);
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const location = useLocation();

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

  // ── Handle Global Sorting State ─────────────────────────
  const [sortConfig, setSortConfig] = useState({ field: null, direction: 'asc' });
  const [isSortLoading, setIsSortLoading] = useState(false);

  const handleSortChange = useCallback((field, direction) => {
    setSortConfig({ field, direction });
  }, []);

  // Re-fetch users when sort changes (only for live data)
  useEffect(() => {
    if (!isAuthenticated || !dataFetchedRef.current || isLive === null) return;

    if (isLive && sortConfig.field) {
      setIsSortLoading(true);
      fetchUsers({ sortBy: sortConfig.field, sortDir: sortConfig.direction })
        .then(setUsers)
        .catch(() => { /* keep current data on error */ })
        .finally(() => setIsSortLoading(false));
    } else if (isLive && !sortConfig.field) {
      // Reset to unsorted — re-fetch without sort params
      setIsSortLoading(true);
      fetchUsers()
        .then(setUsers)
        .catch(() => {})
        .finally(() => setIsSortLoading(false));
    }
  }, [sortConfig, isLive, isAuthenticated]);

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
  const [isSaveViewModalOpen, setIsSaveViewModalOpen] = useState(false);
  const [savedViews, setSavedViews] = useState([]);

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

  const handleSaveView = useCallback(async (name, savedQuery) => {
    try {
      await saveView({
        name,
        queryJson: JSON.stringify(savedQuery)
      });
      toast.success(`View "${name}" saved successfully!`, {
        icon: '💾',
        style: {
          background: mode === 'dark' ? '#0f172a' : '#fff',
          color: mode === 'dark' ? '#fff' : '#1e293b',
          border: mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
        }
      });
      // Refresh saved views after a successful save
      const updatedViews = await fetchSavedViews();
      setSavedViews(updatedViews);
    } catch (error) {
      toast.error(error.message || 'Failed to save view');
      throw error; // Let the modal handle it if needed
    }
  }, [mode]);

  const handleDeleteSavedView = useCallback(async (id) => {
    try {
      await deleteSavedView(id);
      setSavedViews(prev => prev.filter(view => view.id !== id));
      toast.success('Saved view deleted.', {
        icon: '🗑️',
        style: {
          background: mode === 'dark' ? '#0f172a' : '#fff',
          color: mode === 'dark' ? '#fff' : '#1e293b',
          border: mode === 'dark' ? '1px solid #334155' : '1px solid #e2e8f0'
        }
      });
    } catch (error) {
      toast.error(error.message || 'Failed to delete saved view');
    }
  }, [mode]);

  useEffect(() => {
    if (!isAuthenticated || dataFetchedRef.current) return;
    dataFetchedRef.current = true;

    setIsDataLoading(true);
    Promise.all([fetchUsers(), fetchVariables(), fetchSavedViews()])
      .then(([usersData, variablesData, savedViewsData]) => {
        setUsers(usersData);
        setVariables(variablesData);
        setSavedViews(savedViewsData);
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

  const analytics = null;

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
      <SavedViewModal 
        isOpen={isSaveViewModalOpen}
        onClose={() => setIsSaveViewModalOpen(false)}
        query={query}
        onSave={handleSaveView}
      />
    </>
  );

  return (
    <Layout
      analyticsContent={analytics}
      sidebarContent={
        <SidebarNavigation>
          {(() => {
            const path = location.pathname;
            let entityType = null;
            if (path === '/directory') entityType = 'TEAM_MEMBER';
            else if (path === '/sales/organizations') entityType = 'ORGANIZATION';
            else if (path === '/sales/contacts') entityType = 'CONTACT';
            else if (path === '/sales/pipeline') entityType = 'OPPORTUNITY';

            if (entityType) {
              return (
                <QuickFilterBuilder
                  entityType={entityType}
                  query={query}
                  onQueryChange={handleQueryChange}
                  onResetQuery={handleResetQuery}
                  variables={variables}
                  users={users}
                  savedViews={savedViews}
                  onSaveView={() => setIsSaveViewModalOpen(true)}
                  onDeleteView={handleDeleteSavedView}
                />
              );
            }
            return null;
          })()}
        </SidebarNavigation>
      }
      bannerContent={banner}
      modalsContent={modals}
    >
      <ErrorBoundary>
        <Routes>
          <Route path="/directory" element={
            <CollapsibleList
              users={users}
              variables={variables}
              isDataLoading={isDataLoading}
              isSortLoading={isSortLoading}
              query={query}
              onQueryChange={handleQueryChange}
              onResetQuery={handleResetQuery}
              onBulkDelete={handleBulkDeleteRequested}
              onBulkEmail={handleBulkEmailRequested}
              onSaveView={() => setIsSaveViewModalOpen(true)}
              sortConfig={sortConfig}
              onSortChange={handleSortChange}
            />
          } />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/sales/organizations" element={<OrganizationsList query={query} onQueryChange={handleQueryChange} onResetQuery={handleResetQuery} variables={variables} users={users} />} />
          <Route path="/sales/contacts" element={<ContactsList query={query} onQueryChange={handleQueryChange} onResetQuery={handleResetQuery} variables={variables} users={users} />} />
          <Route path="/sales/opportunities" element={<OpportunitiesList query={query} onQueryChange={handleQueryChange} onResetQuery={handleResetQuery} variables={variables} users={users} />} />
          <Route path="/sales/pipeline" element={<PipelinePage query={query} onQueryChange={handleQueryChange} onResetQuery={handleResetQuery} variables={variables} users={users} />} />
          <Route path="/sales/dashboard" element={<SalesDashboard />} />
          <Route path="/automations" element={<AutomationsPage />} />
          <Route path="/segments" element={<CrmQueryPage />} />
          <Route path="/settings/account" element={<ProfileView />} />
          <Route path="/help" element={<UserGuidePage />} />
          <Route path="*" element={<Navigate to="/team" replace />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

// App — top-level component wrapped in AuthProvider.
function App() {
  return (
    <ThemeControlProvider>
      <NotificationProvider>
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
      </NotificationProvider>
    </ThemeControlProvider>
  );
}

export default App;
