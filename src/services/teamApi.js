/**
 * API client for the Team Management module.
 * Calls /api/team endpoints on the Spring Boot backend.
 */
import { getAccessToken } from '../context/AuthProvider';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

function getAuthHeader() {
  const token = getAccessToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Fetches all active team members (with open deal + activity counts).
 * @returns {Promise<TeamMember[]>}
 */
export const fetchTeamMembers = async () => {
  const res = await fetch(`${API_BASE}/team`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error(`Failed to fetch team: ${res.status}`);
  return res.json();
};

/**
 * Fetches a single team member profile by id.
 * @param {number} id
 * @returns {Promise<TeamMember>}
 */
export const fetchTeamMember = async (id) => {
  const res = await fetch(`${API_BASE}/team/${id}`, {
    headers: getAuthHeader(),
  });
  if (!res.ok) throw new Error(`Failed to fetch team member: ${res.status}`);
  return res.json();
};

/**
 * Updates mutable profile fields for a team member.
 * @param {number} id
 * @param {Partial<TeamMemberUpdateRequest>} data
 * @returns {Promise<TeamMember>}
 */
export const updateTeamMember = async (id, data) => {
  const res = await fetch(`${API_BASE}/team/${id}`, {
    method: 'PATCH',
    headers: {
      ...getAuthHeader(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Failed to update team member: ${res.status}`);
  }
  return res.json();
};
