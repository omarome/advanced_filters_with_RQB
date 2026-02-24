import { useState, useEffect, useRef } from 'react';

/**
 * Throttle function to limit how often a function can be called
 * @param {function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {function} - Throttled function
 */
const throttle = (func, limit) => {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

/**
 * Custom hook for calculating suggestions position for portal
 * 
 * @param {boolean} showSuggestions - Whether suggestions are visible
 * @param {number} filteredSuggestionsLength - Number of filtered suggestions
 * @param {object} inputRef - Ref to the input element
 * @returns {object} - Position coordinates { top, left, width }
 */
export const useSuggestionsPosition = (showSuggestions, filteredSuggestionsLength, inputRef) => {
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const throttledUpdateRef = useRef(null);

  useEffect(() => {
    if (showSuggestions && filteredSuggestionsLength > 0 && inputRef.current) {
      const updatePosition = () => {
        if (!inputRef.current) return;
        const inputRect = inputRef.current.getBoundingClientRect();
        setPosition({
          top: inputRect.bottom + window.scrollY + 4,
          left: inputRect.left + window.scrollX,
          width: inputRect.width,
        });
      };
      
      // Initial position update
      updatePosition();
      
      // Create throttled version (updates max once per 16ms ~ 60fps)
      throttledUpdateRef.current = throttle(updatePosition, 16);
      
      // Use throttled version for scroll/resize
      window.addEventListener('scroll', throttledUpdateRef.current, true);
      window.addEventListener('resize', throttledUpdateRef.current);
      
      return () => {
        if (throttledUpdateRef.current) {
          window.removeEventListener('scroll', throttledUpdateRef.current, true);
          window.removeEventListener('resize', throttledUpdateRef.current);
        }
      };
    } else {
      // Reset position when suggestions are closed
      setPosition({ top: 0, left: 0, width: 0 });
    }
  }, [showSuggestions, filteredSuggestionsLength, inputRef]);

  return position;
};
