import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import 'react-querybuilder/dist/query-builder.css';
import { LucideSave, LucideDownload, LucideX } from 'lucide-react';

import QueryBuilderController from '../QueryBuilderController/QueryBuilderController';
import ResultsTable from '../ResultsTable/ResultsTable';
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
const ITEMS_PER_PAGE = 10;

const CollapsibleList = ({ 
  query, 
  onQueryChange, 
  onResetQuery, 
  users, 
  variables, 
  isDataLoading: isLoading,
  onBulkDelete,
  onBulkEmail,
  onSaveView
}) => {
  const [currentPage, setCurrentPage] = useState(1);
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

  // Slice data for pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const tableColumns = useMemo(() => {
    if (users.length === 0) return [];

    const labelMap = new Map(variables.map((v) => [v.name, v.label]));

    return Object.keys(users[0])
      .filter((key) => key !== 'id')
      .map((key) => ({
        key,
        label: labelMap.get(key) || key,
      }));
  }, [users, variables]);

  // Export to CSV handler
  const handleExport = useCallback(() => {
    const csv = convertToCSV(filteredData, tableColumns);
    downloadCSV(csv, `users_export_${new Date().toISOString().split('T')[0]}.csv`);
  }, [filteredData, tableColumns]);

  return (
    <div className="collapsible-list insight-hub-wrapper" data-testid="collapsible-list">
      
      <div className="main-actions-row animate-slide-up delay-300">
        <div className="primary-actions-group">
          <QueryBuilderController
            fields={fields}
            query={query}
            label="Advanced filters"
            onQueryChange={handleQueryChange}
          />
          <button 
            className="action-btn clear-filters-btn"
            onClick={onResetQuery}
            title="Clear all filters"
          >
            <LucideX size={16} /> 
            Clear Filters
          </button>
        </div>
        <div className="secondary-actions">
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

      <div className="results-container animate-fade delay-400">
        <ResultsTable
          data={paginatedData}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          onBulkDelete={onBulkDelete}
          onBulkEmail={onBulkEmail}
          columns={tableColumns}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default CollapsibleList;
