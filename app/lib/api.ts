// lib/api.ts
import type { ResortSummary, ResortDetail, BestResortResponse, RoadCameraResponse } from './types';

export interface FeedbackPayload {
  category: 'idea' | 'bug' | 'data' | 'other';
  message: string;
  email?: string;
  website?: string; // honeypot; always empty from real people
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const API_KEY  = process.env.EXPO_PUBLIC_API_KEY  ?? '';

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'X-API-Key': API_KEY,
    'Bypass-Tunnel-Reminder': 'true',
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string> ?? {}),
  };
  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) throw Object.assign(new Error(`API error ${res.status}: ${path}`), { status: res.status });
  return res.json() as Promise<T>;
}

export const api = {
  getResorts:      ()           => apiFetch<ResortSummary[]>('/api/resorts'),
  getBestResorts:  ()           => apiFetch<BestResortResponse>('/api/resorts/best'),
  getResortDetail: (id: string) => apiFetch<ResortDetail>(`/api/resorts/${id}`),
  getRoadCameras:  ()           => apiFetch<RoadCameraResponse>('/api/road-cameras'),
  sendFeedback:    (body: FeedbackPayload) =>
    apiFetch<{ ok: boolean }>('/api/feedback', { method: 'POST', body: JSON.stringify(body) }),
};
