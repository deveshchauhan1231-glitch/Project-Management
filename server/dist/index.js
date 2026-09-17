import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { Pool } from 'pg';
const app = express();
const port = Number(process.env.PORT ?? 4000);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
app.use(cors());
app.use(express.json());
const logActivity = async (projectId, message, actor = 'You') => {
    await pool.query('INSERT INTO activity (project_id, message, actor) VALUES ($1, $2, $3)', [projectId, message, actor]);
};
app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/projects', async (_req, res) => {
    const result = await pool.query(`
    SELECT p.*, COUNT(t.id)::int AS task_count,
      COUNT(t.id) FILTER (WHERE t.status = 'Done')::int AS completed_tasks
    FROM projects p LEFT JOIN tasks t ON t.project_id = p.id
    GROUP BY p.id ORDER BY p.updated_at DESC
  `);
    res.json(result.rows);
});
app.post('/api/projects', async (req, res) => {
    const { title, description = '', status = 'Planning', deadline = null, actor = 'Unknown user' } = req.body;
    const result = await pool.query('INSERT INTO projects (title, description, status, deadline) VALUES ($1, $2, $3, $4) RETURNING *', [title, description, status, deadline]);
    await logActivity(result.rows[0].id, `Project ${title} was created`, actor);
    res.status(201).json(result.rows[0]);
});
app.patch('/api/projects/:id', async (req, res) => {
    const { title, description, status, deadline, actor = 'Unknown user' } = req.body;
    const result = await pool.query('UPDATE projects SET title = COALESCE($1, title), description = COALESCE($2, description), status = COALESCE($3, status), deadline = $4, updated_at = NOW() WHERE id = $5 RETURNING *', [title, description, status, deadline, req.params.id]);
    if (!result.rowCount)
        return res.status(404).json({ error: 'Project not found' });
    await logActivity(req.params.id, `Project ${result.rows[0].title} was edited`, actor);
    res.json(result.rows[0]);
});
app.delete('/api/projects/:id', async (req, res) => {
    const { actor = 'Unknown user' } = req.body;
    const result = await pool.query('DELETE FROM projects WHERE id = $1 RETURNING title', [req.params.id]);
    if (!result.rowCount)
        return res.status(404).json({ error: 'Project not found' });
    await logActivity(null, `Project ${result.rows[0].title} was deleted`, actor);
    res.status(204).send();
});
app.get('/api/projects/:id/tasks', async (req, res) => {
    const result = await pool.query('SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json(result.rows);
});
app.post('/api/projects/:id/tasks', async (req, res) => {
    const { title, status = 'To do', priority = 'Medium', assignees = [], actor = 'Unknown user' } = req.body;
    const result = await pool.query('INSERT INTO tasks (project_id, title, status, priority, assignees) VALUES ($1, $2, $3, $4, $5) RETURNING *', [req.params.id, title, status, priority, assignees]);
    await logActivity(req.params.id, `Task ${title} was added`, actor);
    res.status(201).json(result.rows[0]);
});
app.patch('/api/tasks/:id', async (req, res) => {
    const { title, status, priority, assignees, actor = 'Unknown user' } = req.body;
    const result = await pool.query('UPDATE tasks SET title = COALESCE($1, title), status = COALESCE($2, status), priority = COALESCE($3, priority), assignees = COALESCE($4, assignees), updated_at = NOW() WHERE id = $5 RETURNING *', [title, status, priority, assignees, req.params.id]);
    if (!result.rowCount)
        return res.status(404).json({ error: 'Task not found' });
    await logActivity(result.rows[0].project_id, `Task ${result.rows[0].title} was edited`, actor);
    res.json(result.rows[0]);
});
app.delete('/api/tasks/:id', async (req, res) => {
    const { actor = 'Unknown user' } = req.body;
    const result = await pool.query('DELETE FROM tasks WHERE id = $1 RETURNING project_id, title', [req.params.id]);
    if (result.rowCount)
        await logActivity(result.rows[0].project_id, `Task ${result.rows[0].title} was deleted`, actor);
    res.status(204).send();
});
app.get('/api/activity', async (_req, res) => {
    const result = await pool.query('SELECT * FROM activity ORDER BY created_at DESC LIMIT 20');
    res.json(result.rows);
});
app.listen(port, () => console.log(`Project Pulse API running on http://localhost:${port}`));
