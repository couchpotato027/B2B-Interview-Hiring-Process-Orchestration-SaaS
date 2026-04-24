'use client';

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Command, CornerDownLeft, Sparkles, Hash, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { COMMANDS } from '@/lib/shortcuts';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const filteredCommands = COMMANDS.filter(cmd => 
    cmd.title.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % filteredCommands.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filteredCommands.length) % filteredCommands.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(filteredCommands[selectedIndex]);
    }
  };

  const executeCommand = (cmd: typeof COMMANDS[0]) => {
    if (!cmd) return;
    console.log('Executing command:', cmd.id);
    setIsOpen(false);
    setQuery('');
    // Handle navigation or actions here
    if (cmd.id.startsWith('view-')) {
        router.push('/dashboard/' + cmd.id.replace('view-', ''));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] p-6 backdrop-blur-md bg-slate-900/40">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] overflow-hidden border border-slate-200 dark:border-slate-800"
      >
        <div className="relative flex items-center p-6 border-b border-slate-100 dark:border-slate-800">
          <Search className="absolute left-10 h-6 w-6 text-slate-400" />
          <input
            autoFocus
            className="w-full pl-14 pr-6 py-4 bg-transparent text-xl font-medium text-slate-900 dark:text-white outline-none placeholder:text-slate-400"
            placeholder="Search for commands, candidates, jobs..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ESC</span>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4 custom-scrollbar" ref={scrollRef}>
          {filteredCommands.length > 0 ? (
            <div className="space-y-1">
              {filteredCommands.map((cmd, idx) => (
                <button
                  key={cmd.id}
                  onClick={() => executeCommand(cmd)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`
                    w-full flex items-center justify-between p-4 rounded-3xl transition-all
                    ${selectedIndex === idx ? 'bg-slate-900 text-white shadow-xl scale-[1.02]' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                  `}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-xl ${selectedIndex === idx ? 'bg-white/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                        {cmd.category === 'Jobs' ? <Hash className="h-4 w-4" /> : <Zap className="h-4 w-4" />}
                    </div>
                    <div className="text-left">
                      <p className="text-sm font-black tracking-tight">{cmd.title}</p>
                      <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedIndex === idx ? 'text-white/50' : 'text-slate-400'}`}>{cmd.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {cmd.shortcut && (
                        <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${selectedIndex === idx ? 'bg-white/20' : 'bg-slate-100 dark:bg-slate-800'}`}>
                             {cmd.shortcut}
                        </span>
                    )}
                    {selectedIndex === idx && (
                      <div className="flex items-center gap-1.5 px-3 py-1 bg-[#c8ff00] text-slate-900 rounded-full text-[10px] font-black uppercase tracking-wider">
                         <CornerDownLeft className="h-3 w-3" /> Execute
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Sparkles className="h-10 w-10 text-slate-200 mx-auto mb-4" />
              <p className="text-slate-400 font-medium">No commands found for "{query}"</p>
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-8">
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="p-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">↑↓</span>
                Navigate
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="p-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">Enter</span>
                Select
            </div>
            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <span className="p-1 px-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm">ESC</span>
                Close
            </div>
        </div>
      </motion.div>
    </div>
  );
}
