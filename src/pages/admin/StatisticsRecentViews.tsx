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
import type { Project } from '../../types/project';
import type { Story } from '../../types/story';
import { collectRecentViews, type RecentViewItem } from '../../lib/statistics';
import { toast } from 'sonner';
import { Clock, Globe, ArrowLeft } from 'lucide-react';

export function StatisticsRecentViews() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const userTimeZone = useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );

  const dateTimeFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        timeZone: userTimeZone,
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZoneName: 'short',
        hour12: false,
      }),
    [userTimeZone]
  );

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectList, storyList] = await Promise.all([
        getProjects(),
        getStories(),
      ]);

      setProjects(projectList);
      setStories(storyList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load recent views');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const recentViews: RecentViewItem[] = useMemo(
    () => collectRecentViews(projects, stories),
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
          <h1 className="text-4xl mb-2">Recent Views</h1>
          <p className="text-muted-foreground">
            Complete activity log for project and story views ({userTimeZone} timezone).
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Latest Views</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <p className="text-muted-foreground">Loading recent views...</p>
            ) : recentViews.length === 0 ? (
              <p className="text-muted-foreground">No view activity recorded yet.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Content</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Time</TableHead>
                    <TableHead>User Agent</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentViews.map((view, index) => (
                    <TableRow key={`${view.itemType}-${view.itemId}-${view.timestamp}-${index}`}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge variant={view.itemType === 'project' ? 'secondary' : 'outline'}>
                            {view.itemType === 'project' ? 'Project' : 'Story'}
                          </Badge>
                          <Link to={view.adminPath} className="hover:underline">
                            {view.itemTitle}
                          </Link>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Globe size={14} className="text-muted-foreground" />
                          <code className="text-sm">{view.ip}</code>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-muted-foreground" />
                          <span className="text-sm">
                            {dateTimeFormatter.format(view.timestamp)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {view.userAgent || 'Unknown'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
