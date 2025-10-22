import { Link } from 'react-router-dom';
import { MapPin, Calendar } from 'lucide-react';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Story } from '../types/story';

type StoryCardProps = {
  story: Story;
  onNavigate?: () => void;
  formatDate?: (dateString: string) => string;
};

const defaultFormatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
};

export function StoryCard({
  story,
  onNavigate,
  formatDate = defaultFormatDate,
}: StoryCardProps) {
  return (
    <Link to={`/stories/${story.id}`} onClick={onNavigate}>
      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full group/card">
        <div className="aspect-[4/3] overflow-hidden bg-muted">
          <ImageWithFallback
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover group-hover/card:scale-105 transition-transform duration-300"
          />
        </div>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 mb-1.5">
            <Badge variant="secondary" className="text-xs">
              {story.category}
            </Badge>
          </div>
          <h3 className="mb-1.5 group-hover/card:text-primary transition-colors line-clamp-1">
            {story.title}
          </h3>
          {story.description && (
            <p className="text-muted-foreground mb-2 text-xs line-clamp-2">
              {story.description}
            </p>
          )}
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {story.location && (
              <div className="flex items-center gap-1 min-w-0 flex-1">
                <MapPin size={12} className="flex-shrink-0" />
                <span className="truncate">{story.location}</span>
              </div>
            )}
            <div className="flex items-center gap-1 flex-shrink-0">
              <Calendar size={12} />
              <span className="whitespace-nowrap">{formatDate(story.date)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
