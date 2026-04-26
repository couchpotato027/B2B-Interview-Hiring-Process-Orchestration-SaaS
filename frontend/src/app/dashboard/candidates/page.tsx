'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Search, SlidersHorizontal, X, Plus, Mail, MoreVertical, Users, ChevronUp, ChevronDown, ArrowUpDown, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { candidateApi, pipelineApi, CandidateFilters } from '@/lib/api';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionsToolbar from '@/components/candidates/BulkActionsToolbar';
import { CandidateDetailDrawer } from '@/components/candidates/CandidateDetailDrawer';
import { ResumeUploadZone } from '@/components/candidates/ResumeUploadZone';
import { EmptyState } from '@/components/shared/EmptyState';
import { ExportDialog } from '@/components/shared/ExportDialog';
import { ImportWizard } from '@/components/shared/ImportWizard';

// ─── Types ───────────────────────────────────────────────────────────────────
interface CandidateRecord {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    status: string;
    createdAt: string;
    currentStage: { id: string; name: string } | null;
    pipeline: { id: string; name: string; roleType: string } | null;
    assignedRecruiter: { id: string; firstName: string; lastName: string } | null;
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
    const { t } = useTranslation();
    const [candidates, setCandidates] = useState<CandidateRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [pipelines, setPipelines] = useState<PipelineItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searching, setSearching] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showFilters, setShowFilters] = useState(false);
    const [showExport, setShowExport] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [actionMenu, setActionMenu] = useState<string | null>(null);
    const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null);
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const [form, setForm] = useState({ firstName: '', lastName: '', email: '', pipelineId: '', initialStageId: '' });
    const [formError, setFormError] = useState('');

    const [searchInput, setSearchInput] = useState('');
    const [filters, setFilters] = useState<CandidateFilters>({
        sort: 'createdAt',
        order: 'desc',
    });
    const debouncedSearch = useDebounce(searchInput, 300);
    const activeFilters: CandidateFilters = { ...filters, search: debouncedSearch || undefined };

    const { selectedIds, isSelected, toggleSelect, toggleSelectAll, clearSelection, handleShiftClick } = useBulkSelection(candidates);

    const load = useCallback(async (showSearchSpinner = false) => {
        if (showSearchSpinner) setSearching(true); else setLoading(true);
        try {
            const [result, p] = await Promise.all([
                candidateApi.list(activeFilters),
                pipelines.length === 0 ? pipelineApi.list() : Promise.resolve(pipelines),
            ]);
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
    }, [JSON.stringify(activeFilters), pipelines.length]);

    useEffect(() => { load(); }, [load]);

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
        <div className="space-y-6 animate-in fade-in duration-500 pb-32 pt-6">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        {t('candidates.title')}
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">
                        {searching ? (
                            <span className="flex items-center gap-1.5">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" /> {t('common.search')}...
                            </span>
                        ) : (
                            t('candidates.searchCount', { 
                                count: candidates.length, 
                                search: debouncedSearch 
                            })
                        )}
                    </p>
                </div>
                
                {/* Header Actions - Improved horizontal scrolling for mobile */}
                <div className="flex items-center gap-3 overflow-x-auto pb-4 -mx-1 px-1 no-scrollbar sm:overflow-visible sm:pb-0 sm:mx-0 sm:px-0">
                    <button
                        onClick={() => setShowFilters(f => !f)}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ring-1 flex-shrink-0 ${showFilters ? 'bg-[#0a0f1a] text-white ring-[#0a0f1a]' : 'bg-white text-slate-700 ring-slate-200 hover:bg-slate-50'}`}
                    >
                        <SlidersHorizontal className="h-4 w-4" />
                        {t('common.filters')} {activeChips.length > 0 && <span className="h-5 w-5 rounded-full bg-[#c8ff00] text-[#0a0f1a] text-xs font-bold flex items-center justify-center">{activeChips.length}</span>}
                    </button>
                    <button
                        onClick={() => setShowImport(true)}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0"
                    >
                        Import
                    </button>
                    <button
                        onClick={() => setShowExport(true)}
                        className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 transition-colors flex-shrink-0"
                    >
                        Export
                    </button>
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center gap-x-2 rounded-full bg-[#0a0f1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors flex-shrink-0"
                    >
                        <Plus className="-ml-0.5 h-4 w-4 text-[#c8ff00]" /> {t('candidates.add')}
                    </button>
                </div>
            </div>

            <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    {searching ? <Loader2 className="h-4 w-4 text-slate-400 animate-spin" /> : <Search className="h-4 w-4 text-slate-400" />}
                </div>
                <input
                    type="text"
                    placeholder={t('common.search')}
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

            {showFilters && (
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-5 animate-in slide-in-from-top-2 duration-200">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('common.status')}</p>
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
                        <div>
                            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">{t('common.stage')}</p>
                            <select
                                value={filters.stage || ''}
                                onChange={e => setFilter('stage', e.target.value || undefined)}
                                className="w-full rounded-xl border-0 py-2 px-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                            >
                                <option value="">Any stage</option>
                                {pipelines.flatMap(p => p.stages).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
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

            <div className="flow-root">
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                    {candidates.length > 0 ? candidates.map((person) => (
                        <div 
                            key={person.id}
                            onClick={() => setSelectedCandidateId(person.id)}
                            className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm active:scale-95 transition-transform"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-sm">
                                        {(person.firstName?.charAt(0) || '')}{(person.lastName?.charAt(0) || '')}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 dark:text-white leading-tight">{person.firstName} {person.lastName}</h4>
                                        <p className="text-xs text-slate-400 font-medium">{person.email}</p>
                                    </div>
                                </div>
                                <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ring-1 ring-inset ${STATUS_COLORS[person.status?.toUpperCase()] || 'bg-slate-100 text-slate-600'}`}>
                                    {person.status}
                                </span>
                            </div>
                            <div className="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800/50">
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Stage</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-white">
                                        {person.currentStage?.name || 'New Lead'}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-1 text-right">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Assigned To</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-white">
                                        {person.assignedRecruiter ? `${person.assignedRecruiter.firstName} ${person.assignedRecruiter.lastName.charAt(0)}.` : 'Unassigned'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )) : (
                        <div className="py-20">
                             <EmptyState type={debouncedSearch ? 'search' : 'candidates'} />
                        </div>
                    )}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block -mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className={`overflow-hidden shadow-sm ring-1 ring-slate-100 sm:rounded-2xl bg-white border border-slate-100 transition-opacity ${searching ? 'opacity-60' : 'opacity-100'}`}>
                            <table className="min-w-full divide-y divide-slate-100">
                                <thead className="bg-slate-50/50">
                                    <tr>
                                        <th className="py-4 pl-4 pr-3 text-left sm:pl-6 w-10">
                                            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-[#c8ff00]" checked={candidates.length > 0 && selectedIds.length === candidates.length} onChange={() => toggleSelectAll(candidates.map(c => c.id))} />
                                        </th>
                                        <th className="py-4 pl-4 pr-3 text-left text-xs sm:pl-6">
                                            <button onClick={() => toggleSort('name')} className="flex items-center gap-1.5 font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors">
                                                Candidate <SortIcon col="name" />
                                            </button>
                                        </th>
                                        <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Pipeline</th>
                                        <th className="px-3 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('common.stage')}</th>
                                        <th className="px-3 py-4 text-left text-xs">
                                            <button onClick={() => toggleSort('status')} className="flex items-center gap-1.5 font-semibold text-slate-500 uppercase tracking-wider hover:text-slate-800 transition-colors">
                                                {t('common.status')} <SortIcon col="status" />
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
                                    {candidates.length > 0 ? candidates.map((person) => (
                                        <tr key={person.id} className={`transition-colors group ${isSelected(person.id) ? 'bg-[#c8ff00]/5 hover:bg-[#c8ff00]/10' : 'hover:bg-slate-50/50'}`}>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm sm:pl-6">
                                                <input type="checkbox" className="h-4 w-4 rounded border-slate-300 cursor-pointer accent-[#c8ff00]" checked={isSelected(person.id)} onChange={() => toggleSelect(person.id)} />
                                            </td>
                                            <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm cursor-pointer" onClick={() => setSelectedCandidateId(person.id)}>
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center font-bold text-white text-xs">
                                                        {(person.firstName?.charAt(0) || '')}{(person.lastName?.charAt(0) || '')}
                                                    </div>
                                                    <div>
                                                        <div className="font-bold text-slate-900">{person.firstName} {person.lastName}</div>
                                                        <div className="text-xs text-slate-500">{person.email}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{person.pipeline?.name || '—'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-900">{person.currentStage?.name || '—'}</td>
                                            <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${STATUS_COLORS[person.status?.toUpperCase()] || 'bg-slate-100 text-slate-600'}`}>
                                                    {person.status}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-4 text-xs text-slate-500">{new Date(person.createdAt).toLocaleDateString()}</td>
                                            <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm sm:pr-6">
                                                <button onClick={() => setSelectedCandidateId(person.id)} className="text-slate-400 hover:text-slate-900"><MoreVertical className="h-5 w-5" /></button>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={7} className="py-12">
                                                <EmptyState 
                                                    type={debouncedSearch ? 'search' : 'candidates'} 
                                                    onPrimaryAction={debouncedSearch ? clearAllFilters : () => setShowAddModal(true)}
                                                />
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <CandidateDetailDrawer 
                candidateId={selectedCandidateId} 
                isOpen={!!selectedCandidateId}
                onClose={() => setSelectedCandidateId(null)} 
                onUpdate={load} 
                availableStages={pipelines.flatMap(p => p.stages).map(s => ({ id: s.id, name: s.name }))}
            />

            <ExportDialog 
                isOpen={showExport} 
                onClose={() => setShowExport(false)} 
                filters={activeFilters} 
            />

            <ImportWizard 
                isOpen={showImport} 
                onClose={() => setShowImport(false)} 
                onComplete={load} 
            />

            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setShowAddModal(false)} />
                    <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <h3 className="text-lg font-bold text-slate-900">Upload Candidates</h3>
                            <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
                        </div>
                        <div className="p-6">
                            <ResumeUploadZone 
                                onUploadComplete={(data) => {
                                    load();
                                    // Optionally select the newly created candidate
                                    if(data?.candidate?.id) setSelectedCandidateId(data.candidate.id);
                                    else if(data?.id) setSelectedCandidateId(data.id);
                                    setShowAddModal(false); // Close the modal so they can actually see the list/drawer
                                }} 
                            />
                        </div>
                        <div className="px-6 py-4 bg-slate-50 flex justify-end">
                            <button onClick={() => setShowAddModal(false)} className="px-5 py-2 font-bold text-sm bg-slate-900 text-white rounded-xl shadow-sm hover:shadow-md transition-all">Done</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
