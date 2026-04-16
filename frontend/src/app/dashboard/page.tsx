'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
    Activity, Users, CheckCircle, Clock, AlertTriangle,
    RefreshCw, TrendingUp, TrendingDown, ChevronDown
} from 'lucide-react';
import { dashboardApi, reportsApi } from '@/lib/api';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, FunnelChart, Funnel, LabelList
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashboardStats {
    activeCandidates: number;
    totalHired: number;
    pendingAlerts: number;
    offersAccepted: number;
    avgTimeToHireDays: number;
}

type DateRange = '7d' | '30d' | '90d' | 'all';
const DATE_RANGES: { label: string; value: DateRange }[] = [
    { label: 'Last 7 days', value: '7d' },
    { label: 'Last 30 days', value: '30d' },
    { label: 'Last 90 days', value: '90d' },
    { label: 'All time', value: 'all' },
];

// ─── Custom Tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-slate-100 rounded-xl shadow-lg px-4 py-3">
                <p className="text-xs font-medium text-slate-500 mb-1">{label}</p>
                {payload.map((p: any) => (
                    <p key={p.name} className="text-sm font-bold text-slate-900">
                        {p.value} <span className="font-normal text-slate-500">{p.name}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardOverview() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [funnelData, setFunnelData] = useState<any[]>([]);
    const [trendData, setTrendData] = useState<any[]>([]);
    const [dropoffData, setDropoffData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [dateRange, setDateRange] = useState<DateRange>('30d');
    const [showDateMenu, setShowDateMenu] = useState(false);

    const load = useCallback(async (isRefresh = false) => {
        if (isRefresh) setRefreshing(true); else setLoading(true);
        try {
            const [s, funnel, trend, dropoff] = await Promise.all([
                dashboardApi.getStats(),
                reportsApi.funnel().catch(() => []),
                reportsApi.timeToHire().catch(() => []),
                reportsApi.dropoff().catch(() => []),
            ]);
            setStats(s);
            setFunnelData(Array.isArray(funnel) ? funnel : []);
            setTrendData(Array.isArray(trend) ? trend : []);
            setDropoffData(Array.isArray(dropoff) ? dropoff : []);
            setLastUpdated(new Date());
        } catch (err) {
            console.error('Dashboard load error:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => load(true), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [load]);

    const statCards = stats ? [
        {
            name: 'Active Candidates',
            value: stats.activeCandidates,
            icon: Users,
            color: 'bg-[#c8ff00]',
            trend: null,
        },
        {
            name: 'Avg. Time to Hire',
            value: stats.avgTimeToHireDays ? `${stats.avgTimeToHireDays}d` : 'N/A',
            icon: Clock,
            color: 'bg-blue-100',
            trend: null,
        },
        {
            name: 'SLA Alerts',
            value: stats.pendingAlerts,
            icon: stats.pendingAlerts > 0 ? AlertTriangle : CheckCircle,
            color: stats.pendingAlerts > 0 ? 'bg-red-100' : 'bg-emerald-100',
            trend: null,
        },
        {
            name: 'Offers Accepted',
            value: stats.offersAccepted,
            icon: CheckCircle,
            color: 'bg-emerald-100',
            trend: null,
        },
    ] : [];

    const FUNNEL_COLORS = ['#c8ff00', '#a8e600', '#88cc00', '#68b200', '#4a8800'];
    const DROPOFF_COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

    const getDropoffColor = (rate: number) => {
        if (rate < 15) return '#22c55e';
        if (rate < 25) return '#f59e0b';
        return '#ef4444';
    };

    if (loading) {
        return (
            <div className="space-y-8 animate-pulse">
                <div><div className="h-8 w-48 bg-slate-200 rounded mb-2" /><div className="h-4 w-64 bg-slate-100 rounded" /></div>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {[1, 2, 3, 4].map(i => <div key={i} className="rounded-2xl bg-white h-32 border border-slate-100" />)}
                </div>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <div className="rounded-2xl bg-white h-72 border border-slate-100" />
                    <div className="rounded-2xl bg-white h-72 border border-slate-100" />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* ─── Header ──────────────────────────────────────────────── */}
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:tracking-tight">Hiring Overview</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        Track organizational hiring velocity and candidate pipeline health.
                        {lastUpdated && (
                            <span className="ml-2 text-slate-400">Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                    {/* Date Range Selector */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDateMenu(m => !m)}
                            className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors"
                        >
                            {DATE_RANGES.find(d => d.value === dateRange)?.label}
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </button>
                        {showDateMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDateMenu(false)} />
                                <div className="absolute right-0 top-12 z-20 w-44 rounded-xl bg-white shadow-lg ring-1 ring-slate-100 p-1">
                                    {DATE_RANGES.map(d => (
                                        <button
                                            key={d.value}
                                            onClick={() => { setDateRange(d.value); setShowDateMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${dateRange === d.value ? 'bg-[#c8ff00] text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                                        >
                                            {d.label}
                                        </button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Refresh Button */}
                    <button
                        onClick={() => load(true)}
                        disabled={refreshing}
                        className="flex items-center gap-2 rounded-full bg-[#0a0f1a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors disabled:opacity-70"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh'}
                    </button>
                </div>
            </div>

            {/* ─── Metric Cards ─────────────────────────────────────────── */}
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item) => (
                    <div key={item.name} className="relative overflow-hidden rounded-2xl bg-white px-4 pt-5 pb-6 shadow-sm sm:px-6 border border-slate-100 hover:shadow-md transition-all hover:-translate-y-0.5 cursor-default group">
                        <dt>
                            <div className={`absolute rounded-xl ${item.color} p-3 shadow-sm`}>
                                <item.icon className="h-5 w-5 text-slate-800" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-slate-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline">
                            <p className="text-3xl font-black text-slate-900">{item.value}</p>
                        </dd>
                    </div>
                ))}
            </dl>

            {/* ─── Charts Row 1 ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Hiring Funnel */}
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Hiring Funnel</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Candidates by pipeline stage</p>
                        </div>
                        <Activity className="h-4 w-4 text-slate-300" />
                    </div>
                    {funnelData.length === 0 ? (
                        <div className="flex items-center justify-center h-52 text-slate-300">
                            <div className="text-center"><Activity className="mx-auto h-10 w-10 mb-2" /><p className="text-sm">No pipeline data yet</p></div>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 20, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                                <YAxis type="category" dataKey="stageName" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} width={90} />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar dataKey="count" name="candidates" radius={[0, 6, 6, 0]}>
                                    {funnelData.map((_: any, i: number) => (
                                        <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Time to Hire Trend */}
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Time to Hire Trend</h3>
                            <p className="text-xs text-slate-400 mt-0.5">Average days to hire per month</p>
                        </div>
                        <Clock className="h-4 w-4 text-slate-300" />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="d" />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="avgDays"
                                name="days"
                                stroke="#0a0f1a"
                                strokeWidth={2.5}
                                dot={{ fill: '#c8ff00', stroke: '#0a0f1a', strokeWidth: 2, r: 5 }}
                                activeDot={{ r: 7, fill: '#c8ff00', stroke: '#0a0f1a', strokeWidth: 2 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── Charts Row 2 ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Stage Drop-off */}
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-base font-bold text-slate-900">Stage Drop-off Rate</h3>
                            <p className="text-xs text-slate-400 mt-0.5">% of candidates who leave at each stage</p>
                        </div>
                        <TrendingDown className="h-4 w-4 text-slate-300" />
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={dropoffData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis dataKey="stageName" tick={{ fontSize: 11, fill: '#64748b' }} tickLine={false} axisLine={false} />
                            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} unit="%" />
                            <Tooltip content={<CustomTooltip />} />
                            <Bar dataKey="dropoffRate" name="drop-off %" radius={[6, 6, 0, 0]}>
                                {dropoffData.map((entry: any, i: number) => (
                                    <Cell key={i} fill={getDropoffColor(entry.dropoffRate)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center gap-4 mt-3">
                        {[{ c: '#22c55e', l: 'Healthy (<15%)' }, { c: '#f59e0b', l: 'Warning (15-25%)' }, { c: '#ef4444', l: 'Critical (>25%)' }].map(({ c, l }) => (
                            <div key={l} className="flex items-center gap-1.5">
                                <div className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />
                                <span className="text-xs text-slate-500">{l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* SLA Alerts Panel */}
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <Activity className="h-4 w-4 text-slate-400" />
                            Pipeline Health
                        </h3>
                        {stats?.pendingAlerts === 0 && (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                                <CheckCircle className="h-3.5 w-3.5" /> All healthy
                            </span>
                        )}
                    </div>

                    <div className="space-y-3">
                        {/* Summary stat blocks */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                { label: 'Active', value: stats?.activeCandidates ?? 0, color: 'bg-[#c8ff00]/20 text-slate-800' },
                                { label: 'Hired', value: stats?.totalHired ?? 0, color: 'bg-emerald-50 text-emerald-800' },
                                { label: 'SLA Alerts', value: stats?.pendingAlerts ?? 0, color: stats?.pendingAlerts ? 'bg-red-50 text-red-700' : 'bg-slate-50 text-slate-500' },
                                { label: 'Avg. Days', value: stats?.avgTimeToHireDays ? `${stats.avgTimeToHireDays}d` : 'N/A', color: 'bg-blue-50 text-blue-700' },
                            ].map(({ label, value, color }) => (
                                <div key={label} className={`rounded-xl p-4 ${color}`}>
                                    <p className="text-xs font-medium opacity-70">{label}</p>
                                    <p className="text-2xl font-black mt-1">{value}</p>
                                </div>
                            ))}
                        </div>

                        {stats && stats.pendingAlerts > 0 && (
                            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
                                    <p className="text-sm font-semibold text-red-800">{stats.pendingAlerts} candidates have breached SLA</p>
                                </div>
                                <p className="text-xs text-red-600 mt-1 ml-7">Check the candidate directory and filter by stage to investigate.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
