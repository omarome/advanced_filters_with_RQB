import React, { useState, useEffect } from 'react';
import { FormControl, Select, MenuItem, Box, Avatar, Typography, CircularProgress, Tooltip } from '@mui/material';
import { fetchUsers } from '../../services/userApi';
import { LucideUser, LucideLock } from 'lucide-react';
import { useRole } from '../../hooks/useRole';

/**
 * AssigneeSelector - Reusable component to assign a record to a team member.
 * 
 * @param {Object} currentAssignee - The current user object assigned.
 * @param {Function} onAssign - Callback when a new assignee is selected.
 * @param {boolean} isLoading - Loading state from parent.
 */
const AssigneeSelector = ({ currentAssignee, onAssign, isLoading: parentLoading }) => {
  const [team, setTeam] = useState([]);
  const [loading, setLoading] = useState(false);
  const { hasMinRole } = useRole();

  // Only Managers, Admins, and Workspace Owners can manually change the record owner
  const canReassign = hasMinRole('MANAGER');

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(setTeam)
      .catch(err => console.error('Failed to fetch team members:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (event) => {
    const userId = event.target.value;
    if (!userId) {
      onAssign(null);
      return;
    }
    const selectedUser = team.find(u => u.id == userId);
    if (selectedUser) {
      onAssign(selectedUser);
    }
  };

  if (loading || parentLoading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', p: 1, gap: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="caption" color="text.secondary">Loading team...</Typography>
      </Box>
    );
  }

  const renderSelectContent = () => (
    <FormControl fullWidth size="small">
      <Select
        labelId="assignee-select-label"
        id="assignee-select"
        value={currentAssignee?.id || ''}
        onChange={handleChange}
        displayEmpty
        disabled={!canReassign}
        MenuProps={{
          PaperProps: {
            sx: {
              bgcolor: 'var(--dropdown-bg)',
              color: 'var(--text-color)',
            }
          }
        }}
        sx={{
          backgroundColor: 'var(--background-alt)',
          borderRadius: '8px',
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 1
          },
          '& fieldset': {
            borderColor: 'var(--border-color)',
          },
          '&:hover fieldset': {
            borderColor: 'var(--primary-color) !important',
          },
          '&.Mui-disabled': {
            opacity: 0.7,
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
          }
        }}
      >
        <MenuItem value="" disabled={!canReassign}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LucideUser size={16} />
            <span>Unassigned</span>
          </Box>
        </MenuItem>
        {team.map((member) => (
          <MenuItem key={member.id} value={member.id}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar 
                src={member.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=7c69ef&color=fff`} 
                sx={{ width: 24, height: 24 }}
              />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 500 }}>{member.fullName}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1 }}>
                  {member.position || member.userType}
                </Typography>
              </Box>
            </Box>
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );

  return (
    <Box className="assignee-selector-container" sx={{ mt: 2, mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block' }}>
          Record Owner
        </Typography>
        {!canReassign && (
          <Tooltip title="Only Managers and Admins can reassign records">
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', gap: 0.5 }}>
               <LucideLock size={12} />
               <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>Locked</Typography>
            </Box>
          </Tooltip>
        )}
      </Box>
      {renderSelectContent()}
    </Box>
  );
};

export default AssigneeSelector;
