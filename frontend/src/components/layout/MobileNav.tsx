'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, Users, Briefcase, 
  Menu, X, Settings, LogOut, Bell, Search,
  Layers, GitMerge, BarChart, Shield
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/jobs', label: 'Jobs', icon: Briefcase },
  { href: '/dashboard/pipelines', label: 'Pipelines', icon: Layers },
  { href: '/dashboard/candidates', label: 'Candidates', icon: Users },
  { href: '/dashboard/workflows', label: 'Workflows', icon: GitMerge },
  { href: '/dashboard/reports', label: 'Reports', icon: BarChart },
  { href: '/dashboard/compliance', label: 'Audit Log', icon: Shield },
];

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <>
      {/* Slide-out Menu */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] lg:hidden">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" 
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#0a0f1a] shadow-2xl p-6 flex flex-col border-l border-white/10"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">Navigation</span>
                <button onClick={() => setIsOpen(false)} className="p-2 text-slate-400 hover:text-white transition-colors">
                    <X className="h-7 w-7" />
                </button>
              </div>

              <nav className="flex-1 space-y-2 overflow-y-auto pr-2 no-scrollbar">
                {NAV_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                  return (
                    <Link 
                        key={item.href} 
                        href={item.href}
                        onClick={() => setIsOpen(false)}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${active ? 'bg-[#c8ff00] text-[#0a0f1a]' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                    >
                      <Icon className={`h-6 w-6 ${active ? 'text-[#0a0f1a]' : 'text-slate-400'}`} />
                      <span className="text-lg font-bold">{item.label}</span>
                    </Link>
                  );
                })}
              </nav>

              <div className="border-t border-white/5 pt-6 mt-6 space-y-3">
                  <Link 
                    href="/dashboard/settings" 
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white transition-colors"
                  >
                      <Settings className="h-5 w-5" /> <span className="font-bold">Settings</span>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-all w-full text-left"
                  >
                      <LogOut className="h-5 w-5" /> <span className="font-bold">Logout</span>
                  </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Bottom Navigation */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0a0f1a]/95 backdrop-blur-xl border-t border-white/5 px-6 h-20 flex items-center justify-between pb-safe shadow-[0_-10px_20px_rgba(0,0,0,0.3)]">
        {NAV_ITEMS.slice(0, 4).map(item => {
            const Icon = item.icon;
            const active = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
            return (
                <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex flex-col items-center gap-1 transition-all ${active ? 'text-[#c8ff00] scale-110' : 'text-slate-500'}`}
                >
                    <div className={`p-2 rounded-xl transition-colors ${active ? 'bg-[#c8ff00]/10' : ''}`}>
                        <Icon className="h-6 w-6" />
                    </div>
                </Link>
            );
        })}
        <button 
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center gap-1 text-slate-500 hover:text-white transition-colors"
        >
            <div className="p-2">
                <Menu className="h-6 w-6" />
            </div>
        </button>
      </div>
    </>
  );
}
