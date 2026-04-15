import { apiJson } from './apiClient';

/**
 * Fetches all automation rules.
 */
export const fetchAutomationRules = async () => {
  return apiJson('/automations');
};

/**
 * Creates a new automation rule.
 */
export const createAutomationRule = async (data) => {
  return apiJson('/automations', {
    method: 'POST',
    body: JSON.stringify(data),
  });
};

/**
 * Updates an automation rule.
 */
export const updateAutomationRule = async (id, data) => {
  return apiJson(`/automations/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
};

/**
 * Deletes an automation rule.
 */
export const deleteAutomationRule = async (id) => {
  await apiJson(`/automations/${id}`, {
    method: 'DELETE',
  });
  return true;
};
