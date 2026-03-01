'use client';

import React from 'react';
import { Mail, Phone, MoreVertical, Filter, Download } from 'lucide-react';

const candidates = [
    { id: 'c1', name: 'Alice Smith', email: 'alice@example.com', role: 'Frontend Engineer', stage: 'Technical Interview', score: 85, date: 'Oct 24, 2026' },
    { id: 'c2', name: 'Bob Jones', email: 'bob@example.com', role: 'Frontend Engineer', stage: 'Culture Fit', score: 92, date: 'Oct 23, 2026' },
    { id: 'c3', name: 'Charlie Davis', email: 'charlie@example.com', role: 'Backend Engineer', stage: 'Phone Screen', score: 78, date: 'Oct 25, 2026' },
    { id: 'c4', name: 'Diana Prince', email: 'diana@example.com', role: 'Product Manager', stage: 'Phone Screen', score: 88, date: 'Oct 25, 2026' },
    { id: 'c5', name: 'Evan Wright', email: 'evan@example.com', role: 'Frontend Engineer', stage: 'Applied', score: null, date: 'Oct 26, 2026' },
];

export default function CandidatesPage() {
    return (
        <div className="space-y-6">
            <div className="sm:flex sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Candidate Directory
                    </h2>
                    <p className="mt-2 text-sm text-gray-600">
                        A list of all candidates in your organization including their name, role, email, and current stage.
                    </p>
                </div>
                <div className="mt-4 flex sm:ml-4 sm:mt-0 gap-3">
                    <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 -1"
                    >
                        <Filter className="-ml-0.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                        Filter
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                    >
                        <Download className="-ml-0.5 h-4 w-4 text-gray-400" aria-hidden="true" />
                        Export
                    </button>
                    <button
                        type="button"
                        className="inline-flex items-center gap-x-1.5 rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600"
                    >
                        Add Candidate
                    </button>
                </div>
            </div>

            <div className="flow-root">
                <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6">
                                            Candidate
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Applied Role
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Current Stage
                                        </th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                                            Aggregated Score
                                        </th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                                            <span className="sr-only">Actions</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {candidates.map((person) => (
                                        <tr key={person.id}>
                                            <td className="whitespace-nowrap py-5 pl-4 pr-3 text-sm sm:pl-6">
                                                <div className="flex items-center bg-transparent gap-4">
                                                    <div className="h-11 w-11 flex-shrink-0">
                                                        <div className="h-11 w-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-500">
                                                            {person.name.charAt(0)}
                                                        </div>
                                                    </div>
                                                    <div>
                                                        <div className="font-medium text-gray-900">{person.name}</div>
                                                        <div className="mt-1 flex items-center gap-2 text-gray-500">
                                                            <Mail className="h-3 w-3" />
                                                            {person.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                                                <div className="text-gray-900">{person.role}</div>
                                                <div className="mt-1 text-gray-500">Applied {person.date}</div>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                                                <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                                    {person.stage}
                                                </span>
                                            </td>
                                            <td className="whitespace-nowrap px-3 py-5 text-sm text-gray-500">
                                                {person.score ? (
                                                    <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                                                        {person.score}
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                                        Pending Review
                                                    </span>
                                                )}
                                            </td>
                                            <td className="relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                <button className="text-gray-400 hover:text-gray-900">
                                                    <MoreVertical className="h-5 w-5" aria-hidden="true" />
                                                    <span className="sr-only">, {person.name}</span>
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
