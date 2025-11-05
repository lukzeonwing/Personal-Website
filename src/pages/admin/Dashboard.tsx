import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, getTotalViews, getMostViewedProjects } from '../../lib/projects';
import { getCategories } from '../../lib/categories';
import { updatePassword } from '../../lib/auth';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Checkbox } from '../../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { FolderOpen, Star, Plus, TrendingUp, Eye, Camera, ShieldCheck, Upload, Trash2 } from 'lucide-react';
import { Project } from '../../types/project';
import type { Category } from '../../lib/categories';
import { toast } from 'sonner';
import { getUnusedMedia, deleteUnusedMedia, formatFileSize, type UnusedMediaFile } from '../../lib/media';
import { uploadWorkshopGalleryImages } from '../../lib/uploads';

export function Dashboard() {
  const [stats, setStats] = useState({
    total: 0,
    featured: 0,
    totalViews: 0,
    averageViews: 0,
    byCategory: {} as Record<string, number>,
  });
  const [mostViewed, setMostViewed] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isGalleryDialogOpen, setIsGalleryDialogOpen] = useState(false);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [isUploadingGallery, setIsUploadingGallery] = useState(false);
  const [isCleanupDialogOpen, setIsCleanupDialogOpen] = useState(false);
  const [unusedMediaFiles, setUnusedMediaFiles] = useState<UnusedMediaFile[]>([]);
  const [isLoadingUnusedMedia, setIsLoadingUnusedMedia] = useState(false);
  const [isDeletingMedia, setIsDeletingMedia] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  
  useEffect(() => {
    let isMounted = true;

    const loadDashboard = async () => {
      try {
        const [categoryList, projectList] = await Promise.all([
          getCategories(),
          getProjects(),
        ]);

        if (!isMounted) return;

        setCategories(categoryList);

        const totalViews = getTotalViews(projectList);
        const featured = projectList.filter((p) => p.featured).length;
        const averageViews = projectList.length > 0 ? Math.round(totalViews / projectList.length) : 0;
        const byCategory = projectList.reduce((acc, project) => {
          acc[project.category] = (acc[project.category] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        setStats({
          total: projectList.length,
          featured,
          totalViews,
          averageViews,
          byCategory,
        });

        setMostViewed(getMostViewedProjects(projectList, 5));
      } catch (error) {
        console.error(error);
        toast.error('Failed to load dashboard data');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  const handlePasswordUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setIsUpdatingPassword(true);
      const message = await updatePassword(currentPassword, newPassword);
      toast.success(message || 'Password updated successfully');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setIsPasswordDialogOpen(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update password';
      toast.error(message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const readFileAsDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      reader.readAsDataURL(file);
    });

  const handleGalleryUpload = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (galleryFiles.length === 0) {
      toast.error('Select at least one image to upload');
      return;
    }

    setIsUploadingGallery(true);

    try {
      const filesPayload = await Promise.all(
        galleryFiles.map(async (file) => ({
          data: await readFileAsDataUrl(file),
          filename: file.name,
        })),
      );

      const uploaded = await uploadWorkshopGalleryImages(filesPayload);

      toast.success(`Uploaded ${uploaded.length} image${uploaded.length === 1 ? '' : 's'} to the workshop gallery`);
      setIsGalleryDialogOpen(false);
      setGalleryFiles([]);
    } catch (error) {
      console.error('Failed to upload workshop gallery images', error);
      const message = error instanceof Error ? error.message : 'Failed to upload images';
      toast.error(message);
    } finally {
      setIsUploadingGallery(false);
    }
  };

  const handleGalleryFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { files } = event.target;
    setGalleryFiles(files ? Array.from(files) : []);
  };

  const handleOpenCleanupDialog = async () => {
    setIsCleanupDialogOpen(true);
    setIsLoadingUnusedMedia(true);
    setSelectedFiles(new Set());
    
    try {
      const response = await getUnusedMedia();
      setUnusedMediaFiles(response.files);
      
      if (response.files.length === 0) {
        toast.success('No unused media files found!');
      } else {
        toast.info(`Found ${response.files.length} unused file(s) (${formatFileSize(response.totalSize)})`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load unused media';
      toast.error(message);
      setIsCleanupDialogOpen(false);
    } finally {
      setIsLoadingUnusedMedia(false);
    }
  };

  const handleToggleFile = (filePath: string) => {
    setSelectedFiles(prev => {
      const next = new Set(prev);
      if (next.has(filePath)) {
        next.delete(filePath);
      } else {
        next.add(filePath);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedFiles.size === unusedMediaFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(unusedMediaFiles.map(f => f.path)));
    }
  };

  const handleDeleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) {
      toast.error('No files selected');
      return;
    }

    setIsDeletingMedia(true);

    try {
      const filesToDelete = Array.from(selectedFiles);
      const response = await deleteUnusedMedia(filesToDelete);
      
      toast.success(response.message);
      
      if (response.failed.length > 0) {
        toast.warning(`Failed to delete ${response.failed.length} file(s)`);
      }
      
      // Refresh the list
      const updatedResponse = await getUnusedMedia();
      setUnusedMediaFiles(updatedResponse.files);
      setSelectedFiles(new Set());
      
      if (updatedResponse.files.length === 0) {
        setIsCleanupDialogOpen(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete files';
      toast.error(message);
    } finally {
      setIsDeletingMedia(false);
    }
  };
  
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl mb-2">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back! Here's an overview of your portfolio.
            </p>
          </div>
          <Link to="/admin/projects/new">
            <Button size="lg">
              <Plus className="mr-2" size={20} />
              New Project
            </Button>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Link to="/admin/projects">
            <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Total Projects</CardTitle>
                <FolderOpen className="text-muted-foreground" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{stats.total}</div>
                <p className="text-muted-foreground mt-1">Active projects</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/projects">
            <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Featured</CardTitle>
                <Star className="text-muted-foreground" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{stats.featured}</div>
                <p className="text-muted-foreground mt-1">On homepage</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/statistics">
            <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Total Views</CardTitle>
                <Eye className="text-muted-foreground" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{stats.totalViews}</div>
                <p className="text-muted-foreground mt-1">All time views</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link to="/admin/statistics">
            <Card className="transition-all hover:shadow-md hover:border-primary/50 cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Avg. Views</CardTitle>
                <TrendingUp className="text-muted-foreground" size={20} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl">{stats.averageViews}</div>
                <p className="text-muted-foreground mt-1">Per project</p>
              </CardContent>
            </Card>
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Link to="/admin/projects/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Plus className="mr-2" size={18} />
                  Create New Project
                </Button>
              </Link>
              <Link to="/admin/stories/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <Camera className="mr-2" size={18} />
                  Create New Story
                </Button>
              </Link>
              <Link to="/admin/projects" className="block">
                <Button variant="outline" className="w-full justify-start">
                  <FolderOpen className="mr-2" size={18} />
                  Manage Projects
                </Button>
              </Link>
              <Dialog
                open={isGalleryDialogOpen}
                onOpenChange={(open: boolean) => {
                  setIsGalleryDialogOpen(open);
                  if (!open) {
                    setGalleryFiles([]);
                    setIsUploadingGallery(false);
                  }
                }}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Upload className="mr-2" size={18} />
                    Upload Workshop Photos
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]" style={{ maxWidth: '450px' }}>
                  <DialogHeader>
                    <DialogTitle>Upload Workshop Gallery Photos</DialogTitle>
                    <DialogDescription>
                      Select one or more images to add them to the workshop gallery folder.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handleGalleryUpload}>
                    <div className="space-y-2">
                      <Label htmlFor="workshop-gallery-files">Choose Images</Label>
                      <Input
                        id="workshop-gallery-files"
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleGalleryFileChange}
                        disabled={isUploadingGallery}
                      />
                      <p className="text-sm text-muted-foreground">
                        Files are stored in <code>server/uploads/workshop</code> and appear on the workshop page.
                      </p>
                    </div>
                    <div>
                      {galleryFiles.length > 0 ? (
                        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
                          {galleryFiles.map((file) => (
                            <li key={`${file.name}-${file.lastModified}`}>
                              {file.name}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-muted-foreground">No images selected yet.</p>
                      )}
                    </div>
                    <DialogFooter className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsGalleryDialogOpen(false)}
                        disabled={isUploadingGallery}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUploadingGallery}>
                        {isUploadingGallery ? 'Uploading...' : 'Upload Images'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
              <Link to="/" className="block">
                <Button variant="outline" className="w-full justify-start">
                  View Live Site
                </Button>
              </Link>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Most Viewed Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : mostViewed.length > 0 ? (
                  mostViewed.map((project) => (
                    <div key={project.id} className="flex justify-between items-center">
                      <Link to={`/admin/projects/edit/${project.id}`} className="flex-1 hover:text-primary transition-colors">
                        <span className="truncate block">{project.title}</span>
                      </Link>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Eye size={14} />
                        <span>{project.views || 0}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No projects yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="mt-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Projects by Category</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-muted-foreground text-center py-6">Loading categories...</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {categories.map((category) => (
                    <div key={category.id} className="text-center p-4 border border-border rounded-lg">
                      <div className="text-2xl mb-1">{stats.byCategory[category.id] || 0}</div>
                      <p className="text-muted-foreground">{category.label}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck size={18} />
                Security
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Keep your dashboard secure by updating the admin password regularly.
              </p>
              <Dialog open={isPasswordDialogOpen} onOpenChange={(open: boolean) => {
                setIsPasswordDialogOpen(open);
                if (!open) {
                  setCurrentPassword('');
                  setNewPassword('');
                  setConfirmPassword('');
                  setIsUpdatingPassword(false);
                }
              }}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    Change Admin Password
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[450px]" style={{ maxWidth: '450px' }}>
                  <DialogHeader>
                    <DialogTitle>Update Admin Password</DialogTitle>
                    <DialogDescription>
                      Enter your current password and choose a new one with at least 8 characters.
                    </DialogDescription>
                  </DialogHeader>
                  <form className="space-y-4" onSubmit={handlePasswordUpdate}>
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={8}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      After updating, you will stay signed in on this device.
                    </p>
                    <DialogFooter className="flex gap-2 justify-end">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsPasswordDialogOpen(false)}
                        disabled={isUpdatingPassword}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isUpdatingPassword}>
                        {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 size={18} />
                Media Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Clean up unused media files to free up server storage space.
              </p>
              <Button className="w-full" variant="outline" onClick={handleOpenCleanupDialog}>
                <Trash2 className="mr-2" size={18} />
                Clean Unused Media
              </Button>

              <Dialog open={isCleanupDialogOpen} onOpenChange={(open: boolean) => {
                setIsCleanupDialogOpen(open);
                if (!open) {
                  setUnusedMediaFiles([]);
                  setSelectedFiles(new Set());
                  setIsLoadingUnusedMedia(false);
                  setIsDeletingMedia(false);
                }
              }}>
                <DialogContent className="sm:max-w-[700px] w-[95vw] max-h-[85vh] flex flex-col overflow-hidden">
                  <DialogHeader className="flex-shrink-0">
                    <DialogTitle>Clean Unused Media Files</DialogTitle>
                    <DialogDescription>
                      Review and delete media files that are not referenced in any projects or stories.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
                    {isLoadingUnusedMedia ? (
                      <div className="text-center py-8 text-muted-foreground">
                        Scanning for unused files...
                      </div>
                    ) : unusedMediaFiles.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        No unused media files found. All files are in use!
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between py-2 border-b">
                          <div className="flex items-center gap-2">
                            <Checkbox
                              id="select-all"
                              checked={selectedFiles.size === unusedMediaFiles.length && unusedMediaFiles.length > 0}
                              onCheckedChange={handleSelectAll}
                            />
                            <Label htmlFor="select-all" className="cursor-pointer">
                              Select All ({unusedMediaFiles.length} files, {formatFileSize(unusedMediaFiles.reduce((sum, f) => sum + f.size, 0))})
                            </Label>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {selectedFiles.size} selected
                          </span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-2 min-h-0" style={{ maxHeight: 'calc(85vh - 300px)' }}>
                          <div className="space-y-2 pb-2">
                            {unusedMediaFiles.map((file) => (
                              <div
                                key={file.path}
                                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                              >
                                <Checkbox
                                  id={`file-${file.path}`}
                                  checked={selectedFiles.has(file.path)}
                                  onCheckedChange={() => handleToggleFile(file.path)}
                                />
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <code className="text-sm font-mono truncate block">
                                      {file.filename}
                                    </code>
                                  </div>
                                  <div className="text-xs text-muted-foreground truncate">
                                    {file.path}
                                  </div>
                                </div>
                                <div className="text-sm text-muted-foreground whitespace-nowrap">
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                  <DialogFooter className="flex gap-2 justify-end flex-shrink-0">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsCleanupDialogOpen(false)}
                      disabled={isDeletingMedia}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      variant="destructive"
                      onClick={handleDeleteSelectedFiles}
                      disabled={isDeletingMedia || selectedFiles.size === 0 || isLoadingUnusedMedia}
                    >
                      {isDeletingMedia ? 'Deleting...' : `Delete ${selectedFiles.size} File(s)`}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
