import React, { useMemo } from 'react';
import { 
  Popover, 
  Typography, 
  IconButton, 
  Box, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Badge,
  Tooltip,
} from '@mui/material';
import { 
  LucideBell, 
  LucideCheckCircle, 
  LucideAlertTriangle, 
  LucideInfo, 
  LucideTrash2,
  LucideCheck,
  LucideX,
  LucideShield,
  LucideSparkles,
  LucideFilter,
  LucideUser,
  LucideDatabase,
  LucideLogIn,
  LucideKey,
  LucideZap,
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useThemeControl } from '../../context/ThemeContext';
import './NotificationMenu.less';

const formatTimeAgo = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString();
};

// Map of keywords in title/message to a specific icon
const KEYWORD_MAP = [
  { keywords: ['auth', 'session', 'login', 'sign in', 're-authenticate', 'password', 'key'], icon: LucideKey, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  { keywords: ['feature', 'new', 'update', 'available', 'sparkle'], icon: LucideSparkles, color: '#8b5cf6', bg: 'rgba(139,92,246,0.15)' },
  { keywords: ['filter', 'query', 'view', 'saved'], icon: LucideFilter, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
  { keywords: ['database', 'sync', 'backup', 'db'], icon: LucideDatabase, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { keywords: ['user', 'profile', 'account', 'welcome'], icon: LucideUser, color: '#6366f1', bg: 'rgba(99,102,241,0.15)' },
  { keywords: ['security', 'permission', 'access', 'shield'], icon: LucideShield, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  { keywords: ['success', 'complete', 'done', 'check'], icon: LucideCheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  { keywords: ['warning', 'alert', 'expire', 'urgent'], icon: LucideAlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
];

const TYPE_FALLBACK = {
  success: { icon: LucideCheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  warning: { icon: LucideAlertTriangle, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  error:   { icon: LucideAlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
  info:    { icon: LucideInfo, color: '#3b82f6', bg: 'rgba(59,130,246,0.15)' },
};

const resolveIcon = (notif) => {
  const text = `${notif.title ?? ''} ${notif.message ?? ''}`.toLowerCase();
  for (const { keywords, icon: Icon, color, bg } of KEYWORD_MAP) {
    if (keywords.some(kw => text.includes(kw))) {
      return { Icon, color, bg };
    }
  }
  const fallback = TYPE_FALLBACK[notif.type] ?? TYPE_FALLBACK.info;
  return { Icon: fallback.icon, color: fallback.color, bg: fallback.bg };
};

const NotificationMenu = ({ anchorEl, onClose }) => {
  const { 
    notifications, 
    unreadCount, 
    markAsRead, 
    markAllAsRead, 
    removeNotification, 
    clearAll 
  } = useNotifications();
  const { mode } = useThemeControl();

  const open = Boolean(anchorEl);
  const id = open ? 'notification-popover' : undefined;

  const handleNotificationClick = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif.id);
    }
  };

  const hasNotifications = notifications.length > 0;

  return (
    <Popover
      id={id}
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      slotProps={{
        paper: {
          className: `notification-popover-paper ${mode === 'dark' ? 'dark' : 'light'}`,
          elevation: 0,
        }
      }}
    >
      <div className="notification-menu">
        <div className="notification-header">
          <div className="header-title-group">
            <Typography variant="h6" className="title">Notifications</Typography>
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount} new</span>
            )}
          </div>
          {hasNotifications && (
            <div className="header-actions">
              <Tooltip title="Mark all as read" placement="top">
                <IconButton size="small" onClick={markAllAsRead} disabled={unreadCount === 0} className="action-btn">
                  <LucideCheck size={16} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear all" placement="top">
                <IconButton size="small" onClick={clearAll} className="action-btn danger">
                  <LucideTrash2 size={16} />
                </IconButton>
              </Tooltip>
            </div>
          )}
        </div>

        <Divider className="notification-divider" />

        <div className="notification-list-container custom-scrollbar">
          {!hasNotifications ? (
            <div className="empty-state">
              <div className="empty-icon-wrapper">
                <LucideBell size={32} className="empty-icon" />
              </div>
              <Typography variant="subtitle1" className="empty-title">All caught up!</Typography>
              <Typography variant="body2" className="empty-desc">You have no new notifications right now.</Typography>
            </div>
          ) : (
            <List className="notification-list">
              {notifications.map((notif) => (
                <ListItem 
                  key={notif.id} 
                  className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notif)}
                  secondaryAction={
                    <IconButton 
                      edge="end" 
                      size="small" 
                      onClick={(e) => { e.stopPropagation(); removeNotification(notif.id); }}
                      className="remove-btn"
                    >
                      <LucideX size={14} />
                    </IconButton>
                  }
                >
                  <ListItemAvatar>
                    {(() => {
                      const { Icon, color, bg } = resolveIcon(notif);
                      return (
                        <Avatar sx={{ bgcolor: bg, width: 40, height: 40 }}>
                          <Icon size={20} color={color} strokeWidth={2.5} />
                        </Avatar>
                      );
                    })()}
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <div className="notif-primary">
                        <span className="notif-title">{notif.title}</span>
                        {!notif.isRead && <span className="unread-dot" />}
                      </div>
                    }
                    secondary={
                      <Box component="span" className="notif-secondary" sx={{ display: 'block' }}>
                        <Typography component="span" variant="body2" className="notif-message" sx={{ display: 'block', color: 'inherit' }}>
                          {notif.message}
                        </Typography>
                        <Typography component="span" variant="caption" className="notif-time" sx={{ display: 'block', mt: 0.5, opacity: 0.7 }}>
                          {formatTimeAgo(notif.timestamp)}
                        </Typography>
                      </Box>
                    }
                    secondaryTypographyProps={{ component: 'div' }}
                  />
                </ListItem>
              ))}
            </List>
          )}
        </div>
        
        {hasNotifications && (
          <>
            <Divider className="notification-divider" />
            <div className="notification-footer">
              <Button className="view-all-btn">
                View All Notifications
              </Button>
            </div>
          </>
        )}
      </div>
    </Popover>
  );
};

export default NotificationMenu;
