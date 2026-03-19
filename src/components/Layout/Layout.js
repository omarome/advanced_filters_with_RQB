import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { Typography, IconButton, Badge, Tooltip, Menu, MenuItem, ListItemIcon, Divider } from '@mui/material';
import { LucideLayers, LucideSearch, LucideBell, LucideMoon, LucideSun, LucideMenu, LucideX, LucideLogOut, LucideUser } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { useThemeControl } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationMenu from '../NotificationMenu/NotificationMenu';
import '../../styles/Layout.less';

const Layout = ({ children, sidebarContent, analyticsContent, bannerContent, modalsContent }) => {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeControl();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const isHub = location.pathname === '/';

  // Use a single state for sidebar visibility across all screen sizes
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  // Notification Menu State
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

  // Profile Menu State
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const handleMenuOpen = (event) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);
  const handleLogout = () => {
    handleMenuClose();
    logout();
  };

  // Update layout when window resizes to handle responsive behavior
  React.useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(true);
      } else {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className={`insight-layout ${mode === 'dark' ? 'dark-mode' : ''}`}>
      {/* Sticky Header */}
      <header className="site-header animate-fade">
        <div className="header-container">
          <div className="header-left">
            <IconButton
              className="sidebar-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ mr: 1, color: 'var(--text-color)', display: isHub ? 'inline-flex' : 'none' }}
            >
              {sidebarOpen ? <LucideX size={24} /> : <LucideMenu size={24} />}
            </IconButton>
            <div className="logo-box" onClick={() => navigate('/')}>
              <LucideLayers size={24} />
            </div>
            <Typography variant="h1" className="site-title" onClick={() => navigate('/')}>QueryForge</Typography>
            {/* <div className="search-bar">
              <LucideSearch className="search-icon" size={18} />
              <input type="text" placeholder="Search across all records..." />
            </div> */}
          </div>

          <div className="header-right">
            <IconButton className="header-action" onClick={handleNotifOpen}>
              <Badge 
                color="error" 
                badgeContent={unreadCount} 
                variant={unreadCount > 0 ? "standard" : "dot"}
                invisible={unreadCount === 0}
              >
                <LucideBell size={20} />
              </Badge>
            </IconButton>
            <NotificationMenu anchorEl={notifAnchorEl} onClose={handleNotifClose} />
            <IconButton className="header-action" onClick={toggleTheme}>
              {mode === 'light' ? <LucideMoon size={20} /> : <LucideSun size={20} />}
            </IconButton>
            <div className="header-divider" />

            <Tooltip title="Account settings">
              <div
                className="user-profile"
                onClick={handleMenuOpen}
              >
                <div className="user-info">
                  <span className="user-name">{user?.displayName || 'Admin User'}</span>
                  <span className="user-role">Super Admin</span>
                </div>
                <img
                  src={user?.photoUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'Admin User')}&background=7c69ef&color=fff`}
                  alt="Profile"
                  className="profile-img"
                />
              </div>
            </Tooltip>

            <Menu
              anchorEl={anchorEl}
              open={open}
              onClose={handleMenuClose}
              onClick={handleMenuClose}
              PaperProps={{
                elevation: 0,
                sx: {
                  overflow: 'visible',
                  filter: mode === 'dark'
                    ? 'drop-shadow(0px 4px 12px rgba(124, 105, 239, 0.4))' // Soft primary color glow
                    : 'drop-shadow(0px 2px 8px rgba(0,0,0,0.15))',
                  mt: 1.5,
                  backgroundColor: mode === 'dark' ? '#1e293b' : 'var(--background)',
                  color: 'var(--text-color)',
                  '& .MuiAvatar-root': {
                    width: 32,
                    height: 32,
                    ml: -0.5,
                    mr: 1,
                  },
                  '&::before': {
                    content: '""',
                    display: 'block',
                    position: 'absolute',
                    top: 0,
                    right: 14,
                    width: 10,
                    height: 10,
                    backgroundColor: mode === 'dark' ? '#1e293b' : 'var(--background)',
                    transform: 'translateY(-50%) rotate(45deg)',
                    zIndex: 0,
                  },
                },
              }}
              transformOrigin={{ horizontal: 'right', vertical: 'top' }}
              anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
              <MenuItem onClick={() => { handleMenuClose(); navigate('/settings/account'); }}>
                <ListItemIcon>
                  <LucideUser size={18} color="var(--text-muted)" />
                </ListItemIcon>
                Profile settings
              </MenuItem>
              <Divider sx={{ borderColor: 'var(--border-color-light)' }} />
              <MenuItem onClick={handleLogout}>
                <ListItemIcon>
                  <LucideLogOut size={18} color="var(--error-color)" />
                </ListItemIcon>
                <Typography color="var(--error-color)" variant="inherit">Sign out</Typography>
              </MenuItem>
            </Menu>
          </div>
        </div>
      </header>

      <main className="main-content">
        {/* Banner Content (Top) */}
        {bannerContent && (
          <div className="banner-row animate-fade">
            {bannerContent}
          </div>
        )}

        {/* Analytics Row - Only on Hub */}
        {isHub && analyticsContent && (
          <section className="analytics-grid animate-slide-up">
            {analyticsContent}
          </section>
        )}

        <div className={`content-layout-grid ${!isHub ? 'full-width' : ''}`}>
          {/* Sidebar - Only on Hub */}
          {isHub && (
            <>
              <div 
                className={`sidebar-overlay ${sidebarOpen ? 'is-open' : ''}`} 
                onClick={() => setSidebarOpen(false)} 
              />
              <aside className={`sidebar animate-slide-up delay-100 ${sidebarOpen ? 'is-open' : ''}`}>
                {sidebarContent}
              </aside>
            </>
          )}

          {/* Page Content */}
          <section className={`page-content-area animate-slide-up ${isHub ? 'delay-200' : ''}`}>
            {children}
          </section>

          {/* Lifted Modals */}
          {modalsContent}
        </div>
      </main>
    </div>
  );
};

export default Layout;
