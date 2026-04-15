import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Avatar, IconButton, TextField,
  Button, Collapse, CircularProgress
} from '@mui/material';
import { LucideMessageSquare, LucideCornerDownRight, LucideTrash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import { apiJson } from '../../services/apiClient';

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

function initials(name = '') {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '??';
}

// ── Single comment with optional reply form ────────────────────────────────

function CommentItem({ comment, onDelete, onReply }) {
  const { user } = useAuth();
  const [showReply, setShowReply] = useState(false);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isOwn = user?.uid && comment.authorId && String(comment.authorId) === String(user.uid);

  const handleReplySubmit = async () => {
    if (!replyBody.trim()) return;
    setSubmitting(true);
    await onReply(replyBody.trim(), comment.id);
    setReplyBody('');
    setShowReply(false);
    setSubmitting(false);
  };

  return (
    <Box sx={{ mb: 2 }}>
      <Box sx={{ display: 'flex', gap: 1.5 }}>
        <Avatar sx={{ width: 28, height: 28, bgcolor: 'rgba(124,105,239,0.2)', fontSize: '0.65rem', color: 'var(--primary-color)', flexShrink: 0 }}>
          {comment.authorAvatar
            ? <img src={comment.authorAvatar} alt="" style={{ width: '100%', borderRadius: '50%' }} />
            : initials(comment.authorName)}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Typography variant="caption" fontWeight={700}>{comment.authorName}</Typography>
            <Typography variant="caption" color="text.secondary">{formatDate(comment.createdAt)}</Typography>
          </Box>
          <Typography variant="body2" sx={{ mt: 0.25, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {comment.body}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
            <Button size="small" variant="text" sx={{ minWidth: 0, p: 0, fontSize: '0.72rem', color: 'var(--text-muted)' }}
              onClick={() => setShowReply(v => !v)}>
              <LucideCornerDownRight size={11} style={{ marginRight: 3 }} /> Reply
            </Button>
            {isOwn && (
              <IconButton size="small" sx={{ p: 0.2 }} onClick={() => onDelete(comment.id)}>
                <LucideTrash2 size={12} color="var(--text-muted)" />
              </IconButton>
            )}
          </Box>

          <Collapse in={showReply}>
            <Box sx={{ mt: 1, display: 'flex', gap: 1 }}>
              <TextField
                size="small"
                multiline
                minRows={1}
                maxRows={4}
                placeholder="Write a reply…"
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontSize: '0.82rem', borderRadius: '8px' } }}
              />
              <Button size="small" variant="contained" disabled={submitting || !replyBody.trim()} onClick={handleReplySubmit}
                sx={{ alignSelf: 'flex-end', borderRadius: '8px', textTransform: 'none', minWidth: 64 }}>
                {submitting ? <CircularProgress size={14} /> : 'Send'}
              </Button>
            </Box>
          </Collapse>

          {/* Nested replies */}
          {comment.replies?.length > 0 && (
            <Box sx={{ mt: 1.5, pl: 1.5, borderLeft: '2px solid rgba(255,255,255,0.06)' }}>
              {comment.replies.map(r => (
                <CommentItem key={r.id} comment={r} onDelete={onDelete} onReply={onReply} />
              ))}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

// ── Thread root ─────────────────────────────────────────────────────────────

/**
 * Embeddable threaded comment panel.
 *
 * Usage: <CommentThread entityType="OPPORTUNITY" entityId={deal.id} />
 */
export default function CommentThread({ entityType, entityId }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newBody, setNewBody] = useState('');
  const [posting, setPosting] = useState(false);

  const base = `/comments/${entityType}/${entityId}`;

  const load = async () => {
    if (!entityType || !entityId) return;
    setLoading(true);
    try {
      const data = await apiJson(base);
      setComments(data);
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [entityType, entityId]);

  const post = async (body, parentId = null) => {
    await apiJson(base, {
      method: 'POST',
      body: JSON.stringify({ body, parentId }),
    });
    await load();
  };

  const handlePost = async () => {
    if (!newBody.trim()) return;
    setPosting(true);
    try {
      await post(newBody.trim());
      setNewBody('');
    } finally {
      setPosting(false);
    }
  };

  const handleDelete = async (commentId) => {
    await apiJson(`/comments/${commentId}`, {
      method: 'DELETE',
    });
    await load();
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <LucideMessageSquare size={16} color="var(--primary-color)" />
        <Typography variant="subtitle2" fontWeight={700}>Discussion</Typography>
        {comments.length > 0 && (
          <Box sx={{ px: 1, py: 0.1, borderRadius: '8px', bgcolor: 'rgba(124,105,239,0.1)', fontSize: '0.7rem', color: 'var(--primary-color)', fontWeight: 700 }}>
            {comments.length}
          </Box>
        )}
      </Box>

      {/* New comment composer */}
      <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
        <TextField
          size="small"
          multiline
          minRows={2}
          maxRows={6}
          fullWidth
          placeholder="Leave a comment…"
          value={newBody}
          onChange={e => setNewBody(e.target.value)}
          sx={{ '& .MuiOutlinedInput-root': { fontSize: '0.85rem', borderRadius: '10px' } }}
        />
        <Button variant="contained" disabled={posting || !newBody.trim()} onClick={handlePost}
          sx={{ alignSelf: 'flex-end', borderRadius: '10px', textTransform: 'none', px: 2 }}>
          {posting ? <CircularProgress size={16} /> : 'Post'}
        </Button>
      </Box>

      {/* Comment list */}
      {loading && <CircularProgress size={20} sx={{ color: 'var(--primary-color)', display: 'block', mx: 'auto', my: 2 }} />}

      {!loading && comments.length === 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
          No comments yet. Be the first to start the discussion.
        </Typography>
      )}

      {!loading && comments.map(c => (
        <CommentItem key={c.id} comment={c} onDelete={handleDelete} onReply={post} />
      ))}
    </Box>
  );
}
