import type { Activity } from './types'

export function ActivityList({ activity }: { activity: Activity[] }) {
  return <section className="activity"><h3>Activity</h3>{activity.length === 0 ? <p className="empty">No activity yet.</p> : activity.map((item) => <p key={item.id}><strong>{item.actor}</strong> {item.message}<small>{new Date(item.created_at).toLocaleString()}</small></p>)}</section>
}
