import React from 'react';
import CollapsibleList from '../CollapsibleList';
import './styles/App.less';

/**
 * App
 *
 * Top-level demo shell that renders the advanced filters
 * `CollapsibleList` with mock data.
 */

function App() {
  return (
    <div className="app">
      <h1>React Query Builder Demo</h1>
      <CollapsibleList />
    </div>
  );
}

export default App;
