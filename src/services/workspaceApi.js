/**
 * API client for workspace management endpoints.
 * All requests auto-inject auth and X-Workspace-Id via apiClient.js.
 */
import { apiJson, apiFetch } from './apiClient';

/**
 * Returns all workspaces the authenticated user belongs to.
 * GET /api/workspaces
 * @returns {Promise<Array<{id, name, slug, role, joinedAt}>>}
 */
export async function getMyWorkspaces() {
  return apiJson('/workspaces');
}

/**
 * Creates a new workspace.
 * POST /api/workspaces
 * @param {{ name: string, slug: string }} payload
 * @returns {Promise<{id, name, slug}>}
 */
export async function createWorkspace(payload) {
  return apiJson('/workspaces', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Lists members of a specific workspace.
 * GET /api/workspaces/{workspaceId}/members
 * @param {number} workspaceId
 * @returns {Promise<Array<{accountId, displayName, email, role, joinedAt, isActive}>>}
 */
export async function getWorkspaceMembers(workspaceId) {
  return apiJson(`/workspaces/${workspaceId}/members`);
}

/**
 * Adds an existing account to a workspace.
 * POST /api/workspaces/{workspaceId}/members
 * @param {number} workspaceId
 * @param {{ accountId: number, role: string }} payload
 */
export async function addWorkspaceMember(workspaceId, payload) {
  return apiJson(`/workspaces/${workspaceId}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Removes a member from a workspace.
 * DELETE /api/workspaces/{workspaceId}/members/{accountId}
 * @param {number} workspaceId
 * @param {number} accountId
 */
export async function removeWorkspaceMember(workspaceId, accountId) {
  return apiJson(`/workspaces/${workspaceId}/members/${accountId}`, {
    method: 'DELETE',
  });
}

/**
 * Changes a member's role within a workspace.
 * PATCH /api/workspaces/{workspaceId}/members/{accountId}/role
 * @param {number} workspaceId
 * @param {number} accountId
 * @param {string} role
 */
export async function changeWorkspaceMemberRole(workspaceId, accountId, role) {
  return apiJson(`/workspaces/${workspaceId}/members/${accountId}/role`, {
    method: 'PATCH',
    body: JSON.stringify({ role }),
  });
}

/**
 * Switches the authenticated user's active workspace.
 * Updates Firebase custom claims (activeWorkspaceId).
 * The caller MUST force-refresh the Firebase ID token after this call.
 * POST /api/me/active-workspace
 * @param {number} workspaceId
 */
export async function switchActiveWorkspace(workspaceId) {
  return apiJson('/me/active-workspace', {
    method: 'POST',
    body: JSON.stringify({ workspaceId }),
  });
}
