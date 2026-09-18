import { useState, useMemo } from 'react'
import {
  Calendar,
  CheckCircle2,
  Clock,
  Edit3,
  Trash2,
  Plus,
  Search,
  Filter,
  Users,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react'
import type { Project, Task } from './types'

type ProjectDetailsProps = {
  project: Project | null
  tasks: Task[]
  onEditProject: () => void
  onDeleteProject: () => void
  onAddTask: () => void
  onEditTask: (task: Task) => void
  onDeleteTask: (task: Task) => void
  onToggleTaskStatus: (task: Task) => void
}

export function ProjectDetails({
  project,
  tasks,
  onEditProject,
  onDeleteProject,
  onAddTask,
  onEditTask,
  onDeleteTask,
  onToggleTaskStatus,
}: ProjectDetailsProps) {
  const [taskSearch, setTaskSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [priorityFilter, setPriorityFilter] = useState('All')

  const totalTasks = tasks.length
  const completedTasks = tasks.filter((t) => t.status === 'Done').length
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchSearch = task.title.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.assignees.some((a) => a.toLowerCase().includes(taskSearch.toLowerCase()))
      const matchStatus = statusFilter === 'All' || task.status === statusFilter
      const matchPriority = priorityFilter === 'All' || task.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [tasks, taskSearch, statusFilter, priorityFilter])

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'High':
        return <span className="priority-pill priority-high"><AlertCircle size={12} /> High</span>
      case 'Low':
        return <span className="priority-pill priority-low">Low</span>
      default:
        return <span className="priority-pill priority-medium">Medium</span>
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Done':
        return <span className="status-badge badge-success"><CheckCircle2 size={12} /> Done</span>
      case 'In progress':
        return <span className="status-badge badge-warning"><Clock size={12} /> In progress</span>
      default:
        return <span className="status-badge badge-neutral">To do</span>
    }
  }

  if (!project) {
    return (
      <div className="empty-project-state">
        <div className="empty-icon-wrap">
          <CheckSquare size={32} />
        </div>
        <h3>No project selected</h3>
        <p>Choose an existing project from the sidebar or create a new one to begin tracking tasks.</p>
      </div>
    )
  }

  return (
    <div className="project-detail-view">
      {/* Project Banner Card */}
      <div className="project-banner">
        <div className="banner-top">
          <div className="banner-info">
            <div className="banner-meta">
              <span className={`project-status-tag status-${project.status.toLowerCase().replace(/\s+/g, '-')}`}>
                {project.status}
              </span>
              {project.deadline && (
                <span className="deadline-badge">
                  <Calendar size={13} />
                  <span>Deadline: {project.deadline}</span>
                </span>
              )}
            </div>
            <h1 className="project-title">{project.title}</h1>
            <p className="project-desc">{project.description || 'No description provided for this project.'}</p>
          </div>

          <div className="project-header-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onEditProject}
              title="Edit project"
            >
              <Edit3 size={15} />
              <span>Edit</span>
            </button>
            <button
              type="button"
              className="btn btn-danger-outline"
              onClick={onDeleteProject}
              title="Delete project"
            >
              <Trash2 size={15} />
              <span>Delete</span>
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="project-progress-card">
          <div className="progress-info">
            <span className="progress-label">Task Completion</span>
            <span className="progress-count">
              <strong>{completedTasks}</strong> of {totalTasks} tasks ({progressPercent}%)
            </span>
          </div>
          <div className="progress-bar-bg">
            <div
              className="progress-bar-fill"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Tasks Section */}
      <div className="tasks-section">
        <div className="tasks-section-header">
          <div className="tasks-heading-wrap">
            <h2>Tasks</h2>
            <span className="count-pill">{totalTasks}</span>
          </div>
          <button type="button" className="btn btn-primary" onClick={onAddTask}>
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>

        {/* Filter bar */}
        <div className="tasks-controls">
          <div className="search-box">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder="Search tasks or assignees..."
              value={taskSearch}
              onChange={(e) => setTaskSearch(e.target.value)}
            />
            {taskSearch && (
              <button
                type="button"
                className="clear-search"
                onClick={() => setTaskSearch('')}
              >
                ×
              </button>
            )}
          </div>

          <div className="filters-group">
            <div className="filter-select-wrap">
              <Filter size={13} className="filter-icon" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Statuses</option>
                <option value="To do">To do</option>
                <option value="In progress">In progress</option>
                <option value="Done">Done</option>
              </select>
            </div>

            <div className="filter-select-wrap">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
        </div>

        {/* Task Cards List */}
        {tasks.length === 0 ? (
          <div className="empty-tasks-card">
            <CheckSquare size={36} className="empty-icon" />
            <p className="empty-title">No tasks in this project yet</p>
            <p className="empty-subtitle">Get started by creating your first task for this project.</p>
            <button type="button" className="btn btn-primary" onClick={onAddTask}>
              <Plus size={15} />
              <span>Create First Task</span>
            </button>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="empty-tasks-card">
            <p className="empty-title">No matching tasks</p>
            <p className="empty-subtitle">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="task-list-grid">
            {filteredTasks.map((task) => {
              const isDone = task.status === 'Done'
              return (
                <div
                  className={`task-card ${isDone ? 'task-done' : ''}`}
                  key={task.id}
                >
                  <div className="task-left">
                    <button
                      type="button"
                      className={`task-checkbox ${isDone ? 'checked' : ''}`}
                      onClick={() => onToggleTaskStatus(task)}
                      title={`Click to cycle status (Current: ${task.status})`}
                      aria-label={`Toggle task status for ${task.title}`}
                    >
                      {isDone ? (
                        <CheckCircle2 size={20} className="check-icon-active" />
                      ) : (
                        <Square size={20} className="check-icon-inactive" />
                      )}
                    </button>

                    <div className="task-content">
                      <div className="task-title-row">
                        <span className={`task-title-text ${isDone ? 'line-through text-muted' : ''}`}>
                          {task.title}
                        </span>
                      </div>

                      <div className="task-tags-row">
                        <button
                          type="button"
                          className="status-toggle-chip"
                          onClick={() => onToggleTaskStatus(task)}
                          title="Click to change status"
                        >
                          {getStatusBadge(task.status)}
                        </button>
                        {getPriorityBadge(task.priority)}

                        {task.assignees && task.assignees.length > 0 && (
                          <div className="assignees-wrap" title={`Assigned: ${task.assignees.join(', ')}`}>
                            <Users size={12} className="text-muted" />
                            <div className="assignees-chips">
                              {task.assignees.map((assignee, idx) => (
                                <span key={idx} className="assignee-tag">
                                  {assignee}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="task-actions">
                    <button
                      type="button"
                      className="task-action-btn edit"
                      onClick={() => onEditTask(task)}
                      title="Edit task"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      type="button"
                      className="task-action-btn delete"
                      onClick={() => onDeleteTask(task)}
                      title="Delete task"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

