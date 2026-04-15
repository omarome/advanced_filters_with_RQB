import { apiJson } from './apiClient';

/**
 * Invite a new team member.
 * POST /api/admin/invite
 * @param {{ email: string, displayName: string, role: string }} payload
 */
export async function inviteUser(payload) {
  return apiJson('/admin/invite', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Deactivate a team member account.
 * DELETE /api/admin/users/{id}/deactivate
 * @param {number} id
 */
export async function deactivateUser(id) {
  return apiJson(`/admin/users/${id}/deactivate`, {
    method: 'DELETE',
  });
}

/**
 * Reactivate a previously deactivated team member account.
 * PUT /api/admin/users/{id}/reactivate
 * @param {number} id
 */
export async function reactivateUser(id) {
  return apiJson(`/admin/users/${id}/reactivate`, {
    method: 'PUT',
  });
}
