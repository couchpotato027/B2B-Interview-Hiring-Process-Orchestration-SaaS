'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { MobileNav } from '@/components/layout/MobileNav';
import { motion, AnimatePresence } from 'framer-motion';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const [mounted, setMounted] = useState(false);

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
            <MobileNav />

            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col border-r border-border">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="lg:pl-72 flex flex-col flex-1 h-full overflow-hidden">
                <div className="hidden lg:block">
                    <Header />
                </div>

                <main className="flex-1 overflow-y-auto w-full bg-background">
                    <div className="px-4 py-8 sm:px-6 lg:px-8 mx-auto max-w-7xl h-full animate-in fade-in duration-700">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
