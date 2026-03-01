import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    Users,
    LayoutDashboard,
    Settings,
    Briefcase,
    GitMerge,
    BarChart,
    LogOut
} from 'lucide-react';

const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Jobs & Pipelines', href: '/dashboard/pipelines', icon: Briefcase },
    { name: 'Candidates', href: '/dashboard/candidates', icon: Users },
    { name: 'Workflow Builder', href: '/dashboard/workflows', icon: GitMerge },
    { name: 'Reports', href: '/dashboard/reports', icon: BarChart },
    { name: 'Settings', href: '/dashboard/settings', icon: Settings },
];

export default function Sidebar() {
    const pathname = usePathname();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
    };

    return (
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-slate-900 px-6 pb-4">
            <div className="flex h-16 shrink-0 items-center">
                <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-indigo-400">
                    HireFlow SaaS
                </span>
            </div>
            <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                    <li>
                        <ul role="list" className="-mx-2 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                                return (
                                    <li key={item.name}>
                                        <Link
                                            href={item.href}
                                            className={`
                        group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors
                        ${isActive
                                                    ? 'bg-slate-800 text-white'
                                                    : 'text-gray-400 hover:text-white hover:bg-slate-800'
                                                }
                      `}
                                        >
                                            <item.icon
                                                className={`h-6 w-6 shrink-0 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
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
                            className="group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold text-gray-400 hover:bg-slate-800 hover:text-white w-full transition-colors"
                        >
                            <LogOut className="h-6 w-6 shrink-0 text-gray-400 group-hover:text-white" aria-hidden="true" />
                            Log out
                        </button>
                    </li>
                </ul>
            </nav>
        </div>
    );
}
