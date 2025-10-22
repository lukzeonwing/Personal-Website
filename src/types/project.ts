export interface ContentBlock {
  id: string;
  type: 'image' | 'text' | 'image-text';
  title?: string;
  description?: string;
  image?: string;
}

export interface ViewRecord {
  timestamp: number;
  ip: string;
  userAgent?: string;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  category: string;
  year: string;
  coverImage: string;
  images: string[];
  role: string;
  tools: string[];
  challenges: string;
  solution: string;
  outcome: string;
  contentBlocks: ContentBlock[];
  link?: string;
  featured: boolean;
  views: number;
  viewHistory?: ViewRecord[];
}
