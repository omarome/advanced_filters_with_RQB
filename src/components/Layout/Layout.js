import React, { useState } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import { IconButton, Badge, Tooltip } from '@mui/material';
import { LucideZap, LucideBell, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { useThemeControl } from '../../context/ThemeContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationMenu from '../NotificationMenu/NotificationMenu';
import GlobalSearch from '../GlobalSearch/GlobalSearch';
import '../../styles/Layout.less';

const Layout = ({ children, sidebarContent, analyticsContent, bannerContent, modalsContent }) => {
  const { mode } = useThemeControl();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const isHub = location.pathname === '/directory' || location.pathname.startsWith('/sales') || location.pathname.startsWith('/team') || location.pathname.startsWith('/automations') || location.pathname.startsWith('/segments');

  // Use a single state for sidebar visibility across all screen sizes
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024);

  // Notification Menu State
  const [notifAnchorEl, setNotifAnchorEl] = useState(null);
  const handleNotifOpen = (event) => setNotifAnchorEl(event.currentTarget);
  const handleNotifClose = () => setNotifAnchorEl(null);

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
            <Tooltip title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}>
              <IconButton
                className="sidebar-toggle"
                data-testid="sidebar-toggle-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                sx={{ mr: 1, color: 'var(--text-color)', display: isHub ? 'inline-flex' : 'none' }}
              >
                {sidebarOpen ? <PanelLeftClose size={24} /> : <PanelLeftOpen size={24} />}
              </IconButton>
            </Tooltip>
            <div className="logo-box" onClick={() => navigate('/team')}>
              <LucideZap size={24} />
            </div>
            <GlobalSearch />
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
                data-testid="sidebar-overlay"
              />
              <aside className={`sidebar animate-slide-up delay-100 ${sidebarOpen ? 'is-open' : ''}`}>
                {React.cloneElement(sidebarContent, { 
                  onToggleSidebar: () => setSidebarOpen(!sidebarOpen), 
                  isSidebarOpen: sidebarOpen 
                })}
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
