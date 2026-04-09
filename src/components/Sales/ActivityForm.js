import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { createActivity } from '../../services/activityApi';
import { fetchUsers } from '../../services/userApi';
import AssigneeSelector from './AssigneeSelector';
import {
  LucideStickyNote,
  LucideMail,
  LucidePhone,
  LucideCalendar,
  LucideCheckSquare,
} from 'lucide-react';

const ACTIVITY_TYPE_OPTIONS = [
  { value: 'NOTE', label: 'Note', icon: LucideStickyNote },
  { value: 'EMAIL', label: 'Email', icon: LucideMail },
  { value: 'CALL', label: 'Call', icon: LucidePhone },
  { value: 'MEETING', label: 'Meeting', icon: LucideCalendar },
  { value: 'TASK', label: 'Task', icon: LucideCheckSquare },
];

const ActivityForm = ({ entityType, entityId, onCreated, onCancel }) => {
  const [activityType, setActivityType] = useState('NOTE');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [emailTo, setEmailTo] = useState('');
  const [callDuration, setCallDuration] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [meetingDate, setMeetingDate] = useState('');
  const [assignedToId, setAssignedToId] = useState(null);
  const [team, setTeam] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers()
      .then(setTeam)
      .catch(err => console.error('Failed to load team users', err));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      toast.warning('Subject is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        activityType,
        entityType,
        entityId,
        subject: subject.trim(),
        body: body.trim() || null,
        assignedToId
      };

      // Add type-specific fields
      if (activityType === 'EMAIL' && emailTo) payload.emailTo = emailTo;
      if (activityType === 'CALL' && callDuration) payload.callDuration = parseInt(callDuration) * 60;
      if (activityType === 'TASK' && taskDueDate) payload.taskDueDate = taskDueDate;
      if (activityType === 'MEETING' && meetingDate) payload.meetingDate = meetingDate;

      await createActivity(payload);
      toast.success(`${activityType.charAt(0) + activityType.slice(1).toLowerCase()} logged successfully`);
      onCreated();
    } catch (error) {
      toast.error('Failed to log activity');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form className="activity-form" onSubmit={handleSubmit}>
      {/* Activity Type Selector */}
      <div className="activity-type-selector">
        {ACTIVITY_TYPE_OPTIONS.map(opt => {
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              type="button"
              className={`type-chip ${activityType === opt.value ? 'active' : ''}`}
              onClick={() => setActivityType(opt.value)}
            >
              <Icon size={14} />
              {opt.label}
            </button>
          );
        })}
      </div>

      {/* Core Fields */}
      <input
        type="text"
        className="activity-input"
        placeholder="Subject *"
        value={subject}
        onChange={(e) => setSubject(e.target.value)}
        autoFocus
      />

      <textarea
        className="activity-textarea"
        placeholder="Add details..."
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
      />

      {/* Type-Specific Fields */}
      {activityType === 'EMAIL' && (
        <input
          type="email"
          className="activity-input"
          placeholder="Recipient email"
          value={emailTo}
          onChange={(e) => setEmailTo(e.target.value)}
        />
      )}

      {activityType === 'CALL' && (
        <input
          type="number"
          className="activity-input"
          placeholder="Call duration (minutes)"
          value={callDuration}
          onChange={(e) => setCallDuration(e.target.value)}
          min="1"
        />
      )}

      {activityType === 'TASK' && (
        <input
          type="date"
          className="activity-input"
          placeholder="Due date"
          value={taskDueDate}
          onChange={(e) => setTaskDueDate(e.target.value)}
        />
      )}

      {activityType === 'MEETING' && (
        <input
          type="datetime-local"
          className="activity-input"
          placeholder="Meeting date/time"
          value={meetingDate}
          onChange={(e) => setMeetingDate(e.target.value)}
        />
      )}

      {/* Assignment Field */}
      <div style={{ marginTop: '12px' }}>
        <AssigneeSelector 
          currentAssignee={team.find(u => u.id == assignedToId)}
          onAssign={(user) => setAssignedToId(user ? user.id : null)}
        />
      </div>

      {/* Actions */}
      <div className="activity-form-actions">
        <button type="button" className="cancel-btn" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="submit-btn" disabled={submitting}>
          {submitting ? 'Saving...' : 'Log Activity'}
        </button>
      </div>
    </form>
  );
};

export default ActivityForm;
