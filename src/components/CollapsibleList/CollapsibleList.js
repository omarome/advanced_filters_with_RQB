import React, { useCallback, useState, useMemo, useEffect, useRef } from 'react';
import 'react-querybuilder/dist/query-builder.css';
import QueryBuilderController from '../QueryBuilderController/QueryBuilderController';
import ResultsTable from '../ResultsTable/ResultsTable';
import { filterData } from '../../utils/queryFilter';
import { fetchUsers, fetchVariables } from '../../services/userApi';
import { enhanceFieldWithValues } from '../../utils/fieldUtils';
import { buildFieldsFromVariables } from '../../config/queryConfig';
import { mockUsers } from '../../data/mockData';
import { mockVariables } from '../../data/mockVariables';
import '../../styles/CollapsibleList.less';

/**
 * CollapsibleList Component
 *
 * - Tries to fetch data from the backend API
 * - Falls back to mock data when the API is unreachable
 * - Shows a one-time banner indicating the data source
 */
const ITEMS_PER_PAGE = 10;

const CollapsibleList = ({ query, onQueryChange, onResetQuery, users: initialUsers, variables: initialVariables, isDataLoading }) => {
  const [users, setUsers] = useState([]);
  const [variables, setVariables] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // null = not yet determined, true = live API, false = mock fallback
  const [isLive, setIsLive] = useState(null);
  // Only show the banner once (on initial load)
  const hasLoadedRef = useRef(false);

  // Fetch from API; fall back to mock data on any error
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [usersData, variablesData] = await Promise.all([
          fetchUsers(),
          fetchVariables(),
        ]);
        if (!cancelled) {
          setUsers(usersData);
          setVariables(variablesData);
          setIsLive(true);
        }
      } catch {
        // Backend unreachable — use mock data
        if (!cancelled) {
          setUsers(mockUsers);
          setVariables(mockVariables);
          setIsLive(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          hasLoadedRef.current = true;
        }
      }
    };

    loadData();

    return () => {
      cancelled = true;
    };
  }, []);

  // Build fields from variables, then enhance with autocomplete values from data
  const fields = useMemo(() => {
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

  // Derive table columns from variables (uses label from the backend / mock)
  const tableColumns = useMemo(() => {
    if (users.length === 0) return [];

    const labelMap = new Map(variables.map((v) => [v.name, v.label]));

    return Object.keys(users[0]).map((key) => ({
      key,
      label: labelMap.get(key) || key,
    }));
  }, [users, variables]);


  return (
    <div className="collapsible-list insight-hub-wrapper" data-testid="collapsible-list">
      
      {/* 
          We move the QueryBuilderController inside the children flow 
          but styled for the main content area.
      */}
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
           <button className="action-btn border-btn"><LucideSave size={16} /> Save View</button>
           <button className="action-btn border-btn"><LucideDownload size={16} /> Export</button>
        </div>
      </div>

      <div className="results-container animate-fade delay-400">
        <ResultsTable
          data={paginatedData}
          totalItems={filteredData.length}
          itemsPerPage={ITEMS_PER_PAGE}
          currentPage={currentPage}
          onPageChange={handlePageChange}
          columns={tableColumns}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

// Internal imports for the icons used in the new structure
import { LucideSave, LucideDownload, LucideX } from 'lucide-react';

export default CollapsibleList;
