import 'dotenv/config'
import cors from 'cors'
import express from 'express'
import { PrismaClient, Priority, ProjectStatus, TaskStatus } from '@prisma/client'

const app = express()
const port = Number(process.env.PORT ?? 4000)
const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

const projectStatus = (value: string): ProjectStatus => value === 'In progress' || value === 'InProgress' ? ProjectStatus.InProgress : value as ProjectStatus
const taskStatus = (value: string): TaskStatus => value === 'In progress' || value === 'InProgress' ? TaskStatus.InProgress : value === 'To do' || value === 'ToDo' ? TaskStatus.ToDo : value as TaskStatus
const displayProjectStatus = (value: ProjectStatus) => value === ProjectStatus.InProgress ? 'In progress' : value
const displayTaskStatus = (value: TaskStatus) => value === TaskStatus.InProgress ? 'In progress' : value === TaskStatus.ToDo ? 'To do' : value
const actorName = (value: unknown) => typeof value === 'string' && value.trim() ? value.trim() : 'Unknown user'

const projectResponse = (project: { id: string; title: string; description: string; status: ProjectStatus; deadline: Date | null }) => ({
  id: project.id,
  title: project.title,
  description: project.description,
  status: displayProjectStatus(project.status),
  deadline: project.deadline?.toISOString().slice(0, 10) ?? null,
})

const taskResponse = (task: { id: string; projectId: string; title: string; status: TaskStatus; priority: Priority; assignees: string[] }) => ({
  id: task.id,
  project_id: task.projectId,
  title: task.title,
  status: displayTaskStatus(task.status),
  priority: task.priority,
  assignees: task.assignees,
})

const logActivity = async (projectId: string | null, message: string, actor = 'Unknown user') => {
  await prisma.activity.create({ data: { projectId, message, actor } })
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.get('/api/projects', async (_req, res) => {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: 'desc' },
    include: { _count: { select: { tasks: true } } },
  })
  res.json(projects.map((project) => ({ ...projectResponse(project), task_count: project._count.tasks })))
})

app.post('/api/projects', async (req, res) => {
  const { title, description = '', status = 'Planning', deadline = null, actor = 'Unknown user' } = req.body
  const project = await prisma.project.create({ data: { title, description, status: projectStatus(status), deadline: deadline ? new Date(deadline) : null } })
  await logActivity(project.id, `Project ${title} was created`, actorName(actor))
  res.status(201).json(projectResponse(project))
})

app.patch('/api/projects/:id', async (req, res) => {
  const { title, description, status, deadline, actor = 'Unknown user' } = req.body
  try {
    const project = await prisma.project.update({ where: { id: req.params.id }, data: { title, description, status: projectStatus(status), deadline: deadline ? new Date(deadline) : null } })
    await logActivity(project.id, `Project ${project.title} was edited`, actorName(actor))
    res.json(projectResponse(project))
  } catch { res.status(404).json({ error: 'Project not found' }) }
})

app.delete('/api/projects/:id', async (req, res) => {
  const { actor = 'Unknown user' } = req.body
  try {
    const project = await prisma.project.findUniqueOrThrow({ where: { id: req.params.id } })
    await prisma.project.delete({ where: { id: req.params.id } })
    await logActivity(null, `Project ${project.title} was deleted`, actorName(actor))
    res.status(204).send()
  } catch { res.status(404).json({ error: 'Project not found' }) }
})

app.get('/api/projects/:id/tasks', async (req, res) => {
  const tasks = await prisma.task.findMany({ where: { projectId: req.params.id }, orderBy: { createdAt: 'desc' } })
  res.json(tasks.map(taskResponse))
})

app.post('/api/projects/:id/tasks', async (req, res) => {
  const { title, status = 'To do', priority = 'Medium', assignees = [], actor = 'Unknown user' } = req.body
  const task = await prisma.task.create({ data: { projectId: req.params.id, title, status: taskStatus(status), priority: priority as Priority, assignees } })
  await logActivity(req.params.id, `Task ${title} was added`, actorName(actor))
  res.status(201).json(taskResponse(task))
})

app.patch('/api/tasks/:id', async (req, res) => {
  const { title, status, priority, assignees, actor = 'Unknown user' } = req.body
  try {
    const task = await prisma.task.update({ where: { id: req.params.id }, data: { title, status: taskStatus(status), priority: priority as Priority, assignees } })
    await logActivity(task.projectId, `Task ${task.title} was edited`, actorName(actor))
    res.json(taskResponse(task))
  } catch { res.status(404).json({ error: 'Task not found' }) }
})

app.delete('/api/tasks/:id', async (req, res) => {
  const { actor = 'Unknown user' } = req.body
  try {
    const task = await prisma.task.findUniqueOrThrow({ where: { id: req.params.id } })
    await prisma.task.delete({ where: { id: req.params.id } })
    await logActivity(task.projectId, `Task ${task.title} was deleted`, actorName(actor))
    res.status(204).send()
  } catch { res.status(404).json({ error: 'Task not found' }) }
})

app.get('/api/activity', async (_req, res) => {
  const activity = await prisma.activity.findMany({ orderBy: { createdAt: 'desc' }, take: 20 })
  res.json(activity.map((item) => ({ id: item.id, message: item.message, actor: item.actor, created_at: item.createdAt })))
})

app.listen(port, () => console.log(`Project Manager API running on http://localhost:${port}`))
