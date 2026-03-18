// lib/api.ts
import type { ResortSummary, ResortDetail, BestResortResponse } from './types';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';
const API_KEY  = process.env.EXPO_PUBLIC_API_KEY  ?? '';

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'X-API-Key': API_KEY },
  });
  if (!res.ok) throw new Error(`API error ${res.status}: ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  getResorts:      ()           => apiFetch<ResortSummary[]>('/api/resorts'),
  getBestResorts:  ()           => apiFetch<BestResortResponse>('/api/resorts/best'),
  getResortDetail: (id: string) => apiFetch<ResortDetail>(`/api/resorts/${id}`),
};
