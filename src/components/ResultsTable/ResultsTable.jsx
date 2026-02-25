import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/ResultsTable.less';
const ResultsTable = ({ data, columns, isLoading = false }) => {
  if (isLoading) {
    return (
      <div className="results-table">
        <div className="results-table__loading">Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="results-table">
        <div className="results-table__empty">
          No results found. Try adjusting your filters.
        </div>
      </div>
    );
  }

  return (
    <div className="results-table">
      <div className="results-table__header">
        <h3 className="results-table__title">
          Results ({data.length} {data.length === 1 ? 'item' : 'items'})
        </h3>
      </div>
      <div className="results-table__container">
        <table className="results-table__table">
          <thead className="results-table__thead">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="results-table__th">
                  {column.label || column.key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="results-table__tbody">
            {data.map((row, index) => (
              <tr key={row.id || index} className="results-table__tr">
                {columns.map((column) => (
                  <td key={column.key} className="results-table__td">
                    {row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
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
};

export default ResultsTable;
