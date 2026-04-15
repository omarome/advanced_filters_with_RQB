import { apiJson } from './apiClient';

/**
 * Fetches all active team members (with open deal + activity counts).
 * @returns {Promise<TeamMember[]>}
 */
export const fetchTeamMembers = async () => {
  return apiJson('/team');
};

/**
 * Fetches a single team member profile by id.
 * @param {number} id
 * @returns {Promise<TeamMember>}
 */
export const fetchTeamMember = async (id) => {
  return apiJson(`/team/${id}`);
};

/**
 * Updates mutable profile fields for a team member.
 * @param {number} id
 * @param {Partial<TeamMemberUpdateRequest>} data
 * @returns {Promise<TeamMember>}
 */
export const updateTeamMember = async (id, data) => {
  return apiJson(`/team/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
};

/**
 * Changes the role of a team member (Admin only).
 * PATCH /api/team/{id}/role
 * @param {number} id
 * @param {string} role  – one of the Role enum values
 * @returns {Promise<TeamMember>}
 */
export const updateTeamMemberRole = async (id, role) => {
  return apiJson(`/team/${id}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
};

/**
 * Fetches ALL team members including inactive ones (Admin only).
 * GET /api/team/all
 * @returns {Promise<TeamMember[]>}
 */
export const fetchAllTeamMembers = async () => {
  return apiJson('/team/all');
};
