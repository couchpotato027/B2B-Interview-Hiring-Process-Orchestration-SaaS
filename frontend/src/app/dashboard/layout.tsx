'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    useEffect(() => {
        setMounted(true);
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    // Prevent hydration mismatch by only rendering authenticated shell after mount
    if (!mounted) return null;

    return (
        <div className="flex h-screen w-full bg-background overflow-hidden relative">
            {/* Mobile Sidebar Backdrop */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        className="fixed inset-0 z-[60] bg-slate-900/40 backdrop-blur-sm lg:hidden transition-opacity"
                    />
                )}
            </AnimatePresence>

            {/* Mobile Sidebar Slider */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '-100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed inset-y-0 left-0 z-[70] w-72 lg:hidden flex flex-col"
                    >
                        <div className="absolute right-[-48px] top-6">
                            <button
                                onClick={() => setIsSidebarOpen(false)}
                                className="p-2 rounded-xl bg-slate-900 text-white shadow-xl border border-white/10"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>
                        <Sidebar />
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-border">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="lg:pl-72 flex flex-col flex-1 h-full overflow-hidden">
                <Header onMenuClick={() => setIsSidebarOpen(true)} />

                <main className="flex-1 overflow-y-auto w-full bg-background">
                    <div className="px-4 py-8 sm:px-6 lg:px-8 mx-auto max-w-7xl h-full animate-in fade-in duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
