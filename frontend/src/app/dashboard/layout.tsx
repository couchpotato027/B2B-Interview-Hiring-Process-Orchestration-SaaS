'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';

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
        <div className="flex h-screen w-full bg-slate-50">
            {/* Static sidebar for desktop */}
            <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
                <Sidebar />
            </div>

            {/* Main Content Area */}
            <div className="lg:pl-72 flex flex-col flex-1 h-full overflow-hidden">
                <Header />

                <main className="flex-1 overflow-y-auto w-full">
                    <div className="px-4 py-8 sm:px-6 lg:px-8 mx-auto max-w-7xl h-full">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
