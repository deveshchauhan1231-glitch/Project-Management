import { useEffect, useState, type FormEvent } from 'react'
import { useUser, useClerk } from '@clerk/clerk-react'
import './App.css'
import { ActivityList } from './components/ActivityList'
import { NavBar } from './components/Navbar.tsx'
import { ConfirmDialog } from './components/ConfirmDialog'
import { ProjectDetails } from './components/ProjectDetails'
import { ProjectForm } from './components/ProjectForm'
import { ProjectList } from './components/ProjectList'
import { TaskForm } from './components/TaskForm'
import { ToastContainer } from './components/Toast'
import {
  Layers,
  Plus,
  BarChart3,
  ListTodo,
  History,
  CheckCircle2,
  Clock,
  AlertCircle,
  LogIn
} from 'lucide-react'
import type {
  Activity,
  ConfirmDialogState,
  Project,
  ProjectFormValues,
  Task,
  TaskFormValues,
  ToastMessage,
} from './components/types'

const emptyProject: ProjectFormValues = {
  title: '',
  description: '',
  status: 'Planning',
  deadline: '',
}

const emptyTask: TaskFormValues = {
  title: '',
  status: 'To do',
  priority: 'Medium',
  assignees: '',
}

const apiUrl = import.meta.env.VITE_API_URL ?? ''
const api = (path: string) => `${apiUrl}${path}`

export default function App() {
  const { user, isSignedIn } = useUser()
  const clerk = useClerk()

  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [activeTab, setActiveTab] = useState<'tasks' | 'activity' | 'overview'>('tasks')

  // Guest mode toggle (for fallback / preview)
  const [isGuest, setIsGuest] = useState(false)

  // Forms & Modals state
  const [projectForm, setProjectForm] = useState<ProjectFormValues>(emptyProject)
  const [taskForm, setTaskForm] = useState<TaskFormValues>(emptyTask)
  const [editingProject, setEditingProject] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)

  // Dialog & Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([])
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null)

  const isUserAuthenticated = Boolean(isSignedIn) || isGuest

  const currentActor = isSignedIn
    ? user?.fullName || user?.firstName || user?.primaryEmailAddress?.emailAddress || 'Authenticated User'
    : isGuest
      ? 'Guest Member'
      : 'Workspace User'

  const notify = (message: string, type: ToastMessage['type'] = 'info', title?: string) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: ToastMessage = { id, message, type, title }
    setToasts((prev) => [...prev, newToast])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  // Auth Guard helper: opens Clerk sign-in directly if not authenticated
  const requireAuth = (actionDescription: string): boolean => {
    if (isUserAuthenticated) return true

    notify(`Authentication required: Please sign in with Clerk to ${actionDescription}.`, 'error', 'Sign In')
    clerk.openSignIn()
    return false
  }

  const loadActivity = () => {
    fetch(api('/api/activity'))
      .then((res) => res.json())
      .then(setActivity)
      .catch(() => notify('Could not sync latest activity.', 'error'))
  }

  const selectProject = (project: Project) => {
    setSelectedProject(project)
    fetch(api(`/api/projects/${project.id}/tasks`))
      .then((res) => res.json())
      .then(setTasks)
      .catch(() => notify('Could not load tasks for project.', 'error'))
  }

  const loadProjects = () => {
    fetch(api('/api/projects'))
      .then((res) => {
        if (!res.ok) throw new Error('Could not connect to the server.')
        return res.json()
      })
      .then((items: Project[]) => {
        setProjects(items)
        if (items.length && (!selectedProject || !items.some((p) => p.id === selectedProject.id))) {
          selectProject(items[0])
        }
      })
      .catch((err: Error) => notify(err.message, 'error'))
  }

  useEffect(() => {
    loadProjects()
    loadActivity()
  }, [])

  const handlePromptNewProject = () => {
    if (!requireAuth('create a project')) return
    setProjectForm(emptyProject)
    setEditingProject(false)
    setShowProjectForm(true)
  }

  // Save or Update Project
  const saveProject = async (event: FormEvent) => {
    event.preventDefault()
    if (!requireAuth('save this project')) return

    const url = editingProject && selectedProject ? `/api/projects/${selectedProject.id}` : '/api/projects'
    const method = editingProject ? 'PATCH' : 'POST'

    try {
      const response = await fetch(api(url), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-actor-name': currentActor,
        },
        body: JSON.stringify({ ...projectForm, actor: currentActor }),
      })

      if (!response.ok) throw new Error('Could not save the project.')
      const saved: Project = await response.json()

      setProjects(editingProject ? projects.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...projects])
      setSelectedProject(saved)
      setProjectForm(emptyProject)
      setShowProjectForm(false)
      setEditingProject(false)
      loadActivity()
      notify(editingProject ? 'Project updated successfully' : 'New project created successfully', 'success')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save project'
      notify(msg, 'error')
    }
  }

  // Delete Project with Confirmation Dialog & Auth Guard
  const handleDeleteProjectPrompt = () => {
    if (!selectedProject) return
    if (!requireAuth('delete this project')) return

    setConfirmDialog({
      isOpen: true,
      title: `Delete "${selectedProject.title}"?`,
      description:
        'Are you sure you want to delete this project? All associated tasks and metrics will be permanently deleted.',
      confirmText: 'Delete Project',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch(api(`/api/projects/${selectedProject.id}`), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-actor-name': currentActor,
            },
            body: JSON.stringify({ actor: currentActor }),
          })
          if (!response.ok) throw new Error('Could not delete project.')

          const remaining = projects.filter((p) => p.id !== selectedProject.id)
          setProjects(remaining)
          if (remaining.length > 0) {
            selectProject(remaining[0])
          } else {
            setSelectedProject(null)
            setTasks([])
          }
          loadActivity()
          notify('Project permanently deleted', 'success')
        } catch {
          notify('Failed to delete project', 'error')
        }
      },
    })
  }

  // Prompt New Task with Auth Guard
  const handlePromptAddTask = () => {
    if (!requireAuth('add a new task')) return
    setTaskForm(emptyTask)
    setEditingTask(null)
    setShowTaskForm(true)
  }

  // Save or Update Task
  const saveTask = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProject) return
    if (!requireAuth('save task')) return

    const assigneesArray = taskForm.assignees
      .split(',')
      .map((name) => name.trim())
      .filter(Boolean)

    const payload = {
      ...taskForm,
      assignees: assigneesArray,
      actor: currentActor,
    }

    const url = editingTask ? `/api/tasks/${editingTask.id}` : `/api/projects/${selectedProject.id}/tasks`
    const method = editingTask ? 'PATCH' : 'POST'

    try {
      const response = await fetch(api(url), {
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-actor-name': currentActor,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Could not save the task.')
      const saved: Task = await response.json()

      setTasks(editingTask ? tasks.map((t) => (t.id === saved.id ? saved : t)) : [saved, ...tasks])
      setTaskForm(emptyTask)
      setShowTaskForm(false)
      setEditingTask(null)
      loadActivity()
      notify(editingTask ? 'Task updated successfully' : 'Task added successfully', 'success')
    } catch {
      notify('Failed to save task', 'error')
    }
  }

  // Delete Task with Confirmation Dialog & Auth Guard
  const handleDeleteTaskPrompt = (task: Task) => {
    if (!requireAuth('delete this task')) return

    setConfirmDialog({
      isOpen: true,
      title: `Delete Task "${task.title}"?`,
      description: 'Are you sure you want to delete this task? This action cannot be undone.',
      confirmText: 'Delete Task',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const response = await fetch(api(`/api/tasks/${task.id}`), {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'x-actor-name': currentActor,
            },
            body: JSON.stringify({ actor: currentActor }),
          })
          if (!response.ok) throw new Error('Could not delete task.')

          setTasks(tasks.filter((t) => t.id !== task.id))
          loadActivity()
          notify('Task deleted', 'success')
        } catch {
          notify('Failed to delete task', 'error')
        }
      },
    })
  }

  // Toggle or Cycle Task Status directly from UI with Auth Guard
  const handleToggleTaskStatus = async (task: Task) => {
    if (!requireAuth('change task status')) return

    const statusCycle: Record<string, string> = {
      'To do': 'In progress',
      'In progress': 'Done',
      'Done': 'To do',
    }
    const nextStatus = statusCycle[task.status] || 'To do'

    try {
      // Optimistic update
      setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))

      const response = await fetch(api(`/api/tasks/${task.id}`), {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-actor-name': currentActor,
        },
        body: JSON.stringify({
          status: nextStatus,
          actor: currentActor,
        }),
      })

      if (!response.ok) throw new Error()
      const updated = await response.json()
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)))
      loadActivity()
      notify(`Status updated to "${nextStatus}"`, 'success')
    } catch {
      // Rollback
      setTasks((prev) => prev.map((t) => (t.id === task.id ? task : t)))
      notify('Could not update status', 'error')
    }
  }

  const beginEditProject = () => {
    if (!selectedProject) return
    if (!requireAuth('edit this project')) return

    setProjectForm({
      title: selectedProject.title,
      description: selectedProject.description,
      status: selectedProject.status,
      deadline: selectedProject.deadline ?? '',
    })
    setEditingProject(true)
    setShowProjectForm(true)
  }

  const beginEditTask = (task: Task) => {
    if (!requireAuth('edit this task')) return

    setEditingTask(task)
    setTaskForm({
      title: task.title,
      status: task.status,
      priority: task.priority,
      assignees: task.assignees.join(', '),
    })
    setShowTaskForm(true)
  }

  // Calculate high-level stats
  const totalTasksCount = tasks.length
  const completedTasksCount = tasks.filter((t) => t.status === 'Done').length
  const pendingTasksCount = totalTasksCount - completedTasksCount

  return (
    <div className="app-container">
      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      {/* Confirmation Dialog */}
      <ConfirmDialog dialog={confirmDialog} onClose={() => setConfirmDialog(null)} />

      {/* Modern Top Navigation Bar */}
      <header className="app-topbar">
        <div className="topbar-brand">
          <div className="brand-logo-wrap">
            <Layers size={22} className="brand-icon" />
          </div>
          <div className="brand-text-wrap">
            <span className="brand-name">ProjectFlow</span>
            <span className="brand-badge">Workspace</span>
          </div>
        </div>

        <div className="topbar-actions">
          

          <button
            type="button"
            className="btn btn-primary"
            onClick={handlePromptNewProject}
          >
            <Plus size={16} />
            <span>New Project</span>
          </button>

          {/* Clerk Auth Controls */}
          <NavBar
            isGuest={isGuest}
            guestName="Guest Member"
            onToggleGuest={() => {
              setIsGuest(!isGuest)
              notify(isGuest ? 'Guest mode disabled' : 'Guest mode enabled', 'info')
            }}
          />
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="app-layout">
        {/* Left Sidebar */}
        <ProjectList
          projects={projects}
          selectedProject={selectedProject}
          onSelect={selectProject}
          onNewProject={handlePromptNewProject}
        />

        {/* Right Main Content Area */}
        <section className="main-content-area">
          {selectedProject && (
            <div className="content-nav-tabs">
              <button
                type="button"
                className={`tab-btn ${activeTab === 'tasks' ? 'active' : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                <ListTodo size={16} />
                <span>Tasks ({tasks.length})</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
                onClick={() => setActiveTab('overview')}
              >
                <BarChart3 size={16} />
                <span>Overview & Metrics</span>
              </button>
              <button
                type="button"
                className={`tab-btn ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                <History size={16} />
                <span>Activity ({activity.length})</span>
              </button>
            </div>
          )}

          {activeTab === 'tasks' && (
            <ProjectDetails
              project={selectedProject}
              tasks={tasks}
              onEditProject={beginEditProject}
              onDeleteProject={handleDeleteProjectPrompt}
              onAddTask={handlePromptAddTask}
              onEditTask={beginEditTask}
              onDeleteTask={handleDeleteTaskPrompt}
              onToggleTaskStatus={handleToggleTaskStatus}
            />
          )}

          {activeTab === 'overview' && selectedProject && (
            <div className="overview-container">
              <div className="overview-stats-grid">
                <div className="stat-card">
                  <div className="stat-icon-wrap stat-total">
                    <ListTodo size={22} />
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">{totalTasksCount}</span>
                    <span className="stat-lbl">Total Tasks</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrap stat-done">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">{completedTasksCount}</span>
                    <span className="stat-lbl">Completed</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrap stat-pending">
                    <Clock size={22} />
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">{pendingTasksCount}</span>
                    <span className="stat-lbl">Remaining</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-icon-wrap stat-priority">
                    <AlertCircle size={22} />
                  </div>
                  <div className="stat-data">
                    <span className="stat-val">{tasks.filter((t) => t.priority === 'High').length}</span>
                    <span className="stat-lbl">High Priority</span>
                  </div>
                </div>
              </div>

              <div className="overview-card project-summary-card">
                <h3>Project Summary</h3>
                <div className="summary-row">
                  <span className="summary-label">Project Status:</span>
                  <span className="summary-value">{selectedProject.status}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Target Deadline:</span>
                  <span className="summary-value">{selectedProject.deadline || 'No deadline set'}</span>
                </div>
                <div className="summary-row">
                  <span className="summary-label">Description:</span>
                  <p className="summary-text">{selectedProject.description || 'No description provided.'}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && <ActivityList activity={activity} />}
        </section>
      </main>

      {/* Project Creation/Editing Modal */}
      {showProjectForm && (
        <ProjectForm
          values={projectForm}
          editing={editingProject}
          onChange={setProjectForm}
          onSubmit={saveProject}
          onCancel={() => setShowProjectForm(false)}
        />
      )}

      {/* Task Creation/Editing Modal */}
      {showTaskForm && (
        <TaskForm
          values={taskForm}
          editing={Boolean(editingTask)}
          onChange={setTaskForm}
          onSubmit={saveTask}
          onCancel={() => setShowTaskForm(false)}
        />
      )}
    </div>
  )
}
