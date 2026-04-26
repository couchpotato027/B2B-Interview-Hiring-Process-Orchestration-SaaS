'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    Activity, Users, CheckCircle, Clock, AlertTriangle,
    RefreshCw, TrendingUp, TrendingDown, ChevronDown, Calendar
} from 'lucide-react';
import { dashboardApi, reportsApi } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import {
    BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer, Cell, LabelList
} from 'recharts';

// ─── Types ───────────────────────────────────────────────────────────────────
interface DashboardStats {
    activeCandidates: { count: number; trend: number; isPositive: boolean };
    timeToHire: { avgDays: number; trend: number; isPositive: boolean };
    slaBreaches: { count: number; message: string };
    offersAccepted: { count: number; total: number; rate: number };
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
                        {p.value} <span className="font-normal text-slate-500">{p.name || p.dataKey}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

// ─── Page ────────────────────────────────────────────────────────────────────
export default function DashboardOverview() {
    const { t } = useTranslation();
    const router = useRouter();
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
            const range = dateRange === 'all' ? '365d' : dateRange;
            const [s, funnel, trend, dropoff] = await Promise.all([
                dashboardApi.getMetrics(range),
                reportsApi.funnel().catch(() => []),
                dashboardApi.getTrends('timeToHire', '6m').catch(() => []),
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
    }, [dateRange]);

    useEffect(() => { load(); }, [load]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        const interval = setInterval(() => load(true), 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [load]);

    const handleDrillDown = (filter: string, value?: string) => {
        const params = new URLSearchParams();
        if (filter === 'status') params.set('status', value || 'ACTIVE');
        if (filter === 'sla') params.set('sla', 'breached');
        if (filter === 'stage') params.set('stage', value || '');
        
        router.push(`/dashboard/candidates?${params.toString()}`);
    };

    const statCards = stats ? [
        {
            name: t('dashboard.activeCandidates'),
            value: stats.activeCandidates.count,
            icon: Users,
            color: 'bg-[#c8ff00]',
            trend: stats.activeCandidates.trend,
            isPositive: stats.activeCandidates.isPositive,
            description: 'Candidates currently in pipeline',
            onClick: () => handleDrillDown('status', 'ACTIVE')
        },
        {
            name: t('dashboard.timeToHire'),
            value: stats.timeToHire.avgDays ? `${stats.timeToHire.avgDays}d` : 'N/A',
            icon: Clock,
            color: 'bg-blue-100',
            trend: stats.timeToHire.trend,
            isPositive: stats.timeToHire.isPositive,
            description: 'Duration from sourcing to hire',
            onClick: () => handleDrillDown('status', 'HIRED')
        },
        {
            name: t('dashboard.slaAlerts'),
            value: stats.slaBreaches.count,
            icon: stats.slaBreaches.count > 0 ? AlertTriangle : CheckCircle,
            color: stats.slaBreaches.count > 0 ? 'bg-red-100' : 'bg-emerald-100',
            description: stats.slaBreaches.message,
            onClick: () => handleDrillDown('sla')
        },
        {
            name: t('dashboard.offersAccepted'),
            value: `${stats.offersAccepted.count}/${stats.offersAccepted.total}`,
            subValue: `(${stats.offersAccepted.rate}%)`,
            icon: CheckCircle,
            color: 'bg-emerald-100',
            description: 'Candidates who accepted offers',
            onClick: () => handleDrillDown('status', 'HIRED')
        },
    ] : [];

    const FUNNEL_COLORS = ['#c8ff00', '#a8e600', '#88cc00', '#68b200', '#4a8800'];
    
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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:text-3xl sm:tracking-tight">{t('dashboard.title')}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                        {lastUpdated && (
                            <span className="flex items-center gap-1.5 text-slate-400">
                                <Clock className="h-3.5 w-3.5" />
                                {t('dashboard.lastUpdated', { time: lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) })}
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    {/* Date Range Selector */}
                    <div className="relative flex-1 sm:flex-none">
                        <button
                            onClick={() => setShowDateMenu(m => !m)}
                            className="w-full flex items-center justify-between gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                        >
                            <span className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-slate-400" />
                                {DATE_RANGES.find(d => d.value === dateRange)?.label}
                            </span>
                            <ChevronDown className="h-4 w-4 text-slate-400" />
                        </button>
                        {showDateMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowDateMenu(false)} />
                                <div className="absolute right-0 top-12 z-20 w-44 rounded-xl bg-white shadow-xl ring-1 ring-slate-100 p-1.5 animate-in slide-in-from-top-2 duration-200">
                                    {DATE_RANGES.map(d => (
                                        <button
                                            key={d.value}
                                            onClick={() => { setDateRange(d.value); setShowDateMenu(false); }}
                                            className={`w-full text-left px-4 py-2.5 text-sm rounded-lg transition-colors ${dateRange === d.value ? 'bg-[#c8ff00] text-slate-900 font-bold' : 'text-slate-700 hover:bg-slate-50'}`}
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
                        className="flex items-center gap-2 rounded-xl bg-[#0a0f1a] px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-800 transition-all disabled:opacity-70 shadow-sm active:scale-95"
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                        {refreshing ? '' : t('common.actions.refresh')}
                    </button>
                </div>
            </div>

            {/* ─── Metric Cards ─────────────────────────────────────────── */}
            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {statCards.map((item) => (
                    <div 
                        key={item.name} 
                        onClick={item.onClick}
                        className="relative overflow-hidden rounded-2xl bg-white px-4 pt-5 pb-6 shadow-sm sm:px-6 border border-slate-100 hover:shadow-md transition-all hover:-translate-y-1 cursor-pointer group"
                    >
                        <dt>
                            <div className={`absolute rounded-xl ${item.color} p-2.5 sm:p-3 shadow-sm group-hover:scale-110 transition-transform`}>
                                <item.icon className="h-4 w-4 sm:h-5 sm:h-5 text-slate-800" aria-hidden="true" />
                            </div>
                            <p className="ml-12 sm:ml-16 truncate text-[10px] sm:text-sm font-semibold text-slate-500 uppercase tracking-wider">{item.name}</p>
                        </dt>
                        <dd className="ml-12 sm:ml-16 flex flex-col items-start mt-0.5 sm:mt-1">
                            <div className="flex items-baseline gap-1.5">
                                <p className="text-3xl font-black text-slate-900 tracking-tight">{item.value}</p>
                                {item.subValue && <p className="text-sm font-bold text-slate-400">{item.subValue}</p>}
                            </div>
                            
                            <div className="flex items-center mt-2">
                                {item.trend !== undefined && item.trend !== 0 && (
                                    <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${item.isPositive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'}`}>
                                        {item.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                                        {Math.abs(item.trend)}%
                                    </span>
                                )}
                                <p className="text-xs text-slate-400 ml-2 font-medium">{item.description}</p>
                            </div>
                        </dd>
                    </div>
                ))}
            </dl>

            {/* ─── Charts Row 1 ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Hiring Funnel */}
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">{t('dashboard.metrics.funnel')}</h3>
                            <p className="text-xs text-slate-400 font-medium">{t('dashboard.metrics.funnelDesc')}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <Activity className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                    {funnelData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-300">
                            <Activity className="h-12 w-12 mb-3 opacity-20" />
                            <p className="text-sm font-medium">No pipeline data available</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={260}>
                            <BarChart 
                                data={funnelData} 
                                layout="vertical" 
                                margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                                onClick={(data: any) => data && handleDrillDown('stage', (data.activePayload?.[0]?.payload as any)?.stageId)}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                                <XAxis type="number" hide />
                                <YAxis 
                                    type="category" 
                                    dataKey="stageName" 
                                    tick={{ fontSize: 12, fill: '#64748b', fontWeight: 600 }} 
                                    tickLine={false} 
                                    axisLine={false} 
                                    width={100} 
                                />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                                <Bar dataKey="candidateCount" name="Candidates" radius={[0, 8, 8, 0]} cursor="pointer">
                                    {funnelData.map((_: any, i: number) => (
                                        <Cell key={i} fill={FUNNEL_COLORS[i % FUNNEL_COLORS.length]} />
                                    ))}
                                    <LabelList dataKey="candidateCount" position="right" style={{ fill: '#475569', fontSize: 12, fontWeight: 700 }} />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Time to Hire Trend */}
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">{t('dashboard.metrics.velocity')}</h3>
                            <p className="text-xs text-slate-400 font-medium">{t('dashboard.metrics.velocityDesc')}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <Clock className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                            <defs>
                                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#c8ff00" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#c8ff00" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis 
                                dataKey="month" 
                                tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 500 }} 
                                tickLine={false} 
                                axisLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                tickLine={false} 
                                axisLine={false} 
                                unit="d" 
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Line
                                type="monotone"
                                dataKey="avgDays"
                                name="Hiring Velocity"
                                stroke="#0a0f1a"
                                strokeWidth={4}
                                dot={{ fill: '#c8ff00', stroke: '#0a0f1a', strokeWidth: 3, r: 6 }}
                                activeDot={{ r: 8, fill: '#c8ff00', stroke: '#0a0f1a', strokeWidth: 3 }}
                                animationDuration={1500}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ─── Charts Row 2 ─────────────────────────────────────────── */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 pb-8">
                {/* Stage Drop-off */}
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-lg font-black text-slate-900">{t('dashboard.metrics.bottlenecks')}</h3>
                            <p className="text-xs text-slate-400 font-medium">{t('dashboard.metrics.bottlenecksDesc')}</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg">
                            <TrendingDown className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                    <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={dropoffData} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                            <XAxis 
                                dataKey="stageName" 
                                tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }} 
                                tickLine={false} 
                                axisLine={false} 
                                dy={10}
                            />
                            <YAxis 
                                tick={{ fontSize: 11, fill: '#94a3b8' }} 
                                tickLine={false} 
                                axisLine={false} 
                                unit="%" 
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
                            <Bar dataKey="dropoffRate" name="Drop-off Rate" radius={[8, 8, 0, 0]} barSize={40}>
                                {dropoffData.map((entry: any, i: number) => (
                                    <Cell key={i} fill={getDropoffColor(entry.dropoffRate)} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-6 mt-6 pt-6 border-t border-slate-50">
                        {[{ c: '#22c55e', l: 'Healthy' }, { c: '#f59e0b', l: 'Warning' }, { c: '#ef4444', l: 'Critical' }].map(({ c, l }) => (
                            <div key={l} className="flex items-center gap-2">
                                <div className="h-3 w-3 rounded-full shadow-sm" style={{ background: c }} />
                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">{l}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Pipeline Health List */}
                <div className="rounded-2xl bg-[#0a0f1a] shadow-xl py-8 px-4 sm:px-8 text-white">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black">{t('dashboard.metrics.health')}</h3>
                            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">{t('dashboard.metrics.healthDesc')}</p>
                        </div>
                        {stats?.slaBreaches.count === 0 ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-[#c8ff00] bg-[#c8ff00]/10 px-4 py-2 rounded-full border border-[#c8ff00]/20 uppercase tracking-wider">
                                <CheckCircle className="h-4 w-4" /> Perfect Flow
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-black text-rose-400 bg-rose-400/10 px-4 py-2 rounded-full border border-rose-400/20 uppercase tracking-wider animate-pulse">
                                <AlertTriangle className="h-4 w-4" /> Actions Needed
                            </span>
                        )}
                    </div>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {[
                                { label: 'Active Pipeline', value: stats?.activeCandidates.count ?? 0, color: 'bg-white/5 text-white', icon: Users },
                                { label: 'Converted Hires', value: stats?.offersAccepted.count ?? 0, color: 'bg-[#c8ff00]/10 text-[#c8ff00]', icon: CheckCircle },
                                { label: 'SLA Exceptions', value: stats?.slaBreaches.count ?? 0, color: stats?.slaBreaches.count ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-white/5 text-slate-500', icon: AlertTriangle },
                                { label: 'Acceptance Rate', value: `${stats?.offersAccepted.rate ?? 0}%`, color: 'bg-blue-500/10 text-blue-400', icon: TrendingUp },
                            ].map(({ label, value, color, icon: Icon }) => (
                                <div key={label} className={`rounded-2xl p-5 ${color} transition-all hover:scale-105 cursor-default`}>
                                    <div className="flex items-center justify-between mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-60">{label}</p>
                                        <Icon className="h-3 w-3 opacity-40" />
                                    </div>
                                    <p className="text-3xl font-black tracking-tight">{value}</p>
                                </div>
                            ))}
                        </div>

                        {stats && stats.slaBreaches.count > 0 && (
                            <button 
                                onClick={() => handleDrillDown('sla')}
                                className="w-full group rounded-2xl bg-rose-500 hover:bg-rose-600 p-6 transition-all duration-300 shadow-lg shadow-rose-900/20 active:scale-95"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="bg-white/20 p-2 rounded-xl group-hover:scale-110 transition-transform">
                                        <AlertTriangle className="h-6 w-6 text-white" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-black text-white leading-tight">Critical Attention Required</p>
                                        <p className="text-xs text-white/80 mt-1 font-medium">{stats.slaBreaches.count} candidates have exceeded their stage SLA. This is causing significant pipeline friction.</p>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-white/20 flex items-center justify-between text-xs font-black text-white uppercase tracking-wider">
                                    <span>Review overdue candidates</span>
                                    <TrendingRight className="h-4 w-4" />
                                </div>
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TrendingRight(props: any) {
    return <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>;
}
