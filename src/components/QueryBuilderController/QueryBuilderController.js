import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { QueryBuilder } from 'react-querybuilder';
import PropTypes from 'prop-types';
import CollapseButton from '../CollapseButton/CollapseButton';
import AutocompleteValueEditor from '../AutocompleteValueEditor/AutocompleteValueEditor';
import { countRules } from '../../utils/queryUtils';
import '../../styles/QueryBuilderController.less';
import '../../styles/QueryBuilderController.query-builder.less';

/**
 * QueryBuilderController
 *
 * Wraps React Query Builder with:
 * - a collapsible panel
 * - autocomplete value editor integration
 * - tracking of open suggestion popovers for layout adjustments.
 */
const QueryBuilderController = ({
  fields,
  operators,
  initialQuery = { combinator: 'and', rules: [] },
  onQueryChange,
  label = 'Advanced filters',
  ...queryBuilderProps
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState(initialQuery);
  const openSuggestionsRef = useRef(new Set());
  const [hasSuggestionsOpen, setHasSuggestionsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleQueryChange = useCallback(
    (newQuery) => {
      setQuery(newQuery);
      if (onQueryChange) {
        onQueryChange(newQuery);
      }
    },
    [onQueryChange]
  );

  const rulesCount = useMemo(() => countRules(query), [query]);

  const expandedLabel = `Hide ${label}`;
  const collapsedLabel = `${label} [${rulesCount} selected]`;

  // Callback to handle suggestion state changes using Set to track editor IDs
  const handleSuggestionsChange = useCallback((hasSuggestions, editorId) => {
    if (hasSuggestions) {
      openSuggestionsRef.current.add(editorId);
    } else {
      openSuggestionsRef.current.delete(editorId);
    }
    // Update state to trigger re-render
    setHasSuggestionsOpen(openSuggestionsRef.current.size > 0);
  }, []);

  // Custom controls to use AutocompleteValueEditor for text inputs
  const customControls = useMemo(() => ({
    valueEditor: (props) => {
      // Use autocomplete editor for text type inputs when values are available
      const { fieldData, type, values, operator } = props;
      
      // Don't use autocomplete for null/notNull operators
      if (operator === 'null' || operator === 'notNull') {
        return <props.schema.controls.valueEditor {...props} />;
      }
      
      // Use autocomplete for text inputs when values are available
      const shouldUseAutocomplete = 
        (type === 'text' || !type) && 
        values && 
        Array.isArray(values) &&
        values.length > 0;
      
      if (shouldUseAutocomplete) {
        return <AutocompleteValueEditor {...props} onSuggestionsChange={handleSuggestionsChange} />;
      }
      
      // Fall back to default value editor for other types
      return <props.schema.controls.valueEditor {...props} />;
    },
  }), [handleSuggestionsChange]);

  // Determine value editor type - use 'text' for autocomplete when values are available
  const getValueEditorType = useCallback((field, operator, { fieldData }) => {
    // If field has values defined, use text editor (which will be replaced by autocomplete)
    if (fieldData?.values && fieldData.values.length > 0) {
      return 'text';
    }
    // Use default based on field data or input type
    return fieldData?.valueEditorType || 'text';
  }, []);

  // Close panel when clicking outside for better UX
  useEffect(() => {
    if (!isExpanded) return;

    const handleClickOutside = (event) => {
      if (!containerRef.current) return;

      const target = event.target;

      // Don't close when clicking inside autocomplete suggestions portal
      if (
        target &&
        typeof target.closest === 'function' &&
        target.closest('.autocomplete-value-editor__suggestions')
      ) {
        return;
      }

      if (!containerRef.current.contains(target)) {
        setIsExpanded(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isExpanded]);

  return (
    <div className="query-builder-controller" ref={containerRef}>
      <CollapseButton
        isExpanded={isExpanded}
        onToggle={handleToggle}
        expandedLabel={expandedLabel}
        collapsedLabel={collapsedLabel}
      />

      {isExpanded && (
        <div 
          className={`query-builder-controller__content ${hasSuggestionsOpen ? 'query-builder-controller__content--has-suggestions' : ''}`}
        >
          <QueryBuilder
            fields={fields}
            operators={operators}
            query={query}
            onQueryChange={handleQueryChange}
            showCombinatorsBetweenRules={true}
            showNotToggle={true}
            getValueEditorType={getValueEditorType}
            controlElements={customControls}
            {...queryBuilderProps}
          />
        </div>
      )}
    </div>
  );
};

QueryBuilderController.propTypes = {
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ).isRequired,
  operators: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ).isRequired,
  initialQuery: PropTypes.object,
  onQueryChange: PropTypes.func,
  label: PropTypes.string,
};

export default QueryBuilderController;
