import type { FormEvent } from 'react'
import type { ProjectForm as ProjectFormValues } from './types'

type ProjectFormProps = { values: ProjectFormValues; editing: boolean; onChange: (values: ProjectFormValues) => void; onSubmit: (event: FormEvent) => void; onCancel: () => void }

export function ProjectForm({ values, editing, onChange, onSubmit, onCancel }: ProjectFormProps) {
  return <div className="overlay"><form className="modal" onSubmit={onSubmit}><h2>{editing ? 'Edit project' : 'New project'}</h2><label>Title<input required value={values.title} onChange={(event) => onChange({ ...values, title: event.target.value })} /></label><label>Description<textarea value={values.description} onChange={(event) => onChange({ ...values, description: event.target.value })} /></label><label>Status<select value={values.status} onChange={(event) => onChange({ ...values, status: event.target.value })}><option>Planning</option><option>In progress</option><option>Complete</option></select></label><label>Deadline<input type="date" value={values.deadline} onChange={(event) => onChange({ ...values, deadline: event.target.value })} /></label><label>Your name<input required value={values.actor} onChange={(event) => onChange({ ...values, actor: event.target.value })} /></label><div className="modal-actions"><button type="button" className="button" onClick={onCancel}>Cancel</button><button className="button primary">Save</button></div></form></div>
}
