import React, { useState, useEffect, useRef } from 'react';
import {
  Box, Typography, IconButton, CircularProgress,
  LinearProgress, Chip, Tooltip
} from '@mui/material';
import { LucidePaperclip, LucideUpload, LucideDownload, LucideTrash2, LucideFile, LucideFileImage, LucideFileText } from 'lucide-react';
import { apiJson, apiFetch } from '../../services/apiClient';

function formatBytes(bytes) {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ contentType }) {
  if (contentType?.startsWith('image/')) return <LucideFileImage size={16} />;
  if (contentType?.includes('pdf') || contentType?.includes('text')) return <LucideFileText size={16} />;
  return <LucideFile size={16} />;
}

/**
 * Drag-and-drop file attachment panel for any CRM entity.
 *
 * Usage: <AttachmentPanel entityType="OPPORTUNITY" entityId={deal.id} />
 */
export default function AttachmentPanel({ entityType, entityId }) {
  const [attachments, setAttachments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef(null);

  const base = `/attachments/${entityType}/${entityId}`;

  const load = async () => {
    if (!entityType || !entityId) return;
    setLoading(true);
    try {
      const data = await apiJson(base);
      setAttachments(data);
    } catch {
      setAttachments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [entityType, entityId]);

  const upload = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    setUploadProgress(0);

    // Simulate progress (real XHR progress would require XMLHttpRequest)
    const interval = setInterval(() => setUploadProgress(p => Math.min(p + 15, 90)), 200);

    try {
      const res = await apiFetch(base, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
      setUploadProgress(100);
      await load();
    } catch (e) {
      console.error(e);
    } finally {
      clearInterval(interval);
      setTimeout(() => { setUploading(false); setUploadProgress(0); }, 600);
    }
  };

  const handleFiles = (files) => {
    Array.from(files).forEach(upload);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleDelete = async (id) => {
    await apiJson(`/attachments/${id}`, {
      method: 'DELETE',
    });
    await load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LucidePaperclip size={16} color="var(--primary-color)" />
        <Typography variant="subtitle2" fontWeight={700}>Attachments</Typography>
        {attachments.length > 0 && (
          <Box sx={{ px: 1, py: 0.1, borderRadius: '8px', bgcolor: 'rgba(124,105,239,0.1)', fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 700 }}>
            {attachments.length}
          </Box>
        )}
      </Box>

      {/* Drop zone */}
      <Box
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        sx={{
          mb: 2, p: 2.5,
          borderRadius: '12px',
          border: `2px dashed ${dragging ? 'var(--primary-color)' : 'rgba(255,255,255,0.1)'}`,
          bgcolor: dragging ? 'rgba(124,105,239,0.05)' : 'rgba(255,255,255,0.02)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 0.5,
          cursor: 'pointer',
          transition: 'all 0.2s',
          '&:hover': { borderColor: 'var(--primary-color)', bgcolor: 'rgba(124,105,239,0.04)' },
        }}
      >
        <LucideUpload size={20} color="var(--text-muted)" />
        <Typography variant="caption" color="text.secondary">
          Drag files here or click to browse
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
          Max 25 MB per file
        </Typography>
        <input ref={fileInputRef} type="file" multiple hidden onChange={e => handleFiles(e.target.files)} />
      </Box>

      {uploading && (
        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary">Uploading…</Typography>
          <LinearProgress variant="determinate" value={uploadProgress}
            sx={{ mt: 0.5, borderRadius: 4, height: 4, bgcolor: 'rgba(255,255,255,0.06)',
              '& .MuiLinearProgress-bar': { bgcolor: 'var(--primary-color)' } }} />
        </Box>
      )}

      {loading && <CircularProgress size={20} sx={{ color: 'var(--primary-color)', display: 'block', mx: 'auto', my: 2 }} />}

      {!loading && attachments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center' }}>
          No attachments yet.
        </Typography>
      )}

      {!loading && attachments.map(a => (
        <Box key={a.id} sx={{
          display: 'flex', alignItems: 'center', gap: 1.5,
          p: 1.5, mb: 1,
          borderRadius: '10px',
          bgcolor: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.05)',
        }}>
          <Box sx={{ color: 'var(--text-muted)', flexShrink: 0 }}>
            <FileIcon contentType={a.contentType} />
          </Box>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} noWrap title={a.fileName}>{a.fileName}</Typography>
            <Typography variant="caption" color="text.secondary">
              {formatBytes(a.fileSize)} • {a.uploaderName}
            </Typography>
          </Box>
          {a.downloadUrl && (
            <Tooltip title="Download">
              <IconButton size="small" component="a" href={a.downloadUrl} target="_blank" rel="noopener noreferrer"
                sx={{ color: 'var(--text-muted)', '&:hover': { color: 'var(--primary-color)' } }}>
                <LucideDownload size={14} />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => handleDelete(a.id)}
              sx={{ color: 'var(--text-muted)', '&:hover': { color: '#ef4444' } }}>
              <LucideTrash2 size={14} />
            </IconButton>
          </Tooltip>
        </Box>
      ))}
    </Box>
  );
}
