'use client';

import React, { useState, useEffect } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { ClientDndContext } from './ClientDndContext';
import { KanbanColumn } from './KanbanColumn';
import { pipelineApi, candidateApi } from '@/lib/api';
import { BoardData, Candidate, Column } from './mockData';
import { Layers } from 'lucide-react';

export default function PipelineBoard() {
    const [data, setData] = useState<BoardData | null>(null);
    const [pipelines, setPipelines] = useState<{id: string; name: string}[]>([]);
    const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
    const [loading, setLoading] = useState(true);

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

    useEffect(() => {
        if (!selectedPipelineId) return;
        const loadBoard = async () => {
            try {
                const pipeline = await pipelineApi.get(selectedPipelineId);
                const stages = pipeline.stages || [];
                const candidates: { id: string; firstName: string; lastName: string; email: string; currentStageId: string }[] = pipeline.candidates || [];

                // Build board data structure
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
                stages.forEach((s: { id: string; name: string }) => {
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
        };
        loadBoard();
    }, [selectedPipelineId]);

    const onDragEnd = async (result: DropResult) => {
        const { destination, source, draggableId } = result;
        if (!destination || !data) return;
        if (destination.droppableId === source.droppableId && destination.index === source.index) return;

        const startColumn = data.columns[source.droppableId];
        const finishColumn = data.columns[destination.droppableId];

        if (startColumn === finishColumn) {
            const newCandidateIds = Array.from(startColumn.candidateIds);
            newCandidateIds.splice(source.index, 1);
            newCandidateIds.splice(destination.index, 0, draggableId);
            setData({
                ...data,
                columns: { ...data.columns, [startColumn.id]: { ...startColumn, candidateIds: newCandidateIds } },
            });
            return;
        }

        // Optimistic update
        const startCandidateIds = Array.from(startColumn.candidateIds);
        startCandidateIds.splice(source.index, 1);
        const finishCandidateIds = Array.from(finishColumn.candidateIds);
        finishCandidateIds.splice(destination.index, 0, draggableId);

        setData({
            ...data,
            columns: {
                ...data.columns,
                [startColumn.id]: { ...startColumn, candidateIds: startCandidateIds },
                [finishColumn.id]: { ...finishColumn, candidateIds: finishCandidateIds },
            },
        });

        // Fire API call
        try {
            await candidateApi.moveStage(draggableId, finishColumn.id);
        } catch (err) {
            console.error('Failed to move candidate:', err);
            // Revert on failure
            setData({
                ...data,
                columns: {
                    ...data.columns,
                    [startColumn.id]: startColumn,
                    [finishColumn.id]: finishColumn,
                },
            });
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
                    <ClientDndContext onDragEnd={onDragEnd}>
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
                                    />
                                );
                            })}
                        </div>
                    </ClientDndContext>
                </div>
            )}
        </div>
    );
}
