import React from 'react';
import PropTypes from 'prop-types';
import ClearIcon from '@mui/icons-material/Clear';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';

/**
 * Input wrapper component with clear button and validation icon
 */
const InputWrapper = ({
  inputValue,
  inputRef,
  inputType,
  placeholder,
  disabled,
  isValid,
  showValidation,
  hasClearButton,
  onInputChange,
  onKeyDown,
  onFocus,
  onClear,
  fieldData,
  className,
  ariaActivedescendant,
  ariaAutocomplete,
  ariaExpanded,
  ariaControls,
  ...inputProps
}) => {
  return (
    <div className={className}>
      <input
        ref={inputRef}
        type={inputType}
        value={inputValue}
        onChange={onInputChange}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        placeholder={placeholder || 'Enter value...'}
        disabled={disabled}
        className="autocomplete-value-editor__input"
        aria-invalid={showValidation && !isValid}
        aria-describedby={showValidation ? `validation-${fieldData.name || 'value'}` : undefined}
        aria-activedescendant={ariaActivedescendant}
        aria-autocomplete={ariaAutocomplete}
        aria-expanded={ariaExpanded}
        aria-controls={ariaControls}
        {...inputProps}
      />
      {hasClearButton && (
        <button
          type="button"
          className="autocomplete-value-editor__clear-button"
          onClick={onClear}
          aria-label="Clear value"
          tabIndex={-1}
        >
          <ClearIcon fontSize="small" />
        </button>
      )}
      {showValidation && (
        <span className="autocomplete-value-editor__validation-icon">
          {isValid ? (
            <CheckCircleIcon fontSize="small" className="autocomplete-value-editor__icon--valid" />
          ) : (
            <ErrorIcon fontSize="small" className="autocomplete-value-editor__icon--invalid" />
          )}
        </span>
      )}
    </div>
  );
};

InputWrapper.propTypes = {
  inputValue: PropTypes.string.isRequired,
  inputRef: PropTypes.object.isRequired,
  inputType: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  isValid: PropTypes.bool,
  showValidation: PropTypes.bool,
  hasClearButton: PropTypes.bool,
  onInputChange: PropTypes.func.isRequired,
  onKeyDown: PropTypes.func.isRequired,
  onFocus: PropTypes.func.isRequired,
  onClear: PropTypes.func.isRequired,
  fieldData: PropTypes.object,
  className: PropTypes.string.isRequired,
  ariaActivedescendant: PropTypes.string,
  ariaAutocomplete: PropTypes.string,
  ariaExpanded: PropTypes.bool,
  ariaControls: PropTypes.string,
};

export default InputWrapper;
