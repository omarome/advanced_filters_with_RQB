import React from 'react';
import PropTypes from 'prop-types';
import { PanelLeftClose, PanelLeftOpen, ChevronUp, ChevronDown } from 'lucide-react';
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
      className={[
        'collapse-button',
        'premium-btn',
        isExpanded && 'collapse-button--expanded',
        className
      ].filter(Boolean).join(' ')}
      onClick={onToggle}
      aria-expanded={isExpanded}
      type="button"
      {...buttonProps}
    >
      {isExpanded ? (
        <PanelLeftClose size={16} className="collapse-button__icon-left" />
      ) : (
        <PanelLeftOpen size={16} className="collapse-button__icon-left" />
      )}
      <span className="collapse-button__text">{buttonText}</span>
      {isExpanded ? (
        <ChevronUp size={16} className="collapse-button__icon" aria-hidden="true" />
      ) : (
        <ChevronDown size={16} className="collapse-button__icon" aria-hidden="true" />
      )}
    </button>
  );
};

CollapseButton.propTypes = {
  isExpanded: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
  expandedLabel: PropTypes.node,
  collapsedLabel: PropTypes.node,
  className: PropTypes.string,
};

export default CollapseButton;
