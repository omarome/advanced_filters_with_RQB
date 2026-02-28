import React, { useCallback, useState, useMemo, useEffect } from 'react';
import 'react-querybuilder/dist/query-builder.css';
import QueryBuilderController from './src/components/QueryBuilderController/QueryBuilderController';
import ResultsTable from './src/components/ResultsTable/ResultsTable';
import { filterData } from './src/utils/queryFilter';
import { fetchUsers } from './src/services/userApi';
import { enhanceFieldWithValues } from './src/utils/fieldUtils';
import { baseFields, defaultOperators } from './src/config/queryConfig';
import './src/styles/CollapsibleList.less';

/**
 * CollapsibleList Component
 * Wrapper component that uses QueryBuilderController for advanced filtering
 * and displays filtered results in a table.
 *
 * Data is fetched from the Spring Boot backend on mount.
 */
const CollapsibleList = () => {
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState({
    combinator: 'and',
    rules: [],
  });

  // Fetch users from the backend API
  useEffect(() => {
    let cancelled = false;

    const loadUsers = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await fetchUsers();
        if (!cancelled) {
          setUsers(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadUsers();

    return () => {
      cancelled = true;
    };
  }, []);

  // Enhanced fields with autocomplete values extracted from live data
  const fields = useMemo(
    () => baseFields.map((field) => enhanceFieldWithValues(users, field)),
    [users]
  );

  const operators = defaultOperators;

  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  // Filter data based on query (client-side filtering)
  const filteredData = useMemo(() => {
    return filterData(users, query);
  }, [users, query]);

  // Define table columns
  const tableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'age', label: 'Age' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'nickname', label: 'Nickname' },
    { key: 'isOnline', label: 'Is Online' },
  ];

  if (error) {
    return (
      <div className="collapsible-list" data-testid="collapsible-list">
        <div className="collapsible-list__error">
          Failed to load data: {error}
        </div>
      </div>
    );
  }

  return (
    <div className="collapsible-list" data-testid="collapsible-list">
      <QueryBuilderController
        fields={fields}
        operators={operators}
        label="Advanced filters"
        onQueryChange={handleQueryChange}
      />
      <ResultsTable
        data={filteredData}
        columns={tableColumns}
        isLoading={isLoading}
      />
    </div>
  );
};

export default CollapsibleList;
