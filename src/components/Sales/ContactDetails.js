import React, { useState, useEffect } from 'react';
import { getContact, updateContact } from '../../services/contactApi';
import { fetchOpportunities } from '../../services/opportunityApi';
import { LucideTarget, LucideBuilding } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AssigneeSelector from './AssigneeSelector';

const ContactDetails = ({ id, activeTab, onNavigate }) => {
  const [contact, setContact] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const contactData = await getContact(id);
      setContact(contactData);

      // Fetch related opportunities
      const oppsRes = await fetchOpportunities({ contactId: id, size: 50 });
      setOpportunities(Array.isArray(oppsRes) ? oppsRes : (oppsRes.content || []));
    } catch (err) {
      toast.error('Failed to load contact details');
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
      await updateContact(id, { 
        ...contact,
        assignedToId: newUser ? newUser.id : null, 
      });
      setContact(prev => ({ ...prev, assignedTo: newUser }));
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
    if (contact) {
      document.querySelectorAll('.sales-detail-view .entity-title').forEach(el => el.textContent = `${contact.firstName} ${contact.lastName}`);
      document.querySelectorAll('.sales-detail-view .entity-subtitle').forEach(el => el.textContent = contact.jobTitle || 'Contact');
    }
  }, [contact]);

  if (isLoading) {
    return <div className="detail-loading">Loading...</div>;
  }

  if (!contact) {
    return <div className="detail-empty">Contact not found</div>;
  }

  return (
    <div className="entity-details-view animate-fade">
      {activeTab === 'about' && (
        <>
          <div className="detail-section">
            <h3 className="section-title">Contact Info</h3>
            <AssigneeSelector 
              currentAssignee={contact.assignedToId ? { id: contact.assignedToId, fullName: contact.assignedToName } : null} 
              onAssign={handleAssign}
              isLoading={isAssigning}
            />
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Email</span>
                <span className={`detail-val ${!contact.email ? 'empty' : ''}`}>
                  {contact.email ? <a href={`mailto:${contact.email}`}>{contact.email}</a> : 'Not specified'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className={`detail-val ${!contact.phone ? 'empty' : ''}`}>
                  {contact.phone || 'Not specified'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Lifecycle Stage</span>
                <span className={`detail-val ${!contact.lifecycleStage ? 'empty' : ''}`}>
                  {contact.lifecycleStage ? (
                     <span className={`status-badge status-${contact.lifecycleStage.toLowerCase().replace(' ', '-')}`}>
                       {contact.lifecycleStage}
                     </span>
                  ) : 'None'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'related' && (
        <>
          <div className="detail-section">
            <h3 className="section-title">Organization</h3>
            <div className="related-list">
              {contact.organizationId ? (
                <div className="related-item" onClick={() => onNavigate('organization', contact.organizationId)}>
                  <div className="related-item-icon"><LucideBuilding size={18} /></div>
                  <div className="related-item-content">
                    <div className="item-title">{contact.organizationName || 'Associated Organization'}</div>
                    <div className="item-subtitle">Click to view details</div>
                  </div>
                </div>
              ) : (
                <div className="empty-list">Not associated with an organization.</div>
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Opportunities ({opportunities.length})</h3>
            <div className="related-list">
              {opportunities.length === 0 ? (
                <div className="empty-list">No opportunities linked to this contact.</div>
              ) : (
                opportunities.map(o => (
                  <div key={o.id} className="related-item" onClick={() => onNavigate('opportunity', o.id)}>
                    <div className="related-item-icon"><LucideTarget size={18} /></div>
                    <div className="related-item-content">
                      <div className="item-title">{o.name}</div>
                      <div className="item-subtitle">
                        {o.stage} • {o.amount ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(o.amount) : 'No amount'}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ContactDetails;
