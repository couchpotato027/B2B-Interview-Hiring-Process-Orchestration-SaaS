'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
    DragEndEvent, 
    DragStartEvent, 
    DragOverEvent,
    DragOverlay,
    defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { ClientDndContext } from './ClientDndContext';
import { KanbanColumn } from './KanbanColumn';
import { pipelineApi, candidateApi, authApi } from '@/lib/api';
import { BoardData, Candidate, Column } from './mockData';
import { Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { CandidateCard } from './CandidateCard';
import { useBulkSelection } from '@/hooks/useBulkSelection';
import BulkActionsToolbar from '@/components/candidates/BulkActionsToolbar';

export default function PipelineBoard() {
    const [data, setData] = useState<BoardData | null>(null);
    const [pipelines, setPipelines] = useState<{id: string; name: string}[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [activeCandidateId, setActiveCandidateId] = useState<string | null>(null);
    const [isUpdating, setIsUpdating] = useState<Record<string, boolean>>({});
    const [user, setUser] = useState<{ role?: string } | null>(null);

    // Flat list of all candidates for selection hook
    const allCandidates = Object.values(data?.candidates || {}).map(c => ({ id: c.id }));
    const { 
        selectedIds, 
        isSelected, 
        toggleSelect, 
        toggleSelectAll, 
        clearSelection,
        handleShiftClick
    } = useBulkSelection(allCandidates);

    useEffect(() => {
        authApi.getMe().then(setUser).catch(() => {});
    }, []);

    const canManageBoard = user?.role === 'ADMIN' || user?.role === 'RECRUITER';

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            // Cmd+A or Ctrl+A
            if ((e.metaKey || e.ctrlKey) && e.key === 'a') {
                e.preventDefault();
                toggleSelectAll(allCandidates.map(c => c.id));
            }
            
            // Escape
            if (e.key === 'Escape') {
                clearSelection();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [allCandidates, toggleSelectAll, clearSelection]);

    useEffect(() => {
        const loadPipelines = async () => {
            try {
                const list = await pipelineApi.list();
                setPipelines(list);
                if (list.length > 0) {
                    setSelectedPipelineId(list[0].id);
                }
            } catch (err) { console.error(err); }
            finally { setLoading(false); }
        };
        loadPipelines();
    }, []);

    const loadBoard = useCallback(async () => {
        if (!selectedPipelineId) return;
        try {
            const pipeline = await pipelineApi.get(selectedPipelineId);
            const stages = pipeline.stages || [];
            const candidates: { id: string; firstName: string; lastName: string; email: string; currentStageId: string }[] = pipeline.candidates || [];

            const boardCandidates: Record<string, Candidate> = {};
            candidates.forEach(c => {
                boardCandidates[c.id] = {
                    id: c.id,
                    name: `${c.firstName} ${c.lastName}`,
                    role: c.email,
                    avatar: c.firstName.charAt(0),
                    score: 0,
                };
            });

            const boardColumns: Record<string, Column> = {};
            const columnOrder: string[] = [];
            stages.sort((a: { orderIndex: number }, b: { orderIndex: number }) => a.orderIndex - b.orderIndex).forEach((s: { id: string; name: string }) => {
                const stageCandidates = candidates.filter(c => c.currentStageId === s.id).map(c => c.id);
                boardColumns[s.id] = {
                    id: s.id,
                    title: s.name,
                    candidateIds: stageCandidates,
                };
                columnOrder.push(s.id);
            });

            setData({ candidates: boardCandidates, columns: boardColumns, columnOrder });
        } catch (err) { console.error(err); }
    }, [selectedPipelineId]);

    useEffect(() => {
        loadBoard();
    }, [loadBoard]);

    const handleDragStart = (event: DragStartEvent) => {
        if (!canManageBoard) {
            toast.error("You don't have permission to move candidates.");
            return;
        }
        setActiveCandidateId(event.active.id as string);
    };

    const handleDragOver = (event: DragOverEvent) => {
        if (!canManageBoard) return;
        const { active, over } = event;
        if (!over || !data) return;

        const activeId = active.id as string;
        const overId = over.id as string;

        if (activeId === overId) return;

        const activeContainer = active.data.current?.sortable.containerId || activeId;
        const overContainer = over.data.current?.sortable.containerId || overId;

        if (!activeContainer || !overContainer || activeContainer === overContainer) return;

        // Move item between containers in state (optimistic)
        const activeItems = data.columns[activeContainer].candidateIds;
        const overItems = data.columns[overContainer].candidateIds;
        const overIndex = overItems.indexOf(overId);

        let newIndex;
        if (overId in data.columns) {
            newIndex = overItems.length + 1;
        } else {
            const isAtEnd = overIndex === overItems.length - 1;
            const modifier = isAtEnd ? 1 : 0;
            newIndex = overIndex >= 0 ? overIndex + modifier : overItems.length + 1;
        }

        setData({
            ...data,
            columns: {
                ...data.columns,
                [activeContainer]: {
                    ...data.columns[activeContainer],
                    candidateIds: activeItems.filter((item) => item !== activeId),
                },
                [overContainer]: {
                    ...data.columns[overContainer],
                    candidateIds: [
                        ...overItems.slice(0, newIndex),
                        activeId,
                        ...overItems.slice(newIndex, overItems.length),
                    ],
                },
            },
        });
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        if (!canManageBoard) return;
        const { active, over } = event;
        setActiveCandidateId(null);

        if (!over || !data) return;

        const candidateId = active.id as string;
        const overId = over.id as string;
        
        // Find which column it ended up in
        const overContainer = over.data.current?.sortable.containerId || overId;
        const activeContainer = active.data.current?.sortable.containerId || candidateId;

        // Reorder within same column
        if (activeContainer === overContainer) {
            const items = data.columns[activeContainer].candidateIds;
            const oldIndex = items.indexOf(candidateId);
            const newIndex = items.indexOf(overId);

            if (oldIndex !== newIndex) {
                setData({
                    ...data,
                    columns: {
                        ...data.columns,
                        [activeContainer]: {
                            ...data.columns[activeContainer],
                            candidateIds: arrayMove(items, oldIndex, newIndex),
                        },
                    },
                });
            }
            return;
        }

        // --- Drag Restrictions ---
        const startColumn = data.columns[activeContainer];
        const endColumn = data.columns[overContainer];
        const candidateName = data.candidates[candidateId].name;

        // Restriction: Cannot move from "Offer" back to earlier stages
        if (startColumn.title.toLowerCase().includes('offer')) {
            toast.error(`Cannot move ${candidateName} back from ${startColumn.title}`);
            loadBoard(); // Revert by reloading
            return;
        }

        // Confirmation for "Rejected"
        if (endColumn.title.toLowerCase().includes('reject')) {
            if (!window.confirm(`Are you sure you want to move ${candidateName} to ${endColumn.title}?`)) {
                loadBoard();
                return;
            }
        }

        // --- Optimistic Update Rollback Logic ---
        const previousData = JSON.parse(JSON.stringify(data));

        // Fire API call
        setIsUpdating(prev => ({ ...prev, [candidateId]: true }));
        try {
            await candidateApi.moveStage(candidateId, overContainer);
            toast.success(`${candidateName} moved to ${endColumn.title}`);
        } catch (err) {
            toast.error(`Failed to move ${candidateName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            setData(previousData); // Rollback to snapshot
        } finally {
            setIsUpdating(prev => ({ ...prev, [candidateId]: false }));
        }
    };

    if (loading) return (
         <div className="space-y-6 animate-pulse p-4">
            <div><div className="h-8 w-48 bg-slate-200 rounded mb-2"></div></div>
            <div className="flex gap-4">
                 {[1,2,3,4].map(i => <div key={i} className="w-80 h-96 bg-slate-100 rounded-3xl shrink-0"></div>)}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col animate-in fade-in duration-500">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Pipeline Board
                    </h2>
                    <p className="mt-2 text-sm text-slate-500">Drag and drop candidates effortlessly between stages.</p>
                </div>
                {pipelines.length > 0 && (
                    <div className="relative">
                        <select
                            value={selectedPipelineId}
                            onChange={e => setSelectedPipelineId(e.target.value)}
                            className="appearance-none rounded-full bg-white border border-slate-200 pl-4 pr-10 py-2.5 text-sm font-bold text-slate-700 shadow-sm focus:ring-2 focus:ring-[#c8ff00] focus:border-transparent outline-none cursor-pointer hover:bg-slate-50 transition-colors"
                        >
                            {pipelines.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4">
                            <Layers className="h-4 w-4 text-slate-400" />
                        </div>
                    </div>
                )}
            </div>

            {!data || data.columnOrder.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 rounded-3xl border-2 border-dashed border-slate-200">
                     <Layers className="mx-auto h-12 w-12 text-slate-300 mb-4" />
                    <h3 className="text-sm font-semibold text-slate-900">No pipeline mapped</h3>
                    <p className="mt-1 text-sm text-slate-500">Please select a pipeline or configure stages in Workflow Builder.</p>
                </div>
            ) : (
                <div className="flex-1 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
                    <ClientDndContext 
                        onDragStart={handleDragStart}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                    >
                        <div className="flex h-full items-start gap-4 px-1 min-w-max">
                            {data.columnOrder.map((columnId) => {
                                const column = data.columns[columnId];
                                const candidates = column.candidateIds.map(
                                    (candidateId) => data.candidates[candidateId]
                                ).filter(Boolean);

                                return (
                                    <KanbanColumn
                                        key={column.id}
                                        column={column}
                                        candidates={candidates}
                                        isUpdating={isUpdating}
                                        selection={{
                                            selectedIds,
                                            isSelected,
                                            toggleSelect,
                                            handleShiftClick
                                        }}
                                    />
                                );
                            })}
                        </div>
                        <DragOverlay dropAnimation={{
                            duration: 250,
                            easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
                            sideEffects: defaultDropAnimationSideEffects({
                                styles: {
                                    active: {
                                        opacity: '0.5',
                                    },
                                },
                            }),
                        }}>
                            {activeCandidateId ? (
                                <CandidateCard 
                                    candidate={data.candidates[activeCandidateId]} 
                                    isOverlay 
                                    loading={isUpdating[activeCandidateId]}
                                />
                            ) : null}
                        </DragOverlay>
                    </ClientDndContext>
                </div>
            )}

            <BulkActionsToolbar 
                selectedIds={selectedIds}
                onClear={clearSelection}
                onActionComplete={loadBoard}
                availableStages={data?.columnOrder.map(id => ({ id, name: data.columns[id].title })) || []}
            />
        </div>
    );
}
