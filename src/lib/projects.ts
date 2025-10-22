import { api } from './api';
import { Project } from '../types/project';

export type ProjectPayload = Omit<Project, 'id' | 'viewHistory'> & {
  id?: string;
  viewHistory?: Project['viewHistory'];
};

export const getProjects = async (): Promise<Project[]> => {
  const projects = await api.get<Project[]>('/projects');
  return projects;
};

export const getProject = async (id: string): Promise<Project | undefined> => {
  try {
    const project = await api.get<Project>(`/projects/${id}`);
    return project;
  } catch (error) {
    return undefined;
  }
};

export const addProject = async (project: ProjectPayload): Promise<Project> => {
  const payload = { ...project };
  return api.post<Project>('/projects', payload, { auth: true });
};

export const updateProject = async (id: string, updates: ProjectPayload): Promise<Project> => {
  return api.put<Project>(`/projects/${id}`, updates, { auth: true });
};

export const deleteProject = async (id: string): Promise<void> => {
  await api.delete(`/projects/${id}`, { auth: true });
};

export const toggleFeatured = async (id: string): Promise<Project> => {
  return api.patch<Project>(`/projects/${id}/feature`, undefined, { auth: true });
};

export const incrementProjectViews = async (id: string): Promise<void> => {
  try {
    await api.post(`/projects/${id}/view`);
  } catch (error) {
    // Ignore view tracking errors (e.g., banned IP)
    console.warn('View tracking failed', error);
  }
};

export const getFeaturedProjects = (projects: Project[]): Project[] => {
  return projects.filter((project) => project.featured);
};

export const getTotalViews = (projects: Project[]): number => {
  return projects.reduce((sum, project) => sum + (project.views || 0), 0);
};

export const getMostViewedProjects = (projects: Project[], limit = 5): Project[] => {
  return [...projects]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, limit);
};

export const getIPStats = (projects: Project[]): Array<{ ip: string; views: number; lastView: number }> => {
  const ipMap = new Map<string, { views: number; lastView: number }>();

  projects.forEach((project) => {
    const history = project.viewHistory || [];
    history.forEach((view) => {
      const current = ipMap.get(view.ip);
      if (current) {
        ipMap.set(view.ip, {
          views: current.views + 1,
          lastView: Math.max(current.lastView, view.timestamp),
        });
      } else {
        ipMap.set(view.ip, {
          views: 1,
          lastView: view.timestamp,
        });
      }
    });
  });

  return Array.from(ipMap.entries())
    .map(([ip, stats]) => ({ ip, ...stats }))
    .sort((a, b) => b.views - a.views);
};
