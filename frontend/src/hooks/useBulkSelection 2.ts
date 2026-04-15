import { useState, useCallback } from 'react';

export function useBulkSelection<T extends { id: string }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelect = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleSelectAll = useCallback((allIds: string[]) => {
        setSelectedIds(prev => {
            if (prev.size === allIds.length) {
                return new Set();
            }
            return new Set(allIds);
        });
    }, []);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const handleShiftClick = useCallback((id: string, lastSelectedId: string | null) => {
        if (!lastSelectedId || lastSelectedId === id) {
            toggleSelect(id);
            return;
        }

        const currentIndex = items.findIndex(item => item.id === id);
        const lastIndex = items.findIndex(item => item.id === lastSelectedId);

        if (currentIndex === -1 || lastIndex === -1) {
            toggleSelect(id);
            return;
        }

        const start = Math.min(currentIndex, lastIndex);
        const end = Math.max(currentIndex, lastIndex);
        const rangeIds = items.slice(start, end + 1).map(item => item.id);

        setSelectedIds(prev => {
            const next = new Set(prev);
            const isRemoving = prev.has(id) && prev.has(lastSelectedId);
            
            rangeIds.forEach(rangeId => {
                if (isRemoving) {
                    next.delete(rangeId);
                } else {
                    next.add(rangeId);
                }
            });
            return next;
        });
    }, [items, toggleSelect]);

    return {
        selectedIds: Array.from(selectedIds),
        isSelected: (id: string) => selectedIds.has(id),
        toggleSelect,
        toggleSelectAll,
        clearSelection,
        handleShiftClick,
    };
}
