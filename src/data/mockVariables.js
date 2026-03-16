/**
 * Mock variable definitions matching the /api/variables endpoint shape.
 * Used as fallback when the backend is unavailable.
 */
export const mockVariables = [
  { id: 1, name: 'age', label: 'Age', offset: 0, type: 'UDINT' },
  { id: 2, name: 'email', label: 'Email', offset: 4, type: 'EMAIL' },
  { id: 3, name: 'firstName', label: 'First Name', offset: 8, type: 'STRING' },
  { id: 4, name: 'isOnline', label: 'Is Online', offset: 12, type: 'BOOL' },
  { id: 5, name: 'lastName', label: 'Last Name', offset: 16, type: 'STRING' },
  { id: 6, name: 'nickname', label: 'Nickname', offset: 20, type: 'STRING' },
  { id: 7, name: 'status', label: 'Status', offset: 24, type: 'STRING' },
  { id: 8, name: 'userType', label: 'User Type', offset: 28, type: 'STRING' },
];
