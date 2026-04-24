'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  ClipboardCheck, Briefcase, Layout, 
  SearchX, Plus, PlayCircle 
} from 'lucide-react';

type EmptyStateType = 'candidates' | 'jobs' | 'pipeline' | 'search';

interface StateConfig {
  icon: any;
  title: string;
  description: string;
  primary: string;
  secondary?: string;
  tutorial?: string;
  templates?: string[];
  suggestions?: string[];
}

const CONFIG: Record<EmptyStateType, StateConfig> = {
  candidates: {
    icon: ClipboardCheck,
    title: "Start building your talent pool",
    description: "Upload resumes or create candidate profiles to begin screening",
    primary: "Upload Resume",
    secondary: "Create Manually",
    tutorial: "How it works (2 min video)"
  },
  jobs: {
    icon: Briefcase,
    title: "Create your first job posting",
    description: "Define requirements and start attracting candidates",
    primary: "Create Job",
    secondary: "Use a template",
    templates: ["Product Designer", "Backend Engineer", "Sales Lead"]
  },
  pipeline: {
    icon: Layout,
    title: "Configure your hiring pipeline",
    description: "Set up stages candidates will move through",
    primary: "Build Pipeline",
    secondary: "Use Standard Template"
  },
  search: {
    icon: SearchX,
    title: "No candidates match your filters",
    description: "Broaden your search criteria or try removing some filters",
    primary: "Clear all filters",
    suggestions: ["Remove location filter", "Check skill spelling", "Broaden experience range"]
  }
};

export function EmptyState({ type, onPrimaryAction, onSecondaryAction }: { 
  type: EmptyStateType; 
  onPrimaryAction?: () => void; 
  onSecondaryAction?: () => void;
}) {
  const config = CONFIG[type];
  const Icon = config.icon;

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-6 text-center w-full"
    >
      <div className="relative mb-8">
        <motion.div 
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="h-24 w-24 bg-slate-50 dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-[2.5rem] flex items-center justify-center shadow-sm"
        >
          <Icon className="h-10 w-10 text-slate-400" />
        </motion.div>
        <div className="absolute -bottom-2 -right-2 h-10 w-10 bg-[#c8ff00] rounded-2xl flex items-center justify-center shadow-lg transform rotate-12">
            <Plus className="h-5 w-5 text-slate-900" />
        </div>
      </div>

      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
        {config.title}
      </h3>
      <p className="text-slate-500 font-medium max-w-sm mb-10">
        {config.description}
      </p>

      <div className="flex flex-col items-center gap-4">
        <button 
          onClick={onPrimaryAction}
          className="px-8 py-3 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-2xl text-sm font-black hover:scale-105 active:scale-95 transition-all shadow-xl"
        >
          {config.primary}
        </button>
        
        {config.secondary && (
          <button 
            onClick={onSecondaryAction}
            className="text-xs font-black text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-widest transition-colors"
          >
            {config.secondary}
          </button>
        )}

        {config.tutorial && (
            <button className="mt-8 flex items-center gap-2 text-xs font-black text-blue-500 hover:text-blue-600 transition-colors bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                <PlayCircle className="h-4 w-4" /> {config.tutorial}
            </button>
        )}

        {config.templates && (
            <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 w-full max-w-lg">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Quick Start Templates</p>
                <div className="flex gap-2 justify-center">
                    {config.templates.map(t => (
                        <button key={t} className="px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-[10px] font-bold text-slate-600 dark:text-slate-400 hover:border-[#c8ff00] transition-colors">
                            {t}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>
    </motion.div>
  );
}
