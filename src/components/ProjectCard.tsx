import { Link } from 'react-router-dom';
import { Project } from '../types/project';
import { getCategoryLabel } from '../lib/categories';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';

type ProjectCardProps = {
  project: Project;
  onNavigate?: () => void;
};

const scrollToTop = () => {
  if (typeof window !== 'undefined') {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }
};

export function ProjectCard({
  project,
  onNavigate,
}: ProjectCardProps) {
  return (
    <Link to={`/projects/${project.id}`} onClick={onNavigate}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full group/card">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <ImageWithFallback
            src={project.coverImage}
            alt={project.title}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2">
            <Badge variant="secondary" className="text-xs">
              {getCategoryLabel(project.category)}
            </Badge>
            <span className="text-xs text-muted-foreground">{project.year}</span>
          </div>
          <h3 className="mb-1.5 text-base group-hover/project:text-primary transition-colors line-clamp-1">
            {project.title}
          </h3>
          <p className="text-sm text-muted-foreground line-clamp-2">
            {project.description}
          </p>
          <div className="mt-3">
            <span className="text-sm text-primary group-hover/project:underline">
              View Project &rarr;
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
