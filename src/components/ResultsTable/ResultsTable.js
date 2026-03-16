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
  onPageChange
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

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
        <div className="bulk-actions">
          <span className="bulk-label">Bulk Actions:</span>
          <button className="bulk-btn">Email</button>
          <button className="bulk-btn">Delete</button>
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
                <input type="checkbox" />
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
              return (
                <tr
                  key={rowId}
                  className="results-table__tr"
                  data-testid={`${testIdPrefix}-row-${rowId}`}
                >
                  <td className="results-table__td checkbox-cell">
                    <input type="checkbox" />
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
};

export default ResultsTable;
