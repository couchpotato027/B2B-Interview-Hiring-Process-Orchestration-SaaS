'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.SyntheticEvent) => {
        if (e) e.preventDefault();
        console.log('🚀 Login attempt initiated for:', email);
        setError('');
        setLoading(true);

        try {
            const data = await authApi.login({ email, password });

            // Store token in localStorage (or an HTTP-only cookie in production)
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            // Setup the user state here via Context/Zustand if you have one

            router.push('/dashboard');

        } catch (err: any) {
            setError(err.message || 'An error occurred during sign in.');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse: any) => {
        if (!credentialResponse.credential) return;
        
        setLoading(true);
        setError('');
        try {
            const data = await authApi.googleLogin(credentialResponse.credential);
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            router.push('/dashboard');
        } catch (err: any) {
            setError(err.message || 'Google login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ''}>
            <div>
                <h2 className="mt-8 text-3xl font-bold tracking-tight text-gray-900">Sign in to your account</h2>
                <p className="mt-2 text-sm text-gray-600">
                    Not a member?{' '}
                    <Link href="/register" className="font-medium text-emerald-600 hover:text-emerald-500 transition-colors">
                        Start a 14-day free trial on your SaaS
                    </Link>
                </p>
            </div>

            <div className="mt-10">
                <div>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* ... existing email/password fields ... */}
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium leading-6 text-gray-900">
                                Email address
                            </label>
                            <div className="mt-2">
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-emerald-600 sm:text-sm sm:leading-6"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-medium leading-6 text-gray-900">
                                Password
                            </label>
                            <div className="mt-2">
                                <input
                                    id="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
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

                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <input
                                    id="remember-me"
                                    type="checkbox"
                                    className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                />
                                <label htmlFor="remember-me" className="ml-3 block text-sm leading-6 text-gray-700">
                                    Remember me
                                </label>
                            </div>

                            <div className="text-sm leading-6">
                                <a href="#" className="font-medium text-emerald-600 hover:text-emerald-500">
                                    Forgot password?
                                </a>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                type="button"
                                onClick={handleSubmit}
                                disabled={loading}
                                className="flex w-full justify-center rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 disabled:opacity-50 transition-colors"
                            >
                                {loading ? 'Signing in...' : 'Sign in'}
                            </button>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                    <div className="w-full border-t border-gray-300"></div>
                                </div>
                                <div className="relative flex justify-center text-sm leading-6">
                                    <span className="bg-white px-6 text-gray-900 font-medium">Or continue with</span>
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <GoogleLogin 
                                    onSuccess={handleGoogleSuccess}
                                    onError={() => setError('Google login failed')}
                                    useOneTap
                                    theme="outline"
                                    shape="rectangular"
                                    width="100%"
                                />
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </GoogleOAuthProvider>
        </>
    );
}
