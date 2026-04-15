import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Paper, Chip, CircularProgress, Avatar } from '@mui/material';
import { LucideTarget, LucideDollarSign } from 'lucide-react';
import { apiJson } from '../../services/apiClient';
import { useNotifications } from '../../context/NotificationContext';
import { executeCrmQuery } from '../../services/crmQueryApi';

const STAGES = [
  { key: 'PROSPECTING',   label: 'Prospecting',   color: '#6366f1' },
  { key: 'QUALIFICATION', label: 'Qualification',  color: '#8b5cf6' },
  { key: 'PROPOSAL',      label: 'Proposal',       color: '#f59e0b' },
  { key: 'NEGOTIATION',   label: 'Negotiation',    color: '#ef4444' },
  { key: 'CLOSED_WON',    label: 'Closed Won',     color: '#10b981' },
  { key: 'CLOSED_LOST',   label: 'Closed Lost',    color: '#6b7280' },
];


function formatCurrency(amount) {
  if (!amount) return '$0';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(amount);
}

function getInitials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function KanbanBoard({ query }) {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draggedId, setDraggedId] = useState(null);
  const dragOverStage = useRef(null);
  const { addNotification } = useNotifications();

  // Fetch directly from API to avoid Firestore timeouts causing heavy performance issues
  useEffect(() => {
    fetchFromApi();
  }, [query]);

  async function fetchFromApi() {
    setLoading(true);
    try {
      const currentQuery = query || { combinator: 'and', rules: [] };
      const response = await executeCrmQuery({
        entityType: 'OPPORTUNITY',
        combinator: currentQuery.combinator,
        rules: currentQuery.rules,
        page: 0,
        size: 200,
      });
      setDeals(response.content || []);
    } catch (e) {
      addNotification('Failed to load deals', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function moveDeal(dealId, newStage) {
    // Optimistic update
    setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));

    try {
      await apiJson(`/sales/opportunities/${dealId}`, {
        method: 'PATCH',
        body: JSON.stringify({ stage: newStage }),
      });
    } catch {
      addNotification('Failed to move deal — reverting', 'error');
      fetchFromApi(); // Re-sync on failure
    }
  }

  // ── Drag handlers ─────────────────────────────────────────────────────
  function onDragStart(e, dealId) {
    setDraggedId(dealId);
    e.dataTransfer.effectAllowed = 'move';
  }

  function onDragOver(e, stageKey) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    dragOverStage.current = stageKey;
  }

  function onDrop(e, stageKey) {
    e.preventDefault();
    if (draggedId && dragOverStage.current) {
      const deal = deals.find(d => d.id === draggedId);
      if (deal && deal.stage !== stageKey) {
        moveDeal(draggedId, stageKey);
      }
    }
    setDraggedId(null);
    dragOverStage.current = null;
  }

  function onDragEnd() {
    setDraggedId(null);
    dragOverStage.current = null;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ overflowX: 'auto', pb: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, minWidth: STAGES.length * 260, p: 2 }}>
        {STAGES.map(stage => {
          const stageDeals = deals.filter(d => d.stage === stage.key);
          const revenue = stageDeals.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

          return (
            <Box
              key={stage.key}
              onDragOver={e => onDragOver(e, stage.key)}
              onDrop={e => onDrop(e, stage.key)}
              sx={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: 1 }}
            >
              {/* Column header */}
              <Paper elevation={0} sx={{
                p: 1.5,
                borderRadius: '12px',
                bgcolor: `${stage.color}14`,
                border: `1px solid ${stage.color}30`,
                mb: 0.5,
              }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: stage.color }} />
                    <Typography variant="body2" fontWeight={700} sx={{ color: stage.color }}>
                      {stage.label}
                    </Typography>
                  </Box>
                  <Chip
                    label={stageDeals.length}
                    size="small"
                    sx={{ bgcolor: `${stage.color}20`, color: stage.color, fontWeight: 700, height: 20, fontSize: '0.7rem' }}
                  />
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                  <LucideDollarSign size={12} color="var(--text-muted)" />
                  <Typography variant="caption" color="text.secondary">{formatCurrency(revenue)}</Typography>
                </Box>
              </Paper>

              {/* Deal cards */}
              {stageDeals.map(deal => (
                <Paper
                  key={deal.id}
                  draggable
                  onDragStart={e => onDragStart(e, deal.id)}
                  onDragEnd={onDragEnd}
                  elevation={0}
                  sx={{
                    p: 2,
                    borderRadius: '12px',
                    bgcolor: draggedId === deal.id
                      ? 'rgba(124, 105, 239, 0.1)'
                      : 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    cursor: 'grab',
                    transition: 'all 0.2s',
                    opacity: draggedId === deal.id ? 0.5 : 1,
                    '&:hover': {
                      bgcolor: 'rgba(255, 255, 255, 0.06)',
                      borderColor: stage.color + '60',
                      transform: 'translateY(-2px)',
                      boxShadow: `0 4px 12px ${stage.color}20`,
                    },
                    '&:active': { cursor: 'grabbing' },
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
                      <Box sx={{
                        width: 32, height: 32, borderRadius: '8px',
                        bgcolor: `${stage.color}20`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <LucideTarget size={16} color={stage.color} />
                      </Box>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                        sx={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {deal.name}
                      </Typography>
                    </Box>
                  </Box>

                  <Box sx={{ mt: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="body2" fontWeight={700} sx={{ color: stage.color }}>
                      {formatCurrency(deal.amount)}
                    </Typography>
                    {deal.ownerName && (
                      <Avatar sx={{ width: 22, height: 22, bgcolor: '#7c69ef', fontSize: '0.6rem' }}>
                        {getInitials(deal.ownerName)}
                      </Avatar>
                    )}
                  </Box>
                </Paper>
              ))}

              {/* Empty column drop target */}
              {stageDeals.length === 0 && (
                <Box sx={{
                  height: 80,
                  borderRadius: '12px',
                  border: '2px dashed rgba(255,255,255,0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  <Typography variant="caption" color="text.secondary">Drop here</Typography>
                </Box>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
