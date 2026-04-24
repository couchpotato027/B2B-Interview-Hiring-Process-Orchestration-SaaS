'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Briefcase, Users, X, Settings2, Loader2, AlertCircle, ChevronRight, CheckCircle2 } from 'lucide-react';
import { jobApi, pipelineApi } from '@/lib/api';
import { ScoringConfigModal } from '@/components/jobs/ScoringConfigModal';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

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

interface FormState {
    title: string;
    department: string;
    description: string;
    requiredSkills: string;      // comma-separated string → split to array on submit
    preferredSkills: string;
    requiredExperience: string;  // string input → parsed to number on submit
    pipelineTemplateId: string;
}

const INITIAL_FORM: FormState = {
    title: '',
    department: '',
    description: '',
    requiredSkills: '',
    preferredSkills: '',
    requiredExperience: '0',
    pipelineTemplateId: '',
};

export default function JobsPage() {
    const router = useRouter();
    const [jobs, setJobs] = useState<JobItem[]>([]);
    const [pipelines, setPipelines] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [form, setForm] = useState<FormState>(INITIAL_FORM);
    const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof FormState, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [configJob, setConfigJob] = useState<JobItem | null>(null);

    const load = useCallback(async () => {
        try {
            const [j, p] = await Promise.all([jobApi.list(), pipelineApi.list()]);
            setJobs(Array.isArray(j) ? j : []);
            setPipelines(Array.isArray(p) ? p : []);
        } catch (err) {
            console.error('[JobsPage] load error:', err);
            toast.error('Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const validate = (): boolean => {
        const errors: Partial<Record<keyof FormState, string>> = {};
        if (!form.title.trim()) errors.title = 'Job title is required';
        if (!form.department.trim()) errors.department = 'Department is required';
        if (!form.description.trim()) errors.description = 'Description is required';
        if (!form.requiredSkills.trim()) errors.requiredSkills = 'At least one required skill is needed';
        const exp = parseFloat(form.requiredExperience);
        if (isNaN(exp) || exp < 0) errors.requiredExperience = 'Enter a valid number (0 or more)';
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('[JobsPage] Submitting form:', form);

        if (!validate()) {
            console.warn('[JobsPage] Validation failed:', fieldErrors);
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                title: form.title.trim(),
                department: form.department.trim(),
                description: form.description.trim(),
                requiredSkills: form.requiredSkills.split(',').map(s => s.trim()).filter(Boolean),
                preferredSkills: form.preferredSkills.split(',').map(s => s.trim()).filter(Boolean),
                requiredExperience: parseFloat(form.requiredExperience) || 0,
                ...(form.pipelineTemplateId ? { pipelineTemplateId: form.pipelineTemplateId } : {}),
            };
            console.log('[JobsPage] API payload:', payload);

            const created = await jobApi.create(payload);
            console.log('[JobsPage] Job created:', created);

            toast.success(`"${payload.title}" created successfully!`);
            setShowAddModal(false);
            setForm(INITIAL_FORM);
            setFieldErrors({});
            load();
        } catch (err: any) {
            console.error('[JobsPage] Create failed:', err);
            toast.error(err.message || 'Failed to create job. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseModal = () => {
        if (isSubmitting) return;
        setShowAddModal(false);
        setForm(INITIAL_FORM);
        setFieldErrors({});
    };

    const handleArchive = async (id: string) => {
        if (!confirm('Archive this job?')) return;
        try {
            await jobApi.archive(id);
            toast.success('Job archived');
            load();
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

    const InputField = ({ label, name, type = 'text', placeholder, hint, required }: {
        label: string; name: keyof FormState; type?: string; placeholder?: string; hint?: string; required?: boolean;
    }) => (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            {hint && <p className="text-xs text-slate-400 mb-1.5">{hint}</p>}
            <input
                type={type}
                value={form[name]}
                onChange={e => { setForm(f => ({ ...f, [name]: e.target.value })); setFieldErrors(v => ({ ...v, [name]: undefined })); }}
                placeholder={placeholder}
                className={`block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset sm:text-sm outline-none transition-all bg-slate-50 focus:ring-2 focus:ring-inset ${fieldErrors[name] ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-200 focus:ring-[#c8ff00]'}`}
            />
            {fieldErrors[name] && (
                <p className="mt-1 text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />{fieldErrors[name]}
                </p>
            )}
        </div>
    );

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
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Jobs</h2>
                    <p className="mt-2 text-sm text-slate-500">Manage open positions and their hiring pipelines.</p>
                </div>
                <button
                    onClick={() => setShowAddModal(true)}
                    className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 rounded-full bg-[#0a0f1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors active:scale-95"
                >
                    <Plus className="-ml-0.5 h-4 w-4 text-[#c8ff00]" /> Create Job
                </button>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {jobs.length === 0 ? (
                    <div className="col-span-full rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center">
                        <Briefcase className="mx-auto h-12 w-12 text-slate-300" />
                        <h3 className="mt-2 text-sm font-semibold text-slate-900">No jobs yet</h3>
                        <p className="mt-1 text-sm text-slate-500">Get started by creating a new job posting.</p>
                        <button onClick={() => setShowAddModal(true)} className="mt-6 inline-flex items-center rounded-full bg-[#c8ff00] px-4 py-2 text-sm font-semibold text-[#0a0f1a] shadow-sm hover:bg-[#b5e800]">
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
                                    <h3 className="text-base font-bold text-slate-900">{job.title}</h3>
                                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mt-1">{job.department || 'No department'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2 text-slate-600">
                                    <Users className="h-4 w-4 text-slate-400" />
                                    <span>{job._count?.candidates ?? 0} candidates</span>
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
                            <div className="mt-6 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => setConfigJob(job)}
                                    className="flex items-center gap-1.5 text-[10px] font-black text-slate-900 bg-slate-100 hover:bg-[#c8ff00] px-3 py-2 rounded-xl transition-colors uppercase"
                                >
                                    <Settings2 className="h-3.5 w-3.5" /> Configure Scoring
                                </button>
                                <button onClick={() => handleArchive(job.id)} className="text-xs font-medium text-red-500 hover:text-red-700 bg-red-50 px-3 py-1.5 rounded-full ring-1 ring-red-100">Archive</button>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* ─── Create Job Modal ──────────────────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={handleCloseModal} />
                        <div className="relative rounded-2xl bg-white shadow-2xl w-full max-w-lg transform transition-all animate-in slide-in-from-bottom-4 duration-300">
                            {/* Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="rounded-xl bg-[#c8ff00]/20 p-2">
                                        <Briefcase className="h-5 w-5 text-[#0a0f1a]" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-900">Create New Job</h3>
                                        <p className="text-xs text-slate-400">Fill in the details below</p>
                                    </div>
                                </div>
                                <button onClick={handleCloseModal} disabled={isSubmitting} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full disabled:opacity-50">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Form */}
                            <form onSubmit={handleCreate} className="px-6 py-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <InputField name="title" label="Job Title" placeholder="e.g. Senior Engineer" required />
                                    <InputField name="department" label="Department" placeholder="e.g. Engineering" required />
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                                        Description <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={form.description}
                                        onChange={e => { setForm(f => ({ ...f, description: e.target.value })); setFieldErrors(v => ({ ...v, description: undefined })); }}
                                        placeholder="Describe the role, responsibilities, and expectations..."
                                        className={`block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset sm:text-sm outline-none transition-all bg-slate-50 focus:ring-2 resize-none ${fieldErrors.description ? 'ring-red-300 focus:ring-red-500' : 'ring-slate-200 focus:ring-[#c8ff00]'}`}
                                    />
                                    {fieldErrors.description && <p className="mt-1 text-xs text-red-500 flex items-center gap-1"><AlertCircle className="h-3 w-3" />{fieldErrors.description}</p>}
                                </div>

                                <InputField
                                    name="requiredSkills"
                                    label="Required Skills"
                                    placeholder="React, Node.js, TypeScript"
                                    hint="Comma-separated (e.g. React, Node.js, SQL)"
                                    required
                                />
                                <InputField
                                    name="preferredSkills"
                                    label="Preferred Skills"
                                    placeholder="Docker, Kubernetes, AWS"
                                    hint="Optional — comma-separated"
                                />

                                <div className="grid grid-cols-2 gap-4">
                                    <InputField
                                        name="requiredExperience"
                                        label="Min. Experience (years)"
                                        type="number"
                                        placeholder="e.g. 3"
                                        required
                                    />
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">Pipeline Template</label>
                                        <select
                                            value={form.pipelineTemplateId}
                                            onChange={e => setForm(f => ({ ...f, pipelineTemplateId: e.target.value }))}
                                            className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none transition-all bg-slate-50 cursor-pointer"
                                        >
                                            <option value="">None (optional)</option>
                                            {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Footer */}
                                <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-slate-100">
                                    <button
                                        type="button"
                                        onClick={handleCloseModal}
                                        disabled={isSubmitting}
                                        className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors disabled:opacity-50"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="inline-flex items-center gap-2 rounded-full bg-[#0a0f1a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-all disabled:opacity-70 active:scale-95"
                                    >
                                        {isSubmitting ? (
                                            <><Loader2 className="h-4 w-4 animate-spin" /> Creating...</>
                                        ) : (
                                            <><CheckCircle2 className="h-4 w-4 text-[#c8ff00]" /> Create Job</>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

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
