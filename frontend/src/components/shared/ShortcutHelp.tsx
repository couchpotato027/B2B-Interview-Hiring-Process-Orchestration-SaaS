'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, X, Printer, Info, Sparkles } from 'lucide-react';
import { GLOBAL_SHORTCUTS } from '@/lib/shortcuts';

export function ShortcutHelp() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '?' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const categories = Array.from(new Set(GLOBAL_SHORTCUTS.map(s => s.category)));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/60">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 40 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 40 }}
        className="relative w-full max-w-4xl bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center">
                <Keyboard className="h-8 w-8 text-[#c8ff00]" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Keyboard Shortcuts</h2>
              <p className="text-sm text-slate-500 font-medium tracking-tight">Master HireFlow with zero mouse latency.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
              <button className="flex items-center gap-2 px-4 py-2 text-xs font-black text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors">
                 <Printer className="h-4 w-4" /> Print Sheet
              </button>
              <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-900 transition-colors">
                <X className="h-8 w-8" />
              </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {categories.map(cat => (
              <div key={cat}>
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Info className="h-3 w-3" /> {cat}
                </h3>
                <div className="space-y-4">
                  {GLOBAL_SHORTCUTS.filter(s => s.category === cat).map(s => (
                    <div key={s.key} className="group flex items-center justify-between p-3 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors">
                      <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{s.description}</span>
                      <div className="flex items-center gap-1">
                        {s.key.split(' ').map((k, i) => (
                           <React.Fragment key={i}>
                              <kbd className="min-w-[2.5rem] h-8 px-2 flex items-center justify-center bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-black text-slate-900 dark:text-white shadow-sm">
                                {k === 'Escape' ? 'Esc' : k}
                              </kbd>
                              {i < s.key.split(' ').length - 1 && <span className="text-[10px] text-slate-300 font-black px-1">THEN</span>}
                           </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-8 bg-[#c8ff00] flex items-center justify-center">
            <p className="text-[11px] font-black text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <Sparkles className="h-4 w-4" /> Shortcut customization available in user settings
            </p>
        </div>
      </motion.div>
    </div>
  );
}
