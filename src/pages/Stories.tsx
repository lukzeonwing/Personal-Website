import { useEffect, useState } from 'react';
import { getStories } from '../lib/stories';
import { Story } from '../types/story';
import { StoryCard } from '../components/StoryCard';

export function Stories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadStories = async () => {
      try {
        const allStories = await getStories();
        if (!isMounted) return;
        const sorted = allStories.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setStories(sorted);
      } catch (error) {
        console.error('Failed to load stories', error);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStories();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = ['All', ...Array.from(new Set(stories.map(s => s.category)))];
  
  const filteredStories = selectedCategory === 'All' 
    ? stories 
    : stories.filter(s => s.category === selectedCategory);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl mb-4">Stories & Photography</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Visual narratives capturing moments, places, and experiences through the lens.
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap gap-2 justify-center mb-12">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-full transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-accent'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">Loading stories...</p>
          </div>
        ) : filteredStories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground text-lg">
              No stories yet. Check back soon!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredStories.map(story => (
              <StoryCard
                key={story.id}
                story={story}
                onNavigate={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
