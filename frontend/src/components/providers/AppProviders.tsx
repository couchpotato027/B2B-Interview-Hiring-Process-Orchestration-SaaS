'use client';

import React from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import '@/lib/i18n'; // Initialize i18n
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { SocketProvider } from './SocketProvider';

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SocketProvider>
          {children}
          <Toaster position="bottom-right" />
        </SocketProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
