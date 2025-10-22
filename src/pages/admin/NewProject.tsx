import { ProjectForm } from '../../components/ProjectForm';
import { addProject } from '../../lib/projects';
import type { Project } from '../../types/project';
import { toast } from 'sonner';

export function NewProject() {
  const handleCreate = async (project: Omit<Project, 'id'> | Project) => {
    await addProject(project);
    toast.success('Project created successfully');
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Create New Project</h1>
          <p className="text-muted-foreground">
            Add a new project to your portfolio.
          </p>
        </div>
        
        <ProjectForm onSubmit={handleCreate} />
      </div>
    </div>
  );
}
