import { api } from './api';
import { Story } from '../types/story';

export type StoryPayload = Omit<Story, 'id'> & { id?: string };

export const getStories = async (): Promise<Story[]> => {
  return api.get<Story[]>('/stories');
};

export const getStory = async (id: string): Promise<Story | undefined> => {
  try {
    return await api.get<Story>(`/stories/${id}`);
  } catch (error) {
    return undefined;
  }
};

interface SaveStoryOptions {
  isNew?: boolean;
}

export const saveStory = async (story: StoryPayload, options: SaveStoryOptions = {}): Promise<Story> => {
  if (options.isNew || !story.id) {
    return api.post<Story>('/stories', story, { auth: true });
  }

  return api.put<Story>(`/stories/${story.id}`, story, { auth: true });
};

export const deleteStory = async (id: string): Promise<void> => {
  await api.delete(`/stories/${id}`, { auth: true });
};

export const incrementViews = async (id: string): Promise<void> => {
  await api.post(`/stories/${id}/view`);
};
