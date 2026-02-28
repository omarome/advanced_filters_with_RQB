const API_BASE_URL = 'http://localhost:8080/api';

/**
 * Fetches all users from the backend API.
 * Falls back to an empty array on error.
 */
export const fetchUsers = async () => {
  const response = await fetch(`${API_BASE_URL}/users`);
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }
  return response.json();
};
