import type { Activity, Project, ProjectFormValues, Task, TaskFormValues } from '../components/types'

const apiUrl = import.meta.env.VITE_API_URL ?? ''
const api = (path: string) => `${apiUrl}${path}`

export const fetchProjectsApi = async (): Promise<Project[]> => {
  const res = await fetch(api('/api/projects'))
  if (!res.ok) throw new Error('Could not connect to the server.')
  return res.json()
}

export const fetchTasksApi = async (projectId: string): Promise<Task[]> => {
  const res = await fetch(api(`/api/projects/${projectId}/tasks`))
  if (!res.ok) throw new Error('Could not load tasks.')
  return res.json()
}

export const fetchActivityApi = async (): Promise<Activity[]> => {
  const res = await fetch(api('/api/activity'))
  if (!res.ok) throw new Error('Could not load activity.')
  return res.json()
}

export const saveProjectApi = async (
  values: ProjectFormValues,
  actor: string,
  editingId?: string
): Promise<Project> => {
  const url = editingId ? `/api/projects/${editingId}` : '/api/projects'
  const method = editingId ? 'PATCH' : 'POST'
  const res = await fetch(api(url), {
    method,
    headers: { 'Content-Type': 'application/json', 'x-actor-name': actor },
    body: JSON.stringify({ ...values, actor }),
  })
  if (!res.ok) throw new Error('Could not save project.')
  return res.json()
}

export const deleteProjectApi = async (projectId: string, actor: string): Promise<void> => {
  const res = await fetch(api(`/api/projects/${projectId}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-actor-name': actor },
    body: JSON.stringify({ actor }),
  })
  if (!res.ok) throw new Error('Could not delete project.')
}

export const saveTaskApi = async (
  values: TaskFormValues,
  projectId: string,
  actor: string,
  editingId?: string
): Promise<Task> => {
  const assignees = values.assignees.split(',').map((s) => s.trim()).filter(Boolean)
  const url = editingId ? `/api/tasks/${editingId}` : `/api/projects/${projectId}/tasks`
  const method = editingId ? 'PATCH' : 'POST'
  const res = await fetch(api(url), {
    method,
    headers: { 'Content-Type': 'application/json', 'x-actor-name': actor },
    body: JSON.stringify({ ...values, assignees, actor }),
  })
  if (!res.ok) throw new Error('Could not save task.')
  return res.json()
}

export const deleteTaskApi = async (taskId: string, actor: string): Promise<void> => {
  const res = await fetch(api(`/api/tasks/${taskId}`), {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', 'x-actor-name': actor },
    body: JSON.stringify({ actor }),
  })
  if (!res.ok) throw new Error('Could not delete task.')
}

export const toggleTaskStatusApi = async (
  taskId: string,
  nextStatus: string,
  actor: string
): Promise<Task> => {
  const res = await fetch(api(`/api/tasks/${taskId}`), {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', 'x-actor-name': actor },
    body: JSON.stringify({ status: nextStatus, actor }),
  })
  if (!res.ok) throw new Error('Could not update status.')
  return res.json()
}
