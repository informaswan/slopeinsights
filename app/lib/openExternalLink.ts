import { Platform } from 'react-native';
import * as Linking from 'expo-linking';

/**
 * Opens an external URL. On web this opens a new tab (expo-linking's web
 * `openURL` navigates the current tab via `window.location`, which isn't
 * what we want for outbound links like donation pages or camera feeds).
 * On native, Linking.openURL already hands off to the OS/browser app.
 */
export function openExternalLink(url: string): void {
  if (Platform.OS === 'web') {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }
  Linking.openURL(url);
}
