import React, { useState, useEffect, useCallback } from 'react';
import {
  LucideStickyNote,
  LucideMail,
  LucidePhone,
  LucideCalendar,
  LucideCheckSquare,
  LucideChevronDown,
  LucideTrash2,
  LucideClock
} from 'lucide-react';
import { fetchActivities, deleteActivity } from '../../services/activityApi';
import ActivityForm from './ActivityForm';
import { toast } from 'react-hot-toast';
import { usePermission } from '../../hooks/usePermission';
import '../../styles/ActivityTimeline.less';

const ACTIVITY_ICONS = {
  NOTE: LucideStickyNote,
  EMAIL: LucideMail,
  CALL: LucidePhone,
  MEETING: LucideCalendar,
  TASK: LucideCheckSquare,
};

const ACTIVITY_COLORS = {
  NOTE: 'var(--primary-color)',
  EMAIL: 'var(--success-color)',
  CALL: 'var(--warning-color)',
  MEETING: '#8b5cf6',
  TASK: 'var(--error-color)',
};

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const formatDuration = (seconds) => {
  if (!seconds) return '';
  const mins = Math.floor(seconds / 60);
  if (mins < 60) return `${mins} min`;
  const hours = Math.floor(mins / 60);
  const remainMins = mins % 60;
  return `${hours}h ${remainMins}m`;
};

const ActivityTimeline = ({ entityType, entityId }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const canCreateActivity = usePermission('ACTIVITIES_CREATE');
  const canDeleteActivity = usePermission('ACTIVITIES_DELETE');

  const loadActivities = useCallback(async (pageNum = 0, append = false) => {
    try {
      setLoading(true);
      const response = await fetchActivities(entityType, entityId, pageNum, 10);
      const newActivities = response.content || [];

      if (append) {
        setActivities(prev => [...prev, ...newActivities]);
      } else {
        setActivities(newActivities);
      }

      setHasMore(!response.last);
      setPage(pageNum);
    } catch (error) {
      console.error('Failed to load activities:', error);
      toast.error('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    if (entityType && entityId) {
      loadActivities(0, false);
    }
  }, [entityType, entityId, loadActivities]);

  const handleLoadMore = () => {
    loadActivities(page + 1, true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteActivity(id);
      setActivities(prev => prev.filter(a => a.id !== id));
      toast.success('Activity deleted');
    } catch {
      toast.error('Failed to delete activity');
    }
  };

  const handleActivityCreated = () => {
    setIsFormOpen(false);
    loadActivities(0, false);
  };

  const renderMeta = (activity) => {
    switch (activity.activityType) {
      case 'CALL':
        return activity.callDuration ? (
          <span className="activity-meta-item">
            <LucideClock size={12} /> {formatDuration(activity.callDuration)}
          </span>
        ) : null;
      case 'EMAIL':
        return activity.emailTo ? (
          <span className="activity-meta-item">To: {activity.emailTo}</span>
        ) : null;
      case 'TASK':
        return (
          <span className={`activity-meta-item task-status ${activity.taskCompleted ? 'completed' : 'pending'}`}>
            {activity.taskCompleted ? '✓ Completed' : '○ Pending'}
            {activity.taskDueDate && ` · Due ${new Date(activity.taskDueDate).toLocaleDateString()}`}
          </span>
        );
      case 'MEETING':
        return activity.meetingDate ? (
          <span className="activity-meta-item">
            <LucideCalendar size={12} /> {new Date(activity.meetingDate).toLocaleString()}
          </span>
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="activity-timeline">
      <div className="timeline-header">
        <h4>Activity Feed</h4>
        {canCreateActivity && (
          <button className="add-activity-btn" onClick={() => setIsFormOpen(true)}>
            + Log Activity
          </button>
        )}
      </div>

      {isFormOpen && (
        <ActivityForm
          entityType={entityType}
          entityId={entityId}
          onCreated={handleActivityCreated}
          onCancel={() => setIsFormOpen(false)}
        />
      )}

      {loading && activities.length === 0 ? (
        <div className="timeline-empty">Loading activities...</div>
      ) : activities.length === 0 ? (
        <div className="timeline-empty">
          <LucideStickyNote size={24} />
          <p>No activities yet</p>
          <span>Log a note, call, or email to start the timeline.</span>
        </div>
      ) : (
        <div className="timeline-list">
          {activities.map((activity, index) => {
            const Icon = ACTIVITY_ICONS[activity.activityType] || LucideStickyNote;
            const color = ACTIVITY_COLORS[activity.activityType] || 'var(--primary-color)';
            const isExpanded = expandedId === activity.id;

            return (
              <div
                key={activity.id}
                className={`timeline-item ${isExpanded ? 'expanded' : ''}`}
                onClick={() => setExpandedId(isExpanded ? null : activity.id)}
              >
                {/* Connector line */}
                {index < activities.length - 1 && <div className="timeline-connector" />}

                {/* Icon badge */}
                <div className="timeline-icon-badge" style={{ backgroundColor: color }}>
                  <Icon size={14} color="#fff" />
                </div>

                {/* Content */}
                <div className="timeline-content">
                  <div className="timeline-content-header">
                    <div className="timeline-title-row">
                      <span className="activity-type-tag" style={{ color }}>{activity.activityType}</span>
                      <span className="activity-subject">{activity.subject || 'Untitled'}</span>
                    </div>
                    <div className="timeline-meta-row">
                      <span className="activity-time">{formatDate(activity.createdAt)}</span>
                      {renderMeta(activity)}
                    </div>
                  </div>

                  {isExpanded && activity.body && (
                    <div className="timeline-body-expanded">
                      <p>{activity.body}</p>
                      {canDeleteActivity && (
                        <button
                          className="delete-activity-btn"
                          onClick={(e) => { e.stopPropagation(); handleDelete(activity.id); }}
                        >
                          <LucideTrash2 size={14} /> Delete
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {hasMore && !loading && (
        <button className="load-more-btn" onClick={handleLoadMore}>
          <LucideChevronDown size={16} /> Load More
        </button>
      )}
    </div>
  );
};

export default ActivityTimeline;
