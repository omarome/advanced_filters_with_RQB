import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import 'react-querybuilder/dist/query-builder.css';
import { LucideSave, LucideDownload, LucideX } from 'lucide-react';

import ResultsTable from '../ResultsTable/ResultsTable';
import InlineFilterBar from '../InlineFilterBar/InlineFilterBar';
import { filterData } from '../../utils/queryFilter';
import { fetchUsers, fetchVariables } from '../../services/userApi';
import { enhanceFieldWithValues } from '../../utils/fieldUtils';
import { buildFieldsFromVariables } from '../../config/queryConfig';
import { mockUsers } from '../../data/mockData';
import { mockVariables } from '../../data/mockVariables';
import { convertToCSV, downloadCSV } from '../../utils/exportUtils';

import '../../styles/CollapsibleList.less';

/**
 * CollapsibleList Component
 *
 * - Tries to fetch data from the backend API
 * - Falls back to mock data when the API is unreachable
 * - Shows a one-time banner indicating the data source
 */
const CollapsibleList = ({ 
  query, 
  onQueryChange, 
  onResetQuery, 
  users, 
  variables, 
  isDataLoading: isLoading,
  isSortLoading,
  onBulkDelete,
  onBulkEmail,
  onSaveView,
  sortConfig,
  onSortChange
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const hasLoadedRef = useRef(false);

  // Track if initial load is done
  useEffect(() => {
    if (!isLoading) {
      hasLoadedRef.current = true;
    }
  }, [isLoading]);

  // Build fields from variables, then enhance with autocomplete values from data
  const fields = useMemo(() => {
    if (!variables) return [];
    const baseFields = buildFieldsFromVariables(variables);
    return baseFields.map((field) => enhanceFieldWithValues(users, field));
  }, [variables, users]);

  const handleQueryChange = useCallback((newQuery) => {
    onQueryChange(newQuery);
    setCurrentPage(1); // Reset to first page on query change
  }, [onQueryChange]);

  // Filter data based on query (client-side filtering)
  const filteredData = useMemo(() => {
    return filterData(users, query);
  }, [users, query]);

  // Handle page change
  const handlePageChange = useCallback((page) => {
    setCurrentPage(page);
  }, []);

  // Handle items per page change
  const handleItemsPerPageChange = useCallback((newCount) => {
    setItemsPerPage(newCount);
    setCurrentPage(1); // Reset to first page to avoid out of bounds
  }, []);

  // Slice data for pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage, itemsPerPage]);

  const tableColumns = useMemo(() => {
    if (users.length === 0) return [];

    const labelMap = new Map(variables.map((v) => [v.name, v.label]));

    const keys = Object.keys(users[0]).filter(key => 
      !['id', 'email', 'nickname', 'firstName', 'lastName'].includes(key)
    );

    // Ensure fullName is always the first column
    const fullNameIndex = keys.indexOf('fullName');
    if (fullNameIndex > 0) {
      keys.splice(fullNameIndex, 1);
      keys.unshift('fullName');
    } else if (fullNameIndex === -1) {
      keys.unshift('fullName');
    }

    return keys.map((key) => ({
      key,
      label: key === 'fullName' ? 'Full Name' : (labelMap.get(key) || key),
    }));
  }, [users, variables]);

  // Export to CSV handler
  const handleExport = useCallback(() => {
    const csv = convertToCSV(filteredData, tableColumns);
    downloadCSV(csv, `users_export_${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredData, tableColumns]);

  return (
    <div className="collapsible-list insight-hub-wrapper" data-testid="collapsible-list">
      <div style={{ padding: '0 24px', paddingTop: '24px' }}>
        <h1 className="page-title-gradient" style={{ margin: '0' }}>Employee Directory</h1>
      </div>
      <div className="main-actions-row mobile-only-actions animate-slide-up delay-300">
        <div className="secondary-actions" style={{ marginLeft: 'auto', marginBottom: '16px' }}>
           <button 
             className="action-btn border-btn"
             onClick={onSaveView}
           >
             <LucideSave size={16} /> 
             Save View
           </button>
           <button 
             className="action-btn border-btn"
             onClick={handleExport}
             title="Export current view to CSV"
           >
             <LucideDownload size={16} /> 
             Export
           </button>
        </div>
      </div>
      <InlineFilterBar
        variant="directory"
        query={query}
        onQueryChange={handleQueryChange}
        onResetQuery={onResetQuery}
        fields={fields}
      />
      <div className="results-container animate-fade delay-400">
        <ResultsTable
          data={paginatedData}
          totalItems={filteredData.length}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={handleItemsPerPageChange}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onBulkDelete={onBulkDelete}
          onBulkEmail={onBulkEmail}
          onResetQuery={onResetQuery}
          query={query}
          columns={tableColumns}
          isLoading={isLoading}
          isSortLoading={isSortLoading}
          onSaveView={onSaveView}
          onExport={handleExport}
          sortField={sortConfig?.field}
          sortDirection={sortConfig?.direction}
          onSortChange={onSortChange}
        />
      </div>
    </div>
  );
};

export default CollapsibleList;
