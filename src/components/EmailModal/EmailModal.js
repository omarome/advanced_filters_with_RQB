import React, { useState } from 'react';
import { LucideSend, LucideX, LucideMail, LucideUser } from 'lucide-react';
import '../../styles/EmailModal.less';

const EmailModal = ({ isOpen, onClose, recipients, onSend }) => {
  const [subject, setSubject] = useState('Important Update regarding your account');
  const [message, setMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend({ subject, message });
    onClose();
  };

  return (
    <div className="email-modal-overlay">
      <div className="email-modal-container animate-scale-up">
        <div className="email-modal-header">
          <div className="header-title-group">
            <div className="icon-badge">
              <LucideMail size={20} />
            </div>
            <div>
              <h3>Compose Bulk Email</h3>
              <p className="subtitle">Sending to {recipients.length} selected users</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <LucideX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="email-modal-form">
          <div className="form-section">
            <label>Recipients</label>
            <div className="recipients-list custom-scrollbar">
              {recipients.map((user, idx) => (
                <span key={idx} className="recipient-chip">
                  <LucideUser size={12} />
                  {user.displayName || user.name || user.email}
                </span>
              ))}
            </div>
          </div>

          <div className="form-section">
            <label htmlFor="email-subject">Subject</label>
            <input 
              id="email-subject"
              type="text" 
              className="form-input" 
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter email subject..."
              required
            />
          </div>

          <div className="form-section flex-grow">
            <label htmlFor="email-message">Message Content</label>
            <textarea 
              id="email-message"
              className="form-textarea custom-scrollbar"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Write your message here..."
              required
            />
          </div>

          <div className="email-modal-footer">
            <button type="button" className="action-btn cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="action-btn send-btn">
              <LucideSend size={16} />
              Send Email
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailModal;
