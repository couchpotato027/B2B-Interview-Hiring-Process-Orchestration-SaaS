'use client';

import React from 'react';
import { Droppable } from '@hello-pangea/dnd';
import { Column as ColumnType, Candidate } from './mockData';
import { CandidateCard } from './CandidateCard';
import { MoreHorizontal } from 'lucide-react';

interface ColumnProps {
    column: ColumnType;
    candidates: Candidate[];
}

export function KanbanColumn({ column, candidates }: ColumnProps) {
    return (
        <div className="flex-shrink-0 w-80 flex flex-col max-h-full bg-slate-50/80 rounded-[24px] border border-slate-100 shadow-sm overflow-hidden">
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

            <Droppable droppableId={column.id}>
                {(provided, snapshot) => (
                    <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        shallow={true}
                        className={`
                            flex-1 px-4 pb-4 overflow-y-auto min-h-[150px] transition-colors duration-200
                            scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent rounded-b-[24px]
                            ${snapshot.isDraggingOver ? 'bg-[#c8ff00]/5 ring-inset ring-2 ring-[#c8ff00]/50' : ''}
                        `}
                    >
                        {candidates.map((candidate, index) => (
                            <CandidateCard
                                key={candidate.id}
                                candidate={candidate}
                                index={index}
                            />
                        ))}
                        {provided.placeholder}
                    </div>
                )}
            </Droppable>
        </div>
    );
}
