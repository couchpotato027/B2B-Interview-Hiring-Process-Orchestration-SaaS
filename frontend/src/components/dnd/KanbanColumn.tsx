'use client';

import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
    SortableContext,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Column as ColumnType, Candidate } from './mockData';
import { CandidateCard } from './CandidateCard';
import { MoreHorizontal } from 'lucide-react';

interface ColumnProps {
    column: ColumnType;
    candidates: Candidate[];
    isUpdating?: Record<string, boolean>;
    selection: {
        selectedIds: string[];
        isSelected: (id: string) => boolean;
        toggleSelect: (id: string) => void;
        handleShiftClick: (id: string, lastSelectedId: string | null) => void;
    };
}

export function KanbanColumn({ column, candidates, isUpdating = {}, selection }: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: column.id,
    });

    return (
        <div 
            ref={setNodeRef}
            className={`
                flex-shrink-0 w-80 flex flex-col max-h-full bg-slate-50/80 rounded-[24px] border transition-all duration-200 overflow-hidden
                ${isOver ? 'border-[#c8ff00] ring-4 ring-[#c8ff00]/10 shadow-lg' : 'border-slate-100 shadow-sm'}
            `}
        >
            <div className="flex items-center justify-between px-5 pt-5 pb-3 bg-transparent">
                <div className="flex items-center gap-3">
                    <h3 className="font-bold text-slate-900 text-sm">{column.title}</h3>
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-[11px] font-bold text-slate-500 shadow-sm">
                        {candidates.length}
                    </span>
                </div>
                <button className="text-slate-400 hover:text-slate-900 transition-colors p-1.5 hover:bg-slate-200/50 rounded-full">
                    <MoreHorizontal className="h-4 w-4" />
                </button>
            </div>

            <div className="flex-1 px-4 pb-4 overflow-y-auto min-h-[150px] scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent rounded-b-[24px]">
                <SortableContext
                    id={column.id}
                    items={candidates.map(c => c.id)}
                    strategy={verticalListSortingStrategy}
                >
                    {candidates.map((candidate) => (
                        <CandidateCard
                            key={candidate.id}
                            candidate={candidate}
                            loading={isUpdating[candidate.id]}
                            selection={selection}
                        />
                    ))}
                </SortableContext>
            </div>
        </div>
    );
}
