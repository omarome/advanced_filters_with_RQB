import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Paper, Typography, Select, MenuItem, FormControl,
  InputLabel, Button, IconButton, Chip, CircularProgress, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TablePagination,
  TextField, Tooltip
} from '@mui/material';
import {
  LucideFilter, LucidePlus, LucideTrash2, LucideSearch,
  LucideDownload, LucideBookmark, LucideRefreshCw
} from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { executeCrmQuery, fetchAllFields } from '../../services/crmQueryApi';

const ENTITY_TYPES = [
  { value: 'CONTACT',      label: 'Contacts' },
  { value: 'ORGANIZATION', label: 'Organizations' },
  { value: 'OPPORTUNITY',  label: 'Opportunities (Deals)' },
  { value: 'ACTIVITY',     label: 'Activities' },
  { value: 'TEAM_MEMBER',  label: 'Team Members' },
];

const OPERATORS_BY_TYPE = {
  STRING: [
    { value: '=',             label: 'equals' },
    { value: '!=',            label: 'not equals' },
    { value: 'contains',      label: 'contains' },
    { value: 'doesNotContain',label: 'does not contain' },
    { value: 'beginsWith',    label: 'begins with' },
    { value: 'endsWith',      label: 'ends with' },
    { value: 'null',          label: 'is empty' },
    { value: 'notNull',       label: 'is not empty' },
  ],
  EMAIL: [
    { value: '=',        label: 'equals' },
    { value: 'contains', label: 'contains' },
    { value: 'null',     label: 'is empty' },
    { value: 'notNull',  label: 'is not empty' },
  ],
  NUMBER: [
    { value: '=',  label: '=' },
    { value: '!=', label: '≠' },
    { value: '>',  label: '>' },
    { value: '>=', label: '≥' },
    { value: '<',  label: '<' },
    { value: '<=', label: '≤' },
  ],
  DATE: [
    { value: '=',  label: 'on' },
    { value: '!=', label: 'not on' },
    { value: '>',  label: 'after' },
    { value: '>=', label: 'on or after' },
    { value: '<',  label: 'before' },
    { value: '<=', label: 'on or before' },
  ],
  BOOL: [
    { value: '=',  label: 'is' },
    { value: '!=', label: 'is not' },
  ],
};

const selectSx = {
  bgcolor: 'rgba(255,255,255,0.03)',
  borderRadius: '10px',
  '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.08)' },
  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-color)' },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--primary-color)' },
  color: 'var(--text-color)',
};

function emptyRule() {
  return { id: Date.now(), field: '', operator: '=', value: '' };
}

function getResultColumns(entityType, rows) {
  if (!rows.length) return [];
  const sample = rows[0];
  // Show the most useful columns per entity
  const priority = {
    CONTACT:      ['fullName', 'email', 'jobTitle', 'lifecycleStage', 'organizationName'],
    ORGANIZATION: ['name', 'industry', 'city', 'country', 'numberOfEmployees'],
    OPPORTUNITY:  ['name', 'stage', 'amount', 'organizationName', 'assignedToName'],
    ACTIVITY:     ['activityType', 'subject', 'taskDueDate', 'entityType'],
    TEAM_MEMBER:  ['displayName', 'email', 'jobTitle', 'department', 'role'],
  };
  const cols = priority[entityType] || Object.keys(sample).slice(0, 6);
  return cols.filter(k => k in sample);
}

export default function CrmQueryPage() {
  const { addNotification } = useNotifications();
  const [entityType, setEntityType] = useState('CONTACT');
  const [combinator, setCombinator] = useState('and');
  const [rules, setRules]           = useState([emptyRule()]);
  const [allFields, setAllFields]   = useState({});
  const [fieldsLoading, setFieldsLoading] = useState(true);

  const [results, setResults]       = useState(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [page, setPage]             = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Load field metadata once
  useEffect(() => {
    fetchAllFields()
      .then(setAllFields)
      .catch(() => addNotification('Could not load field metadata', 'error'))
      .finally(() => setFieldsLoading(false));
  }, []);

  // Reset rules when entity type changes
  const handleEntityChange = (newType) => {
    setEntityType(newType);
    setRules([emptyRule()]);
    setResults(null);
    setPage(0);
  };

  const currentFields = allFields[entityType] || [];

  // ── Rule management ───────────────────────────────────────────────────
  const addRule = () => setRules(r => [...r, emptyRule()]);
  const removeRule = (id) => setRules(r => r.filter(x => x.id !== id));
  const updateRule = (id, patch) => setRules(r => r.map(x => x.id === id ? { ...x, ...patch } : x));

  const getFieldMeta = (fieldName) => currentFields.find(f => f.name === fieldName);
  const getOperators = (fieldName) => {
    const meta = getFieldMeta(fieldName);
    return OPERATORS_BY_TYPE[meta?.type] || OPERATORS_BY_TYPE.STRING;
  };

  // ── Execute query ─────────────────────────────────────────────────────
  const runQuery = async (p = page) => {
    const validRules = rules.filter(r => r.field && r.operator);
    setQueryLoading(true);
    try {
      const data = await executeCrmQuery({
        entityType,
        combinator,
        rules: validRules.map(({ field, operator, value }) => ({ field, operator, value })),
        page: p,
        size: rowsPerPage,
      });
      setResults(data);
    } catch (e) {
      addNotification(e.message || 'Query failed', 'error');
    } finally {
      setQueryLoading(false);
    }
  };

  const handlePageChange = (_, newPage) => {
    setPage(newPage);
    runQuery(newPage);
  };

  const exportCsv = () => {
    if (!results?.content?.length) return;
    const cols = getResultColumns(entityType, results.content);
    const rows = results.content.map(row => cols.map(c => `"${row[c] ?? ''}"`).join(','));
    const csv  = [cols.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a'); a.href = url; a.download = `${entityType.toLowerCase()}_segment.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const resultColumns = results?.content?.length ? getResultColumns(entityType, results.content) : [];

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(124,105,239,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LucideFilter size={20} color="var(--primary-color)" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={700} className="page-title-gradient">Segmentation Engine</Typography>
            <Typography variant="caption" color="text.secondary">Filter any CRM entity with advanced rules</Typography>
          </Box>
        </Box>
      </Box>

      {/* Query Builder Panel */}
      <Paper elevation={0} sx={{
        p: 3, mb: 3, borderRadius: '20px',
        bgcolor: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Entity type + combinator row */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'var(--text-muted)' }}>Entity Type</InputLabel>
              <Select
                label="Entity Type"
                value={entityType}
                onChange={e => handleEntityChange(e.target.value)}
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#1b2436' } } }}
              >
                {ENTITY_TYPES.map(et => (
                  <MenuItem key={et.value} value={et.value}>{et.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ color: 'var(--text-muted)' }}>Match</InputLabel>
              <Select
                label="Match"
                value={combinator}
                onChange={e => setCombinator(e.target.value)}
                sx={selectSx}
                MenuProps={{ PaperProps: { sx: { bgcolor: '#1b2436' } } }}
              >
                <MenuItem value="and">ALL rules (AND)</MenuItem>
                <MenuItem value="or">ANY rule (OR)</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>

        <Divider sx={{ mb: 3, borderColor: 'rgba(255,255,255,0.06)' }} />

        {/* Rules */}
        {fieldsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={32} sx={{ color: 'var(--primary-color)' }} />
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {rules.map((rule, i) => {
              const ops = getOperators(rule.field);
              const meta = getFieldMeta(rule.field);
              const needsValue = rule.operator !== 'null' && rule.operator !== 'notNull';

              return (
                <Box key={rule.id} sx={{ display: 'flex', gap: 1.5, alignItems: 'center', flexWrap: 'wrap' }}>
                  {i > 0 && (
                    <Chip
                      label={combinator.toUpperCase()}
                      size="small"
                      sx={{ bgcolor: 'rgba(124,105,239,0.1)', color: 'var(--primary-color)', fontWeight: 700, minWidth: 40 }}
                    />
                  )}

                  {/* Field picker */}
                  <FormControl size="small" sx={{ minWidth: 180 }}>
                    <InputLabel sx={{ color: 'var(--text-muted)' }}>Field</InputLabel>
                    <Select
                      label="Field"
                      value={rule.field}
                      onChange={e => updateRule(rule.id, { field: e.target.value, operator: '=', value: '' })}
                      sx={selectSx}
                      MenuProps={{ PaperProps: { sx: { bgcolor: '#1b2436' } } }}
                    >
                      {currentFields.map(f => (
                        <MenuItem key={f.name} value={f.name}>{f.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Operator picker */}
                  <FormControl size="small" sx={{ minWidth: 150 }}>
                    <InputLabel sx={{ color: 'var(--text-muted)' }}>Operator</InputLabel>
                    <Select
                      label="Operator"
                      value={rule.operator}
                      onChange={e => updateRule(rule.id, { operator: e.target.value })}
                      sx={selectSx}
                      MenuProps={{ PaperProps: { sx: { bgcolor: '#1b2436' } } }}
                    >
                      {ops.map(op => (
                        <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  {/* Value input */}
                  {needsValue && (
                    <TextField
                      size="small"
                      label="Value"
                      value={rule.value}
                      onChange={e => updateRule(rule.id, { value: e.target.value })}
                      type={meta?.type === 'NUMBER' ? 'number' : meta?.type === 'DATE' ? 'date' : 'text'}
                      sx={{
                        minWidth: 160,
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '10px',
                          bgcolor: 'rgba(255,255,255,0.03)',
                          '& fieldset': { borderColor: 'rgba(255,255,255,0.08)' },
                          '&:hover fieldset': { borderColor: 'var(--primary-color)' },
                        },
                        '& .MuiInputLabel-root': { color: 'var(--text-muted)' },
                        '& .MuiInputBase-input': { color: 'var(--text-color)' },
                      }}
                      InputLabelProps={meta?.type === 'DATE' ? { shrink: true } : {}}
                    />
                  )}

                  {/* Remove rule */}
                  <Tooltip title="Remove rule">
                    <IconButton
                      size="small"
                      onClick={() => removeRule(rule.id)}
                      disabled={rules.length === 1}
                      sx={{ color: 'var(--text-muted)', '&:hover': { color: '#ef4444' } }}
                    >
                      <LucideTrash2 size={16} />
                    </IconButton>
                  </Tooltip>
                </Box>
              );
            })}

            {/* Add rule + Run buttons */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap', alignItems: 'center' }}>
              <Button
                size="small"
                startIcon={<LucidePlus size={15} />}
                onClick={addRule}
                sx={{ color: 'var(--primary-color)', textTransform: 'none', borderRadius: '8px' }}
              >
                Add Rule
              </Button>
              <Button
                variant="contained"
                startIcon={queryLoading ? <CircularProgress size={15} color="inherit" /> : <LucideSearch size={15} />}
                onClick={() => { setPage(0); runQuery(0); }}
                disabled={queryLoading || !rules.some(r => r.field)}
                sx={{
                  bgcolor: 'var(--primary-color)',
                  '&:hover': { bgcolor: 'var(--primary-hover)' },
                  textTransform: 'none',
                  borderRadius: '10px',
                  px: 3,
                }}
              >
                {queryLoading ? 'Running...' : 'Run Segment'}
              </Button>
              {results && (
                <Button
                  size="small"
                  startIcon={<LucideRefreshCw size={15} />}
                  onClick={() => { setResults(null); setRules([emptyRule()]); }}
                  sx={{ color: 'var(--text-muted)', textTransform: 'none' }}
                >
                  Reset
                </Button>
              )}
            </Box>
          </Box>
        )}
      </Paper>

      {/* Results Table */}
      {results && (
        <Paper elevation={0} sx={{
          borderRadius: '20px',
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          {/* Results header */}
          <Box sx={{
            px: 3, py: 2,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="h6" fontWeight={700}>Results</Typography>
              <Chip
                label={`${results.totalElements.toLocaleString()} matches`}
                size="small"
                sx={{ bgcolor: 'rgba(124,105,239,0.1)', color: 'var(--primary-color)', fontWeight: 700 }}
              />
            </Box>
            <Button
              size="small"
              startIcon={<LucideDownload size={15} />}
              onClick={exportCsv}
              disabled={!results.content.length}
              sx={{ color: 'var(--text-muted)', textTransform: 'none' }}
            >
              Export CSV
            </Button>
          </Box>

          {results.content.length === 0 ? (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <Typography color="text.secondary">No records match the current filters.</Typography>
            </Box>
          ) : (
            <>
              <Box sx={{ overflowX: 'auto' }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      {resultColumns.map(col => (
                        <TableCell key={col} sx={{
                          color: 'var(--text-muted)',
                          fontWeight: 700,
                          fontSize: '0.75rem',
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          borderBottom: '1px solid rgba(255,255,255,0.06)',
                          whiteSpace: 'nowrap',
                        }}>
                          {col.replace(/([A-Z])/g, ' $1').trim()}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {results.content.map((row, i) => (
                      <TableRow key={i} sx={{ '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' } }}>
                        {resultColumns.map(col => (
                          <TableCell key={col} sx={{
                            borderBottom: '1px solid rgba(255,255,255,0.03)',
                            color: 'var(--text-color)',
                            fontSize: '0.85rem',
                            whiteSpace: 'nowrap',
                            maxWidth: 200,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {row[col] != null ? String(row[col]) : '—'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
              <TablePagination
                component="div"
                count={results.totalElements}
                page={page}
                onPageChange={handlePageChange}
                rowsPerPage={rowsPerPage}
                rowsPerPageOptions={[10, 20, 50]}
                onRowsPerPageChange={e => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                sx={{ color: 'var(--text-muted)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
              />
            </>
          )}
        </Paper>
      )}
    </Box>
  );
}
