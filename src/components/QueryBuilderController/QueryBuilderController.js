import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { QueryBuilder, ValueEditor } from 'react-querybuilder';
import PropTypes from 'prop-types';
import { LucideX, LucideFilter, LucideChevronDown, LucideCheck, LucideSlidersHorizontal } from 'lucide-react';
import CollapseButton from '../CollapseButton/CollapseButton';
import AutocompleteValueEditor from '../AutocompleteValueEditor/AutocompleteValueEditor';
import { countRules } from '../../utils/queryUtils';
import '../../styles/QueryBuilderController.less';
import '../../styles/QueryBuilderController.query-builder.less';

// ---------------------------------------------------------------------------
// PortalSelect — replaces native <select> inside the QueryBuilder.
//
// Native <select> on mobile triggers an OS-level picker that positions itself
// relative to the viewport without regard for the modal's scroll position,
// causing it to appear detached from the trigger element.
//
// This component renders its dropdown menu via ReactDOM.createPortal at
// document.body, so it always positions correctly — exactly like the
// Industry / Department dropdowns in the sidebar Quick Filters.
// ---------------------------------------------------------------------------
function PortalSelect({ value, options = [], handleOnChange, className, disabled, placeholder }) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState({});
  const btnRef = useRef(null);

  // Flatten grouped options so we can find the selected label
  const flatOptions = useMemo(() => {
    const flat = [];
    for (const opt of options) {
      if (opt.options) {
        flat.push(...opt.options);
      } else {
        flat.push(opt);
      }
    }
    return flat;
  }, [options]);

  const selectedLabel = useMemo(() => {
    const found = flatOptions.find(o => (o.name ?? o.value) === value);
    return found?.label ?? placeholder ?? value ?? '';
  }, [flatOptions, value, placeholder]);

  const openMenu = () => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    // Prefer opening below; fall back to above when space is tight
    const spaceBelow = window.innerHeight - rect.bottom;
    const approxMenuH = Math.min(flatOptions.length * 44 + 12, 280);
    const showAbove = spaceBelow < approxMenuH && rect.top > approxMenuH;

    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: Math.max(rect.width, 160),
      zIndex: 99999,
      ...(showAbove
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    });
    setOpen(true);
  };

  const handleSelect = (optValue) => {
    handleOnChange(optValue);
    setOpen(false);
  };

  const renderOption = (opt) => {
    const optValue = opt.name ?? opt.value;
    const isSelected = optValue === value;
    return (
      <button
        key={optValue}
        type="button"
        className={`qb-portal-select-option${isSelected ? ' is-selected' : ''}${opt.disabled ? ' is-disabled' : ''}`}
        onClick={() => !opt.disabled && handleSelect(optValue)}
        disabled={opt.disabled}
      >
        <span>{opt.label}</span>
        {isSelected && <LucideCheck size={13} className="qb-option-check" />}
      </button>
    );
  };

  return (
    <div className={`qb-portal-select${className ? ` ${className}` : ''}${disabled ? ' is-disabled' : ''}`}>
      <button
        ref={btnRef}
        type="button"
        className={`qb-portal-select-btn${open ? ' is-open' : ''}`}
        onClick={open ? () => setOpen(false) : openMenu}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="qb-portal-select-value">{selectedLabel}</span>
        <LucideChevronDown size={12} className="qb-portal-select-chevron" aria-hidden />
      </button>

      {open && createPortal(
        <>
          {/* Transparent backdrop — closes menu on outside click */}
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 99998 }}
            onClick={() => setOpen(false)}
            aria-hidden
          />
          <div
            className="qb-portal-select-menu"
            style={menuStyle}
            role="listbox"
          >
            {options.map((opt, i) =>
              opt.options ? (
                // Grouped option set (e.g. field groups)
                <div key={i} className="qb-portal-select-group">
                  <p className="qb-portal-select-group-label">{opt.label}</p>
                  {opt.options.map(renderOption)}
                </div>
              ) : renderOption(opt)
            )}
          </div>
        </>,
        document.body
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------

/**
 * QueryBuilderController
 *
 * Presentational wrapper around React Query Builder:
 * - collapsible panel (opens as a modal / bottom sheet on mobile)
 * - portal-based custom selectors (field, operator, combinator, value)
 *   that position correctly on mobile instead of floating like OS pickers
 * - autocomplete value editor for text fields
 *
 * Query state is owned by the **parent** (controlled mode).
 */
const QueryBuilderController = ({
  fields,
  query,
  onQueryChange,
  label = 'Advanced filters',
  // When false the "[N selected]" count is hidden from the collapse button.
  // Set this when the parent renders its own count badge next to the card header.
  showCount = true,
  ...queryBuilderProps
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [localQuery, setLocalQuery] = useState(query);
  const openSuggestionsRef = useRef(new Set());
  const [hasSuggestionsOpen, setHasSuggestionsOpen] = useState(false);

  const handleToggle = useCallback(() => {
    if (!isModalOpen) {
      if (query.rules.length === 0 && fields.length > 0) {
        setLocalQuery({
          ...query,
          rules: [{ field: fields[0].name, operator: '=', value: '' }]
        });
      } else {
        setLocalQuery(query);
      }
      setIsModalOpen(true);
    } else {
      setIsModalOpen(false);
    }
  }, [isModalOpen, query, fields]);

  const handleApply = useCallback(() => {
    onQueryChange(localQuery);
    setIsModalOpen(false);
  }, [localQuery, onQueryChange]);

  const rulesCount = useMemo(() => countRules(query), [query]);

  const expandedLabel = `Hide ${label}`;
  const collapsedLabel = (
    <span className="collapse-button__label-wrapper">
      <span className="collapse-button__label-text">{label}</span>
      {showCount && rulesCount > 0 && (
        <span className="collapse-button__label-count">[{rulesCount} selected]</span>
      )}
    </span>
  );

  const handleSuggestionsChange = useCallback((hasSuggestions, editorId) => {
    if (hasSuggestions) {
      openSuggestionsRef.current.add(editorId);
    } else {
      openSuggestionsRef.current.delete(editorId);
    }
    setHasSuggestionsOpen(openSuggestionsRef.current.size > 0);
  }, []);

  // Custom controls — portal selects replace every native <select> inside the
  // QueryBuilder so dropdowns position correctly on mobile.
  const customControls = useMemo(() => ({
    // Field selector (left-most dropdown in each rule row)
    fieldSelector: (props) => (
      <PortalSelect {...props} placeholder="Select field…" />
    ),

    // Operator selector (middle dropdown: =, contains, between, …)
    operatorSelector: (props) => (
      <PortalSelect {...props} placeholder="Operator…" />
    ),

    // AND / OR combinator between rule groups
    combinatorSelector: (props) => (
      <PortalSelect {...props} />
    ),

    // Remove-rule button
    removeRuleAction: (props) => (
      <button
        type="button"
        className={props.className}
        title={props.title}
        onClick={(e) => props.handleOnClick(e)}
        data-testid="remove-rule"
      >
        <span className="remove-rule-text">Remove Rule</span>
      </button>
    ),

    // Value editor — portal select for select-type fields; autocomplete for text
    valueEditor: (props) => {
      const { fieldData, type, operator } = props;

      // Select-type value editor → PortalSelect (options come from field.values)
      if (type === 'select' || fieldData?.valueEditorType === 'select') {
        return (
          <PortalSelect
            value={props.value}
            options={props.values || fieldData?.values || []}
            handleOnChange={props.handleOnChange}
            className={props.className}
            placeholder="Select value…"
          />
        );
      }

      // Radio / boolean → library default renders radio buttons
      if (
        type === 'radio' ||
        fieldData?.valueEditorType === 'radio' ||
        fieldData?.type === 'boolean'
      ) {
        return <ValueEditor {...props} />;
      }

      // Null-check operators → no value editor needed
      if (operator === 'null' || operator === 'notNull') {
        return <ValueEditor {...props} />;
      }

      // Text fields → autocomplete
      const isTextField = type === 'text' || !type;
      if (isTextField) {
        return (
          <AutocompleteValueEditor
            {...props}
            onSuggestionsChange={handleSuggestionsChange}
          />
        );
      }

      return <ValueEditor {...props} />;
    },
  }), [handleSuggestionsChange]);

  const getValueEditorType = useCallback((_field, _operator, { fieldData }) => {
    if (fieldData?.valueEditorType) {
      return fieldData.valueEditorType;
    }
    return 'text';
  }, []);

  // Lock body scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = isModalOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isModalOpen]);

  return (
    <div className="query-builder-controller" data-testid="query-builder-controller">
      <CollapseButton
        isExpanded={isModalOpen}
        onToggle={handleToggle}
        expandedLabel={expandedLabel}
        collapsedLabel={collapsedLabel}
        icon={<LucideSlidersHorizontal size={14} />}
        iconExpanded={<LucideX size={14} />}
        data-testid="advanced-filters-toggle"
      />

      {isModalOpen && createPortal(
        <div className="query-builder-modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div
            className="query-builder-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drag handle — decorative, visible on mobile only */}
            <div className="query-builder-modal-handle" aria-hidden="true" />

            <div className="query-builder-modal-header">
              <h2><LucideFilter size={18} /> {label}</h2>
              <button className="close-modal-btn" onClick={() => setIsModalOpen(false)}>
                <LucideX size={20} />
              </button>
            </div>

            <div className={`query-builder-modal-body query-builder-controller__content${hasSuggestionsOpen ? ' query-builder-controller__content--has-suggestions' : ''}`}>
              <QueryBuilder
                fields={fields}
                query={localQuery}
                onQueryChange={setLocalQuery}
                showCombinatorsBetweenRules={true}
                showNotToggle={true}
                getValueEditorType={getValueEditorType}
                controlElements={customControls}
                {...queryBuilderProps}
              />
            </div>

            <div className="query-builder-modal-footer">
              <button className="cancel-btn" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="apply-btn" onClick={handleApply}>Apply Filters</button>
            </div>
          </div>
        </div>,
        document.body
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
  query: PropTypes.object.isRequired,
  onQueryChange: PropTypes.func.isRequired,
  label: PropTypes.string,
  showCount: PropTypes.bool,
};

export default QueryBuilderController;
