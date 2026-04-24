'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Briefcase, Users, Settings2 } from 'lucide-react';
import { jobApi } from '@/lib/api';
import { ScoringConfigModal } from '@/components/jobs/ScoringConfigModal';
import { CreateJobModal } from '@/components/jobs/CreateJobModal';
import toast from 'react-hot-toast';

interface JobItem {
    id: string;
    title: string;
    department: string;
    status: string;
    createdAt: string;
    description?: string;
    pipelineTemplate: { id: string; name: string; roleType: string } | null;
    hiringManager: { id: string; email: string; firstName: string; lastName: string } | null;
    _count: { candidates: number };
}

export default function JobsPage() {
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [configJob, setConfigJob] = useState<JobItem | null>(null);

    const load = useCallback(async () => {
        try {
            const data = await jobApi.list();
            setJobs(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('[JobsPage] load error:', err);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    // Optimistic insert — new job appears immediately
    const handleJobCreated = useCallback((newJob: unknown) => {
        setJobs(prev => [newJob as JobItem, ...prev]);
        load(); // background sync to get full relations
    }, [load]);

    const handleArchive = async (id: string) => {
        if (!confirm('Archive this job?')) return;
        try {
            await jobApi.archive(id);
            toast.success('Job archived');
            setJobs(prev => prev.map(j => j.id === id ? { ...j, status: 'ARCHIVED' } : j));
        } catch (err: any) {
            toast.error(err.message || 'Failed to archive job');
        }
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
            <div className="h-8 w-32 bg-slate-200 rounded mb-2" />
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map(i => <div key={i} className="rounded-2xl bg-white h-44 border border-slate-100" />)}
            </div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Jobs</h2>
                    <p className="mt-2 text-sm text-slate-500">{jobs.filter(j => j.status === 'OPEN').length} open position{jobs.filter(j => j.status === 'OPEN').length !== 1 ? 's' : ''}</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 rounded-full bg-[#0a0f1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors active:scale-95"
                >
                    <Plus className="-ml-0.5 h-4 w-4 text-[#c8ff00]" /> Create Job
                </button>
            </div>

            {/* Job Grid */}
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.length === 0 ? (
                    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">No jobs yet</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by creating a new job posting.</p>
                        <button
                            onClick={() => setShowCreate(true)}
                            className="mt-6 inline-flex items-center rounded-full bg-[#c8ff00] px-4 py-2 text-sm font-semibold text-[#0a0f1a] shadow-sm hover:bg-[#b5e800]"
                        >
                            <Plus className="-ml-0.5 mr-1.5 h-4 w-4" /> New Job
                        </button>
                    </div>
                ) : jobs.map(job => (
                    <div key={job.id} className="rounded-2xl bg-white shadow-sm border border-slate-100 p-6 hover:shadow-md transition-all hover:-translate-y-0.5 relative overflow-hidden group">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="rounded-xl bg-slate-50 p-3 ring-1 ring-slate-100">
                                    <Briefcase className="h-6 w-6 text-slate-700" />
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900 leading-tight">{job.title}</h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{job.department || 'No department'}</p>
                                </div>
                            </div>
                        </div>

                        {job.description && (
                            <p className="mt-3 text-xs text-slate-500 line-clamp-2">{job.description}</p>
                        )}

                        <div className="mt-5 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span>{job._count?.candidates ?? 0} candidates</span>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusBadge(job.status)}`}>
                                    {job.status}
                                </span>
                            </div>

                            {(job.pipelineTemplate || job.hiringManager) && (
                                <div className="pt-3 border-t border-slate-100 space-y-1.5">
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
                            )}
                        </div>

                        {job.status === 'OPEN' && (
                            <div className="mt-5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setConfigJob(job)}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 bg-slate-100 hover:bg-[#c8ff00] px-3 py-2 rounded-xl transition-colors uppercase"
                                >
                                    <Settings2 className="h-3.5 w-3.5" /> Configure Scoring
                                </button>
                                <button
                                    onClick={() => handleArchive(job.id)}
                                    className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-full ring-1 ring-red-100"
                                >
                                    Archive
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Modals */}
            <CreateJobModal
                isOpen={showCreate}
                onClose={() => setShowCreate(false)}
                onJobCreated={handleJobCreated}
            />

            {configJob && (
                <ScoringConfigModal
                    job={configJob}
                    onClose={() => setConfigJob(null)}
                    onUpdate={load}
                />
            )}
        </div>
    );
}
