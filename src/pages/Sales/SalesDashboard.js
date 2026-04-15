import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, CircularProgress, Avatar, Chip
} from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import {
  LucideTrendingUp, LucideTarget, LucideDollarSign,
  LucidePercent, LucideClock, LucideAward
} from 'lucide-react';
import { apiJson } from '../../services/apiClient';

const STAGE_COLORS = {
  PROSPECTING:   '#6366f1',
  QUALIFICATION: '#8b5cf6',
  PROPOSAL:      '#f59e0b',
  NEGOTIATION:   '#ef4444',
  CLOSED_WON:    '#10b981',
  CLOSED_LOST:   '#6b7280',
};

function formatCurrency(v) {
  if (!v) return '$0';
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}K`;
  return `$${v}`;
}

function KpiCard({ icon: Icon, label, value, color = 'var(--primary-color)', sub }) {
  return (
    <Paper elevation={0} sx={{
      p: 3,
      borderRadius: '20px',
      bgcolor: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.06)',
      height: '100%',
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Box sx={{
          width: 40, height: 40, borderRadius: '10px',
          bgcolor: `${color}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Icon size={20} color={color} />
        </Box>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
      </Box>
      <Typography variant="h4" fontWeight={800}>{value}</Typography>
      {sub && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>{sub}</Typography>}
    </Paper>
  );
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <Paper elevation={4} sx={{ p: 1.5, borderRadius: '8px', bgcolor: '#1b2436', border: '1px solid rgba(255,255,255,0.1)' }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      {payload.map((p, i) => (
        <Typography key={i} variant="body2" fontWeight={700} sx={{ color: p.fill || p.stroke }}>
          {formatCurrency(p.value)}
        </Typography>
      ))}
    </Paper>
  );
};

export default function SalesDashboard() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const json = await apiJson('/sales/opportunities?size=500');
        setDeals(json.content || []);
      } catch {
        setDeals([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
      </Box>
    );
  }

  // ── KPI calculations ─────────────────────────────────────────────────
  const wonDeals       = deals.filter(d => d.stage === 'CLOSED_WON');
  const lostDeals      = deals.filter(d => d.stage === 'CLOSED_LOST');
  const activeDeals    = deals.filter(d => !['CLOSED_WON', 'CLOSED_LOST'].includes(d.stage));
  const totalRevenue   = wonDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const pipelineValue  = activeDeals.reduce((s, d) => s + (Number(d.amount) || 0), 0);
  const closedCount    = wonDeals.length + lostDeals.length;
  const winRate        = closedCount ? Math.round((wonDeals.length / closedCount) * 100) : 0;
  const avgDealSize    = wonDeals.length ? Math.round(totalRevenue / wonDeals.length) : 0;

  // Pipeline by stage (bar chart)
  const pipelineByStage = Object.entries(STAGE_COLORS)
    .filter(([k]) => !['CLOSED_WON', 'CLOSED_LOST'].includes(k))
    .map(([stage, color]) => ({
      name: stage.replace('_', ' '),
      value: deals.filter(d => d.stage === stage).reduce((s, d) => s + (Number(d.amount) || 0), 0),
      color,
    }));

  // Win/loss pie
  const winLossData = [
    { name: 'Won',  value: wonDeals.length,  color: '#10b981' },
    { name: 'Lost', value: lostDeals.length, color: '#ef4444' },
    { name: 'Open', value: activeDeals.length, color: '#7c69ef' },
  ].filter(d => d.value > 0);

  // Team leaderboard (by owner name)
  const ownerMap = {};
  wonDeals.forEach(d => {
    const name = d.assignedTo?.email || d.ownerName || 'Unassigned';
    if (!ownerMap[name]) ownerMap[name] = { name, won: 0, revenue: 0 };
    ownerMap[name].won++;
    ownerMap[name].revenue += Number(d.amount) || 0;
  });
  const leaderboard = Object.values(ownerMap).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  function getInitials(name = '') {
    return name.split(/[\s@.]+/).filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase();
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* KPI row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={LucideDollarSign} label="Total Revenue" value={formatCurrency(totalRevenue)} color="#10b981" sub={`${wonDeals.length} deals closed`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={LucideTrendingUp} label="Pipeline Value" value={formatCurrency(pipelineValue)} color="#6366f1" sub={`${activeDeals.length} open deals`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={LucidePercent} label="Win Rate" value={`${winRate}%`} color="#f59e0b" sub={`${closedCount} deals evaluated`} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard icon={LucideTarget} label="Avg Deal Size" value={formatCurrency(avgDealSize)} color="#8b5cf6" sub="on won deals" />
        </Grid>
      </Grid>

      {/* Charts row */}
      <Grid container spacing={2.5} sx={{ mb: 3 }}>
        {/* Pipeline by stage bar chart */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{
            p: 3, borderRadius: '20px',
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            height: 300,
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>Pipeline by Stage</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={pipelineByStage} barSize={28}>
                <XAxis dataKey="name" tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tickFormatter={v => `$${v >= 1000 ? `${Math.round(v / 1000)}K` : v}`} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {pipelineByStage.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Win/loss pie chart */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{
            p: 3, borderRadius: '20px',
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            height: 300,
          }}>
            <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>Deal Outcomes</Typography>
            {winLossData.length > 0 ? (
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={winLossData}
                    cx="50%" cy="48%"
                    innerRadius={55} outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {winLossData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip formatter={(v, name) => [`${v} deals`, name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
                <Typography color="text.secondary">No closed deals yet</Typography>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Leaderboard */}
      {leaderboard.length > 0 && (
        <Paper elevation={0} sx={{
          p: 3, borderRadius: '20px',
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <LucideAward size={20} color="#f59e0b" />
            <Typography variant="h6" fontWeight={700}>Team Leaderboard</Typography>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {leaderboard.map((rep, i) => (
              <Box key={rep.name} sx={{
                display: 'flex', alignItems: 'center', gap: 2,
                p: 1.5, borderRadius: '12px',
                bgcolor: i === 0 ? 'rgba(245,158,11,0.06)' : 'transparent',
                border: i === 0 ? '1px solid rgba(245,158,11,0.15)' : '1px solid transparent',
              }}>
                <Typography variant="body2" fontWeight={800} sx={{ width: 20, color: i === 0 ? '#f59e0b' : 'var(--text-muted)' }}>
                  #{i + 1}
                </Typography>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#7c69ef', fontSize: '0.7rem' }}>
                  {getInitials(rep.name)}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="body2" fontWeight={600} noWrap>{rep.name}</Typography>
                  <Typography variant="caption" color="text.secondary">{rep.won} deal{rep.won !== 1 ? 's' : ''} won</Typography>
                </Box>
                <Chip label={formatCurrency(rep.revenue)} size="small" sx={{ bgcolor: 'rgba(16,185,129,0.1)', color: '#10b981', fontWeight: 700 }} />
              </Box>
            ))}
          </Box>
        </Paper>
      )}
    </Box>
  );
}
