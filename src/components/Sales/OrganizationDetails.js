import React, { useState, useEffect } from 'react';
import { updateOrganization, getOrganization } from '../../services/organizationApi';
import { fetchContacts } from '../../services/contactApi';
import { fetchOpportunities } from '../../services/opportunityApi';
import { LucidePhone, LucideMail, LucideTarget, LucideUsers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import AssigneeSelector from './AssigneeSelector';

const OrganizationDetails = ({ id, activeTab, onNavigate }) => {
  const [org, setOrg] = useState(null);
  const [contacts, setContacts] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const orgData = await getOrganization(id);
      setOrg(orgData);

      // Fetch related data
      const [contactsRes, oppsRes] = await Promise.all([
        fetchContacts({ organizationId: id, size: 50 }),
        fetchOpportunities({ organizationId: id, size: 50 })
      ]);

      setContacts(Array.isArray(contactsRes) ? contactsRes : (contactsRes.content || []));
      setOpportunities(Array.isArray(oppsRes) ? oppsRes : (oppsRes.content || []));
    } catch (err) {
      toast.error('Failed to load organization details');
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
      await updateOrganization(id, { 
        ...org, 
        assignedToId: newUser ? newUser.id : null,
      });
      setOrg(prev => ({ ...prev, assignedTo: newUser }));
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

  // Update header title in DOM since the shell is generic
  useEffect(() => {
    if (org) {
      document.querySelectorAll('.sales-detail-view .entity-title').forEach(el => el.textContent = org.name);
      document.querySelectorAll('.sales-detail-view .entity-subtitle').forEach(el => el.textContent = 'Organization');
    }
  }, [org]);

  if (isLoading) {
    return <div className="detail-loading">Loading...</div>;
  }

  if (!org) {
    return <div className="detail-empty">Organization not found</div>;
  }

  return (
    <div className="entity-details-view animate-fade">
      {activeTab === 'about' && (
        <>
          <div className="detail-section">
            <h3 className="section-title">Overview</h3>
            <AssigneeSelector 
              currentAssignee={org.assignedToId ? { id: org.assignedToId, fullName: org.assignedToName } : null} 
              onAssign={handleAssign}
              isLoading={isAssigning}
            />
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">Industry</span>
                <span className={`detail-val ${!org.industry ? 'empty' : ''}`}>{org.industry || 'Not specified'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Annual Revenue</span>
                <span className={`detail-val ${!org.annualRevenue ? 'empty' : ''}`}>
                  {org.annualRevenue ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(org.annualRevenue) : 'Not specified'}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Employees</span>
                <span className={`detail-val ${!org.employeeCount ? 'empty' : ''}`}>{org.employeeCount || 'Not specified'}</span>
              </div>
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Location & Contact</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">City</span>
                <span className={`detail-val ${!org.city ? 'empty' : ''}`}>{org.city || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">State/Region</span>
                <span className={`detail-val ${!org.state ? 'empty' : ''}`}>{org.state || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Country</span>
                <span className={`detail-val ${!org.country ? 'empty' : ''}`}>{org.country || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Phone</span>
                <span className={`detail-val ${!org.phone ? 'empty' : ''}`}>{org.phone || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Website</span>
                <span className={`detail-val ${!org.website ? 'empty' : ''}`}>
                  {org.website ? <a href={org.website} target="_blank" rel="noopener noreferrer">{org.website}</a> : '-'}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {activeTab === 'related' && (
        <>
          <div className="detail-section">
            <h3 className="section-title">Contacts ({contacts.length})</h3>
            <div className="related-list">
              {contacts.length === 0 ? (
                <div className="empty-list">No contacts found for this organization.</div>
              ) : (
                contacts.map(c => (
                  <div key={c.id} className="related-item" onClick={() => onNavigate('contact', c.id)}>
                    <div className="related-item-icon"><LucideUsers size={18} /></div>
                    <div className="related-item-content">
                      <div className="item-title">{c.firstName} {c.lastName}</div>
                      <div className="item-subtitle">{c.jobTitle || 'No title'}</div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="detail-section">
            <h3 className="section-title">Opportunities ({opportunities.length})</h3>
            <div className="related-list">
              {opportunities.length === 0 ? (
                <div className="empty-list">No opportunities found.</div>
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

export default OrganizationDetails;
