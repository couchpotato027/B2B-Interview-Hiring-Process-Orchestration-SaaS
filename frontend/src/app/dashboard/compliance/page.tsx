'use client';

import React from 'react';
import { 
  ShieldCheck, Lock, Eye, Trash2, 
  FileCheck, Download, AlertTriangle, Users 
} from 'lucide-react';
import { AuditLogViewer } from '@/components/compliance/AuditLogViewer';

export default function CompliancePage() {
  return (
    <div className="p-10 space-y-12 max-w-7xl mx-auto">
      <header className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Lock className="h-5 w-5 text-blue-500" />
            <span className="text-xs font-black text-blue-600 uppercase tracking-[0.3em]">Institutional Grade Security</span>
          </div>
          <h1 className="text-5xl font-black text-slate-900 tracking-tighter">Compliance & Privacy</h1>
          <p className="mt-4 text-slate-500 font-medium text-lg max-w-2xl">
            Managing global data protection requirements across GDPR, SOC 2, and CCPA. All administrative actions are cryptographically logged.
          </p>
        </div>
        
        <div className="flex gap-4">
            <div className="px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-3xl text-center">
                <div className="text-2xl font-black text-emerald-700">98%</div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mt-1">Audit Score</div>
            </div>
             <div className="px-6 py-4 bg-blue-50 border border-blue-100 rounded-3xl text-center">
                <div className="text-2xl font-black text-blue-700">ACTIVE</div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">SOC 2 Mode</div>
            </div>
        </div>
      </header>

      {/* Compliance Stats */}
      <div className="grid grid-cols-4 gap-6">
        {[
            { label: 'SAR Requests', val: '12', icon: Users, color: 'text-purple-500', bg: 'bg-purple-50' },
            { label: 'PII Accesses', val: '1,420', icon: Eye, color: 'text-blue-500', bg: 'bg-blue-50' },
            { label: 'Data Deletions', val: '4', icon: Trash2, color: 'text-red-500', bg: 'bg-red-50' },
            { label: 'Audit Reports', val: '31', icon: FileCheck, color: 'text-emerald-500', bg: 'bg-emerald-50' },
        ].map(stat => (
            <div key={stat.label} className="p-6 bg-white border border-slate-100 rounded-[2.5rem] shadow-sm hover:shadow-md transition-shadow">
                <div className={`h-12 w-12 rounded-2xl ${stat.bg} flex items-center justify-center mb-4`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className="text-3xl font-black text-slate-900">{stat.val}</div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{stat.label}</div>
            </div>
        ))}
      </div>

      {/* Main Audit Viewer */}
      <section className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Real-time Audit Stream</h3>
            <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase">
                <AlertTriangle className="h-4 w-4" /> Log retention: 7 Years
            </div>
        </div>
        <AuditLogViewer />
      </section>

      {/* GDPR Quick Actions */}
      <section className="grid grid-cols-2 gap-8">
          <div className="p-8 bg-slate-900 rounded-[3rem] text-white">
              <h3 className="text-2xl font-black mb-4">Export Candidate Bundle</h3>
              <p className="text-slate-400 text-sm leading-relaxed mb-8">
                  Fulfill GDPR Section 20 "Right to Data Portability". Generates a cryptographically signed archive of all data associated with a specific candidate ID.
              </p>
              <button className="w-full py-4 bg-[#c8ff00] text-slate-900 rounded-2xl text-xs font-black hover:shadow-2xl transition-all shadow-xl">
                  GENERATE EXPORT REQUEST
              </button>
          </div>
          <div className="p-8 bg-white border-2 border-slate-100 rounded-[3rem]">
              <h3 className="text-2xl font-black text-slate-900 mb-4">Permanent Anonymization</h3>
              <p className="text-slate-500 text-sm leading-relaxed mb-8">
                  Fulfill GDPR Section 17 "Right to Erasure". This process is irreversible. All PII will be sanitized and replaced with anonymized tokens while preserving system integrity.
              </p>
              <button className="w-full py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-black hover:bg-red-100 transition-all">
                  INITIATE FORGETTING PROTOCOL
              </button>
          </div>
      </section>
    </div>
  );
}
