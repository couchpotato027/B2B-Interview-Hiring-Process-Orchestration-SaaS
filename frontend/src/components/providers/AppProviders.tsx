'use client';

import React, { useEffect } from 'react';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import '@/lib/i18n'; // Initialize i18n
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/i18n';
import { SocketProvider } from './SocketProvider';
import { OnboardingFlow } from '../shared/OnboardingFlow';
import { CommandPalette } from '../shared/CommandPalette';
import { ShortcutHelp } from '../shared/ShortcutHelp';
import { useGlobalShortcuts } from '@/lib/useGlobalShortcuts';

function AppProviderInner({ children }: { children: React.ReactNode }) {
  useGlobalShortcuts();

  useEffect(() => {
    // Register Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(err => console.error('SW registration failed:', err));
    }

    // Load Accent Color
    const saved = localStorage.getItem('accent-color');
    if (saved) {
      try {
        const accent = JSON.parse(saved);
        document.documentElement.style.setProperty('--primary', accent.hsl);
      } catch (e) {
        console.error('Failed to load accent color', e);
      }
    }
  }, []);

  return (
    <>
      {children}
      <CommandPalette />
      <ShortcutHelp />
      <OnboardingFlow />
    </>
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <SocketProvider>
          <AppProviderInner>
            {children}
          </AppProviderInner>
          <Toaster position="bottom-right" />
        </SocketProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}
