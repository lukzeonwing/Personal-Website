const DEFAULT_API_PORT = import.meta.env.VITE_API_PORT || '4000';

function resolveApiBase(): string {
  const configured = import.meta.env.VITE_API_URL;
  if (typeof configured === 'string' && configured.trim().length > 0) {
    return configured.replace(/\/$/, '');
  }

  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    const portSegment = DEFAULT_API_PORT ? `:${DEFAULT_API_PORT}` : '';
    return `${protocol}//${hostname}${portSegment}/api`.replace(/\/$/, '');
  }

  return `http://localhost:${DEFAULT_API_PORT}/api`;
}

const API_BASE = resolveApiBase();

const API_BASE_URL = (() => {
  try {
    return new URL(API_BASE);
  } catch (error) {
    try {
      if (typeof window !== 'undefined') {
        return new URL(API_BASE, window.location.origin);
      }
      return new URL(API_BASE, `http://localhost:${DEFAULT_API_PORT}`);
    } catch {
      return null;
    }
  }
})();

const API_ORIGIN =
  API_BASE_URL ? `${API_BASE_URL.protocol}//${API_BASE_URL.host}` : '';

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const AUTH_STORAGE_KEY = 'portfolio_token';

function getAuthToken(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }
  return localStorage.getItem(AUTH_STORAGE_KEY);
}

export function storeAuthToken(token: string) {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, token);
}

export function clearAuthToken() {
  if (typeof window === 'undefined') {
    return;
  }
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth, headers, ...rest } = options;
  const finalHeaders = new Headers(headers || {});

  if (!finalHeaders.has('Content-Type') && !(rest.body instanceof FormData)) {
    finalHeaders.set('Content-Type', 'application/json');
  }

  if (auth) {
    const token = getAuthToken();
    if (!token) {
      throw new Error('Authentication required');
    }
    finalHeaders.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...rest,
    headers: finalHeaders,
  });

  if (!response.ok) {
    let message = 'Request failed';
    try {
      const data = await response.json();
      if (data?.message) {
        message = data.message;
      }
    } catch (error) {
      // ignore JSON parse errors
    }

    throw new Error(message);
  }

  if (response.status === 204) {
    return null as T;
  }

  return response.json() as Promise<T>;
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, {
      ...options,
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body ?? {}),
    }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
};

export function resolveMediaUrl(path?: string | null): string | undefined {
  if (typeof path !== 'string') {
    return path ?? undefined;
  }

  const trimmed = path.trim();
  if (trimmed.length === 0) {
    return trimmed;
  }

  if (/^(?:https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:')) {
    return trimmed;
  }

  if (!API_ORIGIN) {
    return trimmed;
  }

  if (trimmed.startsWith('/uploads/')) {
    return `${API_ORIGIN}${trimmed}`;
  }

  if (trimmed.startsWith('uploads/')) {
    return `${API_ORIGIN}/${trimmed}`;
  }

  return trimmed;
}

export { AUTH_STORAGE_KEY, API_ORIGIN };
