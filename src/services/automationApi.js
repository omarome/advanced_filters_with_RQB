import { getAccessToken } from '../context/AuthProvider';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeader() {
  const token = getAccessToken();
  if (token) {
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  return { 'Content-Type': 'application/json' };
}

/**
 * Fetches all automation rules.
 */
export const fetchAutomationRules = async () => {
  const response = await fetch(`${API_BASE}/automations`, {
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error(`Failed to fetch rules: ${response.status}`);
  return response.json();
};

/**
 * Creates a new automation rule.
 */
export const createAutomationRule = async (data) => {
  const response = await fetch(`${API_BASE}/automations`, {
    method: 'POST',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to create rule: ${response.status}`);
  }
  return response.json();
};

/**
 * Updates an automation rule.
 */
export const updateAutomationRule = async (id, data) => {
  const response = await fetch(`${API_BASE}/automations/${id}`, {
    method: 'PUT',
    headers: getAuthHeader(),
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `Failed to update rule: ${response.status}`);
  }
  return response.json();
};

/**
 * Deletes an automation rule.
 */
export const deleteAutomationRule = async (id) => {
  const response = await fetch(`${API_BASE}/automations/${id}`, {
    method: 'DELETE',
    headers: getAuthHeader(),
  });
  if (!response.ok) throw new Error(`Failed to delete rule: ${response.status}`);
  return true;
};
