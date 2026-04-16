'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { Search, SlidersHorizontal, X, Plus, Mail, MoreVertical, Users, ChevronUp, ChevronDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { candidateApi, pipelineApi, CandidateFilters } from '@/lib/api';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionsToolbar from '@/components/candidates/BulkActionsToolbar';
import { CandidateDetailDrawer } from '@/components/candidates/CandidateDetailDrawer';

// ─── Types ───────────────────────────────────────────────────────────────────
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

const STATUS_OPTIONS = ['ACTIVE', 'HIRED', 'REJECTED'] as const;
const DATE_PRESETS = [
    { label: 'Last 7 days', value: '7d' as const },
    { label: 'Last 30 days', value: '30d' as const },
    { label: 'Last 90 days', value: '90d' as const },
];

const STATUS_COLORS: Record<string, string> = {
    ACTIVE: 'bg-[#c8ff00]/20 text-[#0a0f1a] ring-[#c8ff00]/50',
    HIRED: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
    REJECTED: 'bg-red-50 text-red-700 ring-red-600/20',
};

// ─── Custom hook: debounce ────────────────────────────────────────────────────
function useDebounce<T>(value: T, delay: number): T {
    const [debounced, setDebounced] = useState(value);
    useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay);
        return () => clearTimeout(timer);
    }, [value, delay]);
    return debounced;
}

// ─── Page ────────────────────────────────────────────────────────────────────
export default function CandidatesPage() {
    const [candidates, setCandidates] = useState<CandidateItem[]>([]);
    const [total, setTotal] = useState(0);
    const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', pipelineId: '', initialStageId: '' });
    const [formError, setFormError] = useState('');

    // ─── Filters State ────────────────────────────────────────────────────────
    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState<CandidateFilters>({
        sort: 'createdAt',
        order: 'desc',
    });
    const debouncedSearch = useDebounce(searchInput, 300);

    // Merge debounced search into filters
    const activeFilters: CandidateFilters = { ...filters, search: debouncedSearch || undefined };

    // ─── Bulk Selection ───────────────────────────────────────────────────────
    const { selectedIds, isSelected, toggleSelect, toggleSelectAll, clearSelection, handleShiftClick } = useBulkSelection(candidates);

    // ─── Data Loading ─────────────────────────────────────────────────────────
    const load = useCallback(async (showSearchSpinner = false) => {
        if (showSearchSpinner) setSearching(true); else setLoading(true);
        try {
            const [result, p] = await Promise.all([
                candidateApi.list(activeFilters),
                pipelines.length === 0 ? pipelineApi.list() : Promise.resolve(pipelines),
            ]);
            // API returns { items, total, filtered } or plain array
            if (Array.isArray(result)) {
                setCandidates(result);
                setTotal(result.length);
            } else {
                setCandidates(result.items || []);
                setTotal(result.total || result.items?.length || 0);
            }
            if (pipelines.length === 0) setPipelines(p);
        } catch (err) { console.error(err); }
        finally { setLoading(false); setSearching(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(activeFilters)]);

    useEffect(() => { load(); }, [load]);

    // Keyboard shortcuts
    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (showAddModal) return;
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') { e.preventDefault(); toggleSelectAll(candidates.map(c => c.id)); }
            if (e.key === 'Escape') { clearSelection(); setSelectedCandidateId(null); }
        };
        window.addEventListener('keydown', h);
        return () => window.removeEventListener('keydown', h);
    }, [candidates, showAddModal, toggleSelectAll, clearSelection]);

    // ─── Actions ──────────────────────────────────────────────────────────────
    const handleAddCandidate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        try {
            await candidateApi.create(form);
            setShowAddModal(false);
            setForm({ firstName: '', lastName: '', email: '', pipelineId: '', initialStageId: '' });
            load();
        } catch (err: any) { setFormError(err.message); }
    };

    const handleReject = async (id: string) => {
        if (!confirm('Reject this candidate?')) return;
        await candidateApi.reject(id).catch(_ => {});
        setActionMenu(null);
        load();
    };

    const handleHire = async (id: string) => {
        if (!confirm('Mark as hired?')) return;
        await candidateApi.hire(id).catch(_ => {});
        setActionMenu(null);
        load();
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this candidate permanently?')) return;
        await candidateApi.delete(id).catch(_ => {});
        setActionMenu(null);
        load();
    };

    // ─── Filter helpers ───────────────────────────────────────────────────────
    const setFilter = (key: keyof CandidateFilters, value: string | undefined) => {
        setFilters(f => ({ ...f, [key]: value }));
    };

    const toggleSort = (col: CandidateFilters['sort']) => {
        if (filters.sort === col) {
            setFilters(f => ({ ...f, order: f.order === 'desc' ? 'asc' : 'desc' }));
        } else {
            setFilters(f => ({ ...f, sort: col, order: 'asc' }));
        }
    };

    const clearAllFilters = () => {
        setSearchInput('');
        setFilters({ sort: 'createdAt', order: 'desc' });
    };

    // Active filter chips (excluding sort/order)
    const activeChips: { label: string; onRemove: () => void }[] = [];
    if (debouncedSearch) activeChips.push({ label: `"${debouncedSearch}"`, onRemove: () => setSearchInput('') });
    if (filters.status) activeChips.push({ label: filters.status, onRemove: () => setFilter('status', undefined) });
    if (filters.stage) {
        const stageName = pipelines.flatMap(p => p.stages).find(s => s.id === filters.stage)?.name;
        if (stageName) activeChips.push({ label: `Stage: ${stageName}`, onRemove: () => setFilter('stage', undefined) });
    }
    if (filters.dateRange) {
        const label = DATE_PRESETS.find(d => d.value === filters.dateRange)?.label || filters.dateRange;
        activeChips.push({ label, onRemove: () => setFilter('dateRange', undefined) });
    }

    const selectedPipeline = pipelines.find(p => p.id === form.pipelineId);
    const allStages = pipelines.flatMap(p => p.stages);

    // ─── Sort Indicator ───────────────────────────────────────────────────────
    const SortIcon = ({ col }: { col: CandidateFilters['sort'] }) => {
        if (filters.sort !== col) return <ArrowUpDown className="h-3.5 w-3.5 text-slate-400" />;
        return filters.order === 'asc' ? <ChevronUp className="h-3.5 w-3.5 text-[#0a0f1a]" /> : <ChevronDown className="h-3.5 w-3.5 text-[#0a0f1a]" />;
    };

    if (loading && candidates.length === 0) {
        return (
            <div className="space-y-6 animate-pulse">
                <div><div className="h-8 w-48 bg-slate-200 rounded mb-2" /></div>
                <div className="h-12 bg-slate-100 rounded-2xl" />
                <div className="h-64 bg-slate-100 rounded-2xl" />
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* ─── Header ──────────────────────────────────────────────── */}
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Candidate Directory</h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {searching ? <span className="flex items-center gap-1.5"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Searching...</span>
                            : `${candidates.length}${total !== candidates.length ? ` of ${total}` : ''} candidate${candidates.length !== 1 ? 's' : ''}${debouncedSearch ? ` for "${debouncedSearch}"` : ''}`
                        }
                    </p>
                </div>
                <div className="mt-4 flex sm:ml-4 sm:mt-0 gap-3">
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ring-1 ${showFilters ? 'bg-[#0a0f1a] text-white ring-[#0a0f1a]' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        Filters {activeChips.length > 0 && <span className="h-5 w-5 rounded-full bg-[#c8ff00] text-[#0a0f1a] text-xs font-bold flex items-center justify-center">{activeChips.length}</span>}
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-x-2 rounded-full bg-[#0a0f1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors"
                    >
                        <Plus className="-ml-0.5 h-4 w-4 text-[#c8ff00]" /> Add Candidate
                    </button>
                </div>
            </div>

            {/* ─── Search Bar ────────────────────────────────────────────── */}
            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    {searching
                        ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                        : <Search className="h-4 w-4 text-slate-400" />
                    }
                </div>
                <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={searchInput}
                    onChange={e => setSearchInput(e.target.value)}
                    className="w-full rounded-2xl border-0 py-3 pl-11 pr-12 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] outline-none bg-white shadow-sm transition"
                />
                {searchInput && (
                    <button onClick={() => setSearchInput('')} className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600">
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* ─── Filter Panel ─────────────────────────────────────────── */}
            {showFilters && (
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        {/* Status */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Status</p>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map(s => (
                                    <button
                                        key={s}
                                        onClick={() => setFilter('status', filters.status === s ? undefined : s)}
                                        className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filters.status === s ? 'bg-[#0a0f1a] text-white border-transparent' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stage */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Stage</p>
                            <select
                                value={filters.stage || ''}
                                onChange={e => setFilter('stage', e.target.value || undefined)}
                                className="w-full rounded-xl border-0 py-2 px-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                            >
                                <option value="">Any stage</option>
                                {allStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>

                        {/* Date Range */}
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Date Added</p>
                            <div className="flex flex-col gap-1.5">
                                {DATE_PRESETS.map(d => (
                                    <button
                                        key={d.value}
                                        onClick={() => setFilter('dateRange', filters.dateRange === d.value ? undefined : d.value)}
                                        className={`text-left px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filters.dateRange === d.value ? 'bg-[#c8ff00] text-[#0a0f1a]' : 'text-slate-600 hover:bg-slate-100'}`}
                                    >
                                        {d.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Active Filter Chips ──────────────────────────────────── */}
            {activeChips.length > 0 && (
                <div className="flex items-center flex-wrap gap-2">
                    <span className="text-xs font-medium text-slate-500">Active filters:</span>
                    {activeChips.map(chip => (
                        <span key={chip.label} className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0f1a] pl-3 pr-2 py-1 text-xs font-medium text-white">
                            {chip.label}
                            <button onClick={chip.onRemove} className="rounded-full hover:bg-white/20 p-0.5 transition-colors">
                                <X className="h-3 w-3" />
                            </button>
                        </span>
                    ))}
                    <button onClick={clearAllFilters} className="text-xs text-slate-500 hover:text-slate-800 underline">Clear all</button>
                </div>
            )}

            {/* ─── Table ───────────────────────────────────────────────── */}
            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className={`overflow-hidden shadow-sm ring-1 ring-slate-100 sm:rounded-2xl bg-white border border-slate-100 transition-opacity ${searching ? 'opacity-60' : 'opacity-100'}`}>
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="py-4 pl-4 pr-3 text-left sm:pl-6 w-10">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-[#c8ff00]"
                                                checked={candidates.length > 0 && selectedIds.length === candidates.length}
                                                onChange={() => toggleSelectAll(candidates.map(c => c.id))}
                                            />
                                        </th>
                                        <th className="py-4 pl-4 pr-3 text-left text-xs sm:pl-6">
                                            <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors">
                                                Candidate <SortIcon col="name" />
                                            </button>
                                        </th>
                                        <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline</th>
                                        <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Stage</th>
                                        <th className="px-3 py-4 text-left text-xs">
                                            <button onClick={() => toggleSort('status')} className="flex items-center gap-1.5 font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors">
                                                Status <SortIcon col="status" />
                                            </button>
                                        </th>
                                        <th className="px-3 py-4 text-left text-xs">
                                            <button onClick={() => toggleSort('createdAt')} className="flex items-center gap-1.5 font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors">
                                                Added <SortIcon col="createdAt" />
                                            </button>
                                        </th>
                                        <th className="relative py-4 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 bg-white">
                                    {candidates.length === 0 ? (
                                        <tr>
                                            <td colSpan={7} className="py-16 text-center">
                                                <Users className="mx-auto h-12 w-12 text-slate-200 mb-3" />
                                                <h3 className="text-sm font-semibold text-slate-900">
                                                    {debouncedSearch || activeChips.length > 0 ? 'No candidates match your filters' : 'No candidates yet'}
                                                </h3>
                                                <p className="text-sm text-slate-400 mt-1">
                                                    {debouncedSearch || activeChips.length > 0 ? 'Try adjusting your search or removing filters.' : 'Add your first candidate to get started.'}
                                                </p>
                                                {activeChips.length > 0 && (
                                                    <button onClick={clearAllFilters} className="mt-4 text-sm font-medium text-slate-700 underline">Clear all filters</button>
                                                )}
                                            </td>
                                        </tr>
                                    ) : candidates.map((person) => (
                                        <tr
                                            key={person.id}
                                            className={`transition-colors group ${isSelected(person.id) ? 'bg-[#c8ff00]/5 hover:bg-[#c8ff00]/10' : 'hover:bg-slate-50/50'}`}
                                        >
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <input
                                                    type="checkbox"
                                                    className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-[#c8ff00]"
                                                    checked={isSelected(person.id)}
                                                    onChange={(e) => {
                                                        if ((e.nativeEvent as MouseEvent).shiftKey) handleShiftClick(person.id, lastSelectedId);
                                                        else toggleSelect(person.id);
                                                        setLastSelectedId(person.id);
                                                    }}
                                                />
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm cursor-pointer" onClick={() => setSelectedCandidateId(person.id)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center font-bold text-white text-sm shadow-sm shrink-0">
                                                        {person.firstName.charAt(0)}{person.lastName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900 group-hover:text-[#0a0f1a]">{person.firstName} {person.lastName}</div>
                                                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500"><Mail className="h-3 w-3 text-slate-400" />{person.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <div className="font-medium text-slate-900">{person.pipeline?.name || '—'}</div>
                                                {person.pipeline?.roleType && <div className="mt-0.5 text-xs text-slate-400">{person.pipeline.roleType}</div>}
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                                                    {person.currentStage?.name || 'Unassigned'}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[person.status] || 'bg-slate-50 text-slate-600 ring-slate-200'}`}>
                                                    {person.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">
                                                {new Date(person.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm sm:pr-6">
                                                <div className="relative">
                                                    <button onClick={() => setActionMenu(actionMenu === person.id ? null : person.id)} className="text-slate-400 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors opacity-0 group-hover:opacity-100">
                                                        <MoreVertical className="h-5 w-5" />
                                                    </button>
                                                    {actionMenu === person.id && (
                                                        <>
                                                            <div className="fixed inset-0 z-10" onClick={() => setActionMenu(null)} />
                                                            <div className="absolute right-6 top-0 z-20 w-40 rounded-xl bg-white shadow-lg ring-1 ring-slate-200/50 p-1">
                                                                <button onClick={() => { setSelectedCandidateId(person.id); setActionMenu(null); }} className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50">View Details</button>
                                                                {person.status === 'ACTIVE' && (
                                                                    <>
                                                                        <button onClick={() => handleHire(person.id)} className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-emerald-700 hover:bg-emerald-50">Hire</button>
                                                                        <button onClick={() => handleReject(person.id)} className="block w-full rounded-lg px-4 py-2 text-left text-sm font-medium text-red-700 hover:bg-red-50">Reject</button>
                                                                    </>
                                                                )}
                                                                <div className="h-px bg-slate-100 my-1" />
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

            {/* ─── Add Candidate Modal ──────────────────────────────────── */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)} />
                        <div className="relative transform overflow-hidden rounded-2xl bg-white px-4 pb-4 pt-5 text-left shadow-2xl w-full max-w-lg sm:p-6 transition-all animate-in zoom-in-95 duration-200">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-bold text-slate-900">Add New Candidate</h3>
                                <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <form onSubmit={handleAddCandidate} className="space-y-5 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">First Name</label>
                                        <input required value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] text-sm outline-none bg-slate-50" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Last Name</label>
                                        <input required value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] text-sm outline-none bg-slate-50" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                                    <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] text-sm outline-none bg-slate-50" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Pipeline</label>
                                    <select required value={form.pipelineId} onChange={e => setForm({ ...form, pipelineId: e.target.value, initialStageId: '' })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] text-sm outline-none bg-slate-50 cursor-pointer">
                                        <option value="">Select a pipeline...</option>
                                        {pipelines.map(p => <option key={p.id} value={p.id}>{p.name} ({p.roleType})</option>)}
                                    </select>
                                </div>
                                {selectedPipeline && (
                                    <div className="animate-in slide-in-from-top-2 duration-200">
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Starting Stage</label>
                                        <select required value={form.initialStageId} onChange={e => setForm({ ...form, initialStageId: e.target.value })} className="block w-full rounded-xl border-0 py-2 px-3 text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] text-sm outline-none bg-slate-50 cursor-pointer">
                                            <option value="">Select starting stage...</option>
                                            {selectedPipeline.stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                )}
                                {formError && <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{formError}</p>}
                                <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowAddModal(false)} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
                                    <button type="submit" className="rounded-full bg-[#0a0f1a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Add Candidate</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Candidate Detail Drawer ──────────────────────────────── */}
            <CandidateDetailDrawer
                candidateId={selectedCandidateId}
                onClose={() => setSelectedCandidateId(null)}
                onUpdate={load}
            />

            {/* ─── Bulk Actions ─────────────────────────────────────────── */}
            <BulkActionsToolbar
                selectedIds={selectedIds}
                onClear={clearSelection}
                onActionComplete={load}
                availableStages={allStages}
            />
        </div>
    );
}
