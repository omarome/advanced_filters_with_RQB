import React, { useState } from 'react';
import { Box, IconButton, Typography, Menu, MenuItem, CircularProgress, Divider, Tooltip } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

import CollapsibleList from './components/CollapsibleList/CollapsibleList';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoginPage from './components/LoginPage/LoginPage';
import RegisterPage from './components/RegisterPage/RegisterPage';
import ProfileView from './components/ProfileView/ProfileView';
import { AuthProvider, useAuth } from './context/AuthProvider';
import { ThemeControlProvider, useThemeControl } from './context/ThemeContext';
import './styles/App.less';

/**
 * Inner app shell — rendered only when authenticated.
 */
function AppContent() {
  const { user, isAuthenticated, isLoading, logout, handleOAuthSuccess } = useAuth();
  const { mode, toggleTheme } = useThemeControl();
  const [authView, setAuthView] = useState('login'); // 'login' | 'register'
  const [appView, setAppView] = useState('hub'); // 'hub' | 'profile'
  const [anchorEl, setAnchorEl] = useState(null);

  // ── Handle OAuth Success Redirect ──────────────────────
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const accessToken = params.get('accessToken');
    const refreshToken = params.get('refreshToken');

    if (accessToken && refreshToken && window.location.pathname.includes('/login-success')) {
      handleOAuthSuccess(accessToken, refreshToken);
      // Clean up URL to keep it pretty
      window.history.replaceState({}, document.title, "/");
    }
  }, [handleOAuthSuccess]);

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
        <CircularProgress sx={{ color: '#667eea' }} size={48} />
      </Box>
    );
  }

  // ── Not authenticated → show login or register ──────────
  if (!isAuthenticated) {
    if (authView === 'register') {
      return <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
    }
    return <LoginPage onSwitchToRegister={() => setAuthView('register')} />;
  }

  // ── Authenticated → show main app or profile ────────────
  return (
    <div className="app">
      <Box className="app-header">
        <Typography 
          variant="h1" 
          onClick={() => setAppView('hub')}
          sx={{ 
            cursor: 'pointer', 
            fontSize: '2rem', 
            m: 0, 
            fontWeight: 700,
            color: 'text.primary' // Use theme text color
          }}
        >
          {import.meta.env.VITE_APP_TITLE || 'Smart Filter Hub'}
        </Typography>

        <Box className="app-user-menu">
          <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
            <IconButton onClick={toggleTheme} sx={{ color: mode === 'light' ? '#333' : '#fff', mr: 1 }}>
              {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
            </IconButton>
          </Tooltip>

          <IconButton
            id="user-menu-button"
            onClick={(e) => setAnchorEl(e.currentTarget)}
            sx={{ color: mode === 'light' ? '#333' : '#fff' }}
          >
            <AccountCircleIcon />
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem 
              id="profile-button"
              onClick={() => { setAnchorEl(null); setAppView('profile'); }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {user?.displayName || user?.email} (Profile)
              </Typography>
            </MenuItem>
            <Divider />
            <MenuItem
              id="logout-button"
              onClick={() => { setAnchorEl(null); logout(); }}
            >
              <LogoutIcon fontSize="small" sx={{ mr: 1 }} /> Sign Out
            </MenuItem>
          </Menu>
        </Box>
      </Box>

      <ErrorBoundary>
        {appView === 'profile' ? (
          <ProfileView onBack={() => setAppView('hub')} />
        ) : (
          <CollapsibleList />
        )}
      </ErrorBoundary>
    </div>
  );
}

/**
 * App — top-level component wrapped in AuthProvider.
 */
function App() {
  return (
    <ThemeControlProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeControlProvider>
  );
}

export default App;
