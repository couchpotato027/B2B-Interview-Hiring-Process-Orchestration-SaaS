'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Sparkles } from 'lucide-react';

interface CelebrationProps {
  show: boolean;
  title: string;
  subtitle: string;
  onComplete: () => void;
}

export function Celebration({ show, title, subtitle, onComplete }: CelebrationProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onComplete, 4000);
      return () => clearTimeout(timer);
    }
  }, [show, onComplete]);

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[200] pointer-events-none flex items-center justify-center p-6 overflow-hidden">
          {/* Confetti-like background stars */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ 
                  opacity: 0, 
                  x: 0, 
                  y: 0, 
                  scale: 0 
              }}
              animate={{ 
                  opacity: [0, 1, 0], 
                  x: (Math.random() - 0.5) * 800, 
                  y: (Math.random() - 0.5) * 800,
                  scale: Math.random() * 2,
                  rotate: Math.random() * 360
              }}
              transition={{ duration: 3, ease: "easeOut" }}
              className="absolute text-[#c8ff00]"
            >
              <Star className="fill-current h-4 w-4" />
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 100 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -100 }}
            className="bg-white dark:bg-slate-900 border-4 border-[#c8ff00] rounded-[3.5rem] p-12 text-center shadow-2xl relative z-10"
          >
            <div className="h-24 w-24 bg-slate-900 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-xl ring-8 ring-slate-100">
                <Trophy className="h-12 w-12 text-[#c8ff00]" />
            </div>
            
            <div className="inline-flex items-center gap-2 mb-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Milestone Reached</span>
            </div>
            
            <h2 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter mb-2">{title}</h2>
            <p className="text-slate-500 font-medium">{subtitle}</p>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
