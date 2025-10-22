import { api } from './api';

type UploadEntityType = 'project' | 'story' | 'site';

interface UploadRequestBody {
  data: string;
  filename?: string;
  entityType: UploadEntityType;
  entityId: string;
}

interface UploadResponse {
  url: string;
}

interface UploadOptions {
  filename?: string;
  entityType: UploadEntityType;
  entityId: string;
}

interface WorkshopGalleryUploadFile {
  data: string;
  filename?: string;
}

export interface WorkshopGalleryFile {
  filename: string;
  url: string;
}

interface WorkshopGalleryResponse {
  files: WorkshopGalleryFile[];
}

export const uploadImage = async (dataUrl: string, options: UploadOptions): Promise<string> => {
  const body: UploadRequestBody = {
    data: dataUrl,
    filename: options.filename,
    entityType: options.entityType,
    entityId: options.entityId,
  };

  const response = await api.post<UploadResponse>('/uploads', body, { auth: true });
  return response.url;
};

export const uploadWorkshopGalleryImages = async (
  files: WorkshopGalleryUploadFile[],
): Promise<WorkshopGalleryFile[]> => {
  const response = await api.post<WorkshopGalleryResponse>(
    '/workshop/gallery',
    { files },
    { auth: true },
  );

  return response.files;
};

export const fetchWorkshopGalleryImages = async (): Promise<WorkshopGalleryFile[]> => {
  const response = await api.get<WorkshopGalleryResponse>('/workshop/gallery');
  return response.files;
};
