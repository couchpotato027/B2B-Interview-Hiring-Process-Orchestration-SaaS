import React from 'react';
import { ArrowRight } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-white flex">
            {/* Left Pane - Form */}
            <div className="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:flex-none lg:px-20 xl:px-24 w-full max-w-lg mx-auto lg:mx-0">
                <div className="w-full max-w-sm mx-auto lg:w-96">
                    {children}
                </div>
            </div>

            {/* Right Pane - Visuals */}
            <div className="hidden lg:block relative w-0 flex-1 bg-slate-900">
                <div className="absolute inset-0 h-full w-full object-cover flex flex-col justify-center px-16 z-10 text-white">
                    <div className="max-w-xl">
                        <h2 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
                            Orchestrate your entire hiring process seamlessly.
                        </h2>
                        <p className="mt-6 text-lg leading-8 text-gray-300">
                            The industry-standard B2B SaaS platform for mid-to-large organizations to streamline hiring workflows, handle SLA alerts, and gather structured interviewer feedback.
                        </p>
                        <div className="mt-8 flex items-center gap-x-4">
                            <div className="h-px flex-1 bg-gray-700"></div>
                            <span className="text-sm font-medium text-gray-400 uppercase tracking-widest">Built for scale</span>
                            <div className="h-px flex-1 bg-gray-700"></div>
                        </div>
                        <ul className="mt-8 space-y-4">
                            {[
                                'Configurable pipeline templates per role',
                                'Structured interviewer assignment',
                                'Scorecard-based feedback collection',
                                'SLA-based bottleneck alerting'
                            ].map((feature, i) => (
                                <li key={i} className="flex gap-x-3 items-center text-gray-300">
                                    <ArrowRight className="h-5 w-5 text-emerald-400 flex-none" />
                                    {feature}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Decorative background elements */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-900 via-slate-900 to-emerald-900 opacity-80 mix-blend-multiply" />
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob" />
                <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-emerald-600 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000" />
            </div>
        </div>
    );
}
