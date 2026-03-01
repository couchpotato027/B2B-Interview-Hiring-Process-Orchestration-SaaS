export type Id = string;

export interface Candidate {
    id: Id;
    name: string;
    role: string;
    avatar: string;
    score: number;
}

export interface Column {
    id: Id;
    title: string;
    candidateIds: Id[];
}

export interface BoardData {
    candidates: Record<Id, Candidate>;
    columns: Record<Id, Column>;
    columnOrder: Id[];
}

export const initialBoardData: BoardData = {
    candidates: {
        'c1': { id: 'c1', name: 'Alice Smith', role: 'Frontend Eng', avatar: 'A', score: 85 },
        'c2': { id: 'c2', name: 'Bob Jones', role: 'Frontend Eng', avatar: 'B', score: 92 },
        'c3': { id: 'c3', name: 'Charlie Davis', role: 'Backend Eng', avatar: 'C', score: 78 },
        'c4': { id: 'c4', name: 'Diana Prince', role: 'Product Manager', avatar: 'D', score: 88 },
        'c5': { id: 'c5', name: 'Evan Wright', role: 'Frontend Eng', avatar: 'E', score: 0 }, // not scored yet
    },
    columns: {
        'col-1': {
            id: 'col-1',
            title: 'Applied',
            candidateIds: ['c5'],
        },
        'col-2': {
            id: 'col-2',
            title: 'Phone Screen',
            candidateIds: ['c3', 'c4'],
        },
        'col-3': {
            id: 'col-3',
            title: 'Technical Interview',
            candidateIds: ['c1'],
        },
        'col-4': {
            id: 'col-4',
            title: 'Culture Fit',
            candidateIds: ['c2'],
        },
        'col-5': {
            id: 'col-5',
            title: 'Offer Sent',
            candidateIds: [],
        }
    },
    // Facilitate reordering of the columns
    columnOrder: ['col-1', 'col-2', 'col-3', 'col-4', 'col-5'],
};
