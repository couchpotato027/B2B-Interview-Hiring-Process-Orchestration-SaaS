'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';

export default function RegisterPage() {
    const router = useRouter();

    const [formData, setFormData] = useState({
        companyName: '',
        adminEmail: '',
        adminPassword: '',
        confirmPassword: '',
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.adminPassword !== formData.confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setLoading(true);

        try {
            const responsePayload = {
                companyName: formData.companyName,
                adminEmail: formData.adminEmail,
                adminPassword: formData.adminPassword
            };

            await authApi.register(responsePayload);

            // Auto login or redirect to login. We will redirect to login to keep flow explicit
            router.push('/login?registered=true');

        } catch (err: any) {
            setError(err.message || 'An error occurred during registration.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <div>
                <h2 className="mt-8 text-3xl font-bold tracking-tight text-gray-900">Activate your tenant</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Set up your organization and admin account to get started. Already registered?{' '}
                    <Link href="/login" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                        Sign in here
                    </Link>
                </p>
            </div>

            <div className="mt-10">
                <div>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="companyName" className="block text-sm font-medium leading-6 text-gray-900">
                                Organization / Company Name
                            </label>
                            <div className="mt-2">
                                <input
                                    id="companyName"
                                    name="companyName"
                                    type="text"
                                    required
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="adminEmail" className="block text-sm font-medium leading-6 text-gray-900">
                                Admin Work Email
                            </label>
                            <div className="mt-2">
                                <input
                                    id="adminEmail"
                                    name="adminEmail"
                                    type="email"
                                    required
                                    value={formData.adminEmail}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="adminPassword" className="block text-sm font-medium leading-6 text-gray-900">
                                Admin Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="adminPassword"
                                    name="adminPassword"
                                    type="password"
                                    required
                                    value={formData.adminPassword}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="confirmPassword" className="block text-sm font-medium leading-6 text-gray-900">
                                Confirm Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        {error && (
                            <div className="rounded-md bg-red-50 p-4 border border-red-200">
                                <div className="flex">
                                    <div className="ml-3">
                                        <h3 className="text-sm font-medium text-red-800">{error}</h3>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Setting up tenant...' : 'Create Tenant Account'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
