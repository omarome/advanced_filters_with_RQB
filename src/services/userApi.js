const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Fetches all users from the backend API.
 */
export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }
  return response.json();
};

/**
 * Fetches field/variable definitions from the backend API.
 * Each variable has: id, name, label, offset, type (UDINT, STRING, BOOL, etc.)
 */
export const fetchVariables = async () => {
  const response = await fetch(`${API_BASE_URL}/variables`);
  if (!response.ok) {
    throw new Error(`Failed to fetch variables: ${response.status}`);
  }
  return response.json();
};
