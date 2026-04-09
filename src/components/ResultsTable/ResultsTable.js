import React from 'react';
import { Mail, Trash2, X as LucideX, Save as LucideSave, Download as LucideDownload, ArrowUp, ArrowDown, ArrowUpDown, Loader2, ChevronRight, ChevronDown } from 'lucide-react';
import PropTypes from 'prop-types';
import '../../styles/ResultsTable.less';

const ResultsTable = ({ 
  data, 
  columns, 
  isLoading = false, 
  isSortLoading = false,
  testIdPrefix = 'results-table',
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onItemsPerPageChange,
  onPageChange,
  onBulkDelete,
  onBulkEmail,
  onResetQuery,
  query,
  onSaveView,
  onExport,
  sortField,
  sortDirection,
  onSortChange,
  onRowClick,
  renderExpandedRow,
  expandedRowId
}) => {
  const [selectedIds, setSelectedIds] = React.useState([]);
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  // Clear selection on page change or data refresh
  React.useEffect(() => {
    setSelectedIds([]);
  }, [currentPage, data]);

  const handleToggleRow = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allPageIds = data.map((row, idx) => row.id ?? idx);
      setSelectedIds(allPageIds);
    } else {
      setSelectedIds([]);
    }
  };

  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  if (isLoading) {
    return (
      <div className="results-table" data-testid={testIdPrefix}>
        <div className="results-table__loading" data-testid={`${testIdPrefix}-loading`}>
          Loading...
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="results-table" data-testid={testIdPrefix}>
        <div className="results-table__empty" data-testid={`${testIdPrefix}-empty`}>
          No results found. Try adjusting your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="results-table insight-table" data-testid={testIdPrefix}>
      <div className="results-table__header section-header">
        {onResetQuery && (
          <button 
            className="clear-filters-btn"
            onClick={onResetQuery}
            disabled={!query || !query.rules || query.rules.length === 0}
            title="Clear all filters"
          >
            <LucideX size={16} /> Clear Filters
          </button>
        )}
        <div className="header-actions-right" style={{ display: 'flex', alignItems: 'center', gap: '16px', marginLeft: onResetQuery ? '0' : 'auto' }}>
          <div className="secondary-actions desktop-only-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onSaveView && (
              <button 
                className="desktop-header-btn"
                onClick={onSaveView}
              >
                <LucideSave size={14} /> Save View
              </button>
            )}
            {onExport && (
              <button 
                className="desktop-header-btn"
                onClick={onExport}
                title="Export current view to CSV"
              >
                <LucideDownload size={14} /> Export
              </button>
            )}
          </div>
          <div className={`bulk-actions ${selectedIds.length > 0 ? 'active' : ''}`}>
          <button 
            className="bulk-btn email" 
            disabled={selectedIds.length === 0}
            onClick={() => onBulkEmail && onBulkEmail(selectedIds)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Mail size={14} /> Email
          </button>
          <button 
            className="bulk-btn delete" 
            disabled={selectedIds.length === 0}
            onClick={() => onBulkDelete && onBulkDelete(selectedIds)}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>
        </div>
      </div>
      <div className="results-table__container custom-scrollbar">
        {isSortLoading && (
          <div className="results-table__sort-overlay">
            <Loader2 className="sort-spinner" size={28} />
          </div>
        )}
        <table
          className="results-table__table"
          data-testid={`${testIdPrefix}-table`}
        >
          <thead className="results-table__thead">
            <tr>
              <th className="results-table__th checkbox-cell">
                <input 
                  type="checkbox" 
                  onChange={handleSelectAll}
                  checked={isAllSelected}
                />
              </th>
              {renderExpandedRow && <th className="results-table__th expand-cell" style={{ width: '40px' }}></th>}
              {columns.map((column) => {
                const isSorted = sortField === column.key;
                const handleSort = () => {
                  if (!onSortChange) return;
                  if (!isSorted) {
                    onSortChange(column.key, 'asc');
                  } else if (sortDirection === 'asc') {
                    onSortChange(column.key, 'desc');
                  } else {
                    onSortChange(null, 'asc');
                  }
                };
                return (
                  <th
                    key={column.key}
                    className={`results-table__th sortable ${isSorted ? 'sorted' : ''}`}
                    data-testid={`${testIdPrefix}-header-${column.key}`}
                    onClick={handleSort}
                    role="columnheader"
                    aria-sort={isSorted ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <span className="th-content">
                      {column.label || column.key}
                      <span className="sort-indicator">
                        {isSorted && sortDirection === 'asc' && <ArrowUp size={14} />}
                        {isSorted && sortDirection === 'desc' && <ArrowDown size={14} />}
                        {!isSorted && <ArrowUpDown size={14} />}
                      </span>
                    </span>
                  </th>
                );
              })}
              <th className="results-table__th actions-cell">Actions</th>
            </tr>
          </thead>
          <tbody className="results-table__tbody">
            {data.map((row, index) => {
              const rowId = row.id ?? index;
              const isSelected = selectedIds.includes(rowId);
              return (
                <React.Fragment key={`row-group-${rowId}`}>
                  <tr
                    className={`results-table__tr ${isSelected ? 'selected' : ''} ${onRowClick ? 'clickable-row' : ''}`}
                    data-testid={`${testIdPrefix}-row-${rowId}`}
                    onClick={() => onRowClick && onRowClick(row)}
                    style={onRowClick ? { cursor: 'pointer' } : {}}
                  >
                    <td className="results-table__td checkbox-cell" onClick={(e) => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => handleToggleRow(rowId)}
                      />
                    </td>
                    {renderExpandedRow && (
                      <td className="results-table__td expand-cell" style={{ width: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        {expandedRowId === rowId ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </td>
                    )}
                    {columns.map((column) => {
                      const cellValue = row[column.key];
                      let displayValue = typeof cellValue === 'boolean'
                        ? (cellValue ? 'Yes' : 'No')
                        : cellValue;

                      // Specialized rendering for InsightHub look
                      if (column.key === 'fullName') {
                         // Failsafe string construction in case the backend hasn't been recompiled yet
                         const actualValue = cellValue || `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Unknown User';
                         
                         displayValue = (
                           <div className="user-cell">
                             <img 
                               className="user-avatar" 
                               src={`https://ui-avatars.com/api/?name=${encodeURIComponent(actualValue)}&background=7c69ef&color=fff`} 
                               alt="Avatar" 
                             />
                             <div className="user-details">
                               <div className="user-name">{actualValue}</div>
                               <div className="user-subtext">{row.email || 'user@example.com'}</div>
                             </div>
                           </div>
                         );
                      }

                      if (column.key === 'isOnline') {
                        const isOnline = Boolean(cellValue);
                        displayValue = (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ 
                              width: '8px', 
                              height: '8px', 
                              borderRadius: '50%', 
                              backgroundColor: isOnline ? '#10b981' : '#ef4444' 
                            }}></span>
                            <span style={{ fontWeight: 500 }}>{isOnline ? 'Online' : 'Offline'}</span>
                          </div>
                        );
                      }

                      if (column.key === 'status') {
                        const statusClass = cellValue?.toLowerCase() === 'active' ? 'status-active' : 
                                           cellValue?.toLowerCase() === 'pending' ? 'status-pending' : 'status-inactive';
                        displayValue = <span className={`status-badge ${statusClass}`}>{cellValue}</span>;
                      }

                      return (
                        <td
                          key={column.key}
                          className="results-table__td"
                          data-testid={`${testIdPrefix}-cell-${rowId}-${column.key}`}
                          data-label={column.label || column.key}
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                    <td className="results-table__td actions-cell">
                      <div className="row-actions">
                        <button 
                          className="action-icon-btn email-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBulkEmail && onBulkEmail([rowId]);
                          }}
                          title="Send Email"
                        >
                          <Mail size={16} />
                        </button>
                        <button 
                          className="action-icon-btn delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onBulkDelete && onBulkDelete([rowId]);
                          }}
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                  
                  {expandedRowId === rowId && renderExpandedRow && (
                    <tr className="results-table__tr-expanded">
                      <td colSpan={columns.length + 2} className="results-table__td-expanded">
                        {renderExpandedRow(row)}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <div className="footer-stats">
          <span className="total-items">Total: {totalItems} items</span>
          <span className="page-info">Page {currentPage} of {totalPages}</span>
        </div>
        <div className="pagination-controls">
          <div className="rows-per-page">
            <label htmlFor="rowsPerPage">Rows per page:</label>
            <select 
              id="rowsPerPage" 
              value={itemsPerPage} 
              onChange={(e) => onItemsPerPageChange && onItemsPerPageChange(Number(e.target.value))}
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
          <div className="pagination-btns">
            <button 
            className={`pagination-btn ${currentPage === 1 ? 'disabled' : ''}`}
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            Previous
          </button>
          <button 
            className={`pagination-btn ${currentPage === totalPages ? 'disabled' : ''}`}
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  </div>
);
};

ResultsTable.propTypes = {
  data: PropTypes.arrayOf(PropTypes.object).isRequired,
  columns: PropTypes.arrayOf(
    PropTypes.shape({
      key: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ).isRequired,
  isLoading: PropTypes.bool,
  testIdPrefix: PropTypes.string,
  currentPage: PropTypes.number,
  totalItems: PropTypes.number,
  itemsPerPage: PropTypes.number,
  onItemsPerPageChange: PropTypes.func,
  onPageChange: PropTypes.func,
  onBulkDelete: PropTypes.func,
  onBulkEmail: PropTypes.func,
  onResetQuery: PropTypes.func,
  query: PropTypes.object,
  onSaveView: PropTypes.func,
  onExport: PropTypes.func,
  sortField: PropTypes.string,
  sortDirection: PropTypes.string,
  onSortChange: PropTypes.func,
  isSortLoading: PropTypes.bool,
  onRowClick: PropTypes.func,
  renderExpandedRow: PropTypes.func,
  expandedRowId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
};

export default ResultsTable;
