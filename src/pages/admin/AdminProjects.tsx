import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProjects, deleteProject, toggleFeatured } from '../../lib/projects';
import { getCategories, addCategory, updateCategory, deleteCategory, getCategoryLabel } from '../../lib/categories';
import { Project } from '../../types/project';
import type { Category } from '../../lib/categories';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Star, Tag, Book, AlertTriangle } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../components/ui/dialog';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { ImageWithFallback } from '../../components/figma/ImageWithFallback';
import { toast } from 'sonner';

export function AdminProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategoryLabel, setNewCategoryLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLabel, setEditingLabel] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    loadData();
  }, []);
  
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [projectList, categoryList] = await Promise.all([
        getProjects(),
        getCategories(),
      ]);
      setProjects(projectList);
      setCategories(categoryList);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load projects');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success('Project deleted successfully');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to delete project');
    }
  };
  
  const handleToggleFeatured = async (id: string) => {
    try {
      await toggleFeatured(id);
      toast.success('Featured status updated');
      await loadData();
    } catch (error) {
      console.error(error);
      toast.error('Failed to update featured status');
    }
  };

  const getProjectCountByCategory = (categoryId: string) => {
    return projects.filter(p => p.category === categoryId).length;
  };

  const handleAddCategory = async () => {
    if (!newCategoryLabel.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      await addCategory(newCategoryLabel.trim());
      toast.success('Category added successfully');
      setNewCategoryLabel('');
      setIsAddDialogOpen(false);
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add category');
    }
  };

  const handleUpdateCategory = async (id: string) => {
    if (!editingLabel.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      await updateCategory(id, editingLabel.trim());
      toast.success('Category updated successfully');
      setEditingId(null);
      setEditingLabel('');
      await loadData();
    } catch (error) {
      toast.error('Failed to update category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      const projectCount = getProjectCountByCategory(id);
      if (projectCount > 0) {
        toast.error(`Cannot delete category with ${projectCount} project(s). Reassign projects first.`);
        return;
      }

      await deleteCategory(id);
      toast.success('Category deleted successfully');
      await loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete category');
    }
  };
  
  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl mb-2">Manage Projects</h1>
            <p className="text-muted-foreground">
              Add, edit, or remove projects and manage categories.
            </p>
          </div>
          <Link to="/admin/projects/new">
            <Button size="lg">
              <Plus className="mr-2" size={20} />
              New Project
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="projects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="projects">
              <Book className="mr-2" size={16} />
              Projects
            </TabsTrigger>
            <TabsTrigger value="categories">
              <Tag className="mr-2" size={16} />
              Categories
            </TabsTrigger>
          </TabsList>

          <TabsContent value="projects" className="space-y-6">
            {isLoading ? (
              <Card className="p-12 text-center">
                <p className="text-xl text-muted-foreground">Loading projects...</p>
              </Card>
            ) : projects.length === 0 ? (
              <Card className="p-12 text-center">
                <p className="text-xl text-muted-foreground mb-4">No projects yet</p>
                <Link to="/admin/projects/new">
                  <Button>Create Your First Project</Button>
                </Link>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map(project => (
                  <Card key={project.id} className="overflow-hidden flex flex-col">
                    <div className="aspect-[4/3] overflow-hidden bg-muted">
                      <ImageWithFallback
                        src={project.coverImage}
                        alt={project.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{getCategoryLabel(project.category, categories)}</Badge>
                          {project.featured && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <Star size={12} />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleFeatured(project.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Star
                            size={16}
                            className={project.featured ? 'fill-current text-yellow-500' : ''}
                          />
                        </Button>
                      </div>
                      <h3 className="mb-1">{project.title}</h3>
                      <p className="text-muted-foreground line-clamp-2 mb-3 flex-1">
                        {project.description}
                      </p>
                      <div className="flex gap-2">
                        <Link to={`/admin/projects/edit/${project.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            <Edit className="mr-2" size={14} />
                            Edit
                          </Button>
                        </Link>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Trash2 size={14} />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Delete Project</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete "{project.title}"? This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(project.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl mb-1">Project Categories</h2>
                <p className="text-muted-foreground">
                  Manage the categories available for organizing your projects.
                </p>
              </div>
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="mr-2" size={18} />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Category</DialogTitle>
                    <DialogDescription>
                      Create a new category for organizing your projects.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div>
                      <Label htmlFor="new-category">Category Name</Label>
                      <Input
                        id="new-category"
                        value={newCategoryLabel}
                        onChange={(e) => setNewCategoryLabel(e.target.value)}
                        placeholder="e.g., Web Design"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleAddCategory();
                          }
                        }}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleAddCategory}>Add Category</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <div className="p-6">
                  <h3 className="mb-4">All Categories</h3>
                  <div className="space-y-3">
                    {categories.map((category) => {
                      const projectCount = getProjectCountByCategory(category.id);
                      const isEditing = editingId === category.id;

                      return (
                        <div
                          key={category.id}
                          className="flex items-center justify-between p-3 border border-border rounded-lg"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <Tag className="text-muted-foreground flex-shrink-0" size={18} />
                            {isEditing ? (
                              <Input
                                value={editingLabel}
                                onChange={(e) => setEditingLabel(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    handleUpdateCategory(category.id);
                                  } else if (e.key === 'Escape') {
                                    setEditingId(null);
                                    setEditingLabel('');
                                  }
                                }}
                                className="max-w-xs"
                                autoFocus
                              />
                            ) : (
                              <div className="flex-1">
                                <div>{category.label}</div>
                                <p className="text-muted-foreground">
                                  {projectCount} {projectCount === 1 ? 'project' : 'projects'}
                                </p>
                              </div>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {isEditing ? (
                              <>
                                <Button
                                  size="sm"
                                  onClick={() => handleUpdateCategory(category.id)}
                                >
                                  Save
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingLabel('');
                                  }}
                                >
                                  Cancel
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setEditingId(category.id);
                                    setEditingLabel(category.label);
                                  }}
                                >
                                  <Edit size={16} />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <Trash2 size={16} />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Delete Category</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        {projectCount > 0 ? (
                                          <div className="space-y-2">
                                            <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                                              <AlertTriangle className="text-destructive flex-shrink-0 mt-0.5" size={18} />
                                              <div>
                                                <p className="font-medium text-destructive">Cannot delete this category</p>
                                                <p className="text-sm text-muted-foreground mt-1">
                                                  This category has {projectCount} {projectCount === 1 ? 'project' : 'projects'}.
                                                  Please reassign or delete {projectCount === 1 ? 'it' : 'them'} first.
                                                </p>
                                              </div>
                                            </div>
                                          </div>
                                        ) : (
                                          `Are you sure you want to delete "${category.label}"? This action cannot be undone.`
                                        )}
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                                      {projectCount === 0 && (
                                        <AlertDialogAction
                                          onClick={() => handleDeleteCategory(category.id)}
                                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                        >
                                          Delete
                                        </AlertDialogAction>
                                      )}
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card>
                <div className="p-6">
                  <h3 className="mb-4">Category Usage</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => {
                      const count = getProjectCountByCategory(category.id);
                      return (
                        <div
                          key={category.id}
                          className="text-center p-4 border border-border rounded-lg"
                        >
                          <div className="text-2xl mb-1">{count}</div>
                          <p className="text-muted-foreground">{category.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
