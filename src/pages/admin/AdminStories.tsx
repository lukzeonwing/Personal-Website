import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getStories, deleteStory } from '../../lib/stories';
import { Story } from '../../types/story';
import { Card, CardContent } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Eye, MapPin } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '../../components/ui/alert-dialog';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { toast } from 'sonner';

export function AdminStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStories();
  }, []);

  const loadStories = async () => {
    try {
      setIsLoading(true);
      const allStories = await getStories();
      const sorted = allStories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setStories(sorted);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load stories');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteStory(id);
      toast.success('Story deleted successfully');
      await loadStories();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete story');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl mb-2">Stories & Photography</h1>
            <p className="text-muted-foreground">
              Manage your photography stories and galleries
            </p>
          </div>
          <Link to="/admin/stories/new">
            <Button size="lg">
              <Plus size={20} className="mr-2" />
              New Story
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground">Loading stories...</p>
            </CardContent>
          </Card>
        ) : stories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <p className="text-muted-foreground mb-4">No stories yet</p>
              <Link to="/admin/stories/new">
                <Button>
                  <Plus size={20} className="mr-2" />
                  Create Your First Story
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map(story => (
              <Card key={story.id} className="overflow-hidden group">
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  <ImageWithFallback
                    src={story.coverImage}
                    alt={story.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary">{story.category}</Badge>
                  </div>
                  
                  <h3 className="mb-2">{story.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {story.description}
                  </p>

                  <div className="flex items-center gap-3 text-sm text-muted-foreground mb-4">
                    {story.location && (
                      <div className="flex items-center gap-1">
                        <MapPin size={14} />
                        <span className="truncate">{story.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Eye size={14} />
                      <span>{story.views || 0}</span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-4">
                    {formatDate(story.date)}
                  </p>

                  <div className="flex gap-2">
                    <Link to={`/admin/stories/edit/${story.id}`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        <Edit size={16} className="mr-2" />
                        Edit
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="icon">
                          <Trash2 size={16} />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Story</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{story.title}"? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(story.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
