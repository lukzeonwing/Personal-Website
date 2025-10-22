import type { Project, ViewRecord } from '../types/project';
import type { Story } from '../types/story';
import type { Category } from './categories';
import { getCategoryLabel } from './categories';

export interface CategoryStat {
  category: string;
  label: string;
  projectCount: number;
  storyCount: number;
  count: number;
  views: number;
  avgViews: number;
}

export interface RecentViewItem extends ViewRecord {
  itemTitle: string;
  itemId: string;
  itemType: 'project' | 'story';
  adminPath: string;
}

export interface PerformanceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  type: 'project' | 'story';
  featured: boolean;
  views: number;
}

export const buildCategoryStats = (
  projects: Project[],
  stories: Story[],
  categories: Category[] = []
): CategoryStat[] => {
  const categoryMap = new Map<
    string,
    { projectCount: number; storyCount: number; views: number }
  >();

  const ensureEntry = (categoryId: string) => {
    if (!categoryMap.has(categoryId)) {
      categoryMap.set(categoryId, { projectCount: 0, storyCount: 0, views: 0 });
    }
    return categoryMap.get(categoryId)!;
  };

  projects.forEach((project) => {
    const entry = ensureEntry(project.category);
    entry.projectCount += 1;
    entry.views += project.views || 0;
  });

  stories.forEach((story) => {
    const entry = ensureEntry(story.category);
    entry.storyCount += 1;
    entry.views += story.views || 0;
  });

  const stats: CategoryStat[] = [];
  const knownIds = new Set(categories.map((category) => category.id));

  categories.forEach((category) => {
    const data = categoryMap.get(category.id) ?? {
      projectCount: 0,
      storyCount: 0,
      views: 0,
    };
    const count = data.projectCount + data.storyCount;
    stats.push({
      category: category.id,
      label: category.label,
      projectCount: data.projectCount,
      storyCount: data.storyCount,
      count,
      views: data.views,
      avgViews: count > 0 ? Math.round(data.views / count) : 0,
    });
  });

  categoryMap.forEach((value, categoryId) => {
    if (!knownIds.has(categoryId)) {
      const count = value.projectCount + value.storyCount;
      stats.push({
        category: categoryId,
        label: getCategoryLabel(categoryId, categories),
        projectCount: value.projectCount,
        storyCount: value.storyCount,
        count,
        views: value.views,
        avgViews: count > 0 ? Math.round(value.views / count) : 0,
      });
    }
  });

  return stats.sort((a, b) => b.views - a.views);
};

export const collectRecentViews = (
  projects: Project[],
  stories: Story[]
): RecentViewItem[] => {
  const allViews: RecentViewItem[] = [];

  projects.forEach((project) => {
    if (project.viewHistory) {
      project.viewHistory.forEach((view) => {
        allViews.push({
          ...view,
          itemTitle: project.title,
          itemId: project.id,
          itemType: 'project',
          adminPath: `/admin/projects/edit/${project.id}`,
        });
      });
    }
  });

  stories.forEach((story) => {
    if (story.viewHistory) {
      story.viewHistory.forEach((view) => {
        allViews.push({
          ...view,
          itemTitle: story.title,
          itemId: story.id,
          itemType: 'story',
          adminPath: `/admin/stories/edit/${story.id}`,
        });
      });
    }
  });

  return allViews.sort((a, b) => b.timestamp - a.timestamp);
};

export const buildPerformanceItems = (
  projects: Project[],
  stories: Story[]
): PerformanceItem[] => {
  return [
    ...projects.map((project) => ({
      id: project.id,
      title: project.title,
      description: project.description,
      category: project.category,
      type: 'project' as const,
      featured: project.featured,
      views: project.views || 0,
    })),
    ...stories.map((story) => ({
      id: story.id,
      title: story.title,
      description: story.description,
      category: story.category,
      type: 'story' as const,
      featured: false,
      views: story.views || 0,
    })),
  ].sort((a, b) => b.views - a.views);
};

export const getTotalContentViews = (projects: Project[], stories: Story[]): number => {
  const projectViews = projects.reduce((sum, project) => sum + (project.views || 0), 0);
  const storyViews = stories.reduce((sum, story) => sum + (story.views || 0), 0);
  return projectViews + storyViews;
};
