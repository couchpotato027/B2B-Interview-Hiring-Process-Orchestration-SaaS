import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import {
    Users,
    LayoutDashboard,
    Settings,
    Briefcase,
    GitMerge,
    BarChart,
    LogOut,
    Layers,
    Shield
} from 'lucide-react';

export default function Sidebar() {
    const { t } = useTranslation();
    const pathname = usePathname();

    const navigation = [
        { name: t('common.dashboard'), href: '/dashboard', icon: LayoutDashboard },
        { name: t('common.jobs'), href: '/dashboard/jobs', icon: Briefcase },
        { name: t('common.pipelines'), href: '/dashboard/pipelines', icon: Layers },
        { name: t('common.candidates'), href: '/dashboard/candidates', icon: Users },
        { name: 'Workflow Builder', href: '/dashboard/workflows', icon: GitMerge },
        { name: t('common.reports'), href: '/dashboard/reports', icon: BarChart },
        { name: t('common.auditLog'), href: '/dashboard/compliance', icon: Shield },
        { name: t('common.settings'), href: '/dashboard/settings', icon: Settings },
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-[#0a0f1a] px-6 pb-4 border-r border-[#1e293b]">
            <div className="flex h-20 shrink-0 items-center gap-2">
                <div className="flex gap-0.5">
                    <div className="w-3 h-7 rounded-sm bg-white" />
                    <div className="w-3 h-7 rounded-sm bg-[#c8ff00]" />
                </div>
                <span className="text-xl font-bold text-white tracking-tight">
                    HireFlow
                </span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-2">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`
                                                group flex items-center gap-x-3 rounded-xl p-3 text-sm font-medium transition-all duration-200
                                                ${isActive
                                                    ? 'bg-[#c8ff00] text-[#0a0f1a] shadow-[0_0_15px_rgba(200,255,0,0.15)]'
                                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                                }
                                            `}
                                        >
                                            <item.icon
                                                className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#0a0f1a]' : 'text-slate-400 group-hover:text-white'}`}
                                                aria-hidden="true"
                                            />
                                            {item.name}
                                        </Link>
                                    </li>
                                );
                            })}
                        </ul>
                    </li>
                    <li className="mt-auto">
                        <button
                            onClick={handleLogout}
                            className="group flex items-center gap-x-3 rounded-xl p-3 text-sm font-medium text-slate-400 hover:bg-red-500/10 hover:text-red-400 w-full transition-colors"
                        >
                            <LogOut className="h-5 w-5 shrink-0 text-slate-400 group-hover:text-red-400" aria-hidden="true" />
                            {t('common.logout')}
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
