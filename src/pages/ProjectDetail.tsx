import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getProject, incrementProjectViews } from '../lib/projects';
import { getCategories, getCategoryLabel } from '../lib/categories';
import { Project } from '../types/project';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function ProjectDetail() {
  const { id } = useParams<{ id: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [categoryLabel, setCategoryLabel] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadProject = async () => {
      try {
        const fetched = await getProject(id);

        if (!isMounted) return;

        if (fetched) {
          setProject(fetched);
          incrementProjectViews(id).catch(() => {});

          try {
            const categories = await getCategories();
            if (isMounted) {
              setCategoryLabel(getCategoryLabel(fetched.category, categories));
            }
          } catch (error) {
            console.warn('Failed to load categories', error);
            setCategoryLabel(getCategoryLabel(fetched.category));
          }
        } else {
          setProject(null);
        }
      } catch (error) {
        console.error('Failed to load project', error);
        setProject(null);
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
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg text-muted-foreground">Loading project...</p>
      </div>
    );
  }
  
  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-3xl mb-4">Project not found</h2>
          <Link to="/projects">
            <Button>
              <ArrowLeft className="mr-2" size={18} />
              Back to Projects
            </Button>
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/projects">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft className="mr-2" size={18} />
            Back to Projects
          </Button>
        </Link>
        
        {/* Hero Image */}
        <div className="mb-8 rounded-lg overflow-hidden bg-muted">
          <ImageWithFallback
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover"
          />
        </div>
        
        {/* Project Header */}
        <div className="mb-12">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <Badge variant="secondary">{categoryLabel || getCategoryLabel(project.category)}</Badge>
            <span className="text-muted-foreground">{project.year}</span>
            {project.featured && (
              <Badge variant="default">Featured</Badge>
            )}
          </div>
          <h1 className="text-5xl mb-4">{project.title}</h1>
          <p className="text-xl text-muted-foreground mb-6">{project.description}</p>
          
          <div className="flex flex-wrap gap-8">
            <div>
              <h4 className="mb-2 text-muted-foreground">Role</h4>
              <p>{project.role}</p>
            </div>
            <div>
              <h4 className="mb-2 text-muted-foreground">Tools</h4>
              <div className="flex flex-wrap gap-2">
                {project.tools.map((tool, index) => (
                  <Badge key={index} variant="outline">{tool}</Badge>
                ))}
              </div>
            </div>
            {project.link && (
              <div>
                <h4 className="mb-2 text-muted-foreground">Project Link</h4>
                <a href={project.link} target="_blank" rel="noopener noreferrer">
                  <Button variant="outline" size="sm">
                    Visit Project
                    <ExternalLink className="ml-2" size={16} />
                  </Button>
                </a>
              </div>
            )}
          </div>
        </div>
        
        {/* Project Details */}
        <div className="space-y-12 mb-12">
          <div>
            <h2 className="text-3xl mb-4">Challenge</h2>
            <p className="text-lg leading-relaxed">{project.challenges}</p>
          </div>
          
          <div>
            <h2 className="text-3xl mb-4">Solution</h2>
            <p className="text-lg leading-relaxed">{project.solution}</p>
          </div>
          
        </div>
        
        {/* Content Blocks */}
        {project.contentBlocks && project.contentBlocks.length > 0 && (
          <div className="space-y-12 mb-12">
            <h2 className="text-3xl">Project Deep Dive</h2>
            {project.contentBlocks.map((block) => (
              <div key={block.id}>
                {block.type === 'image' && block.image && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <ImageWithFallback
                      src={block.image}
                      alt={block.title || 'Project image'}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                
                {block.type === 'text' && (
                  <div>
                    {block.title && <h3 className="text-2xl mb-4">{block.title}</h3>}
                    {block.description && (
                      <p className="text-lg leading-relaxed">{block.description}</p>
                    )}
                  </div>
                )}
                
                {block.type === 'image-text' && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                    {block.image && (
                      <div className="rounded-lg overflow-hidden bg-muted">
                        <ImageWithFallback
                          src={block.image}
                          alt={block.title || 'Project image'}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div>
                      {block.title && <h3 className="text-2xl mb-4">{block.title}</h3>}
                      {block.description && (
                        <p className="text-lg leading-relaxed">{block.description}</p>
                      )}
                    </div>
                  </div>
                )}

                {block.type === 'video' && block.video && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <video
                      src={block.video}
                      controls
                      className="w-full h-full object-cover"
                    />
                    {(block.title || block.description) && (
                      <div className="mt-4">
                        {block.title && <h3 className="text-2xl mb-2">{block.title}</h3>}
                        {block.description && (
                          <p className="text-lg leading-relaxed">{block.description}</p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        {/* Additional Images */}
        {project.images.length > 0 && (
          <div>
            <h2 className="text-3xl mb-6">Project Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {project.images.map((image, index) => (
                <div key={index} className="rounded-lg overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={image}
                    alt={`${project.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
