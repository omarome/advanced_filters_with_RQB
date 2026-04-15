import { apiJson } from './apiClient';

/**
 * Fetches a paginated timeline of activities for a specific entity.
 * @param {string} entityType - 'ORGANIZATION' | 'CONTACT' | 'OPPORTUNITY'
 * @param {string} entityId  - UUID of the entity
 * @param {number} page      - zero-based page index
 * @param {number} size      - items per page
 */
export const fetchActivities = async (entityType, entityId, page = 0, size = 20) => {
  const params = new URLSearchParams({
    entityType,
    entityId,
    page: String(page),
    size: String(size),
  });

  return apiJson(`/sales/activities?${params}`);
};

/**
 * Creates a new activity.
 */
export const createActivity = async (data) => {
  return apiJson('/sales/activities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Updates an activity (partial).
 */
export const updateActivity = async (id, data) => {
  return apiJson(`/sales/activities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Soft deletes an activity.
 */
export const deleteActivity = async (id) => {
  await apiJson(`/sales/activities/${id}`, {
    method: 'DELETE',
  });
  return true;
};
