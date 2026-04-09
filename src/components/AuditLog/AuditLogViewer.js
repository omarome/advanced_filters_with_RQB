import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, Chip, CircularProgress,
  Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Collapse, Tooltip
} from '@mui/material';
import { LucideHistory, LucideChevronDown, LucideChevronRight, LucideCheck, LucidePencil, LucideTrash2 } from 'lucide-react';
import { getAccessToken } from '../../context/AuthProvider';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const REV_TYPE_META = {
  ADD: { label: 'Created', color: '#10b981', icon: LucideCheck },
  MOD: { label: 'Modified', color: '#f59e0b', icon: LucidePencil },
  DEL: { label: 'Deleted', color: '#ef4444', icon: LucideTrash2 },
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  } catch { return iso; }
}

function RevisionRow({ rev, entityType }) {
  const [expanded, setExpanded] = useState(false);
  const meta = REV_TYPE_META[rev.revisionType] || REV_TYPE_META.MOD;
  const Icon = meta.icon;

  // Extract a human-readable summary from the entity snapshot
  const entity = rev.entity || {};
  const summary = entity.name || entity.fullName
    || `${entity.firstName ?? ''} ${entity.lastName ?? ''}`.trim()
    || `Rev #${rev.revisionNumber}`;

  // Fields to display in the expanded snapshot (skip internal fields)
  const SKIP = new Set(['id', 'isDeleted', 'createdBy', 'updatedBy', 'version']);
  const displayFields = Object.entries(entity).filter(([k]) => !SKIP.has(k));

  return (
    <>
      <TableRow
        onClick={() => setExpanded(e => !e)}
        sx={{
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.02)' },
          borderBottom: expanded ? 'none' : '1px solid rgba(255,255,255,0.04)',
        }}
      >
        <TableCell sx={{ py: 1.5, borderBottom: 'none', width: 32 }}>
          <IconButton size="small" sx={{ color: 'var(--text-muted)', p: 0.3 }}>
            {expanded ? <LucideChevronDown size={14} /> : <LucideChevronRight size={14} />}
          </IconButton>
        </TableCell>
        <TableCell sx={{ py: 1.5, borderBottom: 'none' }}>
          <Typography variant="caption" color="text.secondary">#{rev.revisionNumber}</Typography>
        </TableCell>
        <TableCell sx={{ py: 1.5, borderBottom: 'none' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box sx={{ width: 28, height: 28, borderRadius: '8px', bgcolor: `${meta.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon size={14} color={meta.color} />
            </Box>
            <Box>
              <Typography variant="body2" fontWeight={600}>{summary}</Typography>
            </Box>
          </Box>
        </TableCell>
        <TableCell sx={{ py: 1.5, borderBottom: 'none' }}>
          <Chip
            label={meta.label}
            size="small"
            sx={{ bgcolor: `${meta.color}18`, color: meta.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }}
          />
        </TableCell>
        <TableCell sx={{ py: 1.5, borderBottom: 'none' }}>
          <Typography variant="caption" color="text.secondary">{formatDate(rev.revisionDate)}</Typography>
        </TableCell>
      </TableRow>

      {/* Expanded snapshot */}
      <TableRow>
        <TableCell colSpan={5} sx={{ p: 0, borderBottom: expanded ? '1px solid rgba(255,255,255,0.06)' : 'none' }}>
          <Collapse in={expanded} unmountOnExit>
            <Box sx={{
              mx: 2, mb: 2, mt: 0.5,
              p: 2,
              borderRadius: '12px',
              bgcolor: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Snapshot at this revision
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {displayFields.map(([key, val]) => (
                  val != null && (
                    <Box key={key} sx={{ minWidth: 120 }}>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: 0.4 }}>
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.82rem' }}>
                        {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      </Typography>
                    </Box>
                  )
                ))}
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
}

/**
 * Embeddable audit log panel.
 *
 * Usage: <AuditLogViewer entityType="OPPORTUNITY" entityId={deal.id} />
 */
export default function AuditLogViewer({ entityType, entityId }) {
  const [revisions, setRevisions] = useState([]);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState(null);

  useEffect(() => {
    if (!entityType || !entityId) return;
    setLoading(true);
    setError(null);

    const token = getAccessToken();
    fetch(`${API_BASE}/audit/${entityType}/${entityId}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(data => setRevisions([...data].reverse())) // newest first
      .catch(e => setError(e.message === '403' ? 'Insufficient permissions to view audit log.' : 'Failed to load audit history.'))
      .finally(() => setLoading(false));
  }, [entityType, entityId]);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LucideHistory size={16} color="var(--primary-color)" />
        <Typography variant="subtitle2" fontWeight={700}>Revision History</Typography>
        {revisions.length > 0 && (
          <Chip label={revisions.length} size="small" sx={{ bgcolor: 'rgba(124,105,239,0.1)', color: 'var(--primary-color)', fontWeight: 700, height: 18, fontSize: '0.7rem' }} />
        )}
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} sx={{ color: 'var(--primary-color)' }} />
        </Box>
      )}

      {error && (
        <Typography variant="body2" color="error.main" sx={{ py: 2 }}>{error}</Typography>
      )}

      {!loading && !error && revisions.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2 }}>No revision history found.</Typography>
      )}

      {!loading && !error && revisions.length > 0 && (
        <Paper elevation={0} sx={{
          borderRadius: '12px',
          bgcolor: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          overflow: 'hidden',
        }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', width: 32, py: 1 }} />
                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', py: 1 }}>#</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', py: 1 }}>Record</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', py: 1 }}>Change</TableCell>
                <TableCell sx={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', py: 1 }}>When</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {revisions.map((rev, i) => (
                <RevisionRow key={i} rev={rev} entityType={entityType} />
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Box>
  );
}
