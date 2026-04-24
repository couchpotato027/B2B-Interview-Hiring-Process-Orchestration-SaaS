'use client';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸', label: 'EN' },
  { code: 'es', name: 'Español', flag: '🇪🇸', label: 'ES' },
  { code: 'fr', name: 'Français', flag: '🇫🇷', label: 'FR' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪', label: 'DE' },
  { code: 'hi', name: 'हिंदी', flag: '🇮🇳', label: 'HI' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  const changeLanguage = async (code: string) => {
    i18n.changeLanguage(code);
    setIsOpen(false);
    try {
        const { authApi } = await import('@/lib/api');
        await authApi.updatePreferences({ language: code });
    } catch (error) {
        console.error('Failed to sync language preference:', error);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-all border border-border shadow-sm group"
      >
        <Globe className="h-4 w-4 text-slate-500 group-hover:text-primary transition-colors" />
        <span className="text-[10px] font-black tracking-widest text-slate-600 dark:text-slate-300">
            {currentLanguage.label}
        </span>
        <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setIsOpen(false)} 
            />
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-900 border border-border rounded-2xl shadow-2xl z-50 overflow-hidden"
            >
              <div className="p-2 space-y-1">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`
                      w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-all
                      ${i18n.language === lang.code 
                        ? 'bg-primary/10 text-primary font-bold' 
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'}
                    `}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg leading-none">{lang.flag}</span>
                      <span className="font-medium tracking-tight">{lang.name}</span>
                    </div>
                    {i18n.language === lang.code && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
