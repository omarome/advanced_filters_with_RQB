import React, { useState, useEffect } from 'react';
import { FormControl, InputLabel, Select, MenuItem, Box, Avatar, Typography, CircularProgress } from '@mui/material';
import { fetchUsers } from '../../services/userApi';
import { LucideUser } from 'lucide-react';

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

  return (
    <Box className="assignee-selector-container" sx={{ mt: 2, mb: 1 }}>
      <Typography variant="overline" sx={{ color: 'var(--text-muted)', fontWeight: 600, display: 'block', mb: 1 }}>
        Record Owner
      </Typography>
      <FormControl fullWidth size="small">
        <Select
          labelId="assignee-select-label"
          id="assignee-select"
          value={currentAssignee?.id || ''}
          onChange={handleChange}
          displayEmpty
          MenuProps={{
            PaperProps: {
              sx: {
                bgcolor: '#1b2436',
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
          }}
        >
          <MenuItem value="" disabled>
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
    </Box>
  );
};

export default AssigneeSelector;
