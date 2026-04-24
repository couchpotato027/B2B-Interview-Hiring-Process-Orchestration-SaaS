'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => setMounted(true), []);

    if (!mounted) return null;

    const themes = [
        { key: 'light', icon: Sun, label: 'Light' },
        { key: 'dark', icon: Moon, label: 'Dark' },
        { key: 'system', icon: Monitor, label: 'System' },
    ];

    const currentTheme = themes.find(t => t.key === theme) || themes[2];

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100"
            >
                <currentTheme.icon className="h-5 w-5" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                        <motion.div
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute right-0 mt-2 w-36 bg-white rounded-2xl shadow-2xl border border-slate-100 py-1 z-20 overflow-hidden"
                        >
                            {themes.map((t) => (
                                <button
                                    key={t.key}
                                    onClick={() => {
                                        setTheme(t.key);
                                        setIsOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                                        theme === t.key 
                                            ? 'text-[#c8ff00] bg-slate-900 font-bold' 
                                            : 'text-slate-600 hover:bg-slate-50'
                                    }`}
                                >
                                    <t.icon className="h-4 w-4" />
                                    {t.label}
                                </button>
                            ))}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
