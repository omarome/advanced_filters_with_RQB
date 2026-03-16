import React from 'react';
import { LucideAlertTriangle, LucideX } from 'lucide-react';
import '../../styles/ConfirmationModal.less';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = 'Delete', type = 'danger' }) => {
  if (!isOpen) return null;

  return (
    <div className="confirm-modal-overlay">
      <div className="confirm-modal-container animate-scale-up">
        <div className="confirm-modal-header">
          <div className={`icon-badge ${type}`}>
            <LucideAlertTriangle size={24} />
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close">
            <LucideX size={20} />
          </button>
        </div>
        
        <div className="confirm-modal-content">
          <h3>{title}</h3>
          <p>{message}</p>
        </div>

        <div className="confirm-modal-footer">
          <button className="confirm-btn cancel" onClick={onClose}>
            Cancel
          </button>
          <button className={`confirm-btn action ${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
