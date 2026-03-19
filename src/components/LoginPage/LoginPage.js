import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  Divider,
  CircularProgress,
  Link,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';
import { IconButton, Tooltip } from '@mui/material';
import { useAuth } from '../../context/AuthProvider';
import { useThemeControl } from '../../context/ThemeContext';
import '../../styles/LoginPage.less';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * LoginPage – email/password login with optional social sign-in.
 */
export default function LoginPage({ onSwitchToRegister }) {
  const { login } = useAuth();
  const { mode, toggleTheme } = useThemeControl();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_BASE}/auth/oauth2/google`;
  };

  return (
    <Box className="login-page">
      <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'light'} mode`}>
        <IconButton onClick={toggleTheme} className="login-theme-toggle">
          {mode === 'light' ? <DarkModeIcon /> : <LightModeIcon />}
        </IconButton>
      </Tooltip>

      <Paper className="login-card" elevation={0}>
        <Box className="login-icon-wrapper">
          <LockOutlinedIcon className="login-icon" />
        </Box>

        <Typography variant="h4" className="login-title">
          Welcome Back
        </Typography>
        <Typography variant="body2" className="login-subtitle">
          Sign in to QueryForge
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
            {error}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit} className="login-form">
          <TextField
            id="login-email"
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            required
            autoFocus
            variant="outlined"
            className="login-field"
          />
          <TextField
            id="login-password"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            required
            variant="outlined"
            className="login-field"
          />
          <Button
            id="login-submit"
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={loading}
            className="login-button"
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </Box>

        <Divider className="login-divider">or</Divider>

        <Button
          id="login-google"
          variant="outlined"
          fullWidth
          size="large"
          startIcon={<GoogleIcon />}
          onClick={handleGoogleLogin}
          className="login-google-button"
        >
          Sign in with Google
        </Button>

        <Typography variant="body2" className="login-footer">
          Don't have an account?{' '}
          <Link
            component="button"
            variant="body2"
            onClick={onSwitchToRegister}
            id="switch-to-register"
          >
            Create one
          </Link>
        </Typography>
      </Paper>
    </Box>
  );
}
