import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Candidate } from './mockData';
import { GripVertical, Loader2 } from 'lucide-react';

interface CandidateCardProps {
    candidate: Candidate;
    isOverlay?: boolean;
    loading?: boolean;
    onClick?: (id: string) => void;
    selection?: {
        isSelected: (id: string) => boolean;
        toggleSelect: (id: string) => void;
        handleShiftClick: (id: string, lastSelectedId: string | null) => void;
    };
}

export function CandidateCard({ candidate, isOverlay, loading, selection, onClick }: CandidateCardProps) {
    const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: candidate.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.3 : 1,
    };

    const cardContent = (
        <div
            onClick={() => onClick?.(candidate.id)}
            className={`
                p-4 bg-white border-2 rounded-[16px] shadow-sm 
                transition-all duration-200 group relative cursor-pointer
                ${isOverlay ? 'shadow-2xl border-[#c8ff00] scale-105 rotate-2 cursor-grabbing' : 'border-slate-100 hover:border-slate-200 hover:shadow-md'}
                ${loading ? 'opacity-70 pointer-events-none' : ''}
                ${selection?.isSelected(candidate.id) ? 'border-[#c8ff00] bg-[#c8ff00]/5' : ''}
            `}
        >
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-3" onClick={e => e.stopPropagation()}>
                    {selection && (
                        <input 
                            type="checkbox" 
                            className="h-4 w-4 rounded border-slate-300 text-[#0a0f1a] focus:ring-[#c8ff00] cursor-pointer accent-[#c8ff00] z-10"
                            checked={selection.isSelected(candidate.id)}
                            onChange={(e) => {
                                const isShift = (e.nativeEvent as MouseEvent).shiftKey;
                                if (isShift) {
                                    selection.handleShiftClick(candidate.id, lastSelectedId);
                                } else {
                                    selection.toggleSelect(candidate.id);
                                }
                                setLastSelectedId(candidate.id);
                            }}
                        />
                    )}
                    <div className="flex-shrink-0 h-11 w-11 rounded-[12px] bg-[#0a0f1a] flex items-center justify-center text-[#c8ff00] font-bold text-base shadow-sm">
                        {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : candidate.avatar}
                    </div>
                    <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 group-hover:text-[#0a0f1a] transition-colors">{candidate.name}</span>
                        <span className="text-xs font-medium text-slate-500 mt-0.5 max-w-[140px] truncate">{candidate.role}</span>
                    </div>
                </div>
                <div 
                    {...attributes} 
                    {...listeners}
                    className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:text-slate-500 p-1"
                >
                    <GripVertical className="h-4 w-4" />
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="inline-flex items-center rounded-md bg-[#f8fafc] border border-slate-200 px-2 py-0.5 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                        {candidate.score === 0 ? 'Pending' : `Score: ${candidate.score}`}
                    </span>
                    {candidate.assignedRecruiter && (
                        <div 
                            className="h-6 w-6 rounded-full bg-[#c8ff00] flex items-center justify-center text-[10px] font-black text-[#0a0f1a] ring-2 ring-white shadow-sm"
                            title={`Assigned to: ${candidate.assignedRecruiter.firstName} ${candidate.assignedRecruiter.lastName}`}
                        >
                            {candidate.assignedRecruiter.firstName[0]}{candidate.assignedRecruiter.lastName[0]}
                        </div>
                    )}
                </div>
                <span className="text-[11px] font-semibold text-slate-400">1d ago</span>
            </div>
        </div>
    );

    if (isOverlay) return cardContent;

    return (
        <div ref={setNodeRef} style={style} className="mb-4 touch-none">
            {cardContent}
        </div>
    );
}
