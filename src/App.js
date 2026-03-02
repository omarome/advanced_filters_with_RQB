import React from 'react';
import CollapsibleList from '../CollapsibleList';
import './styles/App.less';

/**
 * App
 *
 * Top-level shell that renders the advanced data explorer
 * with dynamic filtering powered by React Query Builder.
 */

function App() {
  return (
    <div className="app">
      <h1>{import.meta.env.VITE_APP_TITLE || 'Smart Filter Hub'}</h1>
      <CollapsibleList />
    </div>
  );
}

export default App;
