import { apiJson } from './apiClient';

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

  return apiJson(`/sales/organizations?${searchParams.toString()}`);
};

/**
 * Fetches a single organization by ID.
 */
export const getOrganization = async (id) => {
  return apiJson(`/sales/organizations/${id}`);
};

/**
 * Creates a new organization.
 */
export const createOrganization = async (data) => {
  return apiJson('/sales/organizations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Updates an organization fully.
 */
export const updateOrganization = async (id, data) => {
  return apiJson(`/sales/organizations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Soft deletes an organization.
 */
export const deleteOrganization = async (id) => {
  await apiJson(`/sales/organizations/${id}`, {
    method: 'DELETE',
  });
  return true;
};
