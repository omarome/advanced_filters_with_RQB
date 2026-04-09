import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  TextField, 
  Typography, 
  Box, 
  IconButton,
  Grid,
  MenuItem
} from '@mui/material';
import { LucideX, LucideUser, LucideSave } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createContact } from '../../services/contactApi';
import { fetchOrganizations } from '../../services/organizationApi';
import AssigneeSelector from './AssigneeSelector';
import { fetchUsers } from '../../services/userApi';

const textFieldStyle = {
  mb: 2,
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    '& fieldset': { borderColor: 'var(--border-color)' },
    '&:hover fieldset': { borderColor: 'var(--primary-color)' },
    '&.Mui-focused fieldset': { borderColor: 'var(--primary-color)' },
  },
  '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
  '& .MuiInputLabel-root.Mui-focused': { color: 'var(--primary-color)' },
  '& .MuiInputBase-input': { color: 'var(--text-color)' },
  '& .MuiSelect-select': { color: 'var(--text-color)' },
  '& .MuiSvgIcon-root': { color: 'var(--text-muted)' }
};

const CreateContactModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    firstName: '', lastName: '', email: '', phone: '', jobTitle: '', department: '', organizationId: '', assignedToId: null
  });
  
  const [team, setTeam] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form and fetch orgs when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        firstName: '', lastName: '', email: '', phone: '', jobTitle: '', department: '', organizationId: '', assignedToId: null
      });
      setIsLoadingOrgs(true);
      fetchOrganizations({ size: 100 })
        .then(res => setOrganizations(res.content || []))
        .catch(err => toast.error('Failed to load organizations for dropdown'))
        .finally(() => setIsLoadingOrgs(false));

      fetchUsers()
        .then(setTeam)
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.organizationId) {
        payload.organizationId = null;
      }
      
      await createContact(payload);
      toast.success('Contact created successfully');
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to create contact');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: '24px',
          padding: '8px',
          bgcolor: 'var(--dropdown-bg)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--dropdown-shadow)',
          backgroundImage: 'none',
        }
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="600" display="flex" alignItems="center" gap={1}>
            <LucideUser size={20} color="var(--primary-color)" />
            New Contact
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'var(--text-muted)' }}>
            <LucideX size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'var(--border-color)', borderRadius: '4px' } }}>
        <Box sx={{ mt: 1 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="First Name" name="firstName" placeholder="Jane" value={formData.firstName} onChange={handleChange} autoFocus sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth required label="Last Name" name="lastName" placeholder="Doe" value={formData.lastName} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
          </Grid>

          <TextField fullWidth type="email" label="Email Address" name="email" placeholder="jane.doe@example.com" value={formData.email} onChange={handleChange} sx={textFieldStyle} />
          
          <TextField fullWidth label="Phone Number" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} sx={textFieldStyle} />

          <TextField
            select
            fullWidth
            label="Associated Organization"
            name="organizationId"
            value={formData.organizationId}
            onChange={handleChange}
            disabled={isLoadingOrgs}
            sx={textFieldStyle}
            SelectProps={{
              MenuProps: {
                PaperProps: {
                  sx: { bgcolor: 'var(--dropdown-bg)', color: 'var(--text-color)', borderRadius: '12px', border: '1px solid var(--border-color)' }
                }
              }
            }}
          >
            <MenuItem value=""><em>-- No Organization (Optional) --</em></MenuItem>
            {organizations.map(org => (
              <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Job Title" name="jobTitle" placeholder="e.g. Director of Sales" value={formData.jobTitle} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Department" name="department" placeholder="e.g. Marketing" value={formData.department} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
          </Grid>

          <AssigneeSelector 
            currentAssignee={team.find(u => u.id == formData.assignedToId)}
            onAssign={(user) => setFormData(prev => ({ ...prev, assignedToId: user ? user.id : null }))}
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={isSubmitting} sx={{ color: 'var(--text-muted)', borderRadius: '10px', textTransform: 'none' }}>
          Cancel
        </Button>
        <Button 
          variant="contained" 
          onClick={handleSubmit}
          disabled={!formData.firstName.trim() || !formData.lastName.trim() || isSubmitting}
          startIcon={<LucideSave size={18} />}
          sx={{ 
            bgcolor: 'var(--primary-color)',
            '&:hover': { bgcolor: 'var(--primary-hover)' },
            borderRadius: '10px',
            textTransform: 'none',
            px: 3,
            boxShadow: '0 4px 12px rgba(124, 105, 239, 0.3)',
          }}
        >
          {isSubmitting ? 'Saving...' : 'Create Contact'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateContactModal;
