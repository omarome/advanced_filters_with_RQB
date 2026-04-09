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
import { LucideX, LucideBriefcase, LucideSave } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { createOpportunity } from '../../services/opportunityApi';
import { fetchOrganizations } from '../../services/organizationApi';
import { fetchContacts } from '../../services/contactApi';
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

const CreateOpportunityModal = ({ isOpen, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '', amount: '', stage: 'PROSPECTING', probability: '', expectedCloseDate: '', organizationId: '', primaryContactId: '', assignedToId: null
  });
  
  const [team, setTeam] = useState([]);
  
  const [organizations, setOrganizations] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [isLoadingDeps, setIsLoadingDeps] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load orgs on open
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '', amount: '', stage: 'PROSPECTING', probability: '', expectedCloseDate: '', organizationId: '', primaryContactId: '', assignedToId: null
      });
      setIsLoadingDeps(true);
      fetchOrganizations({ size: 100 })
        .then(res => setOrganizations(res.content || []))
        .catch(err => toast.error('Failed to load organizations'))
        .finally(() => setIsLoadingDeps(false));

      fetchUsers()
        .then(setTeam)
        .catch(err => console.error(err));
    }
  }, [isOpen]);

  // When organization changes, fetch its contacts so we can populate the Primary Contact dropdown
  useEffect(() => {
    if (formData.organizationId) {
      fetchContacts({ organizationId: formData.organizationId, size: 50 })
        .then(res => {
          setContacts(Array.isArray(res) ? res : (res.content || []));
          setFormData(prev => ({ ...prev, primaryContactId: '' })); // reset contact when org changes
        })
        .catch(err => console.error(err));
    } else {
      setContacts([]);
      setFormData(prev => ({ ...prev, primaryContactId: '' }));
    }
  }, [formData.organizationId]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim() || !formData.organizationId) return;

    setIsSubmitting(true);
    try {
      const payload = { ...formData };
      if (!payload.amount) delete payload.amount;
      if (!payload.probability) delete payload.probability;
      if (!payload.expectedCloseDate) delete payload.expectedCloseDate;
      if (!payload.primaryContactId) payload.primaryContactId = null;
      
      await createOpportunity(payload);
      toast.success('Opportunity created successfully');
      onSave();
      onClose();
    } catch (error) {
      toast.error(error.message || 'Failed to create opportunity');
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
            <LucideBriefcase size={20} color="var(--primary-color)" />
            New Opportunity
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'var(--text-muted)' }}>
            <LucideX size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ overflowY: 'auto', '&::-webkit-scrollbar': { width: '8px' }, '&::-webkit-scrollbar-thumb': { backgroundColor: 'var(--border-color)', borderRadius: '4px' } }}>
        <Box sx={{ mt: 1 }}>
          <TextField fullWidth required label="Deal Name" name="name" placeholder="e.g. Q4 Enterprise License Expansion" value={formData.name} onChange={handleChange} autoFocus sx={textFieldStyle} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                required
                label="Organization"
                name="organizationId"
                value={formData.organizationId}
                onChange={handleChange}
                disabled={isLoadingDeps}
                sx={textFieldStyle}
                SelectProps={{
                  MenuProps: { PaperProps: { sx: { bgcolor: 'var(--dropdown-bg)', color: 'var(--text-color)', borderRadius: '12px', border: '1px solid var(--border-color)' } } }
                }}
              >
                <MenuItem value=""><em>-- Select Organization --</em></MenuItem>
                {organizations.map(org => (
                  <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Primary Contact (Optional)"
                name="primaryContactId"
                value={formData.primaryContactId}
                onChange={handleChange}
                disabled={!formData.organizationId || contacts.length === 0}
                sx={textFieldStyle}
                helperText={formData.organizationId && contacts.length === 0 ? "No contacts found for this org." : ""}
                SelectProps={{
                  MenuProps: { PaperProps: { sx: { bgcolor: 'var(--dropdown-bg)', color: 'var(--text-color)', borderRadius: '12px', border: '1px solid var(--border-color)' } } }
                }}
              >
                <MenuItem value=""><em>-- Select Contact --</em></MenuItem>
                {contacts.map(c => (
                  <MenuItem key={c.id} value={c.id}>{c.firstName} {c.lastName}</MenuItem>
                ))}
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Deal Amount ($)" name="amount" placeholder="e.g. 50000" value={formData.amount} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Initial Stage"
                name="stage"
                value={formData.stage}
                onChange={handleChange}
                sx={textFieldStyle}
                SelectProps={{
                  MenuProps: { PaperProps: { sx: { bgcolor: 'var(--dropdown-bg)', color: 'var(--text-color)', borderRadius: '12px', border: '1px solid var(--border-color)' } } }
                }}
              >
                <MenuItem value="PROSPECTING">Prospecting</MenuItem>
                <MenuItem value="QUALIFICATION">Qualification</MenuItem>
                <MenuItem value="NEEDS_ANALYSIS">Needs Analysis</MenuItem>
                <MenuItem value="VALUE_PROPOSITION">Value Proposition</MenuItem>
                <MenuItem value="ID_DECISION_MAKERS">Identify Decision Makers</MenuItem>
                <MenuItem value="PERCEPTION_ANALYSIS">Perception Analysis</MenuItem>
                <MenuItem value="PROPOSAL">Proposal / Price Quote</MenuItem>
                <MenuItem value="NEGOTIATION">Negotiation / Review</MenuItem>
                <MenuItem value="CLOSED_WON">Closed Won</MenuItem>
                <MenuItem value="CLOSED_LOST">Closed Lost</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Probability (%)" name="probability" InputProps={{ inputProps: { min: 0, max: 100 } }} placeholder="e.g. 20" value={formData.probability} onChange={handleChange} sx={textFieldStyle} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                fullWidth 
                type="date" 
                label="Expected Close Date" 
                name="expectedCloseDate" 
                value={formData.expectedCloseDate} 
                onChange={handleChange} 
                InputLabelProps={{ shrink: true }}
                sx={textFieldStyle} 
              />
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
          disabled={!formData.name.trim() || !formData.organizationId || isSubmitting}
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
          {isSubmitting ? 'Saving...' : 'Create Opportunity'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateOpportunityModal;
