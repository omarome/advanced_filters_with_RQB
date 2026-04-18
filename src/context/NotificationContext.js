import React, { createContext, useContext, useState, useCallback, useMemo, useEffect } from 'react';
import {
  fetchNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification as deleteNotificationApi,
  deleteAllNotifications as deleteAllNotificationsApi,
} from '../services/userApi';

const NotificationContext = createContext(null);

const isPersistedIdStatic = (id) => typeof id === 'number' || /^\d+$/.test(String(id));

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const POLL_INTERVAL_MS = 30_000;

  // ── Load from backend + poll for new notifications ───────────────────────
  useEffect(() => {
    const fetchAndMerge = async (isInitial = false) => {
      try {
        if (isInitial) setIsLoading(true);
        const data = await fetchNotifications();
        setNotifications(prev => {
          // Keep local (non-persisted) notifications, merge backend ones
          const local = prev.filter(n => !isPersistedIdStatic(n.id));
          // Preserve isRead state for items already read locally but not yet synced
          const merged = data.map(n => {
            const existing = prev.find(p => p.id === n.id);
            return existing ? { ...n, isRead: existing.isRead || n.isRead } : n;
          });
          return [...local, ...merged];
        });
      } catch (err) {
        if (isInitial) {
          console.error('Failed to load notifications:', err);
          setError(err.message);
        }
      } finally {
        if (isInitial) setIsLoading(false);
      }
    };

    fetchAndMerge(true);
    const timer = setInterval(() => fetchAndMerge(false), POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(() => {
    fetchNotifications()
      .then(data => {
        setNotifications(prev => {
          const local = prev.filter(n => !isPersistedIdStatic(n.id));
          const merged = data.map(n => {
            const existing = prev.find(p => p.id === n.id);
            return existing ? { ...n, isRead: existing.isRead || n.isRead } : n;
          });
          return [...local, ...merged];
        });
      })
      .catch(() => {});
  }, []);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.isRead).length;
  }, [notifications]);

  // ── Optimistic helpers ───────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    if (!isPersistedIdStatic(id)) return;
    try {
      await markNotificationRead(id);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const previous = notifications;
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    try {
      await markAllNotificationsRead();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
      setNotifications(previous); // rollback
    }
  }, [notifications]);

  const removeNotification = useCallback(async (id) => {
    const previous = notifications;
    setNotifications(prev => prev.filter(n => n.id !== id));
    if (!isPersistedIdStatic(id)) return;
    try {
      await deleteNotificationApi(id);
    } catch (err) {
      console.error('Failed to delete notification:', err);
      setNotifications(previous);
    }
  }, [notifications]);

  const clearAll = useCallback(async () => {
    const previous = notifications;
    setNotifications([]);
    try {
      await deleteAllNotificationsApi();
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
      setNotifications(previous); // rollback
    }
  }, [notifications]);

  // Keep addNotification for future use (e.g. SSE/WebSocket push)
  const addNotification = useCallback((notificationOrMessage, type) => {
    const base = typeof notificationOrMessage === 'string'
      ? { title: notificationOrMessage, message: '', type: type || 'info' }
      : notificationOrMessage;
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      isRead: false,
      timestamp: new Date().toISOString(),
      ...base,
    };
    setNotifications(prev => [newNotif, ...prev]);
  }, []);

  const value = {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    clearAll,
    addNotification,
    removeNotification,
    refresh,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};
