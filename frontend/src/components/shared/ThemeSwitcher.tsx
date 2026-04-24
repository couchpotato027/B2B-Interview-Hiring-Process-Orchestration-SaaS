'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export function ThemeSwitcher() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-10 w-10 bg-slate-100 rounded-xl" />;

  const modes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-[#c8ff00] transition-colors shadow-sm"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="h-4 w-4 text-slate-400" />
        ) : (
          <Sun className="h-4 w-4 text-slate-400" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-3 w-40 z-50 p-1.5 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl"
            >
              <div className="px-3 py-2 border-b border-slate-50 dark:border-slate-900 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Theme</span>
              </div>
              {modes.map((mode) => {
                const Icon = mode.icon;
                const active = theme === mode.value;
                return (
                  <button
                    key={mode.value}
                    onClick={() => {
                      setTheme(mode.value);
                      setIsOpen(false);
                    }}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-bold transition-all
                      ${active 
                        ? 'bg-[#c8ff00] text-slate-900 shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${active ? 'text-slate-900' : 'text-slate-400'}`} />
                      {mode.label}
                    </div>
                    {active && <Check className="h-3 w-3" />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
