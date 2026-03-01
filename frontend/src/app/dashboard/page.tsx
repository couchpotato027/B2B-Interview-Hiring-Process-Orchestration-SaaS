import React from 'react';
import { Activity, Users, CheckCircle, Clock } from 'lucide-react';

const stats = [
    { name: 'Active Candidates', value: '142', icon: Users, change: '+12%', changeType: 'positive' },
    { name: 'Time to Hire (Avg)', value: '18 Days', icon: Clock, change: '-2 Days', changeType: 'positive' },
    { name: 'Pending SLA Alerts', value: '4', icon: Activity, change: '+2', changeType: 'negative' },
    { name: 'Offers Accepted', value: '24', icon: CheckCircle, change: '+4.5%', changeType: 'positive' },
];

export default function DashboardOverview() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    Hiring Overview
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Track organizational hiring velocity and candidate pipeline health.
                </p>
            </div>

            <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((item) => (
                    <div
                        key={item.name}
                        className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6 border border-gray-100"
                    >
                        <dt>
                            <div className="absolute rounded-md bg-emerald-500 p-3">
                                <item.icon className="h-6 w-6 text-white" aria-hidden="true" />
                            </div>
                            <p className="ml-16 truncate text-sm font-medium text-gray-500">{item.name}</p>
                        </dt>
                        <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
                            <p className="text-2xl font-semibold text-gray-900">{item.value}</p>
                            <p
                                className={`ml-2 flex items-baseline text-sm font-semibold ${item.changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'
                                    }`}
                            >
                                {item.change}
                            </p>
                            <div className="absolute inset-x-0 bottom-0 bg-gray-50 px-4 py-4 sm:px-6">
                                <div className="text-sm">
                                    <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                                        View all<span className="sr-only"> {item.name} stats</span>
                                    </a>
                                </div>
                            </div>
                        </dd>
                    </div>
                ))}
            </dl>

            <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="rounded-lg bg-white shadow py-6 px-4 sm:px-6 border border-gray-100">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Recent SLA Alerts</h3>
                    <div className="rounded-md bg-red-50 p-4 border border-red-100">
                        <div className="flex">
                            <div className="ml-3">
                                <h3 className="text-sm font-medium text-red-800">Engineering Manager Pipeline</h3>
                                <div className="mt-2 text-sm text-red-700">
                                    <p>Candidate Jane Doe has been seated in "Technical Interview" for 4 days. SLA threshold exceeded (48h).</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="rounded-lg bg-white shadow py-6 px-4 sm:px-6 border border-gray-100">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Pending Evaluations</h3>
                    <ul role="list" className="divide-y divide-gray-100">
                        <li className="flex gap-x-4 py-3">
                            <div className="min-w-0 flex-auto">
                                <p className="text-sm font-semibold leading-6 text-gray-900">John Smith</p>
                                <p className="mt-1 flex text-xs leading-5 text-gray-500">Frontend Developer • Initial Phone Screen</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-x-4">
                                <button className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Review</button>
                            </div>
                        </li>
                        <li className="flex gap-x-4 py-3">
                            <div className="min-w-0 flex-auto">
                                <p className="text-sm font-semibold leading-6 text-gray-900">Alice Johnson</p>
                                <p className="mt-1 flex text-xs leading-5 text-gray-500">Product Manager • Onsite Panel</p>
                            </div>
                            <div className="flex shrink-0 items-center gap-x-4">
                                <button className="rounded bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">Review</button>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
