import React from 'react';
import { ArrowUpRight, ArrowDownRight, Clock, Users, Activity, BarChart4 } from 'lucide-react';

const stats = [
    { name: 'Total Hired', stat: '45', previousStat: '32', change: '40.6%', changeType: 'increase', icon: Users },
    { name: 'Avg. Time to Hire', stat: '18d', previousStat: '24d', change: '25%', changeType: 'decrease', icon: Clock },
    { name: 'SLA Breaches', stat: '12', previousStat: '8', change: '50%', changeType: 'increase', icon: Activity },
    { name: 'Pipeline Conversion', stat: '12.4%', previousStat: '11.8%', change: '5.0%', changeType: 'increase', icon: BarChart4 },
]

function classNames(...classes: string[]) {
    return classes.filter(Boolean).join(' ')
}

export default function ReportsPage() {
    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                    Reports & Analytics
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                    Analyze historical hiring metrics, pipeline efficiency, and SLA compliance.
                </p>
            </div>

            <div>
                <h3 className="text-base font-semibold leading-6 text-gray-900">Last 30 days performance</h3>
                <dl className="mt-5 grid grid-cols-1 divide-y divide-gray-200 overflow-hidden rounded-lg bg-white shadow md:grid-cols-2 lg:grid-cols-4 md:divide-x md:divide-y-0">
                    {stats.map((item) => (
                        <div key={item.name} className="px-4 py-5 sm:p-6">
                            <div className="flex justify-between items-start">
                                <p className="text-base font-normal text-gray-900">{item.name}</p>
                                <item.icon className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="mt-4 flex items-baseline justify-between md:block lg:flex">
                                <div className="flex items-baseline text-2xl font-semibold text-emerald-600">
                                    {item.stat}
                                    <span className="ml-2 text-sm font-medium text-gray-500">from {item.previousStat}</span>
                                </div>

                                <div
                                    className={classNames(
                                        item.changeType === 'increase' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800',
                                        'inline-flex items-baseline rounded-full px-2.5 py-0.5 text-sm font-medium md:mt-2 lg:mt-0',
                                    )}
                                >
                                    {item.changeType === 'increase' ? (
                                        <ArrowUpRight
                                            className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-green-500"
                                            aria-hidden="true"
                                        />
                                    ) : (
                                        <ArrowDownRight
                                            className="-ml-1 mr-0.5 h-5 w-5 flex-shrink-0 self-center text-red-500"
                                            aria-hidden="true"
                                        />
                                    )}

                                    <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                                    {item.change}
                                </div>
                            </div>
                        </div>
                    ))}
                </dl>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {/* Placeholder for charts */}
                <div className="rounded-lg bg-white shadow py-6 px-4 sm:px-6 border border-gray-100">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Pipeline Funnel Drop-off</h3>
                    <div className="h-64 bg-slate-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                        [ Chart Component Placeholder ]
                    </div>
                </div>
                <div className="rounded-lg bg-white shadow py-6 px-4 sm:px-6 border border-gray-100">
                    <h3 className="text-base font-semibold leading-6 text-gray-900 mb-4">Time in Stage Distribution</h3>
                    <div className="h-64 bg-slate-50 border border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm">
                        [ Chart Component Placeholder ]
                    </div>
                </div>
            </div>
        </div>
    );
}
