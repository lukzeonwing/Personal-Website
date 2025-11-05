import { useState, useEffect } from 'react';
import { ProjectCard } from '../components/ProjectCard';
import { getProjects } from '../lib/projects';
import { getCategories } from '../lib/categories';
import { Project } from '../types/project';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import type { Category } from '../lib/categories';

export function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        const [projectList, categoryList] = await Promise.all([
          getProjects(),
          getCategories(),
        ]);

        if (isMounted) {
          setProjects(projectList);
          setCategories(categoryList);
        }
      } catch (error) {
        console.error('Failed to load projects', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);
  
  const filteredProjects = (filter === 'all' 
    ? projects 
    : projects.filter(p => p.category === filter))
    .sort((a, b) => {
      // Featured projects first
      if (a.featured !== b.featured) {
        return a.featured ? -1 : 1;
      }
      
      // If both are featured, sort by featuredAt (latest first)
      if (a.featured && b.featured) {
        const featuredAtA = a.featuredAt || 0;
        const featuredAtB = b.featuredAt || 0;
        return featuredAtB - featuredAtA;
      }
      
      // For non-featured projects, sort by year (newest first)
      const yearA = parseInt(a.year) || 0;
      const yearB = parseInt(b.year) || 0;
      return yearB - yearA;
    });
  
  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-12">
          <h1 className="text-5xl mb-4">All Projects</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Explore my portfolio of industrial design, UI design and UX research work
          </p>
          
          {/* Category Filter */}
          <div className="flex items-center gap-4">
            <span className="text-muted-foreground">Filter by:</span>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Projects Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Loading projects...</p>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No projects yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProjects.map(project => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
