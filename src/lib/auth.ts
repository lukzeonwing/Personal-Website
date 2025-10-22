import { api, storeAuthToken, clearAuthToken, AUTH_STORAGE_KEY } from './api';

interface LoginResponse {
  token: string;
}

export const login = async (password: string): Promise<boolean> => {
  const response = await api.post<LoginResponse>('/auth/login', { password });
  storeAuthToken(response.token);
  return true;
};

export const logout = (): void => {
  clearAuthToken();
};

export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return Boolean(localStorage.getItem(AUTH_STORAGE_KEY));
};

interface UpdatePasswordResponse {
  message: string;
}

export const updatePassword = async (currentPassword: string, newPassword: string): Promise<string> => {
  const response = await api.put<UpdatePasswordResponse>(
    '/auth/password',
    { currentPassword, newPassword },
    { auth: true },
  );
  return response.message;
};
