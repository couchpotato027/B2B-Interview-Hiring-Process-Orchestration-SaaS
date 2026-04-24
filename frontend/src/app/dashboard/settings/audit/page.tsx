'use client';

import React, { useEffect, useState } from 'react';
import { 
    Activity, User, Shield, Search, Filter, 
    Calendar, ArrowRight, ChevronLeft, ChevronRight,
    ShieldAlert, Globe, Monitor, Code
} from 'lucide-react';
import { auditApi, authApi } from '@/lib/api';

interface AuditLog {
    id: string;
    action: string;
    resource: string;
    resourceId: string | null;
    changes: any;
    ipAddress: string | null;
    userAgent: string | null;
    createdAt: string;
    user: {
        email: string;
        firstName: string;
        lastName: string;
    } | null;
}

export default function AuditLogsPage() {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [limit] = useState(20);
    const [users, setUsers] = useState<any[]>([]);
    
    // Filters
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        resource: '',
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const [logsData, usersData] = await Promise.all([
                auditApi.list({ page, limit, ...filters }),
                authApi.listUsers().catch(() => [])
            ]);
            setLogs(logsData.logs);
            setTotal(logsData.total);
            setUsers(usersData);
        } catch (err) {
            console.error('Failed to load audit logs:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, [page, filters]);

    const totalPages = Math.ceil(total / limit);

    const getActionColor = (action: string) => {
        switch (action) {
            case 'CREATE': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
            case 'UPDATE': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
            case 'DELETE': return 'bg-red-50 text-red-700 ring-red-600/20';
            case 'EXPORT': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
            case 'VIEW': return 'bg-slate-50 text-slate-700 ring-slate-600/20';
            default: return 'bg-slate-50 text-slate-600 ring-slate-500/10';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-start justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="h-6 w-6 text-[#c8ff00]" />
                        Audit Logs
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                        Detailed compliance trails for SOC 2 and GDPR auditing.
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">User</label>
                    <div className="relative">
                        <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                            value={filters.userId}
                            onChange={(e) => setFilters(f => ({ ...f, userId: e.target.value }))}
                            className="w-full pl-9 rounded-xl border-0 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                        >
                            <option value="">All Users</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Action</label>
                    <div className="relative">
                        <Activity className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                            value={filters.action}
                            onChange={(e) => setFilters(f => ({ ...f, action: e.target.value }))}
                            className="w-full pl-9 rounded-xl border-0 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                        >
                            <option value="">All Actions</option>
                            <option value="CREATE">Create</option>
                            <option value="UPDATE">Update</option>
                            <option value="DELETE">Delete</option>
                            <option value="VIEW">View</option>
                            <option value="EXPORT">Export</option>
                            <option value="LOGIN">Login</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Resource</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        <select
                            value={filters.resource}
                            onChange={(e) => setFilters(f => ({ ...f, resource: e.target.value }))}
                            className="w-full pl-9 rounded-xl border-0 py-2 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                        >
                            <option value="">All Resources</option>
                            <option value="Candidate">Candidate</option>
                            <option value="Job">Job</option>
                            <option value="Evaluation">Evaluation</option>
                            <option value="Interview">Interview</option>
                            <option value="Pipeline">Pipeline</option>
                            <option value="User">User</option>
                        </select>
                    </div>
                </div>
                <div className="flex items-end">
                    <button 
                        onClick={() => setFilters({ userId: '', action: '', resource: '' })}
                        className="w-full px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Logs Table */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Timestamp</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">User</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Action</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Context</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                [1,2,3,4,5].map(i => (
                                    <tr key={i} className="animate-pulse">
                                        <td colSpan={5} className="px-6 py-4 h-16 bg-white" />
                                    </tr>
                                ))
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500 text-sm">
                                        No audit logs found matching your criteria.
                                    </td>
                                </tr>
                            ) : logs.map((log) => (
                                <tr key={log.id} className="hover:bg-slate-50/30 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-900">
                                                {new Date(log.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {new Date(log.createdAt).toLocaleTimeString()}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center gap-2">
                                            <div className="h-8 w-8 rounded-full bg-[#0a0f1a] flex items-center justify-center text-[#c8ff00] text-xs font-bold">
                                                {log.user?.firstName?.[0] || 'S'}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-semibold text-slate-800">
                                                    {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System'}
                                                </span>
                                                <span className="text-xs text-slate-400">{log.user?.email || 'automated@hireflow.com'}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ${getActionColor(log.action)}`}>
                                            {log.action}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-medium text-slate-700">{log.resource}</span>
                                            <span className="text-xs font-mono text-slate-400">{log.resourceId?.slice(0, 8) || 'N/A'}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1.5 min-w-[200px]">
                                            <div className="flex items-center gap-3 text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                                                <span className="flex items-center gap-1"><Globe className="h-3 w-3" /> {log.ipAddress || '127.0.0.1'}</span>
                                                <span className="flex items-center gap-1"><Monitor className="h-3 w-3" /> {log.userAgent?.includes('Mac') ? 'macOS' : 'Linux'}</span>
                                            </div>
                                            {log.changes && (
                                                <div className="text-[11px] bg-slate-50 text-slate-600 rounded-lg p-2 font-mono whitespace-pre-wrap">
                                                    {JSON.stringify(log.changes, null, 2)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="px-6 py-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                    <p className="text-sm text-slate-500">
                        Showing <span className="font-semibold text-slate-900">{(page - 1) * limit + 1}</span> to <span className="font-semibold text-slate-900">{Math.min(page * limit, total)}</span> of <span className="font-semibold text-slate-900">{total}</span> logs
                    </p>
                    <div className="flex items-center gap-2">
                        <button
                            disabled={page === 1}
                            onClick={() => setPage(p => p - 1)}
                            className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-transparent hover:border-slate-100 shadow-sm"
                        >
                            <ChevronLeft className="h-5 w-5" />
                        </button>
                        <span className="text-sm font-medium text-slate-700 px-2">Page {page} of {totalPages}</span>
                        <button
                            disabled={page === totalPages}
                            onClick={() => setPage(p => p + 1)}
                            className="p-2 rounded-xl text-slate-500 hover:bg-white hover:text-slate-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all border border-transparent hover:border-slate-100 shadow-sm"
                        >
                            <ChevronRight className="h-5 w-5" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
