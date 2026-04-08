'use client';

import React, { useEffect, useState } from 'react';
import { Activity, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';
import { dashboardApi } from '@/lib/api';

interface DashboardStats {
    activeCandidates: number;
    totalHired: number;
    pendingAlerts: number;
    offersAccepted: number;
    avgTimeToHireDays: number;
}

interface SlaAlert {
    id: string;
    alertMessage: string;
    isResolved: boolean;
    createdAt: string;
    candidate: { firstName: string; lastName: string };
}

interface PendingEval {
    id: string;
    scheduledAt: string;
    candidate: { firstName: string; lastName: string };
    stage: { name: string } | null;
    interviewer: { firstName: string; lastName: string };
}

export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [alerts, setAlerts] = useState<SlaAlert[]>([]);
    const [pendingEvals, setPendingEvals] = useState<PendingEval[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [s, a, p] = await Promise.all([
                    dashboardApi.getStats(),
                    dashboardApi.getAlerts(),
                    dashboardApi.getPendingEvaluations(),
                ]);
                setStats(s);
                setAlerts(a);
                setPendingEvals(p);
            } catch (err) {
                console.error('Dashboard load error:', err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const statCards = stats
        ? [
            { name: 'Active Candidates', value: String(stats.activeCandidates), icon: Users },
            { name: 'Time to Hire (Avg)', value: stats.avgTimeToHireDays ? `${stats.avgTimeToHireDays} Days` : 'N/A', icon: Clock },
            { name: 'Pending SLA Alerts', value: String(stats.pendingAlerts), icon: Activity },
            { name: 'Offers Accepted', value: String(stats.offersAccepted), icon: CheckCircle },
        ]
        : [];

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div>
                    <div className="h-8 w-48 bg-slate-200 rounded mb-2"></div>
                    <div className="h-4 w-64 bg-slate-200 rounded"></div>
                </div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="rounded-2xl bg-white px-4 pb-12 pt-5 shadow-sm border border-slate-100 h-32" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    Hiring Overview
                </h2>
                <p className="mt-2 text-sm text-slate-500">
                    Track organizational hiring velocity and candidate pipeline health.
                </p>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item) => (
                    <div
                        key={item.name}
                        className="relative overflow-hidden rounded-2xl bg-white px-4 pb-10 pt-5 shadow-sm sm:px-6 sm:pt-6 border border-slate-100 hover:shadow-md transition-shadow"
                    >
                        <dt>
                            <div className="absolute rounded-xl bg-[#c8ff00] p-3 shadow-sm">
                                <item.icon className="h-5 w-5 text-[#0a0f1a]" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-4 sm:pb-5">
                            <p className="text-3xl font-bold text-slate-900">{item.value}</p>
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100">
                    <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-slate-400" />
                        Recent SLA Alerts
                    </h3>
                    {alerts.length === 0 ? (
                        <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                            <div className="flex">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-emerald-800">No SLA alerts. All pipelines are healthy!</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {alerts.slice(0, 5).map(alert => (
                                <div key={alert.id} className="rounded-xl bg-red-50 p-4 border border-red-100/50">
                                    <div className="flex">
                                        <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                                        <div className="ml-3">
                                            <h3 className="text-sm font-medium text-red-800">
                                                {alert.candidate.firstName} {alert.candidate.lastName}
                                            </h3>
                                            <p className="mt-1 text-sm text-red-700">{alert.alertMessage}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100">
                    <h3 className="text-base font-semibold leading-6 text-slate-900 mb-4 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        Pending Evaluations
                    </h3>
                    {pendingEvals.length === 0 ? (
                        <div className="rounded-xl bg-emerald-50 p-4 border border-emerald-100">
                            <div className="flex">
                                <CheckCircle className="h-5 w-5 text-emerald-500" />
                                <div className="ml-3">
                                    <p className="text-sm font-medium text-emerald-800">No pending evaluations. All feedback submitted!</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <ul role="list" className="divide-y divide-slate-100">
                            {pendingEvals.slice(0, 5).map(item => (
                                <li key={item.id} className="flex gap-x-4 py-3 first:pt-0">
                                    <div className="min-w-0 flex-auto">
                                        <p className="text-sm font-semibold leading-6 text-slate-900">
                                            {item.candidate.firstName} {item.candidate.lastName}
                                        </p>
                                        <p className="mt-1 flex text-xs leading-5 text-slate-500">
                                            {item.stage?.name || 'Unknown Stage'} • Interviewer: {item.interviewer.firstName} {item.interviewer.lastName}
                                        </p>
                                    </div>
                                    <div className="flex-shrink-0">
                                        <span className="inline-flex items-center rounded-md bg-[#c8ff00]/20 px-2 py-1 text-xs font-medium text-[#0a0f1a] ring-1 ring-inset ring-[#c8ff00]/50">
                                            Pending
                                        </span>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}
