import React from 'react';
import { MountainsScreen } from '../components/MountainsScreen';

// Home is the person's own list; everything else is one tap away at /all.
export default function HomeScreen() {
  return <MountainsScreen scope="mine" />;
}
