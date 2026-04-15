import React, { useState, useRef, useEffect } from 'react';
import { LucideBuilding2, LucideCheck, LucideChevronDown, LucideLoader2 } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import './WorkspaceSwitcher.less';

const WorkspaceSwitcher = () => {
  const { workspaces, activeWorkspaceId, switchWorkspace, isWorkspaceSwitching } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!workspaces || workspaces.length === 0) {
    return null; // Don't render until workspaces load
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];

  const handleSelect = async (id) => {
    setIsOpen(false);
    if (id !== activeWorkspaceId) {
      await switchWorkspace(id);
    }
  };

  return (
    <div className="workspace-switcher" ref={dropdownRef}>
      <button 
        className={`workspace-btn ${isOpen ? 'active' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={isWorkspaceSwitching}
      >
        <div className="workspace-icon">
          {isWorkspaceSwitching ? <LucideLoader2 size={16} className="spinner" /> : <LucideBuilding2 size={16} />}
        </div>
        <div className="workspace-info">
          <span className="workspace-label">Workspace</span>
          <span className="workspace-name">{activeWorkspace?.name || 'Loading...'}</span>
        </div>
        <LucideChevronDown size={14} className="workspace-chevron" />
      </button>

      {isOpen && (
        <div className="workspace-dropdown">
          <div className="workspace-dropdown-header">
            <span>Switch Workspace</span>
          </div>
          <div className="workspace-list">
            {workspaces.map((ws) => {
              const isActive = ws.id === activeWorkspaceId;
              return (
                <button
                  key={ws.id}
                  className={`workspace-item ${isActive ? 'selected' : ''}`}
                  onClick={() => handleSelect(ws.id)}
                >
                  <div className="workspace-item-icon">
                    {ws.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="workspace-item-details">
                    <span className="workspace-item-name">{ws.name}</span>
                    <span className="workspace-item-role">{ws.role.replace('_', ' ')}</span>
                  </div>
                  {isActive && <LucideCheck size={16} className="workspace-check" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default WorkspaceSwitcher;
