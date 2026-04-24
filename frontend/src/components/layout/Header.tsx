'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Search, Menu, X } from 'lucide-react';
import { authApi } from '@/lib/api';
import ThemeToggle from './ThemeToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { useTranslation } from 'react-i18next';

interface HeaderProps {
    onMenuClick?: () => void;
}

export default function Header({ onMenuClick }: HeaderProps) {
    const { t } = useTranslation();
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
        <header className="sticky top-0 z-40 flex h-20 shrink-0 items-center gap-x-4 border-b border-border bg-background/80 backdrop-blur-md px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
            <button
                type="button"
                className="-m-2.5 p-2.5 text-slate-500 lg:hidden hover:text-slate-900 transition-colors"
                onClick={onMenuClick}
            >
                <span className="sr-only">Open sidebar</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
            </button>

            <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
                <form className="relative flex flex-1 items-center" action="#" method="GET">
                    <label htmlFor="search-field" className="sr-only">
                        {t('common.search')}
                    </label>
                    <div className="relative w-full max-w-md">
                        <Search
                            className="pointer-events-none absolute inset-y-0 left-3 h-full w-5 text-slate-400 dark:text-slate-500"
                            aria-hidden="true"
                        />
                        <input
                            id="search-field"
                            className="block h-10 w-full rounded-full border-0 bg-slate-100/50 dark:bg-slate-800/50 py-1.5 pl-10 pr-3 text-foreground ring-1 ring-inset ring-border placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-primary sm:text-sm sm:leading-6 outline-none transition-all shadow-sm"
                            placeholder={t('common.search')}
                            type="search"
                            name="search"
                        />
                    </div>
                </form>
                <div className="flex items-center gap-x-2 lg:gap-x-4">
                    <LanguageSwitcher />
                    <ThemeToggle />

                    {/* Separator */}
                    <div className="hidden lg:block lg:h-6 lg:w-px lg:bg-border ml-2" aria-hidden="true" />
                    
                    <button type="button" className="-m-2.5 p-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
                        <span className="sr-only">View notifications</span>
                        <div className="relative">
                            <Bell className="h-5 w-5" aria-hidden="true" />
                            <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-400 ring-2 ring-background" />
                        </div>
                    </button>

                    {/* Profile dropdown */}
                    <div className="relative">
                        <button
                            type="button"
                            className="-m-1.5 flex items-center p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            id="user-menu-button"
                        >
                            <span className="sr-only">Open user menu</span>
                            <div className="h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-sm">
                                {initials}
                            </div>
                            <span className="hidden lg:flex lg:items-center">
                                <span className="ml-3 text-sm font-semibold leading-6 text-foreground" aria-hidden="true">
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
