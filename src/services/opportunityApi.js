import { apiJson } from './apiClient';

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

  return apiJson(`/sales/opportunities?${searchParams.toString()}`);
};

/**
 * Fetches a single opportunity by ID.
 */
export const getOpportunity = async (id) => {
  return apiJson(`/sales/opportunities/${id}`);
};

/**
 * Creates a new opportunity.
 */
export const createOpportunity = async (data) => {
  return apiJson('/sales/opportunities', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Updates an opportunity fully.
 */
export const updateOpportunity = async (id, data) => {
  return apiJson(`/sales/opportunities/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Partially updates an opportunity (e.g., stage change for Kanban drag-and-drop).
 */
export const patchOpportunity = async (id, data) => {
  return apiJson(`/sales/opportunities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Soft deletes an opportunity.
 */
export const deleteOpportunity = async (id) => {
  await apiJson(`/sales/opportunities/${id}`, {
    method: 'DELETE',
  });
  return true;
};
