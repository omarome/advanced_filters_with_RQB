import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  IconButton,
  Switch,
  Tooltip,
  Paper,
  CircularProgress
} from '@mui/material';
import { 
  LucideZap, 
  LucidePlus, 
  LucideTrash2, 
  LucideBot,
  LucideArrowRight,
  LucideShieldCheck
} from 'lucide-react';
import * as automationApi from '../../services/automationApi';
import { useNotifications } from '../../context/NotificationContext';
import { useThemeControl } from '../../context/ThemeContext';
import { useRole } from '../../hooks/useRole';
import './Automations.css';

const AutomationList = ({ onNewRule }) => {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();
  const { mode } = useThemeControl();
  const { can } = useRole();
  const canWrite = can('automations.write');

  useEffect(() => {
    fetchRules();
  }, []);

  const fetchRules = async () => {
    try {
      setLoading(true);
      const data = await automationApi.fetchAutomationRules();
      setRules(data);
    } catch (err) {
      addNotification('Failed to load automation rules', 'error');
    } finally {
      setLoading(false);
    }
  };

  const toggleRule = async (rule) => {
    try {
      const updated = { ...rule, isActive: !rule.isActive };
      await automationApi.updateAutomationRule(rule.id, updated);
      setRules(rules.map(r => r.id === rule.id ? updated : r));
      addNotification(`Rule ${updated.isActive ? 'enabled' : 'disabled'} successfully`, 'success');
    } catch (err) {
      addNotification('Failed to toggle rule', 'error');
    }
  };

  const deleteRule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this automation rule?")) return;
    try {
      await automationApi.deleteAutomationRule(id);
      setRules(rules.filter(r => r.id !== id));
      addNotification('Rule deleted successfully', 'success');
    } catch (err) {
      addNotification('Failed to delete rule', 'error');
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
        <CircularProgress size={40} sx={{ color: 'var(--primary-color)', mb: 2 }} />
        <Typography color="text.secondary">Loading automations...</Typography>
      </Box>
    );
  }

  return (
    <Box className={`automations-container ${mode}`} sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, flexWrap: { xs: 'wrap', sm: 'nowrap' }, gap: { xs: 1.5, sm: 0 }, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ 
            width: 48, 
            height: 48, 
            borderRadius: '12px', 
            bgcolor: 'rgba(124, 105, 239, 0.1)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            color: 'var(--primary-color)'
          }}>
            <LucideZap size={24} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight="700" className="page-title-gradient">Automation Engine</Typography>
            <Typography variant="body2" color="text.secondary">Put your CRM on autopilot with no-code workflows.</Typography>
          </Box>
        </Box>
        {canWrite && (
          <button className="btn-primary" onClick={onNewRule}>
            <LucidePlus size={15} />
            New Rule
          </button>
        )}
      </Box>

      {rules.length === 0 ? (
        <Paper elevation={0} sx={{
          p: 8,
          textAlign: 'center',
          borderRadius: '24px',
          bgcolor: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.1)'
        }}>
          <LucideBot size={64} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
          <Typography variant="h6" fontWeight="600">No Automations Yet</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 4, maxWidth: 400, mx: 'auto' }}>
            {canWrite
              ? 'Create your first rule to automate repetitive tasks and save time.'
              : 'No automations have been set up yet. Contact your Manager or Admin to create one.'}
          </Typography>
          {canWrite && (
            <button className="btn-primary" onClick={onNewRule}>
              <LucidePlus size={15} />
              Create First Automation
            </button>
          )}
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {rules.map(rule => (
            <Grid item xs={12} md={6} lg={4} key={rule.id}>
              <Card elevation={0} sx={{ 
                height: '100%',
                borderRadius: '20px', 
                bgcolor: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.06)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  bgcolor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(124, 105, 239, 0.3)',
                  boxShadow: '0 12px 24px rgba(0,0,0,0.2)'
                },
                opacity: rule.isActive ? 1 : 0.7
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Typography variant="h6" fontWeight="600" sx={{ mt: 0.5 }}>{rule.name}</Typography>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {canWrite && (
                        <Switch
                          checked={rule.isActive}
                          onChange={() => toggleRule(rule)}
                          size="small"
                          color="success"
                        />
                      )}
                      {canWrite && (
                        <IconButton size="small" onClick={() => deleteRule(rule.id)} sx={{ color: 'var(--text-muted)', '&:hover': { color: '#ef4444' } }}>
                          <LucideTrash2 size={16} />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  <Typography variant="body2" color="text.secondary" sx={{ 
                    mb: 3, 
                    minHeight: 40,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {rule.description || 'No description provided.'}
                  </Typography>

                  <Box sx={{ 
                    p: 2, 
                    borderRadius: '12px', 
                    bgcolor: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.05)'
                  }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography component="span" variant="caption" sx={{ 
                        bgcolor: 'rgba(124, 105, 239, 0.1)', 
                        color: 'var(--primary-color)', 
                        px: 1, 
                        py: 0.2, 
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>WHEN</Typography>
                      <Typography variant="body2" fontWeight="500" component="span">
                        {rule.triggerEntity} {rule.triggerEvent.replace('_', ' ')}
                      </Typography>
                    </Box>
                    <Box sx={{ pl: 0.5, color: 'var(--text-muted)', fontSize: '0.75rem', ml: 6, mb: 1 }}>
                      {rule.triggerConfig?.value && `equals "${rule.triggerConfig.value}"`}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography component="span" variant="caption" sx={{ 
                        bgcolor: 'rgba(16, 185, 129, 0.1)', 
                        color: '#10b981', 
                        px: 1, 
                        py: 0.2, 
                        borderRadius: '4px',
                        fontWeight: 700
                      }}>THEN</Typography>
                      <Typography variant="body2" fontWeight="500" component="span">
                        {rule.actionType.replace('_', ' ')}
                      </Typography>
                    </Box>
                    {rule.actionConfig?.title && (
                      <Box sx={{ pl: 0.5, color: 'var(--text-muted)', fontSize: '0.75rem', ml: 6 }}>
                        "{rule.actionConfig.title}"
                      </Box>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default AutomationList;
