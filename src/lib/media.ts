import { api } from './api';

export interface UnusedMediaFile {
  filename: string;
  path: string;
  size: number;
  url: string;
}

export interface UnusedMediaResponse {
  files: UnusedMediaFile[];
  count: number;
  totalSize: number;
}

export interface DeleteMediaResponse {
  message: string;
  deleted: string[];
  failed: Array<{ path: string; reason: string }>;
}

export const getUnusedMedia = async (): Promise<UnusedMediaResponse> => {
  return api.get<UnusedMediaResponse>('/media/unused', { auth: true });
};

export const deleteUnusedMedia = async (filePaths: string[]): Promise<DeleteMediaResponse> => {
  // Using POST instead of DELETE since we need to send a body
  return api.post<DeleteMediaResponse>('/media/unused/delete', { files: filePaths }, { auth: true });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
};
