import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import '../../styles/DataSourceBanner.less';

/**
 * DataSourceBanner
 *
 * A one-time notification that tells the user whether data is coming
 * from the live backend or from local mock data.
 *
 * Auto-dismisses after `duration` ms and can also be closed manually.
 */
const DISMISS_DURATION = 5000; // 5 seconds

const DataSourceBanner = ({ isLive, duration = DISMISS_DURATION }) => {
  const [visible, setVisible] = useState(true);

  // Auto-dismiss after `duration` ms
  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), duration);
    return () => clearTimeout(timer);
  }, [duration]);

  if (!visible) return null;

  const variant = isLive ? 'live' : 'mock';

  return (
    <div
      className={`data-source-banner data-source-banner--${variant}`}
      role="status"
      aria-live="polite"
      data-testid="data-source-banner"
    >
      <span className="data-source-banner__icon" aria-hidden="true">
        {isLive ? '●' : '○'}
      </span>
      <span className="data-source-banner__message">
        {isLive
          ? 'Connected to backend — live data'
          : 'Backend unavailable — using mock data'}
      </span>
      <button
        className="data-source-banner__close"
        onClick={() => setVisible(false)}
        aria-label="Dismiss notification"
        data-testid="data-source-banner-close"
      >
        ×
      </button>
    </div>
  );
};

DataSourceBanner.propTypes = {
  /** true = connected to backend, false = fell back to mock data */
  isLive: PropTypes.bool.isRequired,
  /** Auto-dismiss after this many milliseconds */
  duration: PropTypes.number,
};

export default DataSourceBanner;
