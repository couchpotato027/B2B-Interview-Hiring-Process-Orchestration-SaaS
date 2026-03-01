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
            mb-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm 
            transition-colors duration-200 group
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-indigo-500 opacity-90' : 'hover:border-indigo-300'}
          `}
                >
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold text-sm">
                                {candidate.avatar}
                            </div>
                            <div className="flex flex-col">
                                <span className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{candidate.name}</span>
                                <span className="text-xs text-gray-500">{candidate.role}</span>
                            </div>
                        </div>
                        <div className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <GripVertical className="h-4 w-4" />
                        </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between">
                        <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                            Score: {candidate.score === 0 ? 'Pending' : candidate.score}
                        </span>
                        <span className="text-xs text-gray-400">1 day ago</span>
                    </div>
                </div>
            )}
        </Draggable>
    );
}
