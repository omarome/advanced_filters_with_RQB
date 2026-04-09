import { getAccessToken } from '../context/AuthProvider';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function authHeaders() {
  const token = getAccessToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

/**
 * Execute a CRM segment query.
 * @param {object} req - { entityType, combinator, rules, page, size }
 */
export const executeCrmQuery = async (req) => {
  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(req),
  });
  if (!res.ok) throw new Error(`Query failed: ${res.status}`);
  return res.json();
};

/**
 * Fetch field metadata for all entity types.
 * Returns: { CONTACT: [...], ORGANIZATION: [...], ... }
 */
export const fetchAllFields = async () => {
  const res = await fetch(`${API_BASE}/query/fields`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load fields: ${res.status}`);
  return res.json();
};

/**
 * Fetch field metadata for a single entity type.
 */
export const fetchFieldsForEntity = async (entityType) => {
  const res = await fetch(`${API_BASE}/query/fields/${entityType}`, { headers: authHeaders() });
  if (!res.ok) throw new Error(`Failed to load fields: ${res.status}`);
  return res.json();
};
