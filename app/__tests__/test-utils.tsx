import React from 'react';
import { ThemeProvider } from '../contexts/ThemeContext';

export function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      {children}
    </ThemeProvider>
  );
}
