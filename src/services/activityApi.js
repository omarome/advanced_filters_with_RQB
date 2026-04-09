import { getAccessToken } from '../context/AuthProvider';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeader() {
  const token = getAccessToken();
  if (token) {
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
  }
  return { 'Content-Type': 'application/json' };
}

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

  const response = await fetch(`${API_BASE}/sales/activities?${params}`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error(`Failed to fetch activities: ${response.status}`);
  return response.json();
};

/**
 * Creates a new activity.
 */
export const createActivity = async (data) => {
  const response = await fetch(`${API_BASE}/sales/activities`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create activity: ${response.status}`);
  }
  return response.json();
};

/**
 * Updates an activity (partial).
 */
export const updateActivity = async (id, data) => {
  const response = await fetch(`${API_BASE}/sales/activities/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update activity: ${response.status}`);
  }
  return response.json();
};

/**
 * Soft deletes an activity.
 */
export const deleteActivity = async (id) => {
  const response = await fetch(`${API_BASE}/sales/activities/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error(`Failed to delete activity: ${response.status}`);
  return true;
};
