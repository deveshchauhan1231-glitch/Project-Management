import { useEffect, useState, type FormEvent } from 'react'
import './App.css'
import { ActivityList } from './components/ActivityList'
import { ProjectDetails } from './components/ProjectDetails'
import { ProjectForm } from './components/ProjectForm'
import { ProjectList } from './components/ProjectList'
import { TaskForm } from './components/TaskForm'
import { Toast } from './components/Toast'
import type { Activity, Project, ProjectForm as ProjectFormValues, Task, TaskForm as TaskFormValues, Toast as ToastMessage } from './components/types'

const emptyProject: ProjectFormValues = { title: '', description: '', status: 'Planning', deadline: '', actor: '' }
const emptyTask: TaskFormValues = { title: '', status: 'To do', priority: 'Medium', assignees: '', actor: '' }
const apiUrl = import.meta.env.VITE_API_URL ?? ''
const api = (path: string) => `${apiUrl}${path}`

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [projectForm, setProjectForm] = useState<ProjectFormValues>(emptyProject)
  const [taskForm, setTaskForm] = useState<TaskFormValues>(emptyTask)
  const [editingProject, setEditingProject] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [toast, setToast] = useState<ToastMessage | null>(null)

  const notify = (message: string, type: ToastMessage['type']) => {
    setToast({ message, type })
    window.setTimeout(() => setToast(null), 3500)
  }

  const loadActivity = () => fetch(api('/api/activity')).then((response) => response.json()).then(setActivity).catch(() => notify('Could not load activity.', 'error'))
  const selectProject = (project: Project) => {
    setSelectedProject(project)
    fetch(api(`/api/projects/${project.id}/tasks`)).then((response) => response.json()).then(setTasks).catch(() => notify('Could not load tasks.', 'error'))
  }
  const loadProjects = () => fetch(api('/api/projects')).then((response) => {
    if (!response.ok) throw new Error('Could not connect to the server.')
    return response.json()
  }).then((items: Project[]) => {
    setProjects(items)
    if (items.length) selectProject(items[0])
  }).catch((reason: Error) => notify(reason.message, 'error'))

  useEffect(() => { loadProjects(); loadActivity() }, [])

  const saveProject = async (event: FormEvent) => {
    event.preventDefault()
    const url = editingProject && selectedProject ? `/api/projects/${selectedProject.id}` : '/api/projects'
    const response = await fetch(api(url), { method: editingProject ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(projectForm) })
    if (!response.ok) { notify('Could not save the project.', 'error'); return }
    const saved = await response.json()
    setProjects(editingProject ? projects.map((item) => item.id === saved.id ? saved : item) : [saved, ...projects])
    setSelectedProject(saved); setProjectForm(emptyProject); setShowProjectForm(false); setEditingProject(false); loadActivity()
    notify(editingProject ? 'Project updated successfully.' : 'Project saved successfully.', 'success')
  }

  const removeProject = async (project: Project) => {
    if (!window.confirm(`Delete ${project.title}?`)) return
    const response = await fetch(api(`/api/projects/${project.id}`), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: projectForm.actor }) })
    if (!response.ok) { notify('Could not delete the project.', 'error'); return }
    const remaining = projects.filter((item) => item.id !== project.id)
    setProjects(remaining); setSelectedProject(remaining[0] ?? null); setTasks([]); loadActivity(); notify('Project deleted successfully.', 'success')
  }

  const saveTask = async (event: FormEvent) => {
    event.preventDefault()
    if (!selectedProject) return
    const payload = { ...taskForm, assignees: taskForm.assignees.split(',').map((name) => name.trim()).filter(Boolean) }
    const url = editingTask ? `/api/tasks/${editingTask.id}` : `/api/projects/${selectedProject.id}/tasks`
    const response = await fetch(api(url), { method: editingTask ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!response.ok) { notify('Could not save the task.', 'error'); return }
    const saved = await response.json()
    setTasks(editingTask ? tasks.map((item) => item.id === saved.id ? saved : item) : [saved, ...tasks])
    setTaskForm(emptyTask); setShowTaskForm(false); setEditingTask(null); loadActivity(); notify(editingTask ? 'Task updated successfully.' : 'Task saved successfully.', 'success')
  }

  const removeTask = async (task: Task) => {
    if (!window.confirm(`Delete ${task.title}?`)) return
    const response = await fetch(api(`/api/tasks/${task.id}`), { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor: taskForm.actor }) })
    if (!response.ok) { notify('Could not delete the task.', 'error'); return }
    setTasks(tasks.filter((item) => item.id !== task.id)); loadActivity(); notify('Task deleted successfully.', 'success')
  }

  const beginEditProject = () => {
    if (!selectedProject) return
    setProjectForm({ title: selectedProject.title, description: selectedProject.description, status: selectedProject.status, deadline: selectedProject.deadline ?? '', actor: '' })
    setEditingProject(true); setShowProjectForm(true)
  }
  const beginEditTask = (task: Task) => {
    setEditingTask(task); setTaskForm({ title: task.title, status: task.status, priority: task.priority, assignees: task.assignees.join(', '), actor: '' }); setShowTaskForm(true)
  }

  return <div className="app">
    <Toast toast={toast} />
    <header className="topbar"><h1>Project Manager</h1><button className="button primary" onClick={() => { setProjectForm(emptyProject); setEditingProject(false); setShowProjectForm(true) }}>+ New project</button></header>
    <main className="layout">
      <ProjectList projects={projects} selectedProject={selectedProject} onSelect={selectProject} />
      <section className="details"><ProjectDetails project={selectedProject} tasks={tasks} onEditProject={beginEditProject} onDeleteProject={() => selectedProject && removeProject(selectedProject)} onAddTask={() => { setTaskForm(emptyTask); setEditingTask(null); setShowTaskForm(true) }} onEditTask={beginEditTask} onDeleteTask={removeTask} /><ActivityList activity={activity} /></section>
    </main>
    {showProjectForm && <ProjectForm values={projectForm} editing={editingProject} onChange={setProjectForm} onSubmit={saveProject} onCancel={() => setShowProjectForm(false)} />}
    {showTaskForm && <TaskForm values={taskForm} editing={Boolean(editingTask)} onChange={setTaskForm} onSubmit={saveTask} onCancel={() => setShowTaskForm(false)} />}
  </div>
}

export default App
