// lib/webcam.ts
const API_BASE = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:8000';

// Camera hosts hotlink-block or cache badly, so pictures always go through our server.
export function proxiedWebcamUrl(url: string, bust?: number): string {
  const base = `${API_BASE}/api/webcam-proxy?url=${encodeURIComponent(url)}`;
  return bust == null ? base : `${base}&t=${bust}`;
}

/** When the camera's current picture was taken (ISO string), or null if unknown. Never throws. */
export async function fetchPictureTime(url: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_BASE}/api/webcam-proxy/info?url=${encodeURIComponent(url)}`);
    if (!res.ok) return null;
    const body = await res.json();
    return typeof body?.updated === 'string' ? body.updated : null;
  } catch {
    return null;
  }
}
