import React, { useState } from 'react';
import { Box, Typography, ToggleButtonGroup, ToggleButton } from '@mui/material';
import {
  LucideLayoutList, LucideKanban, LucideCalendar, LucideBarChart2
} from 'lucide-react';
import OpportunitiesList from './OpportunitiesList';
import KanbanBoard from './KanbanBoard';
import CalendarView from './CalendarView';
import SalesDashboard from './SalesDashboard';

const VIEWS = [
  { key: 'table',     label: 'Table',     icon: LucideLayoutList },
  { key: 'board',     label: 'Board',     icon: LucideKanban },
  { key: 'calendar',  label: 'Calendar',  icon: LucideCalendar },
  { key: 'dashboard', label: 'Dashboard', icon: LucideBarChart2 },
];

export default function PipelinePage({ query, onQueryChange, onResetQuery, variables, users }) {
  const [view, setView] = useState('table');

  return (
    <Box>
      {/* View switcher header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        px: { xs: 2, md: 3 },
        pt: 2,
        pb: 1,
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <Typography variant="h6" fontWeight={700} className="page-title-gradient">
          {view === 'dashboard' ? 'Sales Dashboard' : 'Pipeline'}
        </Typography>

        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={(_, v) => v && setView(v)}
          size="small"
          sx={{
            '& .MuiToggleButton-root': {
              border: '1px solid rgba(255,255,255,0.08)',
              color: 'var(--text-muted)',
              px: 1.5,
              py: 0.5,
              gap: 0.75,
              textTransform: 'none',
              fontSize: '0.8rem',
              fontWeight: 500,
              '&.Mui-selected': {
                bgcolor: 'rgba(124,105,239,0.15)',
                color: 'var(--primary-color)',
                borderColor: 'rgba(124,105,239,0.3)',
              },
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.04)',
              },
            },
          }}
        >
          {VIEWS.map(({ key, label, icon: Icon }) => (
            <ToggleButton key={key} value={key}>
              <Icon size={15} />
              {label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Box>

      {/* Each view owns its own filter bar and data fetching */}
      <Box>
        {view === 'table'     && <OpportunitiesList query={query} onQueryChange={onQueryChange} onResetQuery={onResetQuery} variables={variables} users={users} />}
        {view === 'board'     && <KanbanBoard query={query} />}
        {view === 'calendar'  && <CalendarView />}
        {view === 'dashboard' && <SalesDashboard />}
      </Box>
    </Box>
  );
}
