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
 * Fetches a paginated list of contacts.
 * Supports filtering by organizationId, search, sortBy, and sortDir.
 */
export const fetchContacts = async (params = {}) => {
  const searchParams = new URLSearchParams();
  if (params.page !== undefined) searchParams.set('page', params.page);
  if (params.size !== undefined) searchParams.set('size', params.size);
  if (params.sortBy) searchParams.set('sortBy', params.sortBy);
  if (params.sortDir) searchParams.set('sortDir', params.sortDir);
  if (params.search) searchParams.set('search', params.search);
  if (params.organizationId) searchParams.set('organizationId', params.organizationId);

  const url = `${API_BASE}/sales/contacts?${searchParams.toString()}`;
  
  const response = await fetch(url, { headers: getAuthHeader() });
  if (!response.ok) throw new Error(`Failed to fetch contacts: ${response.status}`);
  return response.json();
};

/**
 * Fetches a single contact by ID.
 */
export const getContact = async (id) => {
  const response = await fetch(`${API_BASE}/sales/contacts/${id}`, { headers: getAuthHeader() });
  if (!response.ok) throw new Error(`Failed to fetch contact: ${response.status}`);
  return response.json();
};

/**
 * Creates a new contact.
 */
export const createContact = async (data) => {
  const response = await fetch(`${API_BASE}/sales/contacts`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create contact: ${response.status}`);
  }
  return response.json();
};

/**
 * Updates a contact fully (PUT).
 */
export const updateContact = async (id, data) => {
  const response = await fetch(`${API_BASE}/sales/contacts/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update contact: ${response.status}`);
  }
  return response.json();
};

/**
 * Updates a contact partially (PATCH).
 */
export const patchContact = async (id, data) => {
  const response = await fetch(`${API_BASE}/sales/contacts/${id}`, {
    method: 'PATCH',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to patch contact: ${response.status}`);
  }
  return response.json();
};

/**
 * Soft deletes a contact.
 */
export const deleteContact = async (id) => {
  const response = await fetch(`${API_BASE}/sales/contacts/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader()
  });
  if (!response.ok) throw new Error(`Failed to delete contact: ${response.status}`);
  return true;
};
