import type { FormEvent } from 'react'
import { CheckSquare, PlusCircle, X } from 'lucide-react'
import type { TaskFormValues } from './types'

type TaskFormProps = {
  values: TaskFormValues
  editing: boolean
  onChange: (values: TaskFormValues) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
}

export function TaskForm({ values, editing, onChange, onSubmit, onCancel }: TaskFormProps) {
  return (
    <div className="dialog-overlay" onClick={onCancel} role="presentation">
      <div
        className="dialog-card form-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="dialog-close-btn"
          onClick={onCancel}
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        <div className="form-header">
          <div className="form-icon-badge">
            {editing ? <CheckSquare size={20} /> : <PlusCircle size={20} />}
          </div>
          <div>
            <h2 className="form-title">{editing ? 'Edit Task' : 'Add New Task'}</h2>
            <p className="form-subtitle">
              {editing ? 'Update task requirements and assignments' : 'Create an action item for this project'}
            </p>
          </div>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="task-title">Task Title <span className="req">*</span></label>
            <input
              id="task-title"
              required
              placeholder="e.g. Implement Clerk Auth flow"
              value={values.title}
              onChange={(e) => onChange({ ...values, title: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="task-status">Status</label>
              <select
                id="task-status"
                value={values.status}
                onChange={(e) => onChange({ ...values, status: e.target.value })}
              >
                <option value="To do">To do</option>
                <option value="In progress">In progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="task-priority">Priority</label>
              <select
                id="task-priority"
                value={values.priority}
                onChange={(e) => onChange({ ...values, priority: e.target.value })}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="task-assignees">Assigned Users (comma separated)</label>
            <input
              id="task-assignees"
              placeholder="e.g. Sarah, Alex, Dev"
              value={values.assignees}
              onChange={(e) => onChange({ ...values, assignees: e.target.value })}
            />
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

