import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useMergeRefs } from '@floating-ui/react';
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
  validation,        // RQB already ran field.validator(rule) — use its result
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
  // Read the validation result RQB already computed (no re-running the validator)
  const { isValid, error: validationError } = useInputValidation(validation);

  // Floating UI — positions the suggestions list relative to the input
  const hasSuggestionsOpen = Boolean(showSuggestions && filteredSuggestions.length > 0);
  const { refs: floatingRefs, floatingStyles } = useSuggestionsPosition(hasSuggestionsOpen);

  // Merge Floating UI's reference ref with our inputRef so both work
  const mergedInputRef = useMergeRefs([inputRef, floatingRefs.setReference]);
  // Merge Floating UI's floating ref with our suggestionsRef
  const mergedSuggestionsRef = useMergeRefs([suggestionsRef, floatingRefs.setFloating]);

  // Computed values
  const hasValue = Boolean(inputValue && inputValue.trim() !== '');
  const showValidation = Boolean(hasValue && validationError !== null);
  const hasClearButton = Boolean(hasValue && !disabled);

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
    schema,
    selectorComponent,
    title,
    separator,
    valueListItemClassName,
    ...safeInputProps
  } = props;

  const baseTestId = useMemo(
    () => (testID ? String(testID) : editorIdRef.current),
    [testID]
  );

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
    if (value !== inputValue) {
      setInputValue(value || '');
    }
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
    <div
      className={containerClasses}
      ref={containerRef}
      data-testid={`${baseTestId}-container`}
    >
      <InputWrapper
        inputValue={inputValue}
        inputRef={mergedInputRef}
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
        inputTestId={`${baseTestId}-input`}
        clearButtonTestId={hasClearButton ? `${baseTestId}-clear` : undefined}
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
          suggestionsRef={mergedSuggestionsRef}
          floatingStyles={floatingStyles}
          onSuggestionSelect={handleSuggestionSelect}
          onSuggestionHover={setSelectedIndex}
          editorId={editorIdRef.current}
          listTestId={`${baseTestId}-suggestions`}
          itemTestIdPrefix={`${baseTestId}-suggestion-item`}
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
  /** Validation result computed by RQB from field.validator(rule) */
  validation: PropTypes.oneOfType([
    PropTypes.bool,
    PropTypes.shape({
      valid: PropTypes.bool,
      message: PropTypes.string,
    }),
  ]),
};

export default AutocompleteValueEditor;
