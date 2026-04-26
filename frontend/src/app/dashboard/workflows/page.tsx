'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Settings2, X, Clock, Edit2, Check, GripVertical } from 'lucide-react';
import { pipelineApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface PipelineStage {
    id: string;
    name: string;
    orderIndex: number;
    slaHours: number;
    stageType: string;
}

interface PipelineTemplate {
    id: string;
    name: string;
    roleType: string;
    isActive: boolean;
    stages: PipelineStage[];
    _count?: { candidates: number; jobs: number };
}

export default function WorkflowsPage() {
    const [pipelines, setPipelines] = useState<PipelineTemplate[]>([]);
    const [selected, setSelected] = useState<PipelineTemplate | null>(null);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [showAddStage, setShowAddStage] = useState(false);
    const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);

    // Create pipeline form
    const [createForm, setCreateForm] = useState({ name: '', roleType: '', stages: [{ name: 'Application Review', orderIndex: 0, slaHours: 48, stageType: 'STATIC' }] });
    // Add stage form
    const [stageForm, setStageForm] = useState({ name: '', slaHours: 48, stageType: 'INTERVIEW' });
    // Edit stage form
    const [editForm, setEditForm] = useState({ name: '', slaHours: 48, stageType: 'INTERVIEW' });

    const load = async () => {
        try {
            const data = await pipelineApi.list();
            setPipelines(data);
            if (data.length > 0 && !selected) {
                const full = await pipelineApi.get(data[0].id);
                setSelected(full);
            }
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const selectPipeline = async (id: string) => {
        try {
            const full = await pipelineApi.get(id);
            setSelected(full);
            setEditingStage(null);
        } catch (err) { console.error(err); }
    };

    const handleCreatePipeline = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const created = await pipelineApi.create(createForm);
            setShowCreate(false);
            setCreateForm({ name: '', roleType: '', stages: [{ name: 'Application Review', orderIndex: 0, slaHours: 48, stageType: 'STATIC' }] });
            await load();
            selectPipeline(created.id);
            toast.success('Pipeline created!');
        } catch (err: any) { toast.error(err.message); }
    };

    const handleAddStage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected) return;
        try {
            const newIndex = selected.stages.length;
            await pipelineApi.addStage(selected.id, { ...stageForm, orderIndex: newIndex });
            setShowAddStage(false);
            setStageForm({ name: '', slaHours: 48, stageType: 'INTERVIEW' });
            selectPipeline(selected.id);
            toast.success('Stage added!');
        } catch (err: any) { toast.error(err.message); }
    };

    const handleEditStage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selected || !editingStage) return;
        try {
            await pipelineApi.updateStage(selected.id, editingStage.id, editForm);
            setEditingStage(null);
            selectPipeline(selected.id);
            toast.success('Stage updated!');
        } catch (err: any) { toast.error(err.message); }
    };

    const startEditing = (stage: PipelineStage) => {
        setEditingStage(stage);
        setEditForm({ name: stage.name, slaHours: stage.slaHours, stageType: stage.stageType });
    };

    const handleDeleteStage = async (stageId: string) => {
        if (!selected || !confirm('Delete this stage?')) return;
        try {
            await pipelineApi.deleteStage(selected.id, stageId);
            selectPipeline(selected.id);
            toast.success('Stage deleted.');
        } catch (err: any) { toast.error(err.message); }
    };

    const handleDeletePipeline = async () => {
        if (!selected || !confirm('Delete this entire pipeline template?')) return;
        try {
            await pipelineApi.delete(selected.id);
            setSelected(null);
            load();
            toast.success('Pipeline deleted.');
        } catch (err: any) { toast.error(err.message); }
    };

    const stageTypeColor = (type: string) => {
        switch (type) {
            case 'STATIC': return 'bg-slate-100 text-slate-700';
            case 'INTERVIEW': return 'bg-indigo-50 text-indigo-700 ring-1 ring-indigo-200';
            case 'ASSESSMENT': return 'bg-purple-50 text-purple-700 ring-1 ring-purple-200';
            case 'AUTOMATED': return 'bg-orange-50 text-orange-700 ring-1 ring-orange-200';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    if (loading) return (
         <div className="space-y-6 animate-pulse">
            <div><div className="h-8 w-48 bg-slate-200 rounded mb-2"></div></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Workflow Builder</h2>
                    <p className="mt-2 text-sm text-slate-500">Create and configure intelligent pipelines for your hiring needs.</p>
                </div>
                <button 
                    onClick={() => setShowCreate(true)} 
                    className="inline-flex items-center gap-x-2 rounded-full bg-[#0a0f1a] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors self-start sm:self-auto"
                >
                    <Plus className="-ml-0.5 h-4 w-4 text-[#c8ff00]" /> New Pipeline
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
                {/* Pipeline list */}
                <div className="lg:col-span-1 space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest pl-1 mb-2">Templates</h3>
                    {pipelines.length === 0 ? (
                        <div className="rounded-2xl border-2 border-dashed border-slate-200 p-6 text-center">
                             <p className="text-sm text-slate-500">No templates yet</p>
                        </div>
                    ) : pipelines.map(p => (
                        <button
                            key={p.id}
                            onClick={() => selectPipeline(p.id)}
                            className={`w-full text-left rounded-2xl px-5 py-4 text-sm transition-all duration-200 ${selected?.id === p.id ? 'bg-[#c8ff00]/10 border-transparent shadow-[inset_0_0_0_2px_#c8ff00]' : 'bg-white border border-slate-100 text-slate-700 hover:shadow-md'}`}
                        >
                            <p className={`font-bold ${selected?.id === p.id ? 'text-[#0a0f1a]' : 'text-slate-900'}`}>{p.name}</p>
                            <p className={`text-xs mt-1 font-medium ${selected?.id === p.id ? 'text-slate-700' : 'text-slate-500'}`}>{p.roleType} • {p.stages?.length || 0} stages</p>
                        </button>
                    ))}
                </div>

                {/* Stage editor */}
                <div className="lg:col-span-3">
                    {!selected ? (
                        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-10 sm:p-16 text-center text-slate-400">
                            <Settings2 className="h-16 w-16 mx-auto mb-4 text-slate-200" />
                            <p className="text-sm font-medium">Select a pipeline template to edit its stages</p>
                        </div>
                    ) : (
                        <div className="rounded-3xl bg-white shadow-sm border border-slate-100 p-5 sm:p-8">
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 pb-6 border-b border-slate-100 gap-4">
                                <div>
                                    <h3 className="text-xl sm:text-2xl font-bold text-slate-900">{selected.name}</h3>
                                    <p className="text-sm font-medium text-slate-500 mt-1 uppercase tracking-wider">{selected.roleType}</p>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => setShowAddStage(true)} className="inline-flex items-center gap-1.5 rounded-full bg-[#0a0f1a] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
                                        <Plus className="h-4 w-4 text-[#c8ff00]" /> Add Stage
                                    </button>
                                    <button onClick={handleDeletePipeline} className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-sm font-semibold text-red-600 ring-1 ring-inset ring-slate-200 hover:bg-red-50 hover:ring-red-200 transition-colors">
                                        <Trash2 className="h-4 w-4" /> Delete
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4 relative before:absolute before:inset-y-0 before:left-6 before:w-[2px] before:bg-slate-100">
                                {selected.stages.sort((a, b) => a.orderIndex - b.orderIndex).map((stage, i) => (
                                    <div key={stage.id} className={`relative flex items-center gap-4 sm:gap-6 rounded-2xl border p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow group ml-2 mb-4 ${editingStage?.id === stage.id ? 'border-[#c8ff00] bg-[#c8ff00]/5' : 'border-slate-100 bg-slate-50/50'}`}>
                                        <div className="absolute -left-10 w-8 h-8 rounded-full bg-white border-2 border-slate-200 flex items-center justify-center font-bold text-slate-400 text-sm z-10 hidden sm:flex">{i + 1}</div>
                                        
                                        {editingStage?.id === stage.id ? (
                                            /* ─── Edit Mode ─── */
                                            <form onSubmit={handleEditStage} className="flex-1 space-y-3">
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                                    <input
                                                        value={editForm.name}
                                                        onChange={e => setEditForm({...editForm, name: e.target.value})}
                                                        className="rounded-xl border-0 py-2 px-3 text-sm font-bold text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-white"
                                                        placeholder="Stage name"
                                                        autoFocus
                                                    />
                                                    <select
                                                        value={editForm.stageType}
                                                        onChange={e => setEditForm({...editForm, stageType: e.target.value})}
                                                        className="rounded-xl border-0 py-2 px-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-white cursor-pointer"
                                                    >
                                                        <option value="STATIC">Static Review</option>
                                                        <option value="INTERVIEW">Interview</option>
                                                        <option value="ASSESSMENT">Assessment</option>
                                                        <option value="AUTOMATED">Automated</option>
                                                    </select>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                                                        <input
                                                            type="number" min={1}
                                                            value={editForm.slaHours}
                                                            onChange={e => setEditForm({...editForm, slaHours: parseInt(e.target.value) || 1})}
                                                            className="rounded-xl border-0 py-2 px-3 text-sm text-slate-900 ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-white w-20"
                                                        />
                                                        <span className="text-xs text-slate-500 font-medium">hrs</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2 justify-end">
                                                    <button type="button" onClick={() => setEditingStage(null)} className="px-3 py-1.5 text-xs font-bold text-slate-500 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors">Cancel</button>
                                                    <button type="submit" className="px-3 py-1.5 text-xs font-bold text-white bg-[#0a0f1a] rounded-lg hover:bg-slate-800 transition-colors flex items-center gap-1">
                                                        <Check className="h-3 w-3" /> Save
                                                    </button>
                                                </div>
                                            </form>
                                        ) : (
                                            /* ─── View Mode ─── */
                                            <>
                                                <div className="flex-1 pl-0 sm:pl-2">
                                                    <p className="text-base font-bold text-slate-900">{stage.name}</p>
                                                    <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-2">
                                                        <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold ${stageTypeColor(stage.stageType)} uppercase tracking-wider`}>{stage.stageType}</span>
                                                        <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500"><Clock className="h-3.5 w-3.5 text-slate-400" />{stage.slaHours}h SLA</span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                    <button onClick={() => startEditing(stage)} className="text-slate-400 hover:text-blue-600 p-2 rounded-full hover:bg-blue-50 transition-colors" title="Edit stage">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={() => handleDeleteStage(stage.id)} className="text-slate-300 hover:text-red-500 p-2 rounded-full hover:bg-red-50 transition-colors" title="Delete stage">
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Create Pipeline Modal */}
            {showCreate && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowCreate(false)} />
                        <div className="relative rounded-3xl bg-white px-4 pb-4 pt-5 shadow-2xl w-full max-w-md sm:p-6 transition-all">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-bold text-slate-900">New Pipeline Template</h3>
                                <button onClick={() => setShowCreate(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <form onSubmit={handleCreatePipeline} className="space-y-5 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Template Name</label>
                                    <input required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50" placeholder="e.g. Standard Engineering" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Role Type</label>
                                    <input required value={createForm.roleType} onChange={e => setCreateForm({ ...createForm, roleType: e.target.value })} placeholder="e.g. Technical" className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50" />
                                </div>
                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowCreate(false)} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" className="rounded-full bg-[#0a0f1a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors">Create Template</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Stage Modal */}
            {showAddStage && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowAddStage(false)} />
                        <div className="relative rounded-3xl bg-white px-4 pb-4 pt-5 shadow-2xl w-full max-w-md sm:p-6 transition-all">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <h3 className="text-lg font-bold text-slate-900">Add Stage Configuration</h3>
                                <button onClick={() => setShowAddStage(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <form onSubmit={handleAddStage} className="space-y-5 pt-2">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Stage Name</label>
                                    <input required value={stageForm.name} onChange={e => setStageForm({ ...stageForm, name: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50" placeholder="e.g. Technical Screen" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">Stage Category</label>
                                        <select value={stageForm.stageType} onChange={e => setStageForm({ ...stageForm, stageType: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 cursor-pointer">
                                            <option value="STATIC">Static Review</option>
                                            <option value="INTERVIEW">Interview</option>
                                            <option value="ASSESSMENT">Assessment</option>
                                            <option value="AUTOMATED">Automated</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1.5">SLA Timeout (Hours)</label>
                                        <input type="number" min={1} required value={stageForm.slaHours} onChange={e => setStageForm({ ...stageForm, slaHours: parseInt(e.target.value) })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50" />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowAddStage(false)} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" className="rounded-full bg-[#0a0f1a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors">Add Stage</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
