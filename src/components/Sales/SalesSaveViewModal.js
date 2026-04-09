import React, { useState, useMemo } from 'react';
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
  List,
  ListItem,
  ListItemText,
  Divider,
  Paper,
} from '@mui/material';
import { LucideX, LucideSave, LucideFilter } from 'lucide-react';
import { detectDangerousInput } from '../../utils/validators/sanitize';

/**
 * Converts flat Sales filter state into a display list of { field, operator, value }
 * matching the shape that SavedViewModal renders for RQB rules.
 */
function getFilterRules(filters, entityType) {
  if (!filters) return [];
  const rules = [];

  if (entityType === 'organizations') {
    if (filters.industry)       rules.push({ field: 'industry',   operator: 'is',  value: filters.industry });
    if (filters.country)        rules.push({ field: 'country',    operator: 'is',  value: filters.country });
    if (filters.employeeBucket) rules.push({ field: 'employees',  operator: 'in',  value: filters.employeeBucket.label });
  }

  if (entityType === 'contacts') {
    if (filters.stages?.length)   rules.push({ field: 'lifecycle stage', operator: 'in', value: filters.stages.join(', ') });
    if (filters.organizationName) rules.push({ field: 'organization',    operator: 'is', value: filters.organizationName });
  }

  if (entityType === 'pipeline') {
    if (filters.stages?.length)   rules.push({ field: 'stage',      operator: 'in', value: filters.stages.join(', ') });
    if (filters.owner)            rules.push({ field: 'owner',      operator: 'is', value: filters.owner });
    if (filters.dealValueBucket)  rules.push({ field: 'deal value', operator: 'in', value: filters.dealValueBucket.label });
  }

  return rules;
}

/**
 * SalesSaveViewModal
 *
 * Identical look and feel to SavedViewModal (MUI Dialog, same PaperProps,
 * same BackdropProps, same typography/button styles). Adapted for Sales pages
 * which use flat filter objects instead of RQB query trees.
 */
const SalesSaveViewModal = ({ isOpen, onClose, onSave, filters, entityType }) => {
  const [viewName, setViewName]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (isOpen) setViewName('');
  }, [isOpen]);

  const filterRules = useMemo(() => getFilterRules(filters, entityType), [filters, entityType]);

  const validationError = useMemo(() => {
    if (!viewName.trim()) return null;
    if (viewName.length > 100) return 'Name cannot be more than 100 characters';
    return detectDangerousInput(viewName);
  }, [viewName]);

  const handleSave = async () => {
    if (validationError || !viewName.trim() || filterRules.length === 0) return;
    setIsSubmitting(true);
    try {
      await onSave(viewName.trim());
      onClose();
    } catch {
      // onSave shows its own toast on error
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
      className="saved-view-modal"
      PaperProps={{
        sx: {
          borderRadius: '24px',
          padding: '8px',
          bgcolor: 'var(--dropdown-bg)',
          color: 'var(--text-color)',
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--dropdown-shadow)',
          backgroundImage: 'none',
        },
      }}
      BackdropProps={{
        sx: {
          backgroundColor: 'rgba(15, 23, 42, 0.4)',
          backdropFilter: 'blur(8px)',
        },
      }}
    >
      <DialogTitle className="modal-header">
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" fontWeight="600" display="flex" alignItems="center" gap={1}>
            <LucideFilter size={20} color="var(--primary-color)" />
            Save Current View
          </Typography>
          <IconButton onClick={onClose} size="small" sx={{ color: 'var(--text-muted)' }}>
            <LucideX size={20} />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1, mb: 3 }}>
          <TextField
            fullWidth
            label="Filter View Name"
            placeholder="e.g., High-value US prospects"
            value={viewName}
            onChange={(e) => setViewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            error={!!validationError}
            helperText={validationError || `${viewName.length}/100 characters`}
            variant="outlined"
            autoFocus
            inputProps={{ maxLength: 100 }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '12px',
                '& fieldset': { borderColor: 'var(--border-color)' },
                '&:hover fieldset': { borderColor: 'var(--primary-color)' },
              },
              '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
              '& .MuiInputBase-input': { color: 'var(--text-color)' },
            }}
          />
        </Box>

        <Typography variant="subtitle2" color="var(--text-muted)" gutterBottom fontWeight="600">
          SELECTED FILTERS ({filterRules.length})
        </Typography>

        <Paper
          variant="outlined"
          className={`filters-review-list ${filterRules.length === 0 ? 'error' : ''}`}
          sx={{
            maxHeight: '250px',
            overflow: 'auto',
            borderRadius: '12px',
            borderColor: filterRules.length === 0 ? 'var(--error-color)' : 'var(--border-color)',
            bgcolor: 'var(--background-muted)',
            transition: 'border-color 0.2s ease',
          }}
        >
          {filterRules.length === 0 ? (
            <Box p={4} textAlign="center">
              <Typography color="var(--text-muted)">No filters selected</Typography>
            </Box>
          ) : (
            <List disablePadding>
              {filterRules.map((rule, index) => (
                <React.Fragment key={index}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span className="filter-field">{rule.field}</span>
                          <span className="filter-op">{rule.operator}</span>
                          <span className="filter-val">{rule.value}</span>
                        </Box>
                      }
                      primaryTypographyProps={{ variant: 'body2', fontWeight: '500' }}
                    />
                  </ListItem>
                  {index < filterRules.length - 1 && (
                    <Divider sx={{ borderColor: 'var(--border-color-light)' }} />
                  )}
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        {filterRules.length === 0 && (
          <Box sx={{ mt: 1, mb: 2 }}>
            <Typography variant="caption" color="var(--error-color)" fontWeight="500">
              * At least one filter must be selected to save a view.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            color: 'var(--text-muted)',
            borderRadius: '10px',
            textTransform: 'none',
          }}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!viewName.trim() || !!validationError || isSubmitting || filterRules.length === 0}
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
          {isSubmitting ? 'Saving...' : 'Save View'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default SalesSaveViewModal;
