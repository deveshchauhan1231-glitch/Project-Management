export type Project = { id: string; title: string; description: string; status: string; deadline: string | null }
export type Task = { id: string; project_id: string; title: string; status: string; priority: string; assignees: string[] }
export type Activity = { id: string; message: string; actor: string; created_at: string }
export type Toast = { message: string; type: 'success' | 'error' }
export type ProjectForm = { title: string; description: string; status: string; deadline: string; actor: string }
export type TaskForm = { title: string; status: string; priority: string; assignees: string; actor: string }
