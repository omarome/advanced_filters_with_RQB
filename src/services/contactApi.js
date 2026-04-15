import { apiJson } from './apiClient';

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

  return apiJson(`/sales/contacts?${searchParams.toString()}`);
};

/**
 * Fetches a single contact by ID.
 */
export const getContact = async (id) => {
  return apiJson(`/sales/contacts/${id}`);
};

/**
 * Creates a new contact.
 */
export const createContact = async (data) => {
  return apiJson('/sales/contacts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Updates a contact fully (PUT).
 */
export const updateContact = async (id, data) => {
  return apiJson(`/sales/contacts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Updates a contact partially (PATCH).
 */
export const patchContact = async (id, data) => {
  return apiJson(`/sales/contacts/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Soft deletes a contact.
 */
export const deleteContact = async (id) => {
  await apiJson(`/sales/contacts/${id}`, {
    method: 'DELETE',
  });
  return true;
};
