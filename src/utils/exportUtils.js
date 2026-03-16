/**
 * Utility for exporting data to CSV
 */

/**
 * Converts an array of objects to a CSV string
 * @param {Array<Object>} data - The data to export
 * @param {Array<Object>} columns - The columns to include ({key, label})
 * @returns {string} - CSV formatted string
 */
export const convertToCSV = (data, columns) => {
  if (!data || data.length === 0) return '';

  const header = columns.map(col => `"${col.label || col.key}"`).join(',');
  const rows = data.map(row => {
    return columns.map(col => {
      const cellValue = row[col.key];
      const formattedValue = cellValue !== undefined && cellValue !== null 
        ? String(cellValue).replace(/"/g, '""') 
        : '';
      return `"${formattedValue}"`;
    }).join(',');
  });

  return [header, ...rows].join('\n');
};

/**
 * Triggers a download of the CSV data
 * @param {string} csvContent - The CSV string
 * @param {string} fileName - The name of the file
 */
export const downloadCSV = (csvContent, fileName = 'export.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', fileName);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
