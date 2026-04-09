import React, { useState } from 'react';
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
  Grid
} from '@mui/material';
import { LucideX, LucideBuilding, LucideSave } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createOrganization } from '../../services/organizationApi';
import AssigneeSelector from './AssigneeSelector';
import { fetchUsers } from '../../services/userApi';
import { useEffect } from 'react';

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
};

const CreateOrganizationModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '', industry: '', website: '', phone: '', city: '', state: '', country: '', employeeCount: '', annualRevenue: '', assignedToId: null
  });
  const [team, setTeam] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset form when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '', industry: '', website: '', phone: '', city: '', state: '', country: '', employeeCount: '', annualRevenue: '', assignedToId: null
      });
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
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.employeeCount) delete payload.employeeCount;
      if (!payload.annualRevenue) delete payload.annualRevenue;

      await createOrganization(payload);
      toast.success('Organization created successfully');
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to create organization');
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
            <LucideBuilding size={20} color="var(--primary-color)" />
            New Organization
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'var(--text-muted)' }}>
            <LucideX size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'var(--border-color)', borderRadius: '4px' } }}>
        <Box sx={{ mt: 1 }}>
          <TextField
            fullWidth
            required
            label="Organization Name"
            name="name"
            placeholder="e.g. Acme Corporation"
            value={formData.name}
            onChange={handleChange}
            autoFocus
            sx={textFieldStyle}
          />

          <TextField
            fullWidth
            label="Industry"
            name="industry"
            placeholder="e.g. Technology"
            value={formData.industry}
            onChange={handleChange}
            sx={textFieldStyle}
          />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Website" name="website" placeholder="https://example.com" value={formData.website} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Phone" name="phone" placeholder="+1 (555) 000-0000" value={formData.phone} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="City" name="city" placeholder="San Francisco" value={formData.city} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="State" name="state" placeholder="CA" value={formData.state} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField fullWidth label="Country" name="country" placeholder="USA" value={formData.country} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Employees" name="employeeCount" placeholder="e.g. 500" value={formData.employeeCount} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Annual Revenue" name="annualRevenue" placeholder="e.g. 1000000" value={formData.annualRevenue} onChange={handleChange} sx={textFieldStyle} />
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
          disabled={!formData.name.trim() || isSubmitting}
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
          {isSubmitting ? 'Saving...' : 'Create Organization'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOrganizationModal;
