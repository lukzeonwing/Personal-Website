import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { ProjectForm } from '../../components/ProjectForm';
import { getProject, updateProject } from '../../lib/projects';
import { Project } from '../../types/project';
import { Button } from '../../components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export function EditProject() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProject = async () => {
      try {
        const foundProject = await getProject(id);
        if (!isMounted) return;

        if (foundProject) {
          setProject(foundProject);
        } else {
          toast.error('Project not found');
          navigate('/admin/projects');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load project');
        navigate('/admin/projects');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);
  
  const handleSubmit = async (updatedProject: Project | Omit<Project, 'id'>) => {
    if (!id) return;

    // Ensure the project has an 'id' property before updating
    const projectWithId: Project =
      'id' in updatedProject
        ? updatedProject as Project
        : { ...updatedProject, id };

    try {
      await updateProject(id, projectWithId);
      toast.success('Project updated successfully');
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!project) {
    return null;
  }
  
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/projects')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2" size={18} />
          Back to Projects
        </Button>
        
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Edit Project</h1>
          <p className="text-muted-foreground">
            Update the details of your project.
          </p>
        </div>
        
        <ProjectForm project={project} onSubmit={handleSubmit} />
      </div>
    </div>
  );
}
