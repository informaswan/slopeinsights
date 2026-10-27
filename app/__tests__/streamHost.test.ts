import { isTrustedStream } from '../lib/streamHost';

describe('isTrustedStream', () => {
  it('accepts YouTube (privacy domain) and Ozolio embeds', () => {
    expect(isTrustedStream('https://www.youtube-nocookie.com/embed/abc')).toBe(true);
    expect(isTrustedStream('https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_X')).toBe(true);
  });
  it('rejects other hosts, plain http, lookalikes and junk', () => {
    expect(isTrustedStream('https://evil.example.com/embed/abc')).toBe(false);
    expect(isTrustedStream('http://www.youtube-nocookie.com/embed/abc')).toBe(false);
    expect(isTrustedStream('https://www.youtube-nocookie.com.evil.com/x')).toBe(false);
    expect(isTrustedStream('javascript:alert(1)')).toBe(false);
    expect(isTrustedStream(null)).toBe(false);
  });
});
