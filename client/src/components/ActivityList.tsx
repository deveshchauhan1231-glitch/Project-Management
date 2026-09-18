import { Activity as ActivityIcon, Clock, User } from 'lucide-react'
import type { Activity } from './types'

export function ActivityList({ activity }: { activity: Activity[] }) {
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString)
      return date.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    } catch {
      return isoString
    }
  }

  const getInitials = (name: string) => {
    if (!name) return '?'
    const parts = name.trim().split(' ')
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
    }
    return name.slice(0, 2).toUpperCase()
  }

  return (
    <section className="activity-section">
      <div className="activity-header">
        <div className="flex items-center gap-2">
          <ActivityIcon size={18} className="text-accent" />
          <h3>Audit & Activity Log</h3>
        </div>
        <span className="count-pill">{activity.length}</span>
      </div>

      {activity.length === 0 ? (
        <div className="empty-activity">
          <Clock size={24} className="text-muted" />
          <p>No activity recorded yet.</p>
        </div>
      ) : (
        <div className="activity-timeline">
          {activity.map((item, index) => (
            <div className="timeline-item" key={item.id}>
              <div className="timeline-avatar" title={item.actor}>
                {item.actor ? getInitials(item.actor) : <User size={12} />}
              </div>
              <div className="timeline-content">
                <div className="timeline-msg">
                  <strong className="actor-name">{item.actor || 'System'}</strong>{' '}
                  <span className="activity-action-text">{item.message.replace(/^Project |^Task /, (m) => m)}</span>
                </div>
                <div className="timeline-time">
                  <Clock size={11} />
                  <span>{formatTime(item.created_at)}</span>
                  {index === 0 && <span className="latest-indicator">Latest</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

