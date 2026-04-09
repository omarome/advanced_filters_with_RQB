import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { LucideFilter, LucideTrash2, LucidePlusCircle } from 'lucide-react';
import { fetchSavedViews, deleteSavedView } from '../../services/userApi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';

/**
 * SalesSidebarSavedViews
 *
 * Sidebar "Saved Views" card for Sales pages (Organizations, Contacts, Pipeline).
 * Mirrors the QuickFilterBuilder's saved-filters-section visually, using the same
 * CSS classes so it looks identical.
 *
 * Applying a view: navigates to the current page with ?applyView=<id>.
 * The Sales page listens for that param, applies the filters, and clears the URL.
 *
 * Refreshing: listens for the global "salesViewSaved" DOM event that each Sales
 * page dispatches after a successful save.
 */

function entityTypeFromPath(pathname) {
  if (pathname.includes('/organizations')) return 'organizations';
  if (pathname.includes('/contacts'))      return 'contacts';
  if (pathname.includes('/pipeline'))      return 'pipeline';
  return null;
}

const SalesSidebarSavedViews = () => {
  const location  = useLocation();
  const navigate  = useNavigate();
  const entityType = entityTypeFromPath(location.pathname);

  const [views, setViews]           = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeViewId, setActiveViewId] = useState(null);

  // ── Load views for this entity type ─────────────────────────────────────────
  const loadViews = useCallback(async () => {
    if (!entityType) return;
    try {
      const all = await fetchSavedViews();
      const mine = all.filter(v => {
        try { return JSON.parse(v.queryJson)?.entityType === entityType; }
        catch { return false; }
      });
      setViews(mine);
    } catch {
      // silent — sidebar views are non-critical
    }
  }, [entityType]);

  // Reload on page change and on "salesViewSaved" custom event from Sales pages
  useEffect(() => {
    loadViews();
    setActiveViewId(null); // reset active when switching pages
  }, [loadViews]);

  useEffect(() => {
    const onSaved = () => loadViews();
    window.addEventListener('salesViewSaved', onSaved);
    return () => window.removeEventListener('salesViewSaved', onSaved);
  }, [loadViews]);

  // ── Apply a saved view (navigate with ?applyView=ID) ────────────────────────
  const handleApply = useCallback((view) => {
    if (activeViewId === view.id) {
      // Second click: clear the active view by navigating with ?clearView=1
      setActiveViewId(null);
      navigate(`${location.pathname}?clearView=1`);
    } else {
      setActiveViewId(view.id);
      navigate(`${location.pathname}?applyView=${view.id}`);
    }
  }, [navigate, location.pathname, activeViewId]);

  // ── Delete ───────────────────────────────────────────────────────────────────
  const handleDelete = useCallback(async (e, view) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${view.name}"?`)) return;
    try {
      await deleteSavedView(view.id);
      setViews(prev => prev.filter(v => v.id !== view.id));
      if (activeViewId === view.id) setActiveViewId(null);
      toast.success('Saved view deleted.');
    } catch {
      toast.error('Failed to delete view');
    }
  }, [activeViewId]);

  const filteredViews = useMemo(() =>
    views.filter(v => v.name.toLowerCase().includes(searchQuery.toLowerCase())),
    [views, searchQuery]
  );

  if (!entityType) return null;

  return (
    <aside className="quick-filter-sidebar">
      <div className="sidebar-card saved-filters-section">
        <div className="card-header">
          <h2 className="card-title">Saved Views</h2>
          <button
            className="add-filter-btn"
            title="Save Current View"
            onClick={() => window.dispatchEvent(new CustomEvent('salesOpenSaveView'))}
          >
            <LucidePlusCircle size={16} />
          </button>
        </div>

        {views.length > 0 && (
          <div className="saved-filters-search">
            <input
              type="text"
              placeholder="Search saved views..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="filter-input"
            />
          </div>
        )}

        <nav className="saved-filters-nav custom-scrollbar">
          {views.length === 0 ? (
            <div className="no-filters-msg">
              No saved views yet. Use "Save View" in the table toolbar to save your current filters.
            </div>
          ) : filteredViews.length === 0 ? (
            <div className="no-filters-msg">No views match your search.</div>
          ) : (
            filteredViews.map(view => {
              const isActive = activeViewId === view.id;
              return (
                <div key={view.id} className={`nav-item-wrapper ${isActive ? 'active' : ''}`}>
                  <button
                    className="nav-item-btn"
                    onClick={() => handleApply(view)}
                    title={isActive ? 'Click to clear' : `Apply: ${view.name}`}
                  >
                    <div className="nav-label-group">
                      <LucideFilter size={14} />
                      <span className="truncate-text">{view.name}</span>
                    </div>
                  </button>
                  <div className="nav-item-actions">
                    {isActive && <span className="applied-pill">Applied</span>}
                    <button
                      className="delete-view-btn"
                      onClick={e => handleDelete(e, view)}
                      title="Delete saved view"
                    >
                      <LucideTrash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </nav>
      </div>
    </aside>
  );
};

export default SalesSidebarSavedViews;
