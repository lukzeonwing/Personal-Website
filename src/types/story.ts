import type { ViewRecord } from './project';

export interface ContentBlock {
  id: string;
  type: 'image' | 'text' | 'image-text';
  title?: string;
  description?: string;
  image?: string;
}

export interface Story {
  id: string;
  title: string;
  description: string;
  coverImage: string;
  images: string[];
  category: string;
  location: string;
  date: string;
  content: string;
  contentBlocks: ContentBlock[];
  views: number;
  viewHistory?: ViewRecord[];
}
