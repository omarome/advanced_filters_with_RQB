import React from 'react';
import CollapsibleList from './components/CollapsibleList/CollapsibleList';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import ThemeToggle from './components/ThemeToggle/ThemeToggle';
import './styles/App.less';

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">
          {import.meta.env.VITE_APP_TITLE || 'Smart Filter Hub'}
        </h1>
        <ThemeToggle />
      </header>
      <ErrorBoundary>
        <CollapsibleList />
      </ErrorBoundary>
    </div>
  );
}

export default App;
