import { useContext } from 'react';
import { SafeAreaInsetsContext } from 'react-native-safe-area-context';

const NONE = { top: 0, bottom: 0, left: 0, right: 0 };

// The phone's status bar / gesture bar / on-screen buttons, so content stays clear of them.
// Zeros on the website and anywhere there is no provider (tests).
export function useInsets() {
  return useContext(SafeAreaInsetsContext) ?? NONE;
}
