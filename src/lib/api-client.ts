import { supabase } from '@/api/supabase/client';

//==========================
// Título : Cliente HTTP para Vercel Functions — injeta JWT do Supabase
//==========================

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers as Record<string, string>),
  };

  const path = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const response = await fetch(path, { ...options, headers });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || errorData.detail || `Erro ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}

export const api = {
  get:    <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'GET' }),
  post:   <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'POST', body: data ? JSON.stringify(data) : undefined }),
  patch:  <T>(endpoint: string, data?: unknown, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'PATCH', body: data ? JSON.stringify(data) : undefined }),
  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiFetch<T>(endpoint, { ...options, method: 'DELETE' }),
};
