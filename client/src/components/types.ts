export type Project = {
  id: string
  title: string
  description: string
  status: 'Planning' | 'In progress' | 'Complete' | string
  deadline: string | null
  task_count?: number
}

export type Task = {
  id: string
  project_id: string
  title: string
  status: 'To do' | 'In progress' | 'Done' | string
  priority: 'Low' | 'Medium' | 'High' | string
  assignees: string[]
}

export type Activity = {
  id: string
  message: string
  actor: string
  created_at: string
}

export type ToastMessage = {
  id: string
  title?: string
  message: string
  type: 'success' | 'error' | 'info'
}

export type ProjectFormValues = {
  title: string
  description: string
  status: string
  deadline: string
}

export type TaskFormValues = {
  title: string
  status: string
  priority: string
  assignees: string
}

export type ConfirmDialogState = {
  isOpen: boolean
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  isDestructive?: boolean
  onConfirm: () => void | Promise<void>
}

