import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LucideUser, LucideMail, LucideShield, LucideLogOut, LucideTrash2, LucideCheck, LucideX, LucideEdit2 } from 'lucide-react';
import { useAuth } from '../../context/AuthProvider';
import '../../styles/ProfileView.less';

/**
 * ProfileView — premium settings view for the currently logged-in user.
 */
export default function ProfileView() {
  const navigate = useNavigate();
  const { user, logout, updateProfile, deleteAccount } = useAuth();
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(user?.displayName || '');
  const [isUpdating, setIsUpdating] = useState(false);
  const [nameError, setNameError] = useState('');

  if (!user) return null;

  const handleUpdateName = async () => {
    setIsUpdating(true);
    setNameError('');
    try {
      await updateProfile(newName);
      setIsEditingName(false);
    } catch (err) {
      // Backend returns field-specific errors in the response body
      setNameError(err.message || 'Failed to update name');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="profile-settings animate-fade">
      <div className="profile-settings__header">
        <h2>Profile Settings</h2>
        <button className="edit-btn" onClick={() => navigate('/')}>
          <LucideX size={16} /> Close
        </button>
      </div>

      <div className="profile-settings__content">
        {/* Account Information */}
        <section className="profile-settings__section">
          <div className="profile-settings__avatar-section">
            <img
              src={user?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.displayName || 'Admin User')}&background=7c69ef&color=fff`}
              alt="Profile"
              className="profile-view-img"
            />
            <div className="avatar-info">
              <h3>{user.displayName}</h3>
              <p>{user.email}</p>
            </div>
          </div>

          <div className="profile-settings__item">
            <div className="item-info">
              <label>Display Name</label>
              {isEditingName ? (
                <div className="profile-settings__form">
                  <div className="profile-settings__input-group">
                    <input
                      type="text"
                      className={`value profile-settings__input ${nameError ? 'profile-settings__input--error' : ''}`}
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={isUpdating}
                      className="profile-settings__action-btn profile-settings__action-btn--success"
                    >
                      <LucideCheck size={18} />
                    </button>
                    <button
                      onClick={() => { setIsEditingName(false); setNewName(user.displayName); setNameError(''); }}
                      className="profile-settings__action-btn profile-settings__action-btn--error"
                    >
                      <LucideX size={18} />
                    </button>
                  </div>
                  {nameError && (
                    <div className="profile-settings__error-message">
                      {nameError}
                    </div>
                  )}
                </div>
              ) : (
                <div className="value">{user.displayName || 'No name set'}</div>
              )}
            </div>
            {!isEditingName && (
              <button className="edit-btn" onClick={() => setIsEditingName(true)}>
                <LucideEdit2 size={14} /> Edit
              </button>
            )}
          </div>

          <div className="profile-settings__item">
            <div className="item-info">
              <label>Email</label>
              <div className="value">{user.email}</div>
            </div>
            <div className="profile-settings__icon">
              <LucideMail size={18} />
            </div>
          </div>

          <div className="profile-settings__item">
            <div className="item-info">
              <label>Role</label>
              <div className="value profile-settings__role-value">Super Admin</div>
            </div>
            <div className="profile-settings__icon profile-settings__icon--primary">
              <LucideShield size={18} />
            </div>
          </div>
        </section>

        {/* Sign Out Section */}
        <section className="profile-settings__section">
          <div className="profile-settings__header">
            <h2 className="profile-settings__section-title--small">Sign Out</h2>
          </div>
          <p className="description">
            Sign out of your account on this device.
          </p>
          <div className="profile-settings__footer">
            <button className="sign-out-btn" onClick={logout}>
              <LucideLogOut size={16} /> Sign Out
            </button>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="profile-settings__section profile-settings__danger-zone">
          <div className="profile-settings__header">
            <h2 className="profile-settings__danger-title">Danger Zone</h2>
          </div>
          <p className="description profile-settings__danger-description">
            Permanently delete your account and all associated data.
          </p>
          <div className="profile-settings__footer">
            <button className="delete-btn" onClick={() => { if (window.confirm('Are you sure? This cannot be undone.')) deleteAccount(); }}>
              <LucideTrash2 size={16} /> Delete Account
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
