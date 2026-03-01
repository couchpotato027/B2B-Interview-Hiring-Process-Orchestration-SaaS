'use client';

import React, { useState } from 'react';
import { DropResult } from '@hello-pangea/dnd';
import { initialBoardData, BoardData } from './mockData';
import { ClientDndContext } from './ClientDndContext';
import { KanbanColumn } from './KanbanColumn';

export default function PipelineBoard() {
    const [data, setData] = useState<BoardData>(initialBoardData);

    const onDragEnd = (result: DropResult) => {
        const { destination, source, draggableId } = result;

        if (!destination) return;

        if (
            destination.droppableId === source.droppableId &&
            destination.index === source.index
        ) {
            return;
        }

        const startColumn = data.columns[source.droppableId];
        const finishColumn = data.columns[destination.droppableId];

        // Moving within the same column
        if (startColumn === finishColumn) {
            const newCandidateIds = Array.from(startColumn.candidateIds);
            newCandidateIds.splice(source.index, 1);
            newCandidateIds.splice(destination.index, 0, draggableId);

            const newColumn = {
                ...startColumn,
                candidateIds: newCandidateIds,
            };

            setData({
                ...data,
                columns: {
                    ...data.columns,
                    [newColumn.id]: newColumn,
                },
            });
            return;
        }

        // Moving from one column to another
        const startCandidateIds = Array.from(startColumn.candidateIds);
        startCandidateIds.splice(source.index, 1);
        const newStart = {
            ...startColumn,
            candidateIds: startCandidateIds,
        };

        const finishCandidateIds = Array.from(finishColumn.candidateIds);
        finishCandidateIds.splice(destination.index, 0, draggableId);
        const newFinish = {
            ...finishColumn,
            candidateIds: finishCandidateIds,
        };

        setData({
            ...data,
            columns: {
                ...data.columns,
                [newStart.id]: newStart,
                [newFinish.id]: newFinish,
            },
        });

        // In a real app, fire API call here to persist backend state using API transition pattern
        // candidateApi.moveStage(draggableId, finishColumn.id)
    };

    return (
        <div className="h-full flex flex-col">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Engineering Manager Pipeline
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Manage candidates through the active hiring workflow stages.</p>
                </div>
                <button className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500">
                    Add Candidate
                </button>
            </div>

            <div className="flex-1 overflow-x-auto pb-4">
                <ClientDndContext onDragEnd={onDragEnd}>
                    <div className="flex h-full items-start px-1">
                        {data.columnOrder.map((columnId) => {
                            const column = data.columns[columnId];
                            const candidates = column.candidateIds.map(
                                (candidateId) => data.candidates[candidateId]
                            );

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
        </div>
    );
}
