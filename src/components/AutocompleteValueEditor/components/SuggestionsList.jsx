import React from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';

/**
 * Suggestions list component rendered via portal
 */
const SuggestionsList = ({
  suggestions,
  selectedIndex,
  suggestionsRef,
  position,
  onSuggestionSelect,
  onSuggestionHover,
  editorId,
}) => {
  if (!suggestions || suggestions.length === 0) {
    return null;
  }

  // Use stable keys based on suggestion value and index
  const getSuggestionKey = (suggestion, index) => {
    const value = String(suggestion);
    return `${editorId}-${value}-${index}`;
  };

  // Error handling for portal rendering
  if (typeof document === 'undefined' || !document.body) {
    console.warn('SuggestionsList: document.body not available for portal rendering');
    return null;
  }

  return createPortal(
    <ul 
      id={`suggestions-${editorId}`}
      className="autocomplete-value-editor__suggestions"
      ref={suggestionsRef}
      role="listbox"
      aria-label="Suggestions"
      style={{
        '--suggestions-top': `${position.top}px`,
        '--suggestions-left': `${position.left}px`,
        '--suggestions-width': `${position.width}px`,
      }}
    >
      {suggestions.map((suggestion, index) => {
        const suggestionId = `suggestion-${editorId}-${index}`;
        return (
          <li
            key={getSuggestionKey(suggestion, index)}
            id={suggestionId}
            className={`autocomplete-value-editor__suggestion ${index === selectedIndex ? 'autocomplete-value-editor__suggestion--selected' : ''}`}
            onClick={() => onSuggestionSelect(suggestion)}
            onMouseEnter={() => onSuggestionHover(index)}
            role="option"
            aria-selected={index === selectedIndex}
          >
            {String(suggestion)}
          </li>
        );
      })}
    </ul>,
    document.body
  );
};

SuggestionsList.propTypes = {
  suggestions: PropTypes.array.isRequired,
  selectedIndex: PropTypes.number.isRequired,
  suggestionsRef: PropTypes.object.isRequired,
  position: PropTypes.shape({
    top: PropTypes.number,
    left: PropTypes.number,
    width: PropTypes.number,
  }).isRequired,
  onSuggestionSelect: PropTypes.func.isRequired,
  onSuggestionHover: PropTypes.func.isRequired,
  editorId: PropTypes.string.isRequired,
};

export default SuggestionsList;
