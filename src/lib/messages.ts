import { api } from './api';
import { Message } from '../types/message';

export const getMessages = async (): Promise<Message[]> => {
  return api.get<Message[]>('/messages', { auth: true });
};

export const addMessage = async (message: Omit<Message, 'id' | 'timestamp' | 'read'>): Promise<Message> => {
  return api.post<Message>('/messages', message);
};

export const markAsRead = async (id: string): Promise<Message> => {
  return api.patch<Message>(`/messages/${id}/read`, undefined, { auth: true });
};

export const deleteMessage = async (id: string): Promise<void> => {
  await api.delete(`/messages/${id}`, { auth: true });
};

export const getUnreadCount = (messages: Message[]): number => {
  return messages.filter((message) => !message.read).length;
};
