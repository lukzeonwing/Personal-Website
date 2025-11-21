import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, ContentBlock } from '../types/project';
import { getCategories } from '../lib/categories';
import type { Category } from '../lib/categories';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Switch } from './ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { FileUpload } from './FileUpload';
import { X, GripVertical, Image as ImageIcon, Type, Layers, Video } from 'lucide-react';
import { toast } from 'sonner';
import { resolveMediaUrl } from '../lib/api';

const sanitizeIdFromTitle = (title: string): string => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

interface ProjectFormProps {
  project?: Project;
  onSubmit: (project: Omit<Project, 'id'> | Project) => Promise<void>;
}

export function ProjectForm({ project, onSubmit }: ProjectFormProps) {
  const navigate = useNavigate();
  const generateClientId = () =>
    `proj_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  const [defaultProjectId] = useState(() => project?.id ?? generateClientId());

  const [formData, setFormData] = useState<Omit<Project, 'id'>>({
    title: project?.title || '',
    description: project?.description || '',
    category: project?.category || 'industrial-design',
    year: project?.year || new Date().getFullYear().toString(),
    coverImage: project?.coverImage || '',
    images: project?.images || [],
    role: project?.role || '',
    tools: project?.tools || [],
    challenges: project?.challenges || '',
    solution: project?.solution || '',
    contentBlocks: project?.contentBlocks || [],
    link: project?.link || '',
    featured: project?.featured || false,
    views: project?.views || 0,
  });
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [currentImage, setCurrentImage] = useState('');
  const [currentTool, setCurrentTool] = useState('');
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    let isMounted = true;

    const loadCategories = async () => {
      try {
        const fetched = await getCategories();
        if (!isMounted) return;
        setCategories(fetched);
        setFormData((prev) => {
          if (fetched.some((category) => category.id === prev.category)) {
            return prev;
          }
          const fallback = fetched[0]?.id ?? prev.category;
          return { ...prev, category: fallback as Project['category'] };
        });
      } catch (error) {
        console.error(error);
        toast.error('Failed to load categories');
      } finally {
        if (isMounted) {
          setIsLoadingCategories(false);
        }
      }
    };

    loadCategories();

    return () => {
      isMounted = false;
    };
  }, []);
  
  const sanitizedProjectId = sanitizeIdFromTitle(formData.title);
  const computedProjectId = project?.id ?? (sanitizedProjectId || defaultProjectId);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      await onSubmit({ ...formData, id: computedProjectId });
      navigate('/admin/projects');
    } catch (error) {
      console.error(error);
      toast.error('Failed to save project');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const removeImage = (index: number) => {
    setFormData({ ...formData, images: formData.images.filter((_, i) => i !== index) });
  };
  
  const addTool = () => {
    if (currentTool.trim()) {
      setFormData({ ...formData, tools: [...formData.tools, currentTool.trim()] });
      setCurrentTool('');
    }
  };
  
  const removeTool = (index: number) => {
    setFormData({ ...formData, tools: formData.tools.filter((_, i) => i !== index) });
  };
  
  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      title: '',
      description: '',
      image: '',
      video: '',
    };
    setFormData({ ...formData, contentBlocks: [...formData.contentBlocks, newBlock] });
    setEditingBlockId(newBlock.id);
  };
  
  const updateContentBlock = (id: string, updates: Partial<ContentBlock>) => {
    setFormData({
      ...formData,
      contentBlocks: formData.contentBlocks.map(block =>
        block.id === id ? { ...block, ...updates } : block
      ),
    });
  };
  
  const removeContentBlock = (id: string) => {
    setFormData({
      ...formData,
      contentBlocks: formData.contentBlocks.filter(block => block.id !== id),
    });
    if (editingBlockId === id) {
      setEditingBlockId(null);
    }
  };
  
  const moveContentBlock = (id: string, direction: 'up' | 'down') => {
    const index = formData.contentBlocks.findIndex(block => block.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === formData.contentBlocks.length - 1)
    ) {
      return;
    }
    
    const newBlocks = [...formData.contentBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setFormData({ ...formData, contentBlocks: newBlocks });
  };
  
  return (
    <form onSubmit={handleSubmit} className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="title">Project Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: string) => setFormData({ ...formData, category: value as Project['category'] })}
                disabled={isLoadingCategories || categories.length === 0}
              >
                <SelectTrigger id="category">
                  <SelectValue placeholder={isLoadingCategories ? 'Loading...' : 'Select category'} />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                id="year"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                required
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="role">Your Role</Label>
            <Input
              id="role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            />
          </div>
          
          <div>
            <Label htmlFor="link">Project Link (optional)</Label>
            <Input
              id="link"
              type="url"
              value={formData.link}
              onChange={(e) => setFormData({ ...formData, link: e.target.value })}
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="featured">Featured Project</Label>
              <p className="text-muted-foreground">Display on homepage</p>
            </div>
            <Switch
              id="featured"
              checked={formData.featured}
              onCheckedChange={(checked: boolean) => setFormData({ ...formData, featured: checked })}
            />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Images</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="coverImage">Cover Image</Label>
            <FileUpload
              value={formData.coverImage}
              onChange={(value) => setFormData({ ...formData, coverImage: value })}
              placeholder="Enter image URL or upload/drag file"
              showPreview={true}
              entityType="project"
              entityId={computedProjectId}
            />
          </div>
          
          <div>
            <Label>Additional Images</Label>
            <div className="space-y-3">
              {formData.images.length > 0 && (
                <div className="space-y-2">
                  {formData.images.map((img, index) => {
                    const previewSrc =
                      typeof img === 'string' ? resolveMediaUrl(img) ?? img : img
                    return (
                      <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                        {img && (
                          <div className="w-16 h-16 rounded overflow-hidden bg-background flex-shrink-0">
                            <img
                              src={typeof previewSrc === 'string' ? previewSrc : undefined}
                              alt={`Image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <span className="flex-1 truncate text-sm text-muted-foreground">
                          {img.startsWith('data:') ? 'Uploaded image' : img}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeImage(index)}
                          scrollToTopOnClick={false}
                        >
                          <X size={16} />
                        </Button>
                      </div>
                    )
                  })}
                </div>
              )}
              
              <FileUpload
                value={currentImage}
                onChange={(value) => {
                  if (value) {
                    setFormData({ ...formData, images: [...formData.images, value] });
                    setCurrentImage('');
                  }
                }}
                placeholder="Add more images by URL or upload/drag"
                entityType="project"
                entityId={computedProjectId}
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Tools & Technologies</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={currentTool}
              onChange={(e) => setCurrentTool(e.target.value)}
              placeholder="e.g., Figma, Rhino, Blender"
            />
            <Button type="button" onClick={addTool} scrollToTopOnClick={false}>
              Add
            </Button>
          </div>
          {formData.tools.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {formData.tools.map((tool, index) => (
                <div key={index} className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full">
                  <span>{tool}</span>
                  <button
                    type="button"
                    onClick={() => removeTool(index)}
                    className="hover:text-destructive"
                    aria-label={`Remove ${tool}`}
                    title={`Remove ${tool}`}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="challenges">Challenges</Label>
            <Textarea
              id="challenges"
              value={formData.challenges}
              onChange={(e) => setFormData({ ...formData, challenges: e.target.value })}
              required
              rows={4}
            />
          </div>
          
          <div>
            <Label htmlFor="solution">Solution</Label>
            <Textarea
              id="solution"
              value={formData.solution}
              onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
              required
              rows={4}
            />
          </div>
          
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Content Blocks</CardTitle>
          <p className="text-muted-foreground">Add image and text sections to tell your project story</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {formData.contentBlocks.length === 0 ? (
            <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
              <p className="text-muted-foreground mb-4">No content blocks yet</p>
              <div className="flex flex-wrap gap-2 justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('image')}
                  scrollToTopOnClick={false}
                >
                  <ImageIcon size={16} className="mr-2" />
                  Add Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('text')}
                  scrollToTopOnClick={false}
                >
                  <Type size={16} className="mr-2" />
                  Add Text
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('image-text')}
                  scrollToTopOnClick={false}
                >
                  <Layers size={16} className="mr-2" />
                  Add Image + Text
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('video')}
                  scrollToTopOnClick={false}
                >
                  <Video size={16} className="mr-2" />
                  Add Video
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-3">
                {formData.contentBlocks.map((block, index) => (
                  <div key={block.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex flex-col gap-1 pt-2">
                        <button
                          type="button"
                          onClick={() => moveContentBlock(block.id, 'up')}
                          disabled={index === 0}
                          className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                          aria-label="Move block up"
                          title="Move block up"
                        >
                          <GripVertical size={18} />
                        </button>
                      </div>
                      
                      <div className="flex-1">
                        {editingBlockId === block.id ? (
                          <div className="space-y-3">
                            <div>
                              <Label>Block Type</Label>
                              <Select
                                value={block.type}
                                onValueChange={(value: ContentBlock['type']) =>
                                  updateContentBlock(block.id, { type: value })
                                }
                              >
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="image">Image Only</SelectItem>
                                  <SelectItem value="text">Text Only</SelectItem>
                                  <SelectItem value="image-text">Image + Text</SelectItem>
                                  <SelectItem value="video">Video</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            
                            {(block.type === 'text' || block.type === 'image-text' || block.type === 'video') && (
                              <>
                                <div>
                                  <Label>Title (optional)</Label>
                                  <Input
                                    value={block.title || ''}
                                    onChange={(e) =>
                                      updateContentBlock(block.id, { title: e.target.value })
                                    }
                                    placeholder="Section title"
                                  />
                                </div>
                                <div>
                                  <Label>Description</Label>
                                  <Textarea
                                    value={block.description || ''}
                                    onChange={(e) =>
                                      updateContentBlock(block.id, { description: e.target.value })
                                    }
                                    placeholder="Section content"
                                    rows={4}
                                  />
                                </div>
                              </>
                            )}
                            
                            {(block.type === 'image' || block.type === 'image-text') && (
                              <div>
                                <Label>Image</Label>
                                <FileUpload
                                  value={block.image || ''}
                                  onChange={(value) => updateContentBlock(block.id, { image: value })}
                                  placeholder="Enter image URL or upload/drag file"
                                  showPreview={true}
                                  entityType="project"
                                  entityId={computedProjectId}
                                />
                              </div>
                            )}

                            {block.type === 'video' && (
                              <div>
                                <Label>Video</Label>
                                <FileUpload
                                  value={block.video || ''}
                                  onChange={(value) => updateContentBlock(block.id, { video: value })}
                                  placeholder="Enter video URL or upload/drag file"
                                  showPreview={true}
                                  entityType="project"
                                  entityId={computedProjectId}
                                  accept="video/*"
                                />
                              </div>
                            )}
                            
                            <div className="flex gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => setEditingBlockId(null)}
                                scrollToTopOnClick={false}
                              >
                                Done
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              {block.type === 'image' && <ImageIcon size={16} className="text-muted-foreground" />}
                              {block.type === 'text' && <Type size={16} className="text-muted-foreground" />}
                              {block.type === 'image-text' && <Layers size={16} className="text-muted-foreground" />}
                              {block.type === 'video' && <Video size={16} className="text-muted-foreground" />}
                              <span className="capitalize text-muted-foreground">
                                {block.type.replace('-', ' + ')}
                              </span>
                            </div>
                            {block.title && <h4 className="mb-1">{block.title}</h4>}
                            {block.description && (
                              <p className="text-muted-foreground line-clamp-2">{block.description}</p>
                            )}
                            {block.image && (
                              <p className="text-muted-foreground truncate mt-1">
                                Image: {block.image.startsWith('data:') ? 'Uploaded image' : block.image}
                              </p>
                            )}
                            {block.video && (
                              <p className="text-muted-foreground truncate mt-1">
                                Video: {block.video.startsWith('data:') ? 'Uploaded video' : block.video}
                              </p>
                            )}
                            <div className="flex gap-2 mt-3">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setEditingBlockId(block.id)}
                                scrollToTopOnClick={false}
                              >
                                Edit
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeContentBlock(block.id)}
                        scrollToTopOnClick={false}
                      >
                        <X size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="flex flex-wrap gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('image')}
                  scrollToTopOnClick={false}
                >
                  <ImageIcon size={16} className="mr-2" />
                  Add Image
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('text')}
                  scrollToTopOnClick={false}
                >
                  <Type size={16} className="mr-2" />
                  Add Text
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('image-text')}
                  scrollToTopOnClick={false}
                >
                  <Layers size={16} className="mr-2" />
                  Add Image + Text
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => addContentBlock('video')}
                  scrollToTopOnClick={false}
                >
                  <Video size={16} className="mr-2" />
                  Add Video
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      <div className="flex gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : project ? 'Update Project' : 'Create Project'}
        </Button>
        <Button type="button" variant="outline" size="lg" onClick={() => navigate('/admin/projects')}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
