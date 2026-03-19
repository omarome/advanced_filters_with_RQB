import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/ResultsTable.less';

const ResultsTable = ({ 
  data, 
  columns, 
  isLoading = false, 
  testIdPrefix = 'results-table',
  currentPage = 1,
  totalItems = 0,
  itemsPerPage = 10,
  onPageChange,
  onBulkDelete,
  onBulkEmail
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
        <h3
          className="results-table__title section-title"
          data-testid={`${testIdPrefix}-title`}
        >
          Results ({totalItems} {totalItems === 1 ? 'item' : 'items'})
        </h3>
        <div className={`bulk-actions ${selectedIds.length > 0 ? 'active' : ''}`}>
          <span className="bulk-label">Bulk Actions:</span>
          <button 
            className="bulk-btn" 
            disabled={selectedIds.length === 0}
            onClick={() => onBulkEmail && onBulkEmail(selectedIds)}
          >
            Email
          </button>
          <button 
            className="bulk-btn delete" 
            disabled={selectedIds.length === 0}
            onClick={() => onBulkDelete && onBulkDelete(selectedIds)}
          >
            Delete
          </button>
        </div>
      </div>
      <div className="results-table__container custom-scrollbar">
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
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="results-table__th"
                  data-testid={`${testIdPrefix}-header-${column.key}`}
                >
                  {column.label || column.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="results-table__tbody">
            {data.map((row, index) => {
              const rowId = row.id ?? index;
              const isSelected = selectedIds.includes(rowId);
              return (
                <tr
                  key={rowId}
                  className={`results-table__tr ${isSelected ? 'selected' : ''}`}
                  data-testid={`${testIdPrefix}-row-${rowId}`}
                >
                  <td className="results-table__td checkbox-cell">
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => handleToggleRow(rowId)}
                    />
                  </td>
                  {columns.map((column) => {
                    const cellValue = row[column.key];
                    let displayValue = typeof cellValue === 'boolean'
                      ? (cellValue ? 'Yes' : 'No')
                      : cellValue;

                    // Specialized rendering for InsightHub look
                    if (column.key === 'displayName' || column.key === 'name' || column.key === 'User Details') {
                       displayValue = (
                         <div className="user-cell">
                           <img 
                             className="user-avatar" 
                             src={`https://ui-avatars.com/api/?name=${cellValue}&background=random`} 
                             alt="Avatar" 
                           />
                           <div className="user-details">
                             <div className="user-name">{cellValue}</div>
                             <div className="user-subtext">{row.email || 'user@example.com'}</div>
                           </div>
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
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="table-footer">
        <span className="page-info">Page {currentPage} of {totalPages}</span>
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
  onPageChange: PropTypes.func,
  onBulkDelete: PropTypes.func,
  onBulkEmail: PropTypes.func,
};

export default ResultsTable;
