// Streams are shown in an iframe/webview, so only these hosts are ever loaded.
const TRUSTED_STREAM_HOSTS = ['www.youtube-nocookie.com', 'relay.ozolio.com'];

export function isTrustedStream(url?: string | null): url is string {
  if (!url) return false;
  try {
    const u = new URL(url);
    return u.protocol === 'https:' && TRUSTED_STREAM_HOSTS.includes(u.hostname);
  } catch {
    return false;
  }
}
