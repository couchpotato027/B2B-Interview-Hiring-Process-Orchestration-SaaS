'use client';

import React from 'react';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, Check } from 'lucide-react';

export default function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="h-10 w-10 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />;

  const modes = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 hover:border-primary transition-all shadow-sm active:scale-95"
      >
        <AnimatePresence mode="wait">
            {resolvedTheme === 'dark' ? (
              <motion.div 
                key="moon"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <Moon className="h-4 w-4 text-slate-400" />
              </motion.div>
            ) : (
              <motion.div 
                key="sun"
                initial={{ rotate: -90, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 90, opacity: 0 }}
              >
                <Sun className="h-4 w-4 text-slate-400" />
              </motion.div>
            )}
        </AnimatePresence>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="absolute right-0 mt-3 w-44 z-50 p-2 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-xl space-y-1"
            >
              <div className="px-3 py-1.5 mb-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interface Theme</span>
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
                        ? 'bg-primary text-primary-foreground shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-900'}
                    `}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className={`h-4 w-4 ${active ? 'text-primary-foreground' : 'text-slate-400'}`} />
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
