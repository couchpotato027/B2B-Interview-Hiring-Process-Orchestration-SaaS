'use client';

import React, { useEffect, useState } from 'react';
import { 
    DndContext, 
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
    DragStartEvent,
    DragOverEvent
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Toaster } from 'react-hot-toast';

export function ClientDndContext({ 
    onDragEnd, 
    onDragStart,
    onDragOver,
    children 
}: { 
    onDragEnd: (event: DragEndEvent) => void, 
    onDragStart?: (event: DragStartEvent) => void,
    onDragOver?: (event: DragOverEvent) => void,
    children: React.ReactNode 
}) {
    const [mounted, setMounted] = useState(false);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="animate-pulse flex h-full items-center justify-center text-gray-400">Loading Pipeline Board...</div>;
    }

    return (
        <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            {children}
            <Toaster position="bottom-right" />
        </DndContext>
    );
}
