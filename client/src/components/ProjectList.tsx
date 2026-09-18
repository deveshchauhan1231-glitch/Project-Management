import { useState, useMemo } from 'react'
import { Folder, Search, Plus, CheckCircle2, Clock, Calendar } from 'lucide-react'
import type { Project } from './types'

type ProjectListProps = {
  projects: Project[]
  selectedProject: Project | null
  onSelect: (project: Project) => void
  onNewProject: () => void
}

export function ProjectList({ projects, selectedProject, onSelect, onNewProject }: ProjectListProps) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('All')

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'All' || p.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [projects, search, statusFilter])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Complete':
        return <span className="status-badge badge-success"><CheckCircle2 size={11} /> Done</span>
      case 'In progress':
        return <span className="status-badge badge-warning"><Clock size={11} /> Active</span>
      default:
        return <span className="status-badge badge-neutral"><Calendar size={11} /> Plan</span>
    }
  }

  return (
    <aside className="projects-panel">
      <div className="panel-header">
        <div className="panel-title-wrap">
          <div className="flex items-center gap-2">
            <Folder size={18} className="text-accent" />
            <h2>Projects</h2>
          </div>
          <span className="count-pill">{projects.length}</span>
        </div>
        <button
          type="button"
          className="btn-icon-sm"
          onClick={onNewProject}
          title="Create New Project"
          aria-label="Create New Project"
        >
          <Plus size={16} />
        </button>
      </div>

      <div className="sidebar-search">
        <Search size={14} className="search-icon" />
        <input
          type="text"
          placeholder="Filter projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        {search && (
          <button
            type="button"
            className="clear-search"
            onClick={() => setSearch('')}
          >
            ×
          </button>
        )}
      </div>

      <div className="status-tabs">
        {['All', 'In progress', 'Planning', 'Complete'].map((st) => (
          <button
            key={st}
            type="button"
            className={`status-tab-btn ${statusFilter === st ? 'active' : ''}`}
            onClick={() => setStatusFilter(st)}
          >
            {st === 'All' ? 'All' : st === 'In progress' ? 'Active' : st}
          </button>
        ))}
      </div>

      <div className="project-list">
        {projects.length === 0 ? (
          <div className="empty-sidebar">
            <p>No projects found.</p>
            <button type="button" className="btn btn-sm btn-primary" onClick={onNewProject}>
              + Create Project
            </button>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="empty-sidebar">
            <p>No matching projects.</p>
          </div>
        ) : (
          filteredProjects.map((project) => {
            const isSelected = selectedProject?.id === project.id
            return (
              <button
                type="button"
                className={`project-item ${isSelected ? 'selected' : ''}`}
                key={project.id}
                onClick={() => onSelect(project)}
              >
                <div className="project-item-content">
                  <div className="project-item-header">
                    <strong className="project-item-title">{project.title}</strong>
                  </div>
                  <div className="project-item-meta">
                    {getStatusBadge(project.status)}
                    {project.deadline && (
                      <span className="project-item-deadline">
                        {project.deadline}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })
        )}
      </div>
    </aside>
  )
}

