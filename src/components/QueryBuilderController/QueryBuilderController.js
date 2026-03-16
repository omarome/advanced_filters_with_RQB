import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { QueryBuilder, ValueEditor } from 'react-querybuilder';
import PropTypes from 'prop-types';
import CollapseButton from '../CollapseButton/CollapseButton';
import AutocompleteValueEditor from '../AutocompleteValueEditor/AutocompleteValueEditor';
import { countRules } from '../../utils/queryUtils';
import '../../styles/QueryBuilderController.less';
import '../../styles/QueryBuilderController.query-builder.less';

/**
 * QueryBuilderController
 *
 * Presentational wrapper around React Query Builder:
 * - collapsible panel
 * - autocomplete value editor for text fields
 * - tracks open suggestion popovers for layout adjustments
 *
 * Query state is owned by the **parent** (controlled mode).
 * This component never holds its own copy of the query.
 */
const QueryBuilderController = ({
  fields,
  query,
  onQueryChange,
  label = 'Advanced filters',
  ...queryBuilderProps
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const openSuggestionsRef = useRef(new Set());
  const [hasSuggestionsOpen, setHasSuggestionsOpen] = useState(false);
  const containerRef = useRef(null);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Auto-add initial rule when expanded if query is empty and fields are ready
  useEffect(() => {
    if (isExpanded && query.rules.length === 0 && fields.length > 0) {
      const firstField = fields[0].name;
      onQueryChange({
        ...query,
        rules: [{ field: firstField, operator: '=', value: '' }]
      });
    }
  }, [isExpanded, query.rules.length, fields, onQueryChange, query]);

  // Derive rule count from the query prop (single source of truth)
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

  // Custom controls to use AutocompleteValueEditor for text inputs.
  // We keep the component stable (AutocompleteValueEditor) for all potential
  // autocomplete fields, even if data hasn't loaded yet.
  const customControls = useMemo(() => ({
    valueEditor: (props) => {
      const { fieldData, type, operator } = props;

      // Non-text editors (select, radio, checkbox) → use the library's default
      if (
        type === 'select' ||
        type === 'radio' ||
        fieldData?.valueEditorType === 'select' ||
        fieldData?.valueEditorType === 'radio' ||
        fieldData?.type === 'boolean'
      ) {
        return <ValueEditor {...props} />;
      }

      // Null-check operators don't need a value editor
      if (operator === 'null' || operator === 'notNull') {
        return <ValueEditor {...props} />;
      }

      // Use autocomplete for text inputs. We no longer check for values.length here
      // to keep the component from unmounting/remounting when data arrives.
      const isTextField = type === 'text' || !type;
      
      if (isTextField) {
        return <AutocompleteValueEditor {...props} onSuggestionsChange={handleSuggestionsChange} />;
      }

      // Fall back to the library's default value editor
      return <ValueEditor {...props} />;
    },
  }), [handleSuggestionsChange]);

  // Determine value editor type from field configuration.
  // Operators are already set per-field in queryConfig.js (the library reads
  // field.operators natively), so no getOperators callback is needed.
  const getValueEditorType = useCallback((_field, _operator, { fieldData }) => {
    // If the field already declares a valueEditorType (radio, checkbox, select, etc.)
    // honour it directly — this is the library's recommended pattern.
    if (fieldData?.valueEditorType) {
      return fieldData.valueEditorType;
    }

    return 'text';
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
    <div
      className="query-builder-controller"
      ref={containerRef}
      data-testid="query-builder-controller"
    >
      <CollapseButton
        isExpanded={isExpanded}
        onToggle={handleToggle}
        expandedLabel={expandedLabel}
        collapsedLabel={collapsedLabel}
        data-testid="advanced-filters-toggle"
      />

      {isExpanded && (
        <div 
          className={`query-builder-controller__content ${hasSuggestionsOpen ? 'query-builder-controller__content--has-suggestions' : ''}`}
          data-testid="query-builder-content"
        >
          <QueryBuilder
            fields={fields}
            query={query}
            onQueryChange={onQueryChange}
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
  /** Field definitions (with per-field operators, validators, etc.) */
  fields: PropTypes.arrayOf(
    PropTypes.shape({
      name: PropTypes.string.isRequired,
      label: PropTypes.string,
    })
  ).isRequired,
  /** Controlled query object — parent is the single source of truth */
  query: PropTypes.object.isRequired,
  /** Called whenever the query changes */
  onQueryChange: PropTypes.func.isRequired,
  /** Label shown on the collapse button */
  label: PropTypes.string,
};

export default QueryBuilderController;
