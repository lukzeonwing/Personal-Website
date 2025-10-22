import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { getStory, saveStory, StoryPayload } from '../../lib/stories';
import { ContentBlock } from '../../types/story';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { FileUpload } from '../../components/FileUpload';
import { ArrowLeft, Plus, X, Image as ImageIcon, Type, Layers, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

export function EditStory() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    coverImage: '',
    category: '',
    location: '',
    date: '',
    content: '',
  });
  const [images, setImages] = useState<string[]>([]);
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [views, setViews] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!id) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadStory = async () => {
      try {
        const story = await getStory(id);
        if (!isMounted) return;

        if (story) {
          setFormData({
            title: story.title,
            description: story.description,
            coverImage: story.coverImage,
            category: story.category,
            location: story.location,
            date: story.date,
            content: story.content,
          });
          setImages(story.images || []);
          setContentBlocks(story.contentBlocks || []);
          setViews(story.views || 0);
        } else {
          toast.error('Story not found');
          navigate('/admin/stories');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to load story');
        navigate('/admin/stories');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadStory();

    return () => {
      isMounted = false;
    };
  }, [id, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      setIsSubmitting(true);

      const story: StoryPayload = {
        id,
        ...formData,
        images,
        contentBlocks,
        views,
      };

      await saveStory(story);
      toast.success('Story updated successfully!');
      navigate('/admin/stories');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update story');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddImage = () => {
    setImages([...images, '']);
  };

  const handleUpdateImage = (index: number, value: string) => {
    const newImages = [...images];
    newImages[index] = value;
    setImages(newImages);
  };

  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const addContentBlock = (type: ContentBlock['type']) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      title: '',
      description: '',
      image: '',
    };
    setContentBlocks([...contentBlocks, newBlock]);
    setEditingBlockId(newBlock.id);
  };

  const updateContentBlock = (id: string, updates: Partial<ContentBlock>) => {
    setContentBlocks(contentBlocks.map(block =>
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const removeContentBlock = (id: string) => {
    setContentBlocks(contentBlocks.filter(block => block.id !== id));
    if (editingBlockId === id) {
      setEditingBlockId(null);
    }
  };

  const moveContentBlock = (id: string, direction: 'up' | 'down') => {
    const index = contentBlocks.findIndex(block => block.id === id);
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === contentBlocks.length - 1)
    ) {
      return;
    }
    
    const newBlocks = [...contentBlocks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
    setContentBlocks(newBlocks);
  };

  const categories = [
    'Street Photography',
    'Portrait',
    'Landscape',
    'Travel',
    'Documentary',
    'Architecture',
    'Nature',
    'Urban',
    'Abstract',
    'Other'
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/stories')}
          className="mb-6"
        >
          <ArrowLeft size={16} className="mr-2" />
          Back to Stories
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Edit Story</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  placeholder="Enter story title"
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={3}
                  placeholder="Brief description of your story"
                />
              </div>
              
              {/* Category and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                    aria-label="Story category"
                    className="w-full h-10 px-3 rounded-md border border-input bg-background"
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Tokyo, Japan"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="date">Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>

              {/* Cover Image */}
              <div>
                <Label htmlFor="coverImage">Cover Image *</Label>
                <FileUpload
                  value={formData.coverImage}
                  onChange={(value) => setFormData({ ...formData, coverImage: value })}
                  placeholder="Enter image URL or upload/drag file"
                  showPreview={true}
                  entityType="story"
                  entityId={id ?? ''}
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Main image that will be displayed on the stories page
                </p>
              </div>

              {/* Gallery Images */}
              <div>
                <Label>Gallery Images</Label>
                <div className="space-y-3 mt-2">
                  {images.map((image, index) => (
                    <FileUpload
                      key={index}
                      value={image}
                      onChange={(value) => handleUpdateImage(index, value)}
                      onRemove={() => handleRemoveImage(index)}
                      placeholder="Enter image URL or upload/drag file"
                      entityType="story"
                      entityId={id ?? ''}
                    />
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAddImage}
                    className="w-full"
                  >
                    <Plus size={16} className="mr-2" />
                    Add Gallery Image
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Additional photos to display in the gallery section
                </p>
              </div>

              {/* Content Blocks */}
              <div>
                <Label>Content Blocks</Label>
                <p className="text-sm text-muted-foreground mb-3">
                  Add image and text sections to tell your story
                </p>
                
                {contentBlocks.length === 0 ? (
                  <div className="text-center py-8 border-2 border-dashed border-border rounded-lg">
                    <p className="text-muted-foreground mb-4">No content blocks yet</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('image')}>
                        <ImageIcon size={16} className="mr-2" />
                        Add Image
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('text')}>
                        <Type size={16} className="mr-2" />
                        Add Text
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('image-text')}>
                        <Layers size={16} className="mr-2" />
                        Add Image + Text
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-3">
                      {contentBlocks.map((block, index) => (
                        <div key={block.id} className="border border-border rounded-lg p-4">
                          <div className="flex items-start gap-3">
                            <div className="flex flex-col gap-1 pt-2">
                              <button
                                type="button"
                                onClick={() => moveContentBlock(block.id, 'up')}
                                disabled={index === 0}
                                aria-label="Move block up"
                                title="Move block up"
                                className="text-muted-foreground hover:text-foreground disabled:opacity-30"
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
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  {(block.type === 'text' || block.type === 'image-text') && (
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
                                        entityType="story"
                                        entityId={id ?? ''}
                                      />
                                    </div>
                                  )}
                                  
                                  <div className="flex gap-2">
                                    <Button
                                      type="button"
                                      size="sm"
                                      onClick={() => setEditingBlockId(null)}
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
                                  <div className="flex gap-2 mt-3">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => setEditingBlockId(block.id)}
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
                            >
                              <X size={16} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex flex-wrap gap-2 pt-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('image')}>
                        <ImageIcon size={16} className="mr-2" />
                        Add Image
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('text')}>
                        <Type size={16} className="mr-2" />
                        Add Text
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => addContentBlock('image-text')}>
                        <Layers size={16} className="mr-2" />
                        Add Image + Text
                      </Button>
                    </div>
                  </>
                )}
              </div>

              {/* Legacy Content Field */}
              <div>
                <Label htmlFor="content">Additional Notes (Optional)</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  placeholder="Add any additional notes or context about this story..."
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button type="submit" size="lg" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Update Story'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/admin/stories')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
