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
 * Fetches a paginated list of opportunities.
 * Supports filtering by organizationId, contactId, stage, search, sortBy, and sortDir.
 */
export const fetchOpportunities = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', params.page);
  if (params.size !== undefined) searchParams.set('size', params.size);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);
  if (params.search) searchParams.set('search', params.search);
  if (params.organizationId) searchParams.set('organizationId', params.organizationId);
  if (params.contactId) searchParams.set('contactId', params.contactId);
  if (params.stage) searchParams.set('stage', params.stage);

  const url = `${API_BASE}/sales/opportunities?${searchParams.toString()}`;
  
  const response = await fetch(url, { headers: getAuthHeader() });
  if (!response.ok) throw new Error(`Failed to fetch opportunities: ${response.status}`);
  return response.json();
};

/**
 * Fetches a single opportunity by ID.
 */
export const getOpportunity = async (id) => {
  const response = await fetch(`${API_BASE}/sales/opportunities/${id}`, { headers: getAuthHeader() });
  if (!response.ok) throw new Error(`Failed to fetch opportunity: ${response.status}`);
  return response.json();
};

/**
 * Creates a new opportunity.
 */
export const createOpportunity = async (data) => {
  const response = await fetch(`${API_BASE}/sales/opportunities`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create opportunity: ${response.status}`);
  }
  return response.json();
};

/**
 * Updates an opportunity fully.
 */
export const updateOpportunity = async (id, data) => {
  const response = await fetch(`${API_BASE}/sales/opportunities/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update opportunity: ${response.status}`);
  }
  return response.json();
};

/**
 * Partially updates an opportunity (e.g., stage change for Kanban drag-and-drop).
 */
export const patchOpportunity = async (id, data) => {
  const response = await fetch(`${API_BASE}/sales/opportunities/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to patch opportunity: ${response.status}`);
  }
  return response.json();
};

/**
 * Soft deletes an opportunity.
 */
export const deleteOpportunity = async (id) => {
  const response = await fetch(`${API_BASE}/sales/opportunities/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error(`Failed to delete opportunity: ${response.status}`);
  return true;
};
