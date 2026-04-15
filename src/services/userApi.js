import { apiJson } from './apiClient';

/**
 * Fetches all users from the backend API.
 * @param {{ sortBy?: string, sortDir?: string }} [sortConfig] optional sort params
 */
export const fetchUsers = async (sortConfig) => {
  let url = '/users';

  if (sortConfig?.sortBy) {
    const params = new URLSearchParams();
    params.set('sortBy', sortConfig.sortBy);
    if (sortConfig.sortDir) params.set('sortDir', sortConfig.sortDir);
    url += `?${params.toString()}`;
  }

  return apiJson(url);
};

/**
 * Fetches field/variable definitions from the backend API.
 * Each variable has: id, name, label, offset, type (UDINT, STRING, BOOL, etc.)
 */
export const fetchVariables = async () => {
  return apiJson('/variables');
};

/**
 * Saves a filter view to the backend.
 * @param {Object} viewData - { name: string, queryJson: string }
 */
export const saveView = async (viewData) => {
  return apiJson('/saved-views', {
    method: 'POST',
    body: JSON.stringify(viewData),
  });
};

/**
 * Fetches saved filter views, optionally filtered by entity type.
 * @param {string} [entityType] - e.g. 'TEAM_MEMBER', 'ORGANIZATION', 'CONTACT', 'OPPORTUNITY'
 */
export const fetchSavedViews = async (entityType) => {
  const url = entityType
    ? `/saved-views?entityType=${encodeURIComponent(entityType)}`
    : '/saved-views';
  return apiJson(url);
};

/**
 * Deletes a saved filter view.
 * @param {number|string} id - The ID of the view to delete.
 */
export const deleteSavedView = async (id) => {
  await apiJson(`/saved-views/${id}`, { method: 'DELETE' });
  return true;
};

// ─── Notification API ────────────────────────────────────────────────────────

/**
 * Fetches all notifications from the backend, ordered newest first.
 */
export const fetchNotifications = async () => {
  return apiJson('/notifications');
};

/**
 * Marks a single notification as read.
 * @param {number|string} id
 */
export const markNotificationRead = async (id) => {
  await apiJson(`/notifications/${id}/read`, { method: 'PUT' });
};

/**
 * Marks all notifications as read.
 */
export const markAllNotificationsRead = async () => {
  await apiJson('/notifications/read-all', { method: 'PUT' });
};

/**
 * Deletes a single notification.
 * @param {number|string} id
 */
export const deleteNotification = async (id) => {
  await apiJson(`/notifications/${id}`, { method: 'DELETE' });
  return true;
};

/**
 * Deletes all notifications.
 */
export const deleteAllNotifications = async () => {
  await apiJson('/notifications', { method: 'DELETE' });
  return true;
};
