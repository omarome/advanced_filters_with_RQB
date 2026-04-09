import React, { useState, useEffect } from 'react';
import { LucideX, LucideBuilding, LucideUsers, LucideTarget, Maximize2, Minimize2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OrganizationDetails from './OrganizationDetails';
import ContactDetails from './ContactDetails';
import OpportunityDetails from './OpportunityDetails';
import ActivityTimeline from './ActivityTimeline';
import AuditLogViewer from '../AuditLog/AuditLogViewer';
import CommentThread from '../Comments/CommentThread';
import AttachmentPanel from '../Attachments/AttachmentPanel';
import '../../styles/SalesDetailView.less';

const SalesDetailView = ({ entityId, entityType, mode = 'inline', onClose, onFullScreen }) => {
  const [activeTab, setActiveTab] = useState('about');
  const navigate = useNavigate();

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (mode === 'modal') {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [mode]);

  if (!entityId || !entityType) return null;

  const handleNavigate = (type, targetId) => {
    if (onClose) onClose();
    if (type === 'organization') navigate(`/sales/organizations?selectedId=${targetId}`);
    if (type === 'contact') navigate(`/sales/contacts?selectedId=${targetId}`);
    if (type === 'opportunity') navigate(`/sales/opportunities?selectedId=${targetId}`);
  };

  const renderIcon = () => {
    switch (entityType) {
      case 'organization': return <LucideBuilding size={24} />;
      case 'contact': return <LucideUsers size={24} />;
      case 'opportunity': return <LucideTarget size={24} />;
      default: return null;
    }
  };

  const renderContent = () => {
    switch (entityType) {
      case 'organization':
        return <OrganizationDetails id={entityId} activeTab={activeTab} onNavigate={handleNavigate}/>;
      case 'contact':
        return <ContactDetails id={entityId} activeTab={activeTab} onNavigate={handleNavigate}/>;
      case 'opportunity':
        return <OpportunityDetails id={entityId} activeTab={activeTab} onNavigate={handleNavigate}/>;
      default:
        return <div>Invalid Entity Type</div>;
    }
  };

  const DetailContainer = (
    <div className={`sales-detail-view mode-${mode}`}>
      <div className="sidebar-header">
        <div className="header-content">
          <div className="entity-icon-wrapper">
            {renderIcon()}
          </div>
          {/* Header text injected by child components to reuse API fetch responses */}
          <h2 className="entity-title" style={{ marginTop: '8px' }}>Loading...</h2>
          <span className="entity-subtitle">Entity Details</span>
        </div>
        
        <div className="header-actions">
          {mode === 'inline' && onFullScreen && (
            <button className="icon-btn" onClick={onFullScreen} title="Expand to Full Screen">
              <Maximize2 size={18} />
            </button>
          )}
          {mode === 'modal' && onClose ? (
            <button className="icon-btn" onClick={onClose} title="Minimize Screen">
              <Minimize2 size={20} /> Minimize
            </button>
          ) : mode === 'inline' && onClose ? (
            <button className="icon-btn" onClick={onClose} title="Close">
              <LucideX size={20} />
            </button>
          ) : null}
        </div>
      </div>

      <div className="sidebar-tabs">
        <button 
          className={`tab-btn ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
        <button 
          className={`tab-btn ${activeTab === 'related' ? 'active' : ''}`}
          onClick={() => setActiveTab('related')}
        >
          Related
        </button>
        <button
          className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
          onClick={() => setActiveTab('activity')}
        >
          Activity
        </button>
        <button
          className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          History
        </button>
        <button
          className={`tab-btn ${activeTab === 'discussion' ? 'active' : ''}`}
          onClick={() => setActiveTab('discussion')}
        >
          Discussion
        </button>
        <button
          className={`tab-btn ${activeTab === 'files' ? 'active' : ''}`}
          onClick={() => setActiveTab('files')}
        >
          Files
        </button>
      </div>

      <div className="sidebar-content custom-scrollbar">
        {activeTab === 'activity' ? (
          <ActivityTimeline
            entityType={entityType.toUpperCase()}
            entityId={entityId}
          />
        ) : activeTab === 'history' ? (
          <AuditLogViewer
            entityType={entityType.toUpperCase()}
            entityId={entityId}
          />
        ) : activeTab === 'discussion' ? (
          <CommentThread
            entityType={entityType.toUpperCase()}
            entityId={entityId}
          />
        ) : activeTab === 'files' ? (
          <AttachmentPanel
            entityType={entityType.toUpperCase()}
            entityId={entityId}
          />
        ) : (
          renderContent()
        )}
      </div>
    </div>
  );

  if (mode === 'modal') {
    return (
      <>
        <div className="sales-detail-modal-overlay" onClick={onClose} />
        {DetailContainer}
      </>
    );
  }

  return DetailContainer;
};

export default SalesDetailView;
