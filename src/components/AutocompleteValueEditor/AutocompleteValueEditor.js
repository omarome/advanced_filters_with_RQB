import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  useAutocompleteSuggestions,
  useInputValidation,
  useSuggestionsPosition,
  useClickOutside,
  useKeyboardNavigation,
  useSuggestionsState,
} from './hooks';
import InputWrapper from './subcomponents/InputWrapper';
import SuggestionsList from './subcomponents/SuggestionsList';
import ValidationMessage from './subcomponents/ValidationMessage';
import '../../styles/AutocompleteValueEditor.less';

/**
 * AutocompleteValueEditor
 * 
 * Reusable value editor for React Query Builder that provides
 * autocomplete suggestions, validation feedback, and rich keyboard/mouse UX.
 */

const AutocompleteValueEditor = ({
  value = '',
  handleOnChange,
  values = [],
  fieldData = {},
  operator,
  inputType = 'text',
  disabled = false,
  placeholder = '',
  onSuggestionsChange,
  ...props
}) => {
  // State
  const [inputValue, setInputValue] = useState(value || '');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  // Refs
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);
  const containerRef = useRef(null);
  const editorIdRef = useRef(`editor-${Math.random().toString(36).slice(2, 11)}`);

  // Custom hooks
  const { filteredSuggestions } = useAutocompleteSuggestions(values, inputValue);
  const { isValid, error: validationError } = useInputValidation(inputValue, fieldData, operator);
  const suggestionsPosition = useSuggestionsPosition(showSuggestions, filteredSuggestions.length, inputRef);

  // Computed values (before callbacks to ensure consistent hook order)
  const hasValue = Boolean(inputValue && inputValue.trim() !== '');
  const showValidation = Boolean(hasValue && validationError !== null);
  const hasClearButton = Boolean(hasValue && !disabled);
  const hasSuggestionsOpen = Boolean(showSuggestions && filteredSuggestions.length > 0);

  // Event handlers (defined early so they can be used in hooks)
  const handleSuggestionSelect = useCallback((suggestion) => {
    setInputValue(suggestion);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    handleOnChange?.(suggestion);
    inputRef.current?.focus();
  }, [handleOnChange]);

  const handleInputChange = useCallback((e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(true);
    setSelectedIndex(-1);
    handleOnChange?.(newValue);
  }, [handleOnChange]);

  const handleClear = useCallback((e) => {
    e.stopPropagation();
    setInputValue('');
    setShowSuggestions(false);
    setSelectedIndex(-1);
    handleOnChange?.('');
    inputRef.current?.focus();
  }, [handleOnChange]);

  const handleFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  const handleCloseSuggestions = useCallback(() => {
    setShowSuggestions(false);
    setSelectedIndex(-1);
  }, []);

  // Keyboard navigation hook (uses handleSuggestionSelect)
  const handleKeyDown = useKeyboardNavigation(
    showSuggestions,
    filteredSuggestions,
    selectedIndex,
    setSelectedIndex,
    handleSuggestionSelect,
    setShowSuggestions,
    inputValue
  );

  // Filter out React Query Builder specific props that shouldn't be passed to DOM
  const {
    testID,
    valueSource,
    listsAsArrays,
    parseNumbers,
    validation,
    schema,
    selectorComponent,
    title,
    separator,
    valueListItemClassName,
    ...safeInputProps
  } = props;

  // Build wrapper classes (memoized for performance)
  const wrapperClasses = useMemo(() => [
    'autocomplete-value-editor__input-wrapper',
    showValidation && (isValid ? 'autocomplete-value-editor__input-wrapper--valid' : 'autocomplete-value-editor__input-wrapper--invalid'),
    hasClearButton && 'autocomplete-value-editor__input-wrapper--has-clear',
    showValidation && 'autocomplete-value-editor__input-wrapper--has-validation',
  ].filter(Boolean).join(' '), [showValidation, isValid, hasClearButton]);

  const containerClasses = useMemo(() => [
    'autocomplete-value-editor',
    showValidation && validationError && 'autocomplete-value-editor--has-error',
    hasSuggestionsOpen && 'autocomplete-value-editor--has-suggestions',
  ].filter(Boolean).join(' '), [showValidation, validationError, hasSuggestionsOpen]);

  // Generate stable ID for active descendant
  const activeDescendantId = useMemo(() => 
    hasSuggestionsOpen && selectedIndex >= 0 
      ? `suggestion-${editorIdRef.current}-${selectedIndex}` 
      : undefined
  , [hasSuggestionsOpen, selectedIndex]);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  // Scroll selected suggestion into view
  useEffect(() => {
    if (selectedIndex >= 0 && suggestionsRef.current) {
      const selectedElement = suggestionsRef.current.children[selectedIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  // Notify parent about suggestions state
  useSuggestionsState(
    showSuggestions,
    filteredSuggestions.length,
    onSuggestionsChange,
    editorIdRef.current
  );

  // Handle click outside to close suggestions
  useClickOutside(
    showSuggestions,
    containerRef,
    suggestionsRef,
    handleCloseSuggestions
  );

  return (
    <div className={containerClasses} ref={containerRef}>
      <InputWrapper
        inputValue={inputValue}
        inputRef={inputRef}
        inputType={inputType}
        placeholder={placeholder}
        disabled={disabled}
        isValid={isValid}
        showValidation={showValidation}
        hasClearButton={hasClearButton}
        onInputChange={handleInputChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClear={handleClear}
        fieldData={fieldData}
        className={wrapperClasses}
        ariaActivedescendant={activeDescendantId}
        ariaAutocomplete="list"
        ariaExpanded={hasSuggestionsOpen}
        ariaControls={hasSuggestionsOpen ? `suggestions-${editorIdRef.current}` : undefined}
        {...safeInputProps}
      />
      
      <ValidationMessage 
        error={validationError} 
        fieldName={fieldData.name} 
      />

      {hasSuggestionsOpen && (
        <SuggestionsList
          suggestions={filteredSuggestions}
          selectedIndex={selectedIndex}
          suggestionsRef={suggestionsRef}
          position={suggestionsPosition}
          onSuggestionSelect={handleSuggestionSelect}
          onSuggestionHover={setSelectedIndex}
          editorId={editorIdRef.current}
        />
      )}
    </div>
  );
};

AutocompleteValueEditor.propTypes = {
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  handleOnChange: PropTypes.func.isRequired,
  values: PropTypes.array,
  fieldData: PropTypes.object,
  operator: PropTypes.string,
  inputType: PropTypes.string,
  disabled: PropTypes.bool,
  placeholder: PropTypes.string,
  onSuggestionsChange: PropTypes.func,
};

export default AutocompleteValueEditor;
