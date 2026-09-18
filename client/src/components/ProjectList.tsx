import type { Project } from './types'

type ProjectListProps = { projects: Project[]; selectedProject: Project | null; onSelect: (project: Project) => void }

export function ProjectList({ projects, selectedProject, onSelect }: ProjectListProps) {
  return <aside className="projects-panel"><h2>Projects</h2>{projects.length === 0 && <p className="empty">No projects yet.</p>}<div className="project-list">{projects.map((project) => <button className={`project-item ${selectedProject?.id === project.id ? 'selected' : ''}`} key={project.id} onClick={() => onSelect(project)}><strong>{project.title}</strong><span>{project.status}</span></button>)}</div></aside>
}
