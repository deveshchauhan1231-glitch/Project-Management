import type { FormEvent } from 'react'
import { FolderPlus, FolderPen, X } from 'lucide-react'
import type { ProjectFormValues } from './types'

type ProjectFormProps = {
  values: ProjectFormValues
  editing: boolean
  onChange: (values: ProjectFormValues) => void
  onSubmit: (event: FormEvent) => void
  onCancel: () => void
}

export function ProjectForm({ values, editing, onChange, onSubmit, onCancel }: ProjectFormProps) {
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
            {editing ? <FolderPen size={20} /> : <FolderPlus size={20} />}
          </div>
          <div>
            <h2 className="form-title">{editing ? 'Edit Project' : 'Create New Project'}</h2>
            <p className="form-subtitle">
              {editing ? 'Update project details and progress' : 'Set up a new workspace for your tasks'}
            </p>
          </div>
        </div>

        <form className="modal-form" onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="proj-title">Project Title <span className="req">*</span></label>
            <input
              id="proj-title"
              required
              placeholder="e.g. Website Redesign v2"
              value={values.title}
              onChange={(e) => onChange({ ...values, title: e.target.value })}
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="proj-desc">Description</label>
            <textarea
              id="proj-desc"
              rows={3}
              placeholder="Outline project objectives, milestones, or scope..."
              value={values.description}
              onChange={(e) => onChange({ ...values, description: e.target.value })}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="proj-status">Status</label>
              <select
                id="proj-status"
                value={values.status}
                onChange={(e) => onChange({ ...values, status: e.target.value })}
              >
                <option value="Planning">Planning</option>
                <option value="In progress">In progress</option>
                <option value="Complete">Complete</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="proj-deadline">Target Deadline</label>
              <input
                id="proj-deadline"
                type="date"
                value={values.deadline}
                onChange={(e) => onChange({ ...values, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="dialog-actions">
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {editing ? 'Save Changes' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

