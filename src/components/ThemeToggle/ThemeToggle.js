import React from 'react';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import { useTheme } from '../../context/ThemeContext';
import '../../styles/ThemeToggle.less';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      type="button"
    >
      <span className={`theme-toggle__icon ${isDark ? 'theme-toggle__icon--hidden' : ''}`}>
        <DarkModeIcon fontSize="small" />
      </span>
      <span className={`theme-toggle__icon ${!isDark ? 'theme-toggle__icon--hidden' : ''}`}>
        <LightModeIcon fontSize="small" />
      </span>
    </button>
  );
};

export default ThemeToggle;
