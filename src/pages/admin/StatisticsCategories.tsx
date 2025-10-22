import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { getProjects } from '../../lib/projects';
import { getStories } from '../../lib/stories';
import { getCategories, type Category } from '../../lib/categories';
import type { Project } from '../../types/project';
import type { Story } from '../../types/story';
import { buildCategoryStats, getTotalContentViews, type CategoryStat as CategoryStatData } from '../../lib/statistics';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

export function StatisticsCategories() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectList, storyList, categoryList] = await Promise.all([
        getProjects(),
        getStories(),
        getCategories(),
      ]);

      setProjects(projectList);
      setStories(storyList);
      setCategories(categoryList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load category analytics');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const categoryStats = useMemo(
    () => buildCategoryStats(projects, stories, categories),
    [projects, stories, categories]
  );

  const totalContentViews = useMemo(
    () => getTotalContentViews(projects, stories),
    [projects, stories]
  );

  const getCategoryMeta = (cat: CategoryStatData) => {
    const percent =
      totalContentViews > 0 ? Math.round((cat.views / totalContentViews) * 100) : 0;

    const breakdownParts: string[] = [];
    if (cat.projectCount > 0) {
      breakdownParts.push(
        `${cat.projectCount} project${cat.projectCount === 1 ? '' : 's'}`
      );
    }
    if (cat.storyCount > 0) {
      breakdownParts.push(
        `${cat.storyCount} stor${cat.storyCount === 1 ? 'y' : 'ies'}`
      );
    }

    return {
      percent,
      breakdownText:
        breakdownParts.length > 0 ? ` (${breakdownParts.join(' · ')})` : '',
    };
  };

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/admin/statistics">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2" size={18} />
              Back to Analytics
            </Button>
          </Link>
          <h1 className="text-4xl mb-2">Views by Category</h1>
          <p className="text-muted-foreground">
            Full breakdown of project and story performance across categories.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Category Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading category analytics...</p>
            ) : categoryStats.length === 0 ? (
              <p className="text-muted-foreground">No category data available yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead className="text-right">Projects</TableHead>
                    <TableHead className="text-right">Stories</TableHead>
                    <TableHead className="text-right">Entries</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Avg Views</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categoryStats.map((cat) => {
                    const { percent, breakdownText } = getCategoryMeta(cat);
                    return (
                      <TableRow key={cat.category}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{cat.label}</div>
                            <div className="text-sm text-muted-foreground">
                              {cat.count} total entries{breakdownText}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{cat.projectCount}</TableCell>
                        <TableCell className="text-right">{cat.storyCount}</TableCell>
                        <TableCell className="text-right">{cat.count}</TableCell>
                        <TableCell className="text-right">{cat.views}</TableCell>
                        <TableCell className="text-right">{cat.avgViews}</TableCell>
                        <TableCell className="text-right">{percent}%</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
