import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box, Paper, InputBase, CircularProgress, Typography,
  Divider, Avatar
} from '@mui/material';
import {
  LucideSearch, LucideBuilding, LucideUser, LucideTarget, LucideX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getAccessToken } from '../../context/AuthProvider';

const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api';

const ENTITY_ICONS = {
  contacts:      { icon: LucideUser,     color: '#6366f1', label: 'Contact' },
  organizations: { icon: LucideBuilding, color: '#f59e0b', label: 'Organization' },
  opportunities: { icon: LucideTarget,   color: '#10b981', label: 'Deal' },
};

let debounceTimer;

export default function GlobalSearch() {
  const [query, setQuery]     = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen]       = useState(false);
  const containerRef = useRef(null);
  const navigate     = useNavigate();

  // Close on outside click
  useEffect(() => {
    function onClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const search = useCallback(async (q) => {
    if (!q || q.length < 2) { setResults(null); return; }
    setLoading(true);
    try {
      const token = getAccessToken();
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}&limit=5`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error();
      setResults(await res.json());
    } catch {
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    setOpen(true);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => search(val), 300);
  };

  const handleSelect = (type, item) => {
    setOpen(false);
    setQuery('');
    const routes = {
      contacts:      '/sales/contacts',
      organizations: '/sales/organizations',
      opportunities: '/sales/opportunities',
    };
    navigate(routes[type] || '/');
  };

  const totalResults = results
    ? Object.values(results).reduce((s, arr) => s + arr.length, 0)
    : 0;

  return (
    <Box ref={containerRef} sx={{ position: 'relative', width: { xs: 200, sm: 300, md: 380 } }}>
      {/* Input */}
      <Paper elevation={0} sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1.5,
        py: 0.75,
        borderRadius: '12px',
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        '&:focus-within': {
          borderColor: 'var(--primary-color)',
          bgcolor: 'rgba(255,255,255,0.06)',
        },
        transition: 'all 0.2s',
      }}>
        {loading
          ? <CircularProgress size={16} sx={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          : <LucideSearch size={16} color="var(--text-muted)" style={{ flexShrink: 0 }} />
        }
        <InputBase
          placeholder="Search contacts, deals, orgs…"
          value={query}
          onChange={handleChange}
          onFocus={() => query.length >= 2 && setOpen(true)}
          sx={{
            flex: 1,
            fontSize: '0.85rem',
            color: 'var(--text-color)',
            '& input::placeholder': { color: 'var(--text-muted)' },
          }}
        />
        {query && (
          <LucideX
            size={14}
            color="var(--text-muted)"
            style={{ cursor: 'pointer', flexShrink: 0 }}
            onClick={() => { setQuery(''); setResults(null); setOpen(false); }}
          />
        )}
      </Paper>

      {/* Dropdown */}
      {open && results && (
        <Paper elevation={8} sx={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          mt: 0.5,
          zIndex: 1400,
          borderRadius: '16px',
          bgcolor: 'var(--dropdown-bg, #1b2436)',
          border: '1px solid var(--border-color, rgba(255,255,255,0.08))',
          overflow: 'hidden',
          maxHeight: 480,
          overflowY: 'auto',
        }}>
          {totalResults === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="body2" color="text.secondary">No results for "{query}"</Typography>
            </Box>
          ) : (
            Object.entries(ENTITY_ICONS).map(([type, meta]) => {
              const items = results[type] || [];
              if (!items.length) return null;
              const Icon = meta.icon;
              return (
                <Box key={type}>
                  <Box sx={{ px: 2, py: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Icon size={13} color={meta.color} />
                    <Typography variant="caption" sx={{ color: meta.color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      {meta.label}s
                    </Typography>
                  </Box>
                  {items.map((item, i) => {
                    const label = item.fullName || item.name || `${item.firstName ?? ''} ${item.lastName ?? ''}`.trim();
                    const sub   = item.email || item.industry || item.stage || '';
                    return (
                      <Box
                        key={i}
                        onClick={() => handleSelect(type, item)}
                        sx={{
                          px: 2.5, py: 1,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
                        }}
                      >
                        <Avatar sx={{ width: 28, height: 28, bgcolor: `${meta.color}20`, fontSize: '0.65rem', color: meta.color }}>
                          {label.slice(0, 2).toUpperCase()}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" fontWeight={600} noWrap>{label}</Typography>
                          {sub && (
                            <Typography variant="caption" color="text.secondary" noWrap>{sub}</Typography>
                          )}
                        </Box>
                      </Box>
                    );
                  })}
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.04)' }} />
                </Box>
              );
            })
          )}
        </Paper>
      )}
    </Box>
  );
}
