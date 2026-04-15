'use client';

import React, { useEffect, useState } from 'react';
import { Mail, MoreVertical, Plus, X, Users } from 'lucide-react';
import { candidateApi, pipelineApi } from '@/lib/api';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionsToolbar from '@/components/candidates/BulkActionsToolbar';

interface CandidateItem {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    createdAt: string;
    currentStage: { id: string; name: string } | null;
    pipeline: { id: string; name: string; roleType: string } | null;
}

interface PipelineItem {
    id: string;
    name: string;
    roleType: string;
    stages: { id: string; name: string; orderIndex: number }[];
}

export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<CandidateItem[]>([]);
    const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [actionMenu, setActionMenu] = useState<string | null>(null);

    // Form state
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', pipelineId: '', initialStageId: '' });
    const [formError, setFormError] = useState('');
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

    const { 
        selectedIds, 
        isSelected, 
        toggleSelect, 
        toggleSelectAll, 
        clearSelection, 
        handleShiftClick 
    } = useBulkSelection(candidates);

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (showAddModal) return;
            
            // Cmd+A or Ctrl+A
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                toggleSelectAll(candidates.map(c => c.id));
            }
            
            // Escape
            if (e.key === 'Escape') {
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [candidates, toggleSelectAll, clearSelection, showAddModal]);

    const load = async () => {
        try {
            const [c, p] = await Promise.all([candidateApi.list(), pipelineApi.list()]);
            setCandidates(c);
            setPipelines(p);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const selectedPipeline = pipelines.find(p => p.id === form.pipelineId);

    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            await candidateApi.create(form);
            setShowAddModal(false);
            setForm({ firstName: '', lastName: '', email: '', pipelineId: '', initialStageId: '' });
            load();
        } catch (err: any) {
            setFormError(err.message);
        }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Are you sure you want to reject this candidate?')) return;
        try {
            await candidateApi.reject(id);
            setActionMenu(null);
            load();
        } catch (err: any) { alert(err.message); }
    };

    const handleHire = async (id: string) => {
        if (!confirm('Mark this candidate as hired?')) return;
        try {
            await candidateApi.hire(id);
            setActionMenu(null);
            load();
        } catch (err: any) { alert(err.message); }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this candidate permanently?')) return;
        try {
            await candidateApi.delete(id);
            setActionMenu(null);
            load();
        } catch (err: any) { alert(err.message); }
    };

    const statusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-[#c8ff00]/20 text-[#0a0f1a] ring-[#c8ff00]/50';
            case 'HIRED': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
            case 'REJECTED': return 'bg-red-50 text-red-700 ring-red-600/20';
            default: return 'bg-slate-50 text-slate-600 ring-slate-500/10';
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div><div className="h-8 w-48 bg-slate-200 rounded mb-2"></div></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Candidate Directory</h2>
                    <p className="mt-2 text-sm text-slate-500">A central hub mapping all tracked candidates to their pipelines.</p>
                </div>
                <div className="mt-4 flex sm:ml-4 sm:mt-0 gap-3">
                    <button 
                        onClick={() => setShowAddModal(true)} 
                        className="inline-flex items-center gap-x-2 rounded-full bg-[#0a0f1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="-ml-0.5 h-4 w-4 text-[#c8ff00]" /> Add Candidate
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow-sm ring-1 ring-slate-100 sm:rounded-2xl bg-white border border-slate-100">
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="py-4 pl-4 pr-3 text-left sm:pl-6 w-10">
                                            <input 
                                                type="checkbox" 
                                                className="h-4 w-4 rounded border-slate-300 text-[#0a0f1a] focus:ring-[#c8ff00] cursor-pointer accent-[#c8ff00]"
                                                checked={candidates.length > 0 && selectedIds.length === candidates.length}
                                                onChange={() => toggleSelectAll(candidates.map(c => c.id))}
                                            />
                                        </th>
                                        <th className="py-4 pl-4 pr-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Candidate</th>
                                        <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline</th>
                                        <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stage</th>
                                        <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                                        <th className="relative py-4 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {candidates.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-12 text-center">
                                                <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                                                <h3 className="text-sm font-semibold text-slate-900">No candidates</h3>
                                                <p className="text-sm text-slate-500 mt-1">Get started by adding a candidate to a pipeline.</p>
                                            </td>
                                        </tr>
                                    ) : candidates.map((person) => (
                                        <tr 
                                            key={person.id} 
                                            className={`transition-colors ${isSelected(person.id) ? 'bg-[#c8ff00]/5 hover:bg-[#c8ff00]/10' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <td className="whitespace-nowrap py-5 pl-4 pr-3 text-sm sm:pl-6">
                                                <input 
                                                    type="checkbox" 
                                                    className="h-4 w-4 rounded border-slate-300 text-[#0a0f1a] focus:ring-[#c8ff00] cursor-pointer accent-[#c8ff00]"
                                                    checked={isSelected(person.id)}
                                                    onChange={(e) => {
                                                        const isShift = (e.nativeEvent as MouseEvent).shiftKey;
                                                        if (isShift) {
                                                            handleShiftClick(person.id, lastSelectedId);
                                                        } else {
                                                            toggleSelect(person.id);
                                                        }
                                                        setLastSelectedId(person.id);
                                                    }}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap py-5 pl-4 pr-3 text-sm">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-11 w-11 rounded-full bg-[#f8fafc] border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm">
                                                        {person.firstName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{person.firstName} {person.lastName}</div>
                                                        <div className="mt-1 flex items-center gap-2 text-slate-500"><Mail className="h-3 w-3 text-slate-400" />{person.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm">
                                                <div className="font-medium text-slate-900">{person.pipeline?.name || '—'}</div>
                                                <div className="mt-1 text-slate-500">{person.pipeline?.roleType}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm">
                                                <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-1 text-xs font-medium text-slate-700 ring-1 ring-inset ring-slate-200">
                                                    {person.currentStage?.name || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${statusColor(person.status)}`}>
                                                    {person.status}
                                                </span>
                                            </td>
                                            <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <div className="relative">
                                                    <button onClick={() => setActionMenu(actionMenu === person.id ? null : person.id)} className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors">
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>
                                                    {actionMenu === person.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                                            <div className="absolute right-6 top-0 z-20 mt-0 w-40 rounded-xl bg-white shadow-lg ring-1 ring-slate-200/50 p-1">
                                                                {person.status === 'ACTIVE' && (
                                                                    <>
                                                                        <button onClick={() => handleHire(person.id)} className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50">Hire Candidate</button>
                                                                        <button onClick={() => handleReject(person.id)} className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">Reject</button>
                                                                    </>
                                                                )}
                                                                {person.status !== 'ACTIVE' && (
                                                                    <div className="px-4 py-2 text-xs text-slate-400 italic">No actions available</div>
                                                                )}
                                                                <div className="h-px bg-slate-100 my-1 mx-2" />
                                                                <button onClick={() => handleDelete(person.id)} className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-600 hover:bg-red-50">Delete</button>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl w-full max-w-lg sm:p-6 transition-all">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-bold text-slate-900">Add New Candidate</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <form onSubmit={handleAddCandidate} className="space-y-5 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                                        <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                                        <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pipeline Assessment</label>
                                    <select
                                        required
                                        value={form.pipelineId}
                                        onChange={e => setForm({ ...form, pipelineId: e.target.value, initialStageId: '' })}
                                        className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 cursor-pointer"
                                    >
                                        <option value="">Select a pipeline...</option>
                                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name} ({p.roleType})</option>)}
                                    </select>
                                </div>
                                {selectedPipeline && (
                                    <div className="animate-in slide-in-from-top-2 duration-300">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Starting Stage</label>
                                        <select
                                            required
                                            value={form.initialStageId}
                                            onChange={e => setForm({ ...form, initialStageId: e.target.value })}
                                            className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 cursor-pointer"
                                        >
                                            <option value="">Indicate starting stage...</option>
                                            {selectedPipeline.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {formError && <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{formError}</p>}
                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" className="rounded-full bg-[#0a0f1a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors">Add Candidate</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            <BulkActionsToolbar 
                selectedIds={selectedIds}
                onClear={clearSelection}
                onActionComplete={load}
                availableStages={pipelines.flatMap(p => p.stages)}
            />
        </div>
    );
}
