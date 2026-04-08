'use client';

import React, { useEffect, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';
import { Clock, Users, Activity, BarChart4 } from 'lucide-react';
import { reportsApi, dashboardApi } from '@/lib/api';

const COLORS = ['#c8ff00', '#334155', '#10b981', '#8b5cf6'];

export default function ReportsPage() {
    const [funnelData, setFunnelData] = useState<any[]>([]);
    const [dropoffData, setDropoffData] = useState<any[]>([]);
    const [tthData, setTthData] = useState<any[]>([]);
    const [offerData, setOfferData] = useState<any>(null);
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [funnel, dropoff, tth, offer, s] = await Promise.all([
                    reportsApi.funnel(),
                    reportsApi.dropoff(),
                    reportsApi.timeToHire(),
                    reportsApi.offerRate(),
                    dashboardApi.getStats(),
                ]);
                setFunnelData(funnel);
                setDropoffData(dropoff);
                setTthData(tth);
                setOfferData(offer);
                setStats(s);
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const statCards = stats ? [
        { name: 'Total Hired', stat: String(stats.totalHired), icon: Users },
        { name: 'Avg. Time to Hire', stat: stats.avgTimeToHireDays ? `${stats.avgTimeToHireDays}d` : 'N/A', icon: Clock },
        { name: 'SLA Breaches', stat: String(stats.pendingAlerts), icon: Activity },
        { name: 'Offers Accepted', stat: String(stats.offersAccepted), icon: BarChart4 },
    ] : [];

    const pieData = offerData ? [
        { name: 'Accepted', value: offerData.acceptedOffers },
        { name: 'Rejected', value: offerData.rejectedOffers },
    ] : [];

    if (loading) return (
         <div className="space-y-8 animate-pulse">
            <div><div className="h-8 w-48 bg-slate-200 rounded mb-2"></div></div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="rounded-2xl bg-white px-4 py-8 shadow-sm border border-slate-100 h-28" />
                ))}
            </div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Reports & Analytics</h2>
                <p className="mt-2 text-sm text-slate-500">Analyze historical hiring metrics, pipeline efficiency, and SLA compliance.</p>
            </div>

            {statCards.length > 0 && (
                <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                    {statCards.map(item => (
                        <div key={item.name} className="relative overflow-hidden rounded-2xl bg-white px-5 py-6 shadow-sm border border-slate-100 hover:shadow-md transition-shadow group">
                            <dt>
                                <div className="absolute top-5 right-5 rounded-xl bg-slate-50 p-2.5 group-hover:bg-[#c8ff00]/20 transition-colors">
                                    <item.icon className="h-5 w-5 text-slate-400 group-hover:text-[#0a0f1a] transition-colors" aria-hidden="true" />
                                </div>
                                <p className="truncate text-sm font-semibold text-slate-500 uppercase tracking-wider">{item.name}</p>
                            </dt>
                            <dd className="mt-4 flex items-baseline">
                                <p className="text-3xl font-bold text-slate-900 group-hover:text-[#0a0f1a]">{item.stat}</p>
                            </dd>
                            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent to-transparent group-hover:from-[#c8ff00] group-hover:to-emerald-400 transition-all opacity-0 group-hover:opacity-100" />
                        </div>
                    ))}
                </dl>
            )}

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-base font-bold leading-6 text-slate-900 mb-6 flex items-center gap-2">
                        <Users className="h-4 w-4 text-emerald-500" /> Pipeline Funnel
                    </h3>
                    {funnelData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-sm font-medium">No funnel data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={funnelData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="stageName" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="count" fill="#0a0f1a" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-base font-bold leading-6 text-slate-900 mb-6 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-red-500" /> Stage Drop-off Rate (%)
                    </h3>
                    {dropoffData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-sm font-medium">No dropoff data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <BarChart data={dropoffData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="stageName" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Bar dataKey="dropoffRate" fill="#334155" radius={[6, 6, 0, 0]} barSize={40} />
                            </BarChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-base font-bold leading-6 text-slate-900 mb-6 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-blue-500" /> Time to Hire Trend
                    </h3>
                    {tthData.length === 0 ? (
                        <div className="h-[280px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-sm font-medium">No trend data available</div>
                    ) : (
                        <ResponsiveContainer width="100%" height={280}>
                            <LineChart data={tthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                <XAxis dataKey="month" fontSize={12} tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} dy={10} />
                                <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748b' }} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                <Line type="monotone" dataKey="avgDays" stroke="#c8ff00" strokeWidth={4} activeDot={{ r: 8, fill: '#0a0f1a' }} dot={{ fill: '#c8ff00', r: 4, strokeWidth: 0 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    )}
                </div>

                <div className="rounded-2xl bg-white shadow-sm py-6 px-4 sm:px-6 border border-slate-100 hover:shadow-md transition-shadow">
                    <h3 className="text-base font-bold leading-6 text-slate-900 mb-6 flex items-center gap-2">
                        <BarChart4 className="h-4 w-4 text-purple-500" /> Offer Acceptance Rate
                    </h3>
                    {!offerData || offerData.totalOffers === 0 ? (
                        <div className="h-[280px] flex items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50 text-slate-400 text-sm font-medium">No offer data available</div>
                    ) : (
                        <div className="h-[280px] flex items-center justify-center relative">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie 
                                        data={pieData} 
                                        cx="50%" 
                                        cy="50%" 
                                        innerRadius={70}
                                        outerRadius={100} 
                                        fill="#8884d8" 
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {pieData.map((_, i) => <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />)}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none pb-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-slate-900">{((offerData.acceptedOffers / offerData.totalOffers) * 100).toFixed(0)}%</p>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mt-1">Accepted</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
