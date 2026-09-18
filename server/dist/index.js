import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { clerkMiddleware, getAuth } from '@clerk/express';
import { PrismaClient, ProjectStatus, TaskStatus } from '@prisma/client';
const app = express();
const port = Number(process.env.PORT ?? 4000);
const prisma = new PrismaClient();
app.use(cors());
app.use(express.json());
// Enable Clerk authentication middleware if secret key is present
const hasClerkSecret = Boolean(process.env.CLERK_SECRET_KEY || process.env.CLERK_PUBLISHABLE_KEY);
if (hasClerkSecret) {
    app.use(clerkMiddleware());
}
const getParam = (val) => {
    if (Array.isArray(val))
        return val[0] ?? '';
    return val ?? '';
};
// Status parsing helpers
const projectStatus = (value) => value === 'In progress' || value === 'InProgress' ? ProjectStatus.InProgress : value;
const taskStatus = (value) => value === 'In progress' || value === 'InProgress'
    ? TaskStatus.InProgress
    : value === 'To do' || value === 'ToDo'
        ? TaskStatus.ToDo
        : value;
const displayProjectStatus = (value) => value === ProjectStatus.InProgress ? 'In progress' : value;
const displayTaskStatus = (value) => value === TaskStatus.InProgress ? 'In progress' : value === TaskStatus.ToDo ? 'To do' : value;
// Resolve actor name from Clerk Auth, headers, or body
const resolveActor = (req) => {
    if (hasClerkSecret) {
        try {
            const auth = getAuth(req);
            if (auth.userId) {
                const headerActor = req.headers['x-actor-name'];
                if (typeof headerActor === 'string' && headerActor.trim()) {
                    return headerActor.trim();
                }
                return `User (${auth.userId.slice(-6)})`;
            }
        }
        catch {
            // Fallback
        }
    }
    const headerActor = req.headers['x-actor-name'];
    if (typeof headerActor === 'string' && headerActor.trim()) {
        return headerActor.trim();
    }
    const bodyActor = req.body?.actor;
    if (typeof bodyActor === 'string' && bodyActor.trim()) {
        return bodyActor.trim();
    }
    return 'Workspace Member';
};
const projectResponse = (project) => ({
    id: project.id,
    title: project.title,
    description: project.description,
    status: displayProjectStatus(project.status),
    deadline: project.deadline?.toISOString().slice(0, 10) ?? null,
});
const taskResponse = (task) => ({
    id: task.id,
    project_id: task.projectId,
    title: task.title,
    status: displayTaskStatus(task.status),
    priority: task.priority,
    assignees: task.assignees,
});
const logActivity = async (projectId, message, actor = 'Workspace Member') => {
    try {
        await prisma.activity.create({ data: { projectId, message, actor } });
    }
    catch (error) {
        console.error('Failed to write activity log:', error);
    }
};
// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        clerk_enabled: hasClerkSecret,
    });
});
// Projects Endpoints
app.get('/api/projects', async (_req, res) => {
    try {
        const projects = await prisma.project.findMany({
            orderBy: { updatedAt: 'desc' },
            include: { _count: { select: { tasks: true } } },
        });
        res.json(projects.map((project) => ({ ...projectResponse(project), task_count: project._count.tasks })));
    }
    catch (error) {
        console.error('Error fetching projects:', error);
        res.status(500).json({ error: 'Failed to retrieve projects' });
    }
});
app.post('/api/projects', async (req, res) => {
    try {
        const { title, description = '', status = 'Planning', deadline = null } = req.body;
        if (!title || typeof title !== 'string') {
            res.status(400).json({ error: 'Project title is required' });
            return;
        }
        const actor = resolveActor(req);
        const project = await prisma.project.create({
            data: {
                title: title.trim(),
                description: description.trim(),
                status: projectStatus(status),
                deadline: deadline ? new Date(deadline) : null,
            },
        });
        await logActivity(project.id, `Project "${project.title}" was created`, actor);
        res.status(201).json(projectResponse(project));
    }
    catch (error) {
        console.error('Error creating project:', error);
        res.status(500).json({ error: 'Failed to create project' });
    }
});
app.patch('/api/projects/:id', async (req, res) => {
    const projectId = getParam(req.params.id);
    try {
        const { title, description, status, deadline } = req.body;
        const actor = resolveActor(req);
        const project = await prisma.project.update({
            where: { id: projectId },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(description !== undefined && { description: description.trim() }),
                ...(status !== undefined && { status: projectStatus(status) }),
                ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
            },
        });
        await logActivity(project.id, `Project "${project.title}" was updated`, actor);
        res.json(projectResponse(project));
    }
    catch {
        res.status(404).json({ error: 'Project not found' });
    }
});
app.delete('/api/projects/:id', async (req, res) => {
    const projectId = getParam(req.params.id);
    try {
        const actor = resolveActor(req);
        const project = await prisma.project.findUniqueOrThrow({ where: { id: projectId } });
        await prisma.project.delete({ where: { id: projectId } });
        await logActivity(null, `Project "${project.title}" was deleted`, actor);
        res.status(204).send();
    }
    catch {
        res.status(404).json({ error: 'Project not found' });
    }
});
// Tasks Endpoints
app.get('/api/projects/:id/tasks', async (req, res) => {
    const projectId = getParam(req.params.id);
    try {
        const tasks = await prisma.task.findMany({
            where: { projectId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(tasks.map(taskResponse));
    }
    catch (error) {
        console.error('Error fetching tasks:', error);
        res.status(500).json({ error: 'Failed to retrieve tasks' });
    }
});
app.post('/api/projects/:id/tasks', async (req, res) => {
    const projectId = getParam(req.params.id);
    try {
        const { title, status = 'To do', priority = 'Medium', assignees = [] } = req.body;
        if (!title || typeof title !== 'string') {
            res.status(400).json({ error: 'Task title is required' });
            return;
        }
        const actor = resolveActor(req);
        const task = await prisma.task.create({
            data: {
                projectId,
                title: title.trim(),
                status: taskStatus(status),
                priority: priority,
                assignees: Array.isArray(assignees) ? assignees : [],
            },
        });
        await logActivity(projectId, `Task "${task.title}" was added`, actor);
        res.status(201).json(taskResponse(task));
    }
    catch (error) {
        console.error('Error creating task:', error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
app.patch('/api/tasks/:id', async (req, res) => {
    const taskId = getParam(req.params.id);
    try {
        const { title, status, priority, assignees } = req.body;
        const actor = resolveActor(req);
        const task = await prisma.task.update({
            where: { id: taskId },
            data: {
                ...(title !== undefined && { title: title.trim() }),
                ...(status !== undefined && { status: taskStatus(status) }),
                ...(priority !== undefined && { priority: priority }),
                ...(assignees !== undefined && { assignees: Array.isArray(assignees) ? assignees : [] }),
            },
        });
        await logActivity(task.projectId, `Task "${task.title}" was updated`, actor);
        res.json(taskResponse(task));
    }
    catch {
        res.status(404).json({ error: 'Task not found' });
    }
});
app.delete('/api/tasks/:id', async (req, res) => {
    const taskId = getParam(req.params.id);
    try {
        const actor = resolveActor(req);
        const task = await prisma.task.findUniqueOrThrow({ where: { id: taskId } });
        await prisma.task.delete({ where: { id: taskId } });
        await logActivity(task.projectId, `Task "${task.title}" was deleted`, actor);
        res.status(204).send();
    }
    catch {
        res.status(404).json({ error: 'Task not found' });
    }
});
// Activity Timeline Endpoint
app.get('/api/activity', async (_req, res) => {
    try {
        const activity = await prisma.activity.findMany({
            orderBy: { createdAt: 'desc' },
            take: 30,
        });
        res.json(activity.map((item) => ({
            id: item.id,
            message: item.message,
            actor: item.actor,
            created_at: item.createdAt,
        })));
    }
    catch (error) {
        console.error('Error fetching activity:', error);
        res.status(500).json({ error: 'Failed to retrieve activity' });
    }
});
app.listen(port, () => console.log(`Project Manager API running on http://localhost:${port}`));
