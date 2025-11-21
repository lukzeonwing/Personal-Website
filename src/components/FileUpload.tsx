import { useRef, useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Upload, X } from 'lucide-react';
import { uploadImage } from '../lib/uploads';
import { resolveMediaUrl } from '../lib/api';

interface FileUploadProps {
  value: string;
  onChange: (value: string) => void;
  onRemove?: () => void;
  accept?: string;
  placeholder?: string;
  showPreview?: boolean;
  entityType: 'project' | 'story' | 'site';
  entityId: string;
}

export function FileUpload({ 
  value, 
  onChange, 
  onRemove,
  accept = "image/*",
  placeholder = "Enter image URL or upload file",
  showPreview = false,
  entityType,
  entityId,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const typePrefix = accept.split('/')[0]; // 'image' or 'video'
    if (file && file.type.startsWith(typePrefix)) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        void handleUpload(result, file.name);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async (dataUrl: string, fileName?: string) => {
    const trimmedEntityId = entityId.trim();
    if (!trimmedEntityId) {
      setError('Missing upload destination. Please save and retry.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      const uploadedUrl = await uploadImage(dataUrl, {
        filename: fileName,
        entityType,
        entityId: trimmedEntityId,
      });
      onChange(uploadedUrl);
    } catch (err) {
      console.error('Failed to upload file', err);
      setError('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      const typePrefix = accept.split('/')[0];
      if (file.type.startsWith(typePrefix)) {
        processFile(file);
      }
    }
  };

  const previewSrc =
    value && !value.startsWith('data:')
      ? resolveMediaUrl(value) ?? value
      : value;

  return (
    <div className="space-y-2">
      <div 
        className={`flex gap-2 p-3 border-2 border-dashed rounded-lg transition-colors ${
          isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className="flex-1">
          <Input
            type="text"
            value={value.startsWith('data:') ? '' : value}
            onChange={(e) => {
              setError(null);
              onChange(e.target.value);
            }}
            placeholder={placeholder}
            disabled={isUploading}
            className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
          />
          {isDragging && (
            <p className="text-xs text-muted-foreground mt-1 px-3">
              Drop file here
            </p>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
          title="Upload file"
          placeholder="Choose a file"
        />
        <div className="flex gap-2 items-start">
          <Button
            type="button"
            variant="outline"
            disabled={isUploading}
            onClick={handleBrowseClick}
            scrollToTopOnClick={false}
          >
            <Upload size={16} className="mr-2" />
            Browse
          </Button>
          {onRemove && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              disabled={isUploading}
              onClick={onRemove}
              scrollToTopOnClick={false}
            >
              <X size={16} />
            </Button>
          )}
        </div>
      </div>
      {isUploading && (
        <p className="text-xs text-muted-foreground">
          Uploading...
        </p>
      )}
      {error && (
        <p className="text-xs text-destructive">
          {error}
        </p>
      )}
      {showPreview && value && (
        <div className="relative aspect-video w-full max-w-xs rounded-lg overflow-hidden bg-muted">
          {accept.startsWith('video') ? (
            <video
              src={typeof previewSrc === 'string' ? previewSrc : undefined}
              controls
              className="w-full h-full object-cover"
            />
          ) : (
            <img 
              src={typeof previewSrc === 'string' ? previewSrc : undefined} 
              alt="Preview" 
              className="w-full h-full object-cover"
            />
          )}
        </div>
      )}
    </div>
  );
}
