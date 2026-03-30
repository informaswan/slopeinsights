// lib/api.ts
import type {
  ResortSummary, ResortDetail, BestResortResponse,
  AuthResponse, UserProfile, UserResortsResponse,
} from './types';
import { getToken } from './tokenStorage';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const API_KEY  = process.env.EXPO_PUBLIC_API_KEY  ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Bypass-Tunnel-Reminder': 'true',
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  getResorts:      ()           => apiFetch<ResortSummary[]>('/api/resorts'),
  getBestResorts:  ()           => apiFetch<BestResortResponse>('/api/resorts/best'),
  getResortDetail: (id: string) => apiFetch<ResortDetail>(`/api/resorts/${id}`),
  authGoogle: (idToken: string) =>
    apiFetch<AuthResponse>('/api/auth/google', {
      method: 'POST', body: JSON.stringify({ id_token: idToken }),
    }),
  authApple: (identityToken: string, name?: string) =>
    apiFetch<AuthResponse>('/api/auth/apple', {
      method: 'POST', body: JSON.stringify({ identity_token: identityToken, name }),
    }),
  getMe: () => apiFetch<UserProfile>('/api/auth/me'),
  getUserResorts: () => apiFetch<UserResortsResponse>('/api/users/me/resorts'),
  updateUserResorts: (resortIds: string[]) =>
    apiFetch<UserResortsResponse>('/api/users/me/resorts', {
      method: 'PUT', body: JSON.stringify({ resort_ids: resortIds }),
    }),
};
