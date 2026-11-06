import { isTrustedStream } from '../../lib/streamHost';

describe('isTrustedStream', () => {
  it.each([
    'https://www.youtube-nocookie.com/embed/abc?autoplay=1',
    'https://relay.ozolio.com/pub.api?cmd=embed&oid=EMB_X',
    'https://camstreamer.com/embed/abc?autoplay=1&mute=1',
    'https://watch.hdrelay.io/player.html?cam=cam_x&sig=1',
  ])('plays %s', (url) => expect(isTrustedStream(url)).toBe(true));

  it.each([
    'http://camstreamer.com/embed/abc',
    'https://evil.example.com/embed/abc',
    'https://camstreamer.com.evil.example.com/embed/abc',
    'not a url',
    '',
    null,
    undefined,
  ])('refuses %s', (url) => expect(isTrustedStream(url as string | null | undefined)).toBe(false));
});
