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
 * Fetches a paginated list of organizations.
 * Supports search, sortBy, and sortDir.
 */
export const fetchOrganizations = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', params.page);
  if (params.size !== undefined) searchParams.set('size', params.size);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);
  if (params.search) searchParams.set('search', params.search);

  const url = `${API_BASE}/sales/organizations?${searchParams.toString()}`;
  
  const response = await fetch(url, { headers: getAuthHeader() });
  if (!response.ok) throw new Error(`Failed to fetch organizations: ${response.status}`);
  return response.json();
};

/**
 * Fetches a single organization by ID.
 */
export const getOrganization = async (id) => {
  const response = await fetch(`${API_BASE}/sales/organizations/${id}`, { headers: getAuthHeader() });
  if (!response.ok) throw new Error(`Failed to fetch organization: ${response.status}`);
  return response.json();
};

/**
 * Creates a new organization.
 */
export const createOrganization = async (data) => {
  const response = await fetch(`${API_BASE}/sales/organizations`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create organization: ${response.status}`);
  }
  return response.json();
};

/**
 * Updates an organization fully.
 */
export const updateOrganization = async (id, data) => {
  const response = await fetch(`${API_BASE}/sales/organizations/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update organization: ${response.status}`);
  }
  return response.json();
};

/**
 * Soft deletes an organization.
 */
export const deleteOrganization = async (id) => {
  const response = await fetch(`${API_BASE}/sales/organizations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error(`Failed to delete organization: ${response.status}`);
  return true;
};
