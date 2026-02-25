import React from 'react';
import PropTypes from 'prop-types';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import '../../styles/CollapseButton.less';
const CollapseButton = ({
  isExpanded,
  onToggle,
  expandedLabel = 'Hide',
  collapsedLabel = 'Show',
  className = '',
  ...buttonProps
}) => {
  const buttonText = isExpanded ? expandedLabel : collapsedLabel;

  return (
    <button
      className={`collapse-button ${isExpanded ? 'collapse-button--expanded' : ''} ${className}`.trim()}
      onClick={onToggle}
      aria-expanded={isExpanded}
      type="button"
      {...buttonProps}
    >
      <span className="collapse-button__text">{buttonText}</span>
      {isExpanded ? (
        <ExpandLessIcon className="collapse-button__icon" aria-hidden="true" />
      ) : (
        <ExpandMoreIcon className="collapse-button__icon" aria-hidden="true" />
      )}
    </button>
  );
};

CollapseButton.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  expandedLabel: PropTypes.string,
  collapsedLabel: PropTypes.string,
  className: PropTypes.string,
};

export default CollapseButton;
