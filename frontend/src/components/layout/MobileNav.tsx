'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Briefcase, 
  Menu, X, Settings, LogOut, Bell, Search
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/candidates', label: 'Candidates', icon: Users },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden sticky top-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 bg-slate-900 rounded-lg flex items-center justify-center">
             <div className="h-4 w-4 bg-[#c8ff00] rounded-sm" />
          </div>
          <span className="font-black text-slate-900 dark:text-white tracking-tighter">HireFlow</span>
        </div>
        <div className="flex items-center gap-2">
            <button className="p-2 text-slate-500"><Search className="h-5 w-5" /></button>
            <button className="p-2 text-slate-500"><Bell className="h-5 w-5" /></button>
            <button 
                onClick={() => setIsOpen(true)}
                className="p-2 text-slate-900 dark:text-white"
            >
                <Menu className="h-6 w-6" />
            </button>
        </div>
      </div>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="absolute right-0 top-0 bottom-0 w-[80%] max-w-sm bg-white dark:bg-slate-950 shadow-2xl p-8 flex flex-col"
            >
              <div className="flex items-center justify-between mb-12">
                <span className="text-sm font-black text-slate-400 uppercase tracking-widest">Menu</span>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-slate-900">
                    <X className="h-8 w-8" />
                </button>
              </div>

              <nav className="flex-1 space-y-6">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 text-2xl font-black transition-colors ${active ? 'text-slate-900 dark:text-white' : 'text-slate-300 hover:text-slate-600'}`}
                    >
                      <div className={`p-3 rounded-2xl ${active ? 'bg-[#c8ff00] text-slate-900' : 'bg-slate-50'}`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      {item.label}
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-slate-100 dark:border-slate-800 pt-8 mt-auto space-y-4">
                  <button className="flex items-center gap-3 text-lg font-bold text-slate-500 w-full text-left">
                      <Settings className="h-5 w-5" /> Settings
                  </button>
                  <button className="flex items-center gap-3 text-lg font-bold text-rose-500 w-full text-left">
                      <LogOut className="h-5 w-5" /> Logout
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-100 dark:border-slate-800 px-6 h-20 flex items-center justify-between pb-safe">
        {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
                <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-slate-900 dark:text-white scale-110' : 'text-slate-400'}`}
                >
                    <div className={`p-2 rounded-xl ${active ? 'bg-[#c8ff00] text-slate-900 shadow-lg' : ''}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </Link>
            );
        })}
        <button 
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-400"
        >
            <div className="p-2">
                <Menu className="h-6 w-6" />
            </div>
        </button>
      </div>
    </>
  );
}
