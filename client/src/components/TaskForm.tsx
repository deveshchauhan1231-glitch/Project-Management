import type { FormEvent } from 'react'
import type { TaskForm as TaskFormValues } from './types'

type TaskFormProps = { values: TaskFormValues; editing: boolean; onChange: (values: TaskFormValues) => void; onSubmit: (event: FormEvent) => void; onCancel: () => void }

export function TaskForm({ values, editing, onChange, onSubmit, onCancel }: TaskFormProps) {
  return <div className="overlay"><form className="modal" onSubmit={onSubmit}><h2>{editing ? 'Edit task' : 'New task'}</h2><label>Title<input required value={values.title} onChange={(event) => onChange({ ...values, title: event.target.value })} /></label><label>Status<select value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value })}><option>To do</option><option>In progress</option><option>Done</option></select></label><label>Priority<select value={values.priority} onChange={(event) => onChange({ ...values, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Assigned users<input placeholder="Names separated by commas" value={values.assignees} onChange={(event) => onChange({ ...values, assignees: event.target.value })} /></label><label>Your name<input required value={values.actor} onChange={(event) => onChange({ ...values, actor: event.target.value })} /></label><div className="modal-actions"><button type="button" className="button" onClick={onCancel}>Cancel</button><button className="button primary">Save</button></div></form></div>
}
