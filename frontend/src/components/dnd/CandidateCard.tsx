'use client';

import React from 'react';
import { Draggable } from '@hello-pangea/dnd';
import { Candidate } from './mockData';
import { GripVertical } from 'lucide-react';

interface CandidateCardProps {
    candidate: Candidate;
    index: number;
}

export function CandidateCard({ candidate, index }: CandidateCardProps) {
    return (
        <Draggable draggableId={candidate.id} index={index}>
            {(provided, snapshot) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`
                        mb-4 p-4 bg-white border-2 rounded-[16px] shadow-sm 
                        transition-all duration-200 group relative
                        ${snapshot.isDragging ? 'shadow-2xl border-[#c8ff00] scale-105 z-50' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}
                    `}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-11 w-11 rounded-[12px] bg-[#0a0f1a] flex items-center justify-center text-[#c8ff00] font-bold text-base shadow-sm">
                                {candidate.avatar}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-bold text-slate-900 group-hover:text-[#0a0f1a] transition-colors">{candidate.name}</span>
                                <span className="text-xs font-medium text-slate-500 mt-0.5 max-w-[140px] truncate">{candidate.role}</span>
                            </div>
                        </div>
                        <div className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:text-slate-500 p-1">
                            <GripVertical className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-md bg-[#f8fafc] border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            {candidate.score === 0 ? 'Pending' : `Score: ${candidate.score}`}
                        </span>
                        <span className="text-[11px] font-semibold text-slate-400">1d ago</span>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
