import { Platform } from 'react-native';

// Extra padding so buttons are easier to hit with a thumb. Only the phone app gets it;
// the website keeps its compact sizes.
export const touchPad = Platform.OS === 'web' ? 0 : 4;
// Bump text a little on the phone too.
export const touchText = Platform.OS === 'web' ? 0 : 1;
