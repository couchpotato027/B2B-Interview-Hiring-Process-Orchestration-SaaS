'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, Search, Filter, Download, User, 
  Database, AlertCircle, Calendar, ChevronLeft, 
  ChevronRight, RefreshCw, FileText
} from 'lucide-react';
import { complianceApi } from '@/lib/api';
import { format } from 'date-fns';

export function AuditLogViewer() {
  const [logs, setLogs] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: '',
    resource: '',
    skip: 0,
    take: 20
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const response = await complianceApi.getAuditLogs(filters);
      // fetchWithAuth returns the full body { success: true, data: { logs, total } }
      const logsData = response.data || {};
      setLogs(logsData.logs || []);
      setTotal(logsData.total || 0);
    } catch (error) {
      console.error('Failed to load audit logs:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, [filters]);

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE': return 'bg-red-50 text-red-700 ring-red-100';
      case 'CREATE': return 'bg-emerald-50 text-emerald-700 ring-emerald-100';
      case 'UPDATE': return 'bg-amber-50 text-amber-700 ring-amber-100';
      case 'EXPORT': return 'bg-blue-50 text-blue-700 ring-blue-100';
      default: return 'bg-slate-50 text-slate-700 ring-slate-100';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center">
            <Shield className="h-5 w-5 text-[#c8ff00]" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">Audit Infrastructure</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Compliance & Activity Logging</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-600 hover:bg-slate-50 transition-all">
                <Download className="h-4 w-4" /> Export CSV (SOC 2)
            </button>
            <button onClick={loadLogs} className="p-2 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                <RefreshCw className={`h-4 w-4 text-slate-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-2xl">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input 
                placeholder="Search Resource ID..."
                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none"
            />
        </div>
        <select 
            value={filters.action}
            onChange={e => setFilters({...filters, action: e.target.value, skip: 0})}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
        >
            <option value="">All Actions</option>
            <option value="CREATE">Create</option>
            <option value="UPDATE">Update</option>
            <option value="DELETE">Delete</option>
            <option value="VIEW">View</option>
            <option value="EXPORT">Export</option>
        </select>
        <select 
            value={filters.resource}
            onChange={e => setFilters({...filters, resource: e.target.value, skip: 0})}
            className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none"
        >
            <option value="">All Resources</option>
            <option value="Candidate">Candidate</option>
            <option value="Job">Job</option>
            <option value="Evaluation">Evaluation</option>
        </select>
        <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span className="text-[10px] font-black text-slate-400 uppercase">Last 30 Days</span>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-100">
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">User</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Resource</th>
              <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {logs?.map(log => (
              <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                <td className="px-6 py-4 text-xs font-medium text-slate-500">
                  {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    {log.user?.email || 'System'}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-black ring-1 uppercase tracking-tight ${getActionColor(log.action)}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <Database className="h-3.5 w-3.5 text-slate-400" />
                    {log.resource}
                   </div>
                   <div className="text-[10px] text-slate-400 font-mono mt-0.5">#{log.resourceId?.slice(0, 8)}</div>
                </td>
                <td className="px-6 py-4">
                  <button className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase flex items-center gap-1">
                    <FileText className="h-3.5 w-3.5" /> View Changes
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        
        {logs.length === 0 && !loading && (
            <div className="py-20 text-center">
                <AlertCircle className="h-10 w-10 text-slate-200 mx-auto mb-4" />
                <p className="text-sm font-bold text-slate-500">No audit records found matching criteria</p>
            </div>
        )}

        {/* Pagination */}
        <div className="p-6 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[10px] font-black text-slate-400 uppercase">Showing {logs.length} of {total} logs</p>
            <div className="flex gap-2">
                <button 
                    disabled={filters.skip === 0}
                    onClick={() => setFilters({...filters, skip: Math.max(0, filters.skip - filters.take)})}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all font-black text-slate-600"
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>
                <button 
                    disabled={filters.skip + filters.take >= total}
                    onClick={() => setFilters({...filters, skip: filters.skip + filters.take})}
                    className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-50 transition-all font-black text-slate-600"
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
}
