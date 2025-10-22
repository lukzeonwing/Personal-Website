import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { getProjects } from '../../lib/projects';
import { getStories } from '../../lib/stories';
import { getCategories, getCategoryLabel, type Category } from '../../lib/categories';
import type { Project } from '../../types/project';
import type { Story } from '../../types/story';
import { buildPerformanceItems, type PerformanceItem } from '../../lib/statistics';
import { toast } from 'sonner';
import { Eye, ExternalLink, ArrowLeft } from 'lucide-react';

export function StatisticsPerformance() {
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
      toast.error('Failed to load performance data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const performanceItems: PerformanceItem[] = useMemo(
    () => buildPerformanceItems(projects, stories),
    [projects, stories]
  );

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
          <h1 className="text-4xl mb-2">Projects & Stories Performance</h1>
          <p className="text-muted-foreground">
            Full ranking of content by total views with quick access to edit pages.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Performance Details</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading performance data...</p>
            ) : performanceItems.length === 0 ? (
              <p className="text-muted-foreground">
                No projects or stories available yet.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type / Status</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {performanceItems.map((item) => {
                    const isProject = item.type === 'project';
                    const viewCount = item.views || 0;
                    const publicPath = isProject ? `/projects/${item.id}` : `/stories/${item.id}`;
                    const adminPath = isProject ? `/admin/projects/edit/${item.id}` : `/admin/stories/edit/${item.id}`;

                    return (
                      <TableRow key={`${item.type}-${item.id}`}>
                        <TableCell>
                          <div className="font-medium">{item.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {getCategoryLabel(item.category, categories)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-2">
                            <Badge variant={isProject ? 'secondary' : 'outline'}>
                              {isProject ? 'Project' : 'Story'}
                            </Badge>
                            {isProject && item.featured && (
                              <Badge variant="default">Featured</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Eye size={14} className="text-muted-foreground" />
                            <span>{viewCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link to={publicPath} target="_blank">
                              <Button variant="ghost" size="sm">
                                <ExternalLink size={16} />
                              </Button>
                            </Link>
                            <Link to={adminPath}>
                              <Button variant="outline" size="sm">
                                Edit
                              </Button>
                            </Link>
                          </div>
                        </TableCell>
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
