'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Briefcase, Users, X } from 'lucide-react';
import { jobApi, pipelineApi } from '@/lib/api';

interface JobItem {
    id: string;
    title: string;
    department: string;
    status: string;
    createdAt: string;
    pipelineTemplate: { id: string; name: string; roleType: string } | null;
    hiringManager: { id: string; email: string; firstName: string; lastName: string } | null;
    _count: { candidates: number };
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState({ title: '', department: '', pipelineTemplateId: '' });
    const [formError, setFormError] = useState('');

    const load = async () => {
        try {
            const [j, p] = await Promise.all([jobApi.list(), pipelineApi.list()]);
            setJobs(j);
            setPipelines(p);
        } catch (err) { console.error(err); } finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            await jobApi.create(form);
            setShowAddModal(false);
            setForm({ title: '', department: '', pipelineTemplateId: '' });
            load();
        } catch (err: any) { setFormError(err.message); }
    };

    const handleArchive = async (id: string) => {
        if (!confirm('Archive this job?')) return;
        try { await jobApi.archive(id); load(); } catch (err: any) { alert(err.message); }
    };

    const statusBadge = (status: string) => {
        switch (status) {
            case 'OPEN': return 'bg-[#c8ff00]/20 text-[#0a0f1a] ring-[#c8ff00]/50';
            case 'CLOSED': return 'bg-slate-100 text-slate-600 ring-slate-500/10';
            case 'ARCHIVED': return 'bg-red-50 text-red-700 ring-red-600/20';
            default: return 'bg-slate-50 text-slate-600 ring-slate-500/10';
        }
    };

    if (loading) return (
        <div className="space-y-6 animate-pulse">
            <div><div className="h-8 w-32 bg-slate-200 rounded mb-2"></div></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Jobs</h2>
                    <p className="mt-2 text-sm text-slate-500">Manage open positions and their hiring pipelines.</p>
                </div>
                <button 
                    onClick={() => setShowAddModal(true)} 
                    className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 rounded-full bg-[#0a0f1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                >
                    <Plus className="-ml-0.5 h-4 w-4 text-[#c8ff00]" /> Create Job
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.length === 0 ? (
                    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">No jobs</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by creating a new job posting.</p>
                        <div className="mt-6">
                            <button onClick={() => setShowAddModal(true)} className="inline-flex items-center rounded-full bg-[#c8ff00] px-4 py-2 text-sm font-semibold text-[#0a0f1a] shadow-sm hover:bg-[#b5e800]">
                                <Plus className="-ml-0.5 mr-1.5 h-4 w-4" /> New Job
                            </button>
                        </div>
                    </div>
                ) : jobs.map(job => (
                    <div key={job.id} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                    <Briefcase className="h-6 w-6 text-slate-700" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{job.department || 'No department'}</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span>{job._count.candidates} candidates</span>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadge(job.status)}`}>
                                    {job.status}
                                </span>
                            </div>
                            
                            <div className="pt-4 border-t border-slate-100 space-y-2">
                                {job.pipelineTemplate && (
                                    <p className="text-xs text-slate-500 flex justify-between">
                                        <span>Pipeline:</span>
                                        <span className="font-medium text-slate-700">{job.pipelineTemplate.name}</span>
                                    </p>
                                )}
                                {job.hiringManager && (
                                    <p className="text-xs text-slate-500 flex justify-between">
                                        <span>Manager:</span>
                                        <span className="font-medium text-slate-700">{job.hiringManager.firstName} {job.hiringManager.lastName}</span>
                                    </p>
                                )}
                            </div>
                        </div>

                        {job.status === 'OPEN' && (
                            <div className="mt-6 flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleArchive(job.id)} className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-full ring-1 ring-red-100">Archive role</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
                        <div className="relative rounded-2xl bg-white px-4 pb-4 pt-5 shadow-2xl w-full max-w-md sm:p-6 transform transition-all">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-bold text-slate-900">Create New Job</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Job Title</label>
                                    <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm sm:leading-6 outline-none transition-shadow bg-slate-50" placeholder="e.g. Senior Frontend Engineer" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Department</label>
                                    <input value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm sm:leading-6 outline-none transition-shadow bg-slate-50" placeholder="e.g. Engineering" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pipeline Template</label>
                                    <select value={form.pipelineTemplateId} onChange={e => setForm({ ...form, pipelineTemplateId: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm sm:leading-6 outline-none transition-shadow bg-slate-50 cursor-pointer">
                                        <option value="">Select a pipeline (optional)</option>
                                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                {formError && <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-xl">{formError}</p>}
                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" className="rounded-full bg-[#0a0f1a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors">Create Job</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
