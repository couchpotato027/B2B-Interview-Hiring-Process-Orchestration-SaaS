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
        <div className="flex-shrink-0 w-80 flex flex-col h-full mr-4 bg-slate-50/50 rounded-xl overflow-hidden border border-gray-200 shadow-sm shadow-slate-200">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-white/50 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-800 text-sm tracking-wide">{column.title}</h3>
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-600">
                        {candidates.length}
                    </span>
                </div>
                <button className="text-gray-400 hover:text-gray-600 transition-colors">
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
                flex-1 p-3 overflow-y-auto min-h-[200px] transition-colors duration-200
                scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent
                ${snapshot.isDraggingOver ? 'bg-indigo-50/50' : ''}
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
