'use client';

import React, { useEffect, useState } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';

// Since drag-and-drop libraries rely heavily on the window object
// we must ensure they mount strictly on the client side in Next.js
export function ClientDndContext({ onDragEnd, children }: { onDragEnd: (result: DropResult) => void, children: React.ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className="animate-pulse flex h-full items-center justify-center text-gray-400">Loading Pipeline Board...</div>;
    }

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            {children}
        </DragDropContext>
    );
}

// Re-export specific modules so they can be consumed securely
export { Droppable, Draggable };
