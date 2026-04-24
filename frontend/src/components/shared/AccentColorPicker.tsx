'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

const ACCENTS = [
  { name: 'Lime (Default)', color: '#c8ff00', hsl: '65 100% 50%' },
  { name: 'Electric Blue', color: '#0070f3', hsl: '212 100% 47%' },
  { name: 'Hyper Purple', color: '#7928ca', hsl: '270 67% 47%' },
  { name: 'Vibrant Orange', color: '#ff4d4d', hsl: '0 100% 65%' },
  { name: 'Clean Rose', color: '#f81ce5', hsl: '305 93% 54%' },
];

export function AccentColorPicker() {
  const [activeAccent, setActiveAccent] = React.useState(ACCENTS[0]);

  const applyAccent = (accent: typeof ACCENTS[0]) => {
    setActiveAccent(accent);
    document.documentElement.style.setProperty('--primary', accent.hsl);
    localStorage.setItem('accent-color', JSON.stringify(accent));
  };

  React.useEffect(() => {
    const saved = localStorage.getItem('accent-color');
    if (saved) {
      const accent = JSON.parse(saved);
      setActiveAccent(accent);
      document.documentElement.style.setProperty('--primary', accent.hsl);
    }
  }, []);

  return (
    <div className="p-6 bg-white dark:bg-slate-950 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <div>
           <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">Organization Accent</h3>
           <p className="text-xs text-slate-400 font-medium tracking-tight">Personalize HireFlow with your brand color.</p>
        </div>
        <div 
          className="h-10 w-10 rounded-xl shadow-lg transition-colors border-4 border-white dark:border-slate-800"
          style={{ backgroundColor: activeAccent.color }}
        />
      </div>

      <div className="grid grid-cols-5 gap-3">
        {ACCENTS.map((accent) => (
          <button
            key={accent.name}
            onClick={() => applyAccent(accent)}
            className="group relative h-12 rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-sm"
            style={{ backgroundColor: accent.color }}
            title={accent.name}
          >
            {activeAccent.name === accent.name && (
              <motion.div 
                layoutId="active-accent"
                className="absolute inset-0 flex items-center justify-center bg-black/10 rounded-2xl"
              >
                <Check className="h-5 w-5 text-white drop-shadow-md" />
              </motion.div>
            )}
          </button>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-900 flex items-center justify-between">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Variant</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">{activeAccent.name}</span>
      </div>
    </div>
  );
}
