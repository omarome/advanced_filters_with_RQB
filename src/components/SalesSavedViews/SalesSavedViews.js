import React, { useState, useEffect, useCallback, useRef } from 'react';
import { LucidePlus, LucideTrash2, LucideCheck, LucideBookmark, LucideX } from 'lucide-react';
import { saveView, fetchSavedViews, deleteSavedView } from '../../services/userApi';
import { countSalesFilters } from '../../utils/salesFilterUtils';
import { toast } from 'react-hot-toast';
import './SalesSavedViews.less';

/**
 * SalesSavedViews
 *
 * Inline "Saved Views" strip for Sales pages (Organizations, Contacts, Pipeline).
 * Renders directly below the InlineFilterBar — self-contained, no state lifting needed.
 *
 * Saved views are stored via the same saveView API used by /directory, but the
 * queryJson encodes { entityType, filters } instead of an RQB query. Views are
 * filtered by entityType client-side so each page only sees its own views.
 *
 * Future server-side migration: add an `entityType` column to the saved_views table
 * and filter by it in the API — no changes needed in this component.
 */
const SalesSavedViews = ({ entityType, currentFilters, onApplyFilters }) => {
  const [views, setViews]         = useState([]);
  const [isNaming, setIsNaming]   = useState(false);
  const [name, setName]           = useState('');
  const [saving, setSaving]       = useState(false);
  const nameInputRef              = useRef(null);

  const activeFilterCount = countSalesFilters(currentFilters, entityType);
  const hasFilters        = activeFilterCount > 0;

  // ── Load views for this entity type ───────────────────────────────────────
  const loadViews = useCallback(async () => {
    try {
      const all = await fetchSavedViews();
      const mine = all.filter(v => {
        try { return JSON.parse(v.queryJson)?.entityType === entityType; }
        catch { return false; }
      });
      setViews(mine);
    } catch {
      // Silently fail — saved views are non-critical
    }
  }, [entityType]);

  useEffect(() => { loadViews(); }, [loadViews]);

  // Focus name input when it appears
  useEffect(() => {
    if (isNaming) nameInputRef.current?.focus();
  }, [isNaming]);

  // ── Save current filters as a named view ──────────────────────────────────
  const handleSave = useCallback(async () => {
    if (!name.trim() || !hasFilters) return;
    setSaving(true);
    try {
      await saveView({
        name:      name.trim(),
        queryJson: JSON.stringify({ entityType, filters: currentFilters }),
      });
      toast.success(`View "${name.trim()}" saved!`);
      setName('');
      setIsNaming(false);
      loadViews();
    } catch {
      toast.error('Failed to save view');
    } finally {
      setSaving(false);
    }
  }, [name, hasFilters, entityType, currentFilters, loadViews]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter')  handleSave();
    if (e.key === 'Escape') { setIsNaming(false); setName(''); }
  };

  // ── Apply a saved view ────────────────────────────────────────────────────
  const handleApply = useCallback((view) => {
    try {
      const { filters } = JSON.parse(view.queryJson);
      // If clicking an already-active view, clear it instead
      if (isActive(view)) {
        onApplyFilters(() => getInitialFilters(entityType));
      } else {
        onApplyFilters(() => filters);
      }
    } catch {
      toast.error('Could not apply saved view');
    }
  }, [entityType, onApplyFilters, currentFilters]);

  // ── Delete a saved view ───────────────────────────────────────────────────
  const handleDelete = useCallback(async (e, view) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${view.name}"?`)) return;
    try {
      await deleteSavedView(view.id);
      setViews(prev => prev.filter(v => v.id !== view.id));
      toast.success('Saved view deleted.');
    } catch {
      toast.error('Failed to delete view');
    }
  }, []);

  // ── Check if a view matches current filter state ──────────────────────────
  const isActive = useCallback((view) => {
    try {
      const { filters } = JSON.parse(view.queryJson);
      return JSON.stringify(filters) === JSON.stringify(currentFilters);
    } catch { return false; }
  }, [currentFilters]);

  // Don't render the strip at all if no views and no filters active
  if (views.length === 0 && !hasFilters) return null;

  return (
    <div className="sales-saved-views">
      <span className="ssv-label">
        <LucideBookmark size={12} />
        Saved Views
      </span>

      {/* View chips */}
      <div className="ssv-chips">
        {views.map(view => {
          const active = isActive(view);
          return (
            <button
              key={view.id}
              className={`ssv-chip ${active ? 'is-active' : ''}`}
              onClick={() => handleApply(view)}
              title={active ? 'Click to clear' : `Apply: ${view.name}`}
            >
              {active && <LucideCheck size={11} className="ssv-chip-check" />}
              <span className="ssv-chip-name">{view.name}</span>
              <span
                className="ssv-chip-delete"
                role="button"
                tabIndex={0}
                onClick={(e) => handleDelete(e, view)}
                onKeyDown={(e) => e.key === 'Enter' && handleDelete(e, view)}
                title="Delete view"
              >
                <LucideX size={10} />
              </span>
            </button>
          );
        })}
      </div>

      {/* Save current view */}
      {isNaming ? (
        <div className="ssv-name-input-wrap">
          <input
            ref={nameInputRef}
            type="text"
            className="ssv-name-input"
            placeholder="View name…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={80}
          />
          <button
            className="ssv-save-confirm-btn"
            onClick={handleSave}
            disabled={!name.trim() || saving}
            title="Save"
          >
            {saving ? '…' : <LucideCheck size={13} />}
          </button>
          <button
            className="ssv-cancel-btn"
            onClick={() => { setIsNaming(false); setName(''); }}
            title="Cancel"
          >
            <LucideX size={13} />
          </button>
        </div>
      ) : (
        <button
          className="ssv-save-btn"
          onClick={() => setIsNaming(true)}
          disabled={!hasFilters}
          title={hasFilters ? 'Save current filters as a view' : 'Apply filters first to save a view'}
        >
          <LucidePlus size={12} />
          Save view
        </button>
      )}
    </div>
  );
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getInitialFilters(entityType) {
  // Lazy-import to avoid circular dependency
  const { INITIAL_ORG_FILTERS, INITIAL_CONTACT_FILTERS, INITIAL_PIPELINE_FILTERS }
    = require('../../utils/salesFilterUtils');
  switch (entityType) {
    case 'organizations': return INITIAL_ORG_FILTERS;
    case 'contacts':      return INITIAL_CONTACT_FILTERS;
    case 'pipeline':      return INITIAL_PIPELINE_FILTERS;
    default:              return {};
  }
}

export default SalesSavedViews;
