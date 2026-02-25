import React, { useCallback, useState, useMemo } from 'react';
import 'react-querybuilder/dist/query-builder.css';
import QueryBuilderController from './src/components/QueryBuilderController/QueryBuilderController';
import ResultsTable from './src/components/ResultsTable/ResultsTable';
import { filterData } from './src/utils/queryFilter';
import { mockUsers } from './src/data/mockData';
import { enhanceFieldWithValues } from './src/utils/fieldUtils';
import './src/styles/CollapsibleList.less';

/**
 * CollapsibleList Component
 * Wrapper component that uses QueryBuilderController for advanced filtering
 * and displays filtered results in a table
 */
const CollapsibleList = () => {
  const [query, setQuery] = useState({
    combinator: 'and',
    rules: [],
  });

  // Enhanced fields with autocomplete values and validation
  const fields = useMemo(() => {
    const baseFields = [
      { name: 'firstName', label: 'First Name', type: 'string' },
      { name: 'lastName', label: 'Last Name', type: 'string' },
      { name: 'age', label: 'Age', type: 'number' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'status', label: 'Status', type: 'string' },
    ];

    return baseFields.map(field => enhanceFieldWithValues(mockUsers, field));
  }, []);

  const operators = [
    { name: '=', label: '=' },
    { name: '!=', label: '!=' },
    { name: '<', label: '<' },
    { name: '>', label: '>' },
    { name: '<=', label: '<=' },
    { name: '>=', label: '>=' },
    { name: 'contains', label: 'contains' },
    { name: 'beginsWith', label: 'begins with' },
    { name: 'endsWith', label: 'ends with' },
  ];

  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);
  }, []);

  // Filter data based on query
  const filteredData = useMemo(() => {
    return filterData(mockUsers, query);
  }, [query]);

  // Define table columns
  const tableColumns = [
    { key: 'id', label: 'ID' },
    { key: 'firstName', label: 'First Name' },
    { key: 'lastName', label: 'Last Name' },
    { key: 'age', label: 'Age' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
  ];

  return (
    <div className="collapsible-list">
      <QueryBuilderController
        fields={fields}
        operators={operators}
        label="Advanced filters"
        onQueryChange={handleQueryChange}
      />
      <ResultsTable data={filteredData} columns={tableColumns} />
    </div>
  );
};

export default CollapsibleList;
