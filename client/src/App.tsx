import { useEffect, useState, type FormEvent } from 'react'
import './App.css'

type Project = { id: string; title: string; description: string; status: string; deadline: string | null }
type Task = { id: string; project_id: string; title: string; status: string; priority: string; assignees: string[] }
type Activity = { id: string; message: string; actor: string; created_at: string }

const emptyProject = { title: '', description: '', status: 'Planning', deadline: '' }
const emptyTask = { title: '', status: 'To do', priority: 'Medium', assignees: '' }

function App() {
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [activity, setActivity] = useState<Activity[]>([])
  const [projectForm, setProjectForm] = useState(emptyProject)
  const [taskForm, setTaskForm] = useState(emptyTask)
  const [editingProject, setEditingProject] = useState(false)
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [error, setError] = useState('')

  const loadActivity = () => fetch('/api/activity').then((response) => response.json()).then(setActivity).catch(() => {})
  const loadProjects = () => fetch('/api/projects').then((response) => { if (!response.ok) throw new Error('Could not connect to the server.'); return response.json() }).then((items: Project[]) => { setProjects(items); if (items.length && !selectedProject) selectProject(items[0]) }).catch((reason: Error) => setError(reason.message))
  const selectProject = (project: Project) => { setSelectedProject(project); fetch(`/api/projects/${project.id}/tasks`).then((response) => response.json()).then(setTasks).catch(() => setTasks([])) }

  useEffect(() => { loadProjects(); loadActivity() }, [])

  const askForName = () => window.prompt('What is your name?')?.trim() || null

  const saveProject = async (event: FormEvent) => {
    event.preventDefault(); setError(''); const actor = askForName(); if (!actor) return
    const response = await fetch(editingProject && selectedProject ? `/api/projects/${selectedProject.id}` : '/api/projects', { method: editingProject ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...projectForm, actor }) })
    if (!response.ok) { setError('Could not save the project.'); return }
    const saved = await response.json(); setProjects(editingProject ? projects.map((item) => item.id === saved.id ? saved : item) : [saved, ...projects]); setSelectedProject(saved); setProjectForm(emptyProject); setShowProjectForm(false); setEditingProject(false); loadActivity()
  }

  const removeProject = async (project: Project) => { if (!window.confirm(`Delete ${project.title}?`)) return; const actor = askForName(); if (!actor) return; await fetch(`/api/projects/${project.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor }) }); const remaining = projects.filter((item) => item.id !== project.id); setProjects(remaining); setSelectedProject(remaining[0] ?? null); setTasks([]); loadActivity() }
  const saveTask = async (event: FormEvent) => {
    event.preventDefault(); if (!selectedProject) return; const actor = askForName(); if (!actor) return
    const payload = { title: taskForm.title, status: taskForm.status, priority: taskForm.priority, assignees: taskForm.assignees.split(',').map((name) => name.trim()).filter(Boolean), actor }
    const response = await fetch(editingTask ? `/api/tasks/${editingTask.id}` : `/api/projects/${selectedProject.id}/tasks`, { method: editingTask ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    if (!response.ok) { setError('Could not save the task.'); return }
    const saved = await response.json(); setTasks(editingTask ? tasks.map((item) => item.id === saved.id ? saved : item) : [saved, ...tasks]); setTaskForm(emptyTask); setShowTaskForm(false); setEditingTask(null); loadActivity()
  }
  const removeTask = async (task: Task) => { if (!window.confirm(`Delete ${task.title}?`)) return; const actor = askForName(); if (!actor) return; await fetch(`/api/tasks/${task.id}`, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ actor }) }); setTasks(tasks.filter((item) => item.id !== task.id)); loadActivity() }
  const beginEditProject = () => { if (!selectedProject) return; setProjectForm({ title: selectedProject.title, description: selectedProject.description, status: selectedProject.status, deadline: selectedProject.deadline ?? '' }); setEditingProject(true); setShowProjectForm(true) }
  const beginEditTask = (task: Task) => { setEditingTask(task); setTaskForm({ title: task.title, status: task.status, priority: task.priority, assignees: task.assignees.join(', ') }); setShowTaskForm(true) }

  return <div className="app"><header className="topbar"><h1>Project Manager</h1><button className="button primary" onClick={() => { setProjectForm(emptyProject); setEditingProject(false); setShowProjectForm(true) }}>+ New project</button></header><main className="layout"><aside className="projects-panel"><h2>Projects</h2>{error && <p className="error">{error}</p>}{projects.length === 0 && !error && <p className="empty">No projects yet.</p>}<div className="project-list">{projects.map((project) => <button className={`project-item ${selectedProject?.id === project.id ? 'selected' : ''}`} key={project.id} onClick={() => selectProject(project)}><strong>{project.title}</strong><span>{project.status}</span></button>)}</div></aside><section className="details">{selectedProject ? <><div className="details-header"><div><h2>{selectedProject.title}</h2><p>{selectedProject.description || 'No description.'}</p><span className="deadline">Deadline: {selectedProject.deadline || 'Not set'}</span></div><div className="actions"><button className="button" onClick={beginEditProject}>Edit</button><button className="button danger" onClick={() => removeProject(selectedProject)}>Delete</button></div></div><div className="tasks-heading"><h3>Tasks</h3><button className="button primary" onClick={() => { setTaskForm(emptyTask); setEditingTask(null); setShowTaskForm(true) }}>+ Add task</button></div>{tasks.length === 0 ? <p className="empty">No tasks in this project yet.</p> : <div className="task-list">{tasks.map((task) => <article className="task" key={task.id}><div><strong>{task.title}</strong><span>{task.status} · {task.priority}</span><small>{task.assignees.length ? `Assigned to: ${task.assignees.join(', ')}` : 'Unassigned'}</small></div><div className="actions"><button className="link-button" onClick={() => beginEditTask(task)}>Edit</button><button className="link-button danger-text" onClick={() => removeTask(task)}>Delete</button></div></article>)}</div>} </> : <div className="empty-state"><h2>No project selected</h2><p>Create a project to start managing tasks.</p></div>}<section className="activity"><h3>Activity</h3>{activity.length === 0 ? <p className="empty">No activity yet.</p> : activity.map((item) => <p key={item.id}><strong>{item.actor}</strong> {item.message}<small>{new Date(item.created_at).toLocaleString()}</small></p>)}</section></section></main>{showProjectForm && <div className="overlay"><form className="modal" onSubmit={saveProject}><h2>{editingProject ? 'Edit project' : 'New project'}</h2><label>Title<input required value={projectForm.title} onChange={(event) => setProjectForm({ ...projectForm, title: event.target.value })} /></label><label>Description<textarea value={projectForm.description} onChange={(event) => setProjectForm({ ...projectForm, description: event.target.value })} /></label><label>Status<select value={projectForm.status} onChange={(event) => setProjectForm({ ...projectForm, status: event.target.value })}><option>Planning</option><option>In progress</option><option>Complete</option></select></label><label>Deadline<input type="date" value={projectForm.deadline} onChange={(event) => setProjectForm({ ...projectForm, deadline: event.target.value })} /></label><div className="modal-actions"><button type="button" className="button" onClick={() => setShowProjectForm(false)}>Cancel</button><button className="button primary">Save</button></div></form></div>}{showTaskForm && <div className="overlay"><form className="modal" onSubmit={saveTask}><h2>{editingTask ? 'Edit task' : 'New task'}</h2><label>Title<input required value={taskForm.title} onChange={(event) => setTaskForm({ ...taskForm, title: event.target.value })} /></label><label>Status<select value={taskForm.status} onChange={(event) => setTaskForm({ ...taskForm, status: event.target.value })}><option>To do</option><option>In progress</option><option>Done</option></select></label><label>Priority<select value={taskForm.priority} onChange={(event) => setTaskForm({ ...taskForm, priority: event.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label><label>Assigned users<input placeholder="Names separated by commas" value={taskForm.assignees} onChange={(event) => setTaskForm({ ...taskForm, assignees: event.target.value })} /></label><div className="modal-actions"><button type="button" className="button" onClick={() => setShowTaskForm(false)}>Cancel</button><button className="button primary">Save</button></div></form></div>}</div>
}

export default App
