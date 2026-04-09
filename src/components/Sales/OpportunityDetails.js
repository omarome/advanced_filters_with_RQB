import React, { useState, useEffect } from 'react';
import { getOpportunity, updateOpportunity } from '../../services/opportunityApi';
import { LucideBuilding, LucideUsers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AssigneeSelector from './AssigneeSelector';

const OpportunityDetails = ({ id, activeTab, onNavigate }) => {
  const [opp, setOpp] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const data = await getOpportunity(id);
      setOpp(data);
    } catch (err) {
      toast.error('Failed to load opportunity details');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const handleAssign = async (newUser) => {
    setIsAssigning(true);
    try {
      await updateOpportunity(id, { 
        ...opp, 
        assignedToId: newUser ? newUser.id : null,
      });
      setOpp(prev => ({ ...prev, assignedTo: newUser }));
      if (newUser) {
        toast.success(`Assigned to ${newUser.fullName}`);
      } else {
        toast.success(`Record unassigned`);
      }
    } catch (err) {
      toast.error('Assignment failed');
    } finally {
      setIsAssigning(false);
    }
  };

  // Update header title in DOM
  useEffect(() => {
    if (opp) {
      document.querySelectorAll('.sales-detail-view .entity-title').forEach(el => el.textContent = opp.name);
      document.querySelectorAll('.sales-detail-view .entity-subtitle').forEach(el => el.textContent = `Opportunity • ${opp.stage || 'No Stage'}`);
    }
  }, [opp]);

  if (isLoading) {
    return <div className="detail-loading">Loading...</div>;
  }

  if (!opp) {
    return <div className="detail-empty">Opportunity not found</div>;
  }

  return (
    <div className="entity-details-view animate-fade">
      {activeTab === 'about' && (
        <>
          <div className="detail-section">
            <h3 className="section-title">Deal Info</h3>
            <AssigneeSelector 
              currentAssignee={opp.assignedToId ? { id: opp.assignedToId, fullName: opp.assignedToName } : null} 
              onAssign={handleAssign}
              isLoading={isAssigning}
            />
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Amount</span>
                <span className={`detail-val ${!opp.amount ? 'empty' : ''}`}>
                  {opp.amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(opp.amount) : 'Not specified'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Stage</span>
                <span className={`detail-val ${!opp.stage ? 'empty' : ''}`}>
                  {opp.stage ? (
                     <span className="status-badge status-active">{opp.stage}</span>
                  ) : 'Not specified'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Probability</span>
                <span className={`detail-val ${opp.probability == null ? 'empty' : ''}`}>
                  {opp.probability != null ? `${opp.probability}%` : 'Not specified'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Expected Close Date</span>
                <span className={`detail-val ${!opp.expectedCloseDate ? 'empty' : ''}`}>
                  {opp.expectedCloseDate ? new Date(opp.expectedCloseDate).toLocaleDateString() : 'Not specified'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'related' && (
        <>
          <div className="detail-section">
            <h3 className="section-title">Related Entities</h3>
            <div className="related-list">
              {opp.organizationId ? (
                <div className="related-item" onClick={() => onNavigate('organization', opp.organizationId)}>
                  <div className="related-item-icon"><LucideBuilding size={18} /></div>
                  <div className="related-item-content">
                    <div className="item-title">{opp.organizationName || 'Organization'}</div>
                    <div className="item-subtitle">Company</div>
                  </div>
                </div>
              ) : null}

              {opp.primaryContactId ? (
                <div className="related-item" onClick={() => onNavigate('contact', opp.primaryContactId)}>
                  <div className="related-item-icon"><LucideUsers size={18} /></div>
                  <div className="related-item-content">
                    <div className="item-title">{opp.primaryContactName || 'Primary Contact'}</div>
                    <div className="item-subtitle">Key Decision Maker</div>
                  </div>
                </div>
              ) : null}
              
              {!opp.organizationId && !opp.primaryContactId && (
                <div className="empty-list">No related entities linked to this opportunity.</div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default OpportunityDetails;
