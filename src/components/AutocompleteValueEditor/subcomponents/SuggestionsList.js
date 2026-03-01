import React from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Suggestions list rendered via portal to `document.body`.
 *
 * Positioning is handled by Floating UI — `floatingStyles` contains
 * the computed `position`, `top`, `left` and `transform` values.
 * The merged `suggestionsRef` connects this element to Floating UI's
 * positioning engine so it tracks the input on scroll/resize automatically.
 */
const SuggestionsList = ({
  suggestions,
  selectedIndex,
  suggestionsRef,
  floatingStyles,
  onSuggestionSelect,
  onSuggestionHover,
  editorId,
  listTestId,
  itemTestIdPrefix,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  if (typeof document === 'undefined' || !document.body) {
    return null;
  }

  return createPortal(
    <ul
      id={`suggestions-${editorId}`}
      className="autocomplete-value-editor__suggestions"
      ref={suggestionsRef}
      role="listbox"
      aria-label="Suggestions"
      data-testid={listTestId}
      style={floatingStyles}
    >
      {suggestions.map((suggestion, index) => (
        <li
          key={`${editorId}-${suggestion}-${index}`}
          id={`suggestion-${editorId}-${index}`}
          className={`autocomplete-value-editor__suggestion${
            index === selectedIndex ? ' autocomplete-value-editor__suggestion--selected' : ''
          }`}
          onClick={() => onSuggestionSelect(suggestion)}
          onMouseEnter={() => onSuggestionHover(index)}
          role="option"
          aria-selected={index === selectedIndex}
          data-testid={itemTestIdPrefix ? `${itemTestIdPrefix}-${index}` : undefined}
        >
          {String(suggestion)}
        </li>
      ))}
    </ul>,
    document.body
  );
};

SuggestionsList.propTypes = {
  suggestions: PropTypes.array.isRequired,
  selectedIndex: PropTypes.number.isRequired,
  suggestionsRef: PropTypes.oneOfType([PropTypes.object, PropTypes.func]).isRequired,
  floatingStyles: PropTypes.object.isRequired,
  onSuggestionSelect: PropTypes.func.isRequired,
  onSuggestionHover: PropTypes.func.isRequired,
  editorId: PropTypes.string.isRequired,
  listTestId: PropTypes.string,
  itemTestIdPrefix: PropTypes.string,
};

export default SuggestionsList;
