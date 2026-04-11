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
  // Optional icon overrides — callers can pass any React node.
  // Falls back to the PanelLeft icons when not provided.
  icon = null,
  iconExpanded = null,
  ...buttonProps
}) => {
  const buttonText = isExpanded ? expandedLabel : collapsedLabel;
  // className on the default SVGs is intentionally omitted — the wrapping
  // span already carries collapse-button__icon-left.
  const leftIcon = isExpanded
    ? (iconExpanded ?? <PanelLeftClose size={16} />)
    : (icon        ?? <PanelLeftOpen  size={16} />);

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
      <span className="collapse-button__icon-left" aria-hidden="true">{leftIcon}</span>
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
  icon: PropTypes.node,
  iconExpanded: PropTypes.node,
};

export default CollapseButton;
