import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Grid, IconButton, Chip, CircularProgress, Tooltip
} from '@mui/material';
import {
  LucideChevronLeft, LucideChevronRight, LucideCalendar
} from 'lucide-react';
import { getAccessToken } from '../../context/AuthProvider';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const ACTIVITY_COLORS = {
  TASK:    { bg: '#6366f114', border: '#6366f1', label: '#6366f1' },
  MEETING: { bg: '#f59e0b14', border: '#f59e0b', label: '#f59e0b' },
  CALL:    { bg: '#10b98114', border: '#10b981', label: '#10b981' },
  EMAIL:   { bg: '#8b5cf614', border: '#8b5cf6', label: '#8b5cf6' },
  NOTE:    { bg: '#6b728014', border: '#6b7280', label: '#6b7280' },
};

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

function isSameDay(a, b) {
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

export default function CalendarView() {
  const today = new Date();
  const [current, setCurrent] = useState({ year: today.getFullYear(), month: today.getMonth() });
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // selected date

  useEffect(() => {
    async function load() {
      try {
        const token = getAccessToken();
        const res = await fetch(`${API_BASE}/sales/activities?size=500`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!res.ok) throw new Error();
        const json = await res.json();
        setActivities(json.content || json || []);
      } catch {
        setActivities([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function prevMonth() {
    setCurrent(c => {
      const d = new Date(c.year, c.month - 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelected(null);
  }
  function nextMonth() {
    setCurrent(c => {
      const d = new Date(c.year, c.month + 1, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
    setSelected(null);
  }

  // Build calendar grid
  const firstDay = new Date(current.year, current.month, 1);
  const lastDay  = new Date(current.year, current.month + 1, 0);
  const startPad = firstDay.getDay(); // day-of-week index to pad
  const totalCells = Math.ceil((startPad + lastDay.getDate()) / 7) * 7;
  const cells = Array.from({ length: totalCells }, (_, i) => {
    const dayNum = i - startPad + 1;
    if (dayNum < 1 || dayNum > lastDay.getDate()) return null;
    return new Date(current.year, current.month, dayNum);
  });

  function getActivitiesForDate(date) {
    if (!date) return [];
    return activities.filter(a => {
      const dateField = a.taskDueDate || a.scheduledAt || a.activityDate;
      if (!dateField) return false;
      const d = new Date(dateField);
      return isSameDay(d, date);
    });
  }

  const selectedActivities = selected ? getActivitiesForDate(selected) : [];

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 400 }}>
        <CircularProgress sx={{ color: 'var(--primary-color)' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 } }}>
      <Grid container spacing={3}>
        {/* Calendar grid */}
        <Grid item xs={12} md={selected ? 8 : 12}>
          <Paper elevation={0} sx={{
            borderRadius: '20px',
            bgcolor: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            overflow: 'hidden',
          }}>
            {/* Month navigation */}
            <Box sx={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              px: 3, py: 2,
              borderBottom: '1px solid rgba(255,255,255,0.06)',
            }}>
              <IconButton size="small" onClick={prevMonth} sx={{ color: 'var(--text-muted)' }}>
                <LucideChevronLeft size={18} />
              </IconButton>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <LucideCalendar size={18} color="var(--primary-color)" />
                <Typography variant="h6" fontWeight={700}>
                  {MONTH_NAMES[current.month]} {current.year}
                </Typography>
              </Box>
              <IconButton size="small" onClick={nextMonth} sx={{ color: 'var(--text-muted)' }}>
                <LucideChevronRight size={18} />
              </IconButton>
            </Box>

            {/* Day names */}
            <Grid container sx={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {DAY_NAMES.map(d => (
                <Grid item xs={12 / 7} key={d} sx={{ py: 1, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{d}</Typography>
                </Grid>
              ))}
            </Grid>

            {/* Calendar cells */}
            <Grid container>
              {cells.map((date, i) => {
                const dayActivities = getActivitiesForDate(date);
                const isToday  = date && isSameDay(date, today);
                const isSelected = date && selected && isSameDay(date, selected);

                return (
                  <Grid
                    item
                    xs={12 / 7}
                    key={i}
                    onClick={() => date && setSelected(isSelected ? null : date)}
                    sx={{
                      minHeight: 80,
                      p: 0.75,
                      borderRight: (i % 7 !== 6) ? '1px solid rgba(255,255,255,0.03)' : 'none',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                      cursor: date ? 'pointer' : 'default',
                      bgcolor: isSelected
                        ? 'rgba(124,105,239,0.08)'
                        : isToday
                        ? 'rgba(124,105,239,0.04)'
                        : 'transparent',
                      '&:hover': date ? { bgcolor: 'rgba(255,255,255,0.03)' } : {},
                      transition: 'background 0.15s',
                    }}
                  >
                    {date && (
                      <>
                        <Box sx={{
                          width: 26, height: 26,
                          borderRadius: '50%',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          mb: 0.5,
                          bgcolor: isToday ? 'var(--primary-color)' : 'transparent',
                        }}>
                          <Typography
                            variant="caption"
                            fontWeight={isToday ? 800 : 500}
                            sx={{ color: isToday ? '#fff' : 'var(--text-color)' }}
                          >
                            {date.getDate()}
                          </Typography>
                        </Box>
                        {dayActivities.slice(0, 3).map((a, ai) => {
                          const c = ACTIVITY_COLORS[a.activityType] || ACTIVITY_COLORS.NOTE;
                          return (
                            <Tooltip key={ai} title={a.subject || a.activityType} placement="top">
                              <Box sx={{
                                fontSize: '0.6rem',
                                fontWeight: 600,
                                color: c.label,
                                bgcolor: c.bg,
                                borderLeft: `2px solid ${c.border}`,
                                px: 0.5,
                                py: 0.2,
                                borderRadius: '2px',
                                mb: 0.3,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}>
                                {a.subject || a.activityType}
                              </Box>
                            </Tooltip>
                          );
                        })}
                        {dayActivities.length > 3 && (
                          <Typography variant="caption" color="text.secondary" sx={{ pl: 0.5 }}>
                            +{dayActivities.length - 3} more
                          </Typography>
                        )}
                      </>
                    )}
                  </Grid>
                );
              })}
            </Grid>
          </Paper>
        </Grid>

        {/* Day detail panel */}
        {selected && (
          <Grid item xs={12} md={4}>
            <Paper elevation={0} sx={{
              p: 3,
              borderRadius: '20px',
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
              height: '100%',
            }}>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
                {selected.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Typography>

              {selectedActivities.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <LucideCalendar size={32} color="var(--text-muted)" style={{ marginBottom: 8 }} />
                  <Typography color="text.secondary" variant="body2">No activities on this day</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {selectedActivities.map((a, i) => {
                    const c = ACTIVITY_COLORS[a.activityType] || ACTIVITY_COLORS.NOTE;
                    return (
                      <Box key={i} sx={{
                        p: 2,
                        borderRadius: '12px',
                        bgcolor: c.bg,
                        borderLeft: `3px solid ${c.border}`,
                      }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <Typography variant="body2" fontWeight={600} sx={{ flex: 1, mr: 1 }}>
                            {a.subject || '(No subject)'}
                          </Typography>
                          <Chip
                            label={a.activityType}
                            size="small"
                            sx={{ bgcolor: `${c.label}20`, color: c.label, fontWeight: 700, fontSize: '0.65rem', height: 18 }}
                          />
                        </Box>
                        {a.body && (
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            {a.body.length > 80 ? a.body.slice(0, 80) + '…' : a.body}
                          </Typography>
                        )}
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Paper>
          </Grid>
        )}
      </Grid>
    </Box>
  );
}
