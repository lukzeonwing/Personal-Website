import { api } from './api';

export interface Category {
  id: string;
  label: string;
}

let cachedCategories: Category[] = [];

export const getCategories = async (): Promise<Category[]> => {
  const categories = await api.get<Category[]>('/categories');
  cachedCategories = categories;
  return categories;
};

export const addCategory = async (label: string): Promise<Category> => {
  const newCategory = await api.post<Category>('/categories', { label }, { auth: true });
  cachedCategories = [...cachedCategories, newCategory];
  return newCategory;
};

export const updateCategory = async (id: string, label: string): Promise<Category> => {
  const updated = await api.put<Category>(`/categories/${id}`, { label }, { auth: true });
  cachedCategories = cachedCategories.map((category) => (category.id === id ? updated : category));
  return updated;
};

export const deleteCategory = async (id: string): Promise<void> => {
  await api.delete(`/categories/${id}`, { auth: true });
  cachedCategories = cachedCategories.filter((category) => category.id !== id);
};

export const getCategoryLabel = (id: string, categories?: Category[]): string => {
  const source = categories ?? cachedCategories;
  const category = source.find((cat) => cat.id === id);
  return category?.label || id;
};
