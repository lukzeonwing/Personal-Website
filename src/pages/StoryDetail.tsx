import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getStory, incrementViews } from '../lib/stories';
import { Story } from '../types/story';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { ArrowLeft, MapPin, Calendar, Eye } from 'lucide-react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';

export function StoryDetail() {
  const { id } = useParams<{ id: string }>();
  const [story, setStory] = useState<Story | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      setNotFound(true);
      return;
    }

    let isMounted = true;
    setIsLoading(true);
    setNotFound(false);

    const fetchStory = async () => {
      try {
        const result = await getStory(id);
        if (!isMounted) return;

        if (result) {
          setStory(result);
          setNotFound(false);
          void incrementViews(id);
        } else {
          setStory(null);
          setNotFound(true);
        }
      } catch (error) {
        console.error('Failed to load story', error);
        if (isMounted) {
          setStory(null);
          setNotFound(true);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void fetchStory();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading story...</p>
      </div>
    );
  }

  if (notFound || !story) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl mb-4">Story not found</h2>
          <Link to="/stories">
            <Button>
              <ArrowLeft size={16} className="mr-2" />
              Back to Stories
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <Link to="/stories">
          <Button variant="ghost" className="mb-8">
            <ArrowLeft size={16} className="mr-2" />
            Back to Stories
          </Button>
        </Link>

        {/* Cover Image */}
        <div className="aspect-[16/9] rounded-lg overflow-hidden bg-muted mb-8">
          <ImageWithFallback
            src={story.coverImage}
            alt={story.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge variant="secondary">{story.category}</Badge>
          </div>
          
          <h1 className="text-4xl mb-4">{story.title}</h1>
          
          <div className="flex flex-wrap items-center gap-4 text-muted-foreground mb-4">
            {story.location && (
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{story.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Calendar size={18} />
              <span>{formatDate(story.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={18} />
              <span>{story.views || 0} views</span>
            </div>
          </div>

          <p className="text-lg text-muted-foreground">
            {story.description}
          </p>
        </div>

        {/* Content Blocks */}
        {story.contentBlocks && story.contentBlocks.length > 0 && (
          <div className="space-y-8 mb-12">
            {story.contentBlocks.map((block, index) => (
              <div key={index}>
                {block.type === 'image' && block.image && (
                  <div className="rounded-lg overflow-hidden bg-muted">
                    <ImageWithFallback
                      src={block.image}
                      alt={block.title || `Content ${index + 1}`}
                      className="w-full h-auto"
                    />
                  </div>
                )}
                
                {block.type === 'text' && block.description && (
                  <div className="prose max-w-none">
                    {block.title && <h3>{block.title}</h3>}
                    <p className="whitespace-pre-wrap leading-relaxed">{block.description}</p>
                  </div>
                )}
                
                {block.type === 'image-text' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    {block.image && (
                      <div className="rounded-lg overflow-hidden bg-muted">
                        <ImageWithFallback
                          src={block.image}
                          alt={block.title || `Content ${index + 1}`}
                          className="w-full h-auto"
                        />
                      </div>
                    )}
                    {block.description && (
                      <div className="prose max-w-none">
                        {block.title && <h3>{block.title}</h3>}
                        <p className="whitespace-pre-wrap leading-relaxed">{block.description}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Legacy Content */}
        {story.content && (
          <div className="prose max-w-none mb-12">
            <div className="whitespace-pre-wrap leading-relaxed">
              {story.content}
            </div>
          </div>
        )}

        {/* Photo Gallery */}
        {story.images && story.images.length > 0 && (
          <div className="mb-12">
            <h2 className="text-2xl mb-6">Gallery</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {story.images.map((image, index) => (
                <div 
                  key={index} 
                  className="aspect-[4/3] rounded-lg overflow-hidden bg-muted"
                >
                  <ImageWithFallback
                    src={image}
                    alt={`${story.title} - Image ${index + 1}`}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="pt-8 border-t border-border">
          <Link to="/stories">
            <Button variant="outline" size="lg">
              <ArrowLeft size={16} className="mr-2" />
              View All Stories
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
