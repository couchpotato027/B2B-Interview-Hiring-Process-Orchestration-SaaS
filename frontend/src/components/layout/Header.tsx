'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { authApi } from '@/lib/api';

export default function Header() {
    const [user, setUser] = useState<{ firstName?: string; lastName?: string } | null>(null);

    useEffect(() => {
        const loadUser = async () => {
            try {
                const me = await authApi.getMe();
                setUser(me);
            } catch {
                // Ignore, will be handled by layout redirect if unauthorized
            }
        }
        loadUser();
    }, []);

    const initials = user?.firstName ? `${user.firstName.charAt(0)}${user.lastName?.charAt(0) || ''}`.toUpperCase() : 'U';

    return (
        <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-gray-100 bg-white/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <form className="relative flex flex-1 items-center" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                        Search candidates or jobs
                    </label>
                    <div className="relative w-full max-w-md">
                        <Search
                            className="pointer-events-none absolute inset-y-0 left-3 h-full w-5 text-gray-400"
                            aria-hidden="true"
                        />
                        <input
                            id="search-field"
                            className="block h-10 w-full rounded-full border-0 bg-slate-50 py-1.5 pl-10 pr-3 text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm sm:leading-6 outline-none transition-shadow"
                            placeholder="Search candidates, pipelines, or jobs..."
                            type="search"
                            name="search"
                        />
                    </div>
                </form>
                <div className="flex items-center gap-x-4 lg:gap-x-6">
                    <button type="button" className="-m-2.5 p-2.5 text-gray-400 hover:text-slate-600 transition-colors">
                        <span className="sr-only">View notifications</span>
                        <div className="relative">
                            <Bell className="h-5 w-5" aria-hidden="true" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-white" />
                        </div>
                    </button>

                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-200" aria-hidden="true" />

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            className="-m-1.5 flex items-center p-1.5 rounded-full hover:bg-slate-50 transition-colors"
                            id="user-menu-button"
                            aria-expanded="false"
                            aria-haspopup="true"
                        >
                            <span className="sr-only">Open user menu</span>
                            <div className="h-9 w-9 rounded-full bg-[#c8ff00] flex items-center justify-center text-[#0a0f1a] font-bold text-sm shadow-sm">
                                {initials}
                            </div>
                            <span className="hidden lg:flex lg:items-center">
                                <span className="ml-3 text-sm font-semibold leading-6 text-slate-900" aria-hidden="true">
                                    {user?.firstName ? `${user.firstName} ${user.lastName}` : 'Loading...'}
                                </span>
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </header>
    );
}
