'use client';

import React, { useState } from 'react';
import { Plus, GripVertical, Settings2, Trash2 } from 'lucide-react';

const initialStages = [
    { id: 1, name: 'Applied', type: 'Static', duration: 'N/A' },
    { id: 2, name: 'Phone Screen', type: 'Interview', duration: '30 mins' },
    { id: 3, name: 'Take-home Assignment', type: 'Assessment', duration: '3 days' },
    { id: 4, name: 'Technical Interview', type: 'Interview', duration: '60 mins' },
    { id: 5, name: 'Culture Fit', type: 'Interview', duration: '45 mins' },
    { id: 6, name: 'Offer Processing', type: 'Static', duration: 'N/A' },
];

export default function WorkflowBuilderPage() {
    const [stages, setStages] = useState(initialStages);

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="md:flex md:items-center md:justify-between">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Workflow Builder
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        Configure the template for your Engineering Manager pipeline. Candidates will move linearly through these stages.
                    </p>
                </div>
                <div className="mt-4 flex md:ml-4 md:mt-0">
                    <button
                        type="button"
                        className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        Save as Draft
                    </button>
                    <button
                        type="button"
                        className="ml-3 inline-flex items-center rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Publish Template
                    </button>
                </div>
            </div>

            <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl">
                <div className="px-4 py-6 sm:p-8">
                    <div className="max-w-3xl">
                        <ul role="list" className="space-y-3">
                            {stages.map((stage, index) => (
                                <li
                                    key={stage.id}
                                    className="overflow-hidden rounded-xl border border-gray-200 bg-white hover:border-indigo-300 transition-colors shadow-sm group"
                                >
                                    <div className="flex items-center gap-x-4 px-4 py-4 sm:px-6 hover:bg-slate-50">
                                        <div className="text-gray-400 cursor-grab active:cursor-grabbing hover:text-indigo-600">
                                            <GripVertical className="h-5 w-5" />
                                        </div>
                                        <div className="flex bg-slate-100 rounded-full h-8 w-8 items-center justify-center font-bold text-slate-500 text-xs shadow-inner">
                                            {index + 1}
                                        </div>
                                        <div className="min-w-0 flex-auto">
                                            <p className="text-sm font-semibold leading-6 text-gray-900">
                                                {stage.name}
                                            </p>
                                            <p className="mt-1 flex text-xs leading-5 text-gray-500 gap-x-2">
                                                <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-1 text-xs font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">
                                                    {stage.type}
                                                </span>
                                                {stage.duration !== 'N/A' && (
                                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                        Time length: {stage.duration}
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-x-4">
                                            <button className="hidden sm:flex text-gray-400 hover:text-emerald-600 transition-colors">
                                                <Settings2 className="h-5 w-5" />
                                            </button>
                                            <button className="hidden sm:flex text-gray-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="h-5 w-5" />
                                            </button>
                                        </div>
                                    </div>
                                </li>
                            ))}
                        </ul>

                        <button
                            type="button"
                            className="mt-6 relative block w-full rounded-lg border-2 border-dashed border-gray-300 p-8 text-center hover:border-emerald-400 hover:bg-emerald-50 focus:outline-none transition-all group"
                        >
                            <Plus className="mx-auto h-8 w-8 text-gray-400 group-hover:text-emerald-500" />
                            <span className="mt-2 block text-sm font-semibold text-gray-900 group-hover:text-emerald-700">Add a new stage</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
