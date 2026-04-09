import React, { useState } from 'react';
import AutomationList from './AutomationList';
import AutomationBuilder from './AutomationBuilder';
import './Automations.css';

const AutomationsPage = () => {
  const [view, setView] = useState('list'); // 'list' | 'builder'

  return (
    <div className="automations-page">
      {view === 'list' ? (
        <AutomationList onNewRule={() => setView('builder')} />
      ) : (
        <AutomationBuilder 
          onBack={() => setView('list')} 
          onSaved={() => setView('list')} 
        />
      )}
    </div>
  );
};

export default AutomationsPage;
