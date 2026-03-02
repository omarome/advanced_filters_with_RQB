import React from 'react';
import PropTypes from 'prop-types';
import '../../styles/ResultsTable.less';

const ResultsTable = ({ data, columns, isLoading = false, testIdPrefix = 'results-table' }) => {
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
    <div className="results-table" data-testid={testIdPrefix}>
      <div className="results-table__header">
        <h3
          className="results-table__title"
          data-testid={`${testIdPrefix}-title`}
        >
          Results ({data.length} {data.length === 1 ? 'item' : 'items'})
        </h3>
      </div>
      <div className="results-table__container">
        <table
          className="results-table__table"
          data-testid={`${testIdPrefix}-table`}
        >
          <thead className="results-table__thead">
            <tr>
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
                  {columns.map((column) => {
                    const cellValue = row[column.key];
                    const displayValue = typeof cellValue === 'boolean'
                      ? (cellValue ? 'Yes' : 'No')
                      : cellValue;

                    return (
                      <td
                        key={column.key}
                        className="results-table__td"
                        data-label={column.label || column.key}
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
};

export default ResultsTable;
