import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, getTotalViews, getIPStats } from '../../lib/projects';
import { getCategories, getCategoryLabel } from '../../lib/categories';
import { getBannedIPs, banIP, unbanIP, isIPBanned } from '../../lib/bannedIps';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Eye, TrendingUp, ArrowLeft, ExternalLink, Clock, Globe, Shield, ShieldAlert, ShieldOff } from 'lucide-react';
import { Project, ViewRecord } from '../../types/project';
import type { Category } from '../../lib/categories';
import type { BannedIP } from '../../lib/bannedIps';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
import { toast } from 'sonner';

export function Statistics() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [bannedIPs, setBannedIPs] = useState<BannedIP[]>([]);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [selectedIP, setSelectedIP] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const totalViews = useMemo(() => getTotalViews(projects), [projects]);
  const averageViews = useMemo(
    () => (projects.length > 0 ? Math.round(totalViews / projects.length) : 0),
    [projects, totalViews]
  );
  const featuredViews = useMemo(
    () => projects.filter((project) => project.featured).reduce((sum, project) => sum + (project.views || 0), 0),
    [projects]
  );
  const regularViews = useMemo(() => totalViews - featuredViews, [totalViews, featuredViews]);
  const mostViewedProject = useMemo(() => (projects.length > 0 ? projects[0] : null), [projects]);
  const leastViewedProject = useMemo(
    () => (projects.length > 0 ? projects[projects.length - 1] : null),
    [projects]
  );
  const ipStats = useMemo(() => getIPStats(projects), [projects]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectList, categoryList, bannedList] = await Promise.all([
        getProjects(),
        getCategories(),
        getBannedIPs(),
      ]);

      const sorted = [...projectList].sort((a, b) => (b.views || 0) - (a.views || 0));
      setProjects(sorted);
      setCategories(categoryList);
      setBannedIPs(bannedList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load statistics data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBanIP = (ip: string) => {
    setSelectedIP(ip);
    setBanDialogOpen(true);
  };

  const confirmBan = async () => {
    if (selectedIP) {
      try {
        await banIP(selectedIP, 'Banned from admin panel');
        toast.success(`IP ${selectedIP} has been banned`);
        setBanDialogOpen(false);
        setSelectedIP(null);
        await loadData();
      } catch (error) {
        console.error(error);
        toast.error('Failed to ban IP');
      }
    }
  };

  const handleUnbanIP = async (ip: string) => {
    try {
      await unbanIP(ip);
      toast.success(`IP ${ip} has been unbanned`);
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to unban IP');
    }
  };



  const getCategoryStats = () => {
    const categoryMap = projects.reduce((acc, project) => {
      const cat = project.category;
      if (!acc[cat]) {
        acc[cat] = { count: 0, views: 0 };
      }
      acc[cat].count += 1;
      acc[cat].views += project.views || 0;
      return acc;
    }, {} as Record<string, { count: number; views: number }>);

    if (categories.length === 0) {
      return Object.entries(categoryMap).map(([category, data]) => ({
        category,
        label: getCategoryLabel(category),
        ...data,
        avgViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
      }));
    }

    return categories.map((category) => {
      const data = categoryMap[category.id] || { count: 0, views: 0 };
      return {
        category: category.id,
        label: category.label,
        ...data,
        avgViews: data.count > 0 ? Math.round(data.views / data.count) : 0,
      };
    });
  };

  const getViewsByTime = () => {
    const allViews: ViewRecord[] = [];
    projects.forEach(project => {
      if (project.viewHistory) {
        allViews.push(...project.viewHistory);
      }
    });

    // Group by hour for last 24 hours
    const now = Date.now();
    const last24Hours = now - 24 * 60 * 60 * 1000;
    const hourlyData: { [key: string]: number } = {};

    for (let i = 23; i >= 0; i--) {
      const hourStart = new Date(now - i * 60 * 60 * 1000);
      const key = hourStart.getHours().toString().padStart(2, '0') + ':00';
      hourlyData[key] = 0;
    }

    allViews.forEach(view => {
      if (view.timestamp >= last24Hours) {
        const date = new Date(view.timestamp);
        const key = date.getHours().toString().padStart(2, '0') + ':00';
        if (hourlyData[key] !== undefined) {
          hourlyData[key]++;
        }
      }
    });

    return Object.entries(hourlyData).map(([hour, views]) => ({
      hour,
      views,
    }));
  };

  const getViewsByDay = () => {
    const allViews: ViewRecord[] = [];
    projects.forEach(project => {
      if (project.viewHistory) {
        allViews.push(...project.viewHistory);
      }
    });

    // Group by day for last 7 days
    const now = Date.now();
    const dailyData: { [key: string]: number } = {};
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date(now - i * 24 * 60 * 60 * 1000);
      const key = days[dayStart.getDay()];
      dailyData[key] = 0;
    }

    allViews.forEach(view => {
      const date = new Date(view.timestamp);
      const key = days[date.getDay()];
      if (dailyData[key] !== undefined) {
        dailyData[key]++;
      }
    });

    return Object.entries(dailyData).map(([day, views]) => ({
      day,
      views,
    }));
  };

  const getRecentViews = () => {
    const allViews: Array<ViewRecord & { projectTitle: string; projectId: string }> = [];
    projects.forEach(project => {
      if (project.viewHistory) {
        project.viewHistory.forEach(view => {
          allViews.push({
            ...view,
            projectTitle: project.title,
            projectId: project.id,
          });
        });
      }
    });

    return allViews
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  };

  const categoryStats = getCategoryStats();
  const viewsByTime = getViewsByTime();
  const viewsByDay = getViewsByDay();
  const recentViews = getRecentViews();

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <Link to="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2" size={18} />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-4xl mb-2">Analytics & Statistics</h1>
          <p className="text-muted-foreground">
            Detailed insights into your portfolio performance
          </p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Total Views</CardTitle>
              <Eye className="text-muted-foreground" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{totalViews}</div>
              <p className="text-muted-foreground mt-1">All time</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Average Views</CardTitle>
              <TrendingUp className="text-muted-foreground" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{averageViews}</div>
              <p className="text-muted-foreground mt-1">Per project</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Featured Views</CardTitle>
              <Eye className="text-muted-foreground" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{featuredViews}</div>
              <p className="text-muted-foreground mt-1">
                {totalViews > 0 
                  ? `${Math.round((featuredViews / totalViews) * 100)}% of total`
                  : '0% of total'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle>Regular Views</CardTitle>
              <Eye className="text-muted-foreground" size={20} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl">{regularViews}</div>
              <p className="text-muted-foreground mt-1">
                {totalViews > 0 
                  ? `${Math.round((regularViews / totalViews) * 100)}% of total`
                  : '0% of total'}
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Top & Bottom Performers */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Highlights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {mostViewedProject && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-muted-foreground">Most Viewed Project</h4>
                    <Badge variant="default">Top Performer</Badge>
                  </div>
                  <Link 
                    to={`/admin/projects/edit/${mostViewedProject.id}`}
                    className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="mb-1">{mostViewedProject.title}</h3>
                        <p className="text-muted-foreground line-clamp-1">
                          {mostViewedProject.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Eye size={16} className="text-muted-foreground" />
                        <span>{mostViewedProject.views || 0}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}

              {leastViewedProject && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-muted-foreground">Needs Attention</h4>
                    <Badge variant="secondary">Low Views</Badge>
                  </div>
                  <Link 
                    to={`/admin/projects/edit/${leastViewedProject.id}`}
                    className="block p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="mb-1">{leastViewedProject.title}</h3>
                        <p className="text-muted-foreground line-clamp-1">
                          {leastViewedProject.description}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-4">
                        <Eye size={16} className="text-muted-foreground" />
                        <span>{leastViewedProject.views || 0}</span>
                      </div>
                    </div>
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Views by Category */}
          <Card>
            <CardHeader>
              <CardTitle>Views by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((cat) => (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center mb-2">
                      <span>{cat.label}</span>
                      <span className="text-muted-foreground">{cat.views} views</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full bg-primary progress-bar-${
                            totalViews > 0 ? Math.round((cat.views / totalViews) * 100) : 0
                          }`}
                        />
                      </div>
                      <span className="text-sm text-muted-foreground w-12 text-right">
                        {totalViews > 0 ? Math.round((cat.views / totalViews) * 100) : 0}%
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {cat.count} {cat.count === 1 ? 'project' : 'projects'} · Avg {cat.avgViews} views
                    </p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time-based Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Views by Hour (Last 24h) */}
          <Card>
            <CardHeader>
              <CardTitle>Views by Hour (Last 24h)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={viewsByTime}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="hour" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="views" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={2}
                      dot={{ fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Views by Day (Last 7 days) */}
          <Card>
            <CardHeader>
              <CardTitle>Views by Day (Last 7 days)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={viewsByDay}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="day" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        border: '2px solid hsl(var(--primary))',
                        borderRadius: '8px',
                        padding: '8px 12px',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      labelStyle={{
                        color: 'hsl(var(--foreground))',
                        fontWeight: 600,
                        marginBottom: '4px',
                      }}
                      itemStyle={{
                        color: 'hsl(var(--foreground))',
                        fontWeight: 500,
                      }}
                    />
                    <Bar 
                      dataKey="views" 
                      fill="hsl(var(--primary))"
                      fillOpacity={0.7}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* IP Security Management */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Most Active IPs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Most Active IP Addresses</CardTitle>
                <Shield className="text-muted-foreground" size={20} />
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>IP Address</TableHead>
                    <TableHead className="text-right">Views</TableHead>
                    <TableHead className="text-right">Last Seen</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipStats.slice(0, 10).map((ipStat) => {
                    const isBanned = isIPBanned(ipStat.ip, bannedIPs);
                    return (
                      <TableRow key={ipStat.ip}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-muted-foreground" />
                            <code className="text-sm">{ipStat.ip}</code>
                            {isBanned && (
                              <Badge variant="destructive" className="text-xs">
                                Banned
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="secondary">{ipStat.views}</Badge>
                        </TableCell>
                        <TableCell className="text-right text-sm text-muted-foreground">
                          {new Date(ipStat.lastView).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          {isBanned ? (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleUnbanIP(ipStat.ip)}
                            >
                              <ShieldOff size={14} className="mr-1" />
                              Unban
                            </Button>
                          ) : (
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleBanIP(ipStat.ip)}
                            >
                              <ShieldAlert size={14} className="mr-1" />
                              Ban
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {ipStats.length === 0 && (
                <div className="text-center text-muted-foreground py-8">
                  No IP data available yet
                </div>
              )}
            </CardContent>
          </Card>

          {/* Banned IPs */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Banned IP Addresses</CardTitle>
                <ShieldAlert className="text-destructive" size={20} />
              </div>
            </CardHeader>
            <CardContent>
              {bannedIPs.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  No banned IPs
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>IP Address</TableHead>
                      <TableHead>Banned Date</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {bannedIPs.map((banned) => (
                      <TableRow key={banned.ip}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Globe size={14} className="text-muted-foreground" />
                            <code className="text-sm">{banned.ip}</code>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {new Date(banned.bannedAt).toLocaleString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleUnbanIP(banned.ip)}
                          >
                            <ShieldOff size={14} className="mr-1" />
                            Unban
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Recent Views with IP Tracking */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Recent Views</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>User Agent</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentViews.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No views recorded yet
                    </TableCell>
                  </TableRow>
                ) : (
                  recentViews.map((view, index) => (
                    <TableRow key={`${view.timestamp}-${index}`}>
                      <TableCell>
                        <Link 
                          to={`/admin/projects/edit/${view.projectId}`}
                          className="hover:underline"
                        >
                          {view.projectTitle}
                        </Link>
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
                            {new Date(view.timestamp).toLocaleString()}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-muted-foreground line-clamp-1">
                          {view.userAgent || 'Unknown'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* All Projects Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Projects Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Views</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projects.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No projects yet
                    </TableCell>
                  </TableRow>
                ) : (
                  projects.map((project) => (
                    <TableRow key={project.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{project.title}</div>
                          <div className="text-sm text-muted-foreground line-clamp-1">
                            {project.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {getCategoryLabel(project.category)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {project.featured ? (
                          <Badge variant="default">Featured</Badge>
                        ) : (
                          <Badge variant="outline">Regular</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Eye size={14} className="text-muted-foreground" />
                          <span>{project.views || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/projects/${project.id}`} target="_blank">
                            <Button variant="ghost" size="sm">
                              <ExternalLink size={16} />
                            </Button>
                          </Link>
                          <Link to={`/admin/projects/edit/${project.id}`}>
                            <Button variant="outline" size="sm">
                              Edit
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Ban Confirmation Dialog */}
      <AlertDialog open={banDialogOpen} onOpenChange={setBanDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ban IP Address</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to ban <code className="font-semibold">{selectedIP}</code>? 
              This IP address will be blocked from viewing your projects.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Ban IP
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
