/**
 * Mock variable definitions matching the /api/variables endpoint shape.
 * Used as fallback when the backend is unavailable.
 */
export const mockVariables = [
  { id: 1, name: 'fullName', label: 'Full Name', offset: 0, type: 'STRING' },
  { id: 2, name: 'email', label: 'Email', offset: 4, type: 'EMAIL' },
  { id: 3, name: 'position', label: 'Position', offset: 8, type: 'STRING' },
  { id: 7, name: 'department', label: 'Department', offset: 28, type: 'STRING' },
  { id: 5, name: 'status', label: 'Account Status', offset: 16, type: 'STRING' },
  { id: 6, name: 'isOnline', label: 'Online Status', offset: 20, type: 'BOOL' }
];
