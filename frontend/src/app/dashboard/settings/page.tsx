'use client';

import React, { useEffect, useState } from 'react';
import { X, UserPlus, Building2, User2, BadgeCheck, ShieldAlert, Users } from 'lucide-react';
import { authApi } from '@/lib/api';

interface UserItem {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: { name: string };
    createdAt: string;
}

interface MeData {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    tenant: { id: string; name: string };
}

export default function SettingsPage() {
    const [me, setMe] = useState<MeData | null>(null);
    const [users, setUsers] = useState<UserItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showInvite, setShowInvite] = useState(false);
    const [inviteForm, setInviteForm] = useState({ email: '', password: '', firstName: '', lastName: '', roleName: 'RECRUITER' });
    const [inviteError, setInviteError] = useState('');

    const load = async () => {
        try {
            const [meData, usersData] = await Promise.all([authApi.getMe(), authApi.listUsers()]);
            setMe(meData);
            setUsers(usersData);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteError('');
        try {
            await authApi.createUser(inviteForm);
            setShowInvite(false);
            setInviteForm({ email: '', password: '', firstName: '', lastName: '', roleName: 'RECRUITER' });
            load();
        } catch (err: unknown) { setInviteError(err instanceof Error ? err.message : 'Unknown error'); }
    };

    const roleBadge = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-purple-50 text-purple-700 ring-purple-700/10 border-purple-200';
            case 'RECRUITER': return 'bg-blue-50 text-blue-700 ring-blue-700/10 border-blue-200';
            case 'INTERVIEWER': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 border-emerald-200';
            default: return 'bg-slate-50 text-slate-600 ring-slate-500/10 border-slate-200';
        }
    };

    if (loading) return (
         <div className="space-y-8 animate-pulse">
            <div><div className="h-8 w-48 bg-slate-200 rounded mb-2"></div></div>
            <div className="h-32 bg-white rounded-2xl border border-slate-100"></div>
            <div className="h-64 bg-white rounded-2xl border border-slate-100"></div>
        </div>
    );

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h2 className="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">Settings</h2>
                <p className="mt-2 text-sm text-slate-500">Manage your organization settings and team members.</p>
            </div>

            {/* Organization Info */}
            {me && (
                <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                         <div className="p-2 bg-indigo-50 rounded-lg"><Building2 className="w-5 h-5 text-indigo-500" /></div>
                         <h3 className="text-base font-bold text-slate-900">Organization Identity</h3>
                    </div>
                    <div className="p-6">
                        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-8">
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Company Name</dt>
                                <dd className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    {me.tenant.name}
                                    <BadgeCheck className="w-4 h-4 text-[#c8ff00]" />
                                </dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><User2 className="w-3.5 h-3.5" /> Your Email</dt>
                                <dd className="text-base font-medium text-slate-900">{me.email}</dd>
                            </div>
                            <div>
                                <dt className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Your Access Role</dt>
                                <dd className="mt-1">
                                    <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset border ${roleBadge(me.role)}`}>{me.role}</span>
                                </dd>
                            </div>
                        </dl>
                    </div>
                </div>
            )}

            {/* Team Members */}
            <div className="rounded-2xl bg-white shadow-sm border border-slate-100 overflow-hidden">
                <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#c8ff00]/20 rounded-lg"><Users className="w-5 h-5 text-[#0a0f1a]" /></div>
                        <h3 className="text-base font-bold text-slate-900">Team Members</h3>
                    </div>
                    <button onClick={() => setShowInvite(true)} className="inline-flex items-center gap-2 rounded-full bg-[#0a0f1a] px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
                        <UserPlus className="h-4 w-4 text-[#c8ff00]" /> Invite Member
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-100">
                        <thead className="bg-white">
                            <tr>
                                <th className="py-4 pl-6 pr-3 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Member Name</th>
                                <th className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Email Address</th>
                                <th className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Role</th>
                                <th className="px-3 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 bg-white">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="whitespace-nowrap py-4 pl-6 pr-3 text-sm">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 border border-slate-200 flex items-center justify-center font-bold text-slate-600 shadow-sm text-xs">
                                                {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-900">{u.firstName} {u.lastName}</span>
                                        </div>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-600">{u.email}</td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                        <span className={`inline-flex items-center rounded-lg px-2.5 py-1 text-xs font-bold ring-1 ring-inset border ${roleBadge(u.role.name)}`}>
                                            {u.role.name}
                                        </span>
                                    </td>
                                    <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-slate-500">
                                        {new Date(u.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Member Modal */}
            {showInvite && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={() => setShowInvite(false)} />
                        <div className="relative rounded-3xl bg-white px-4 pb-4 pt-5 shadow-2xl w-full max-w-md sm:p-6 transition-all">
                            <div className="flex items-center justify-between mb-5 border-b border-slate-100 pb-4">
                                <h3 className="text-xl font-bold text-slate-900">Invite Team Member</h3>
                                <button onClick={() => setShowInvite(false)} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-1.5 rounded-full"><X className="h-5 w-5" /></button>
                            </div>
                            <form onSubmit={handleInvite} className="space-y-5 pt-2">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">First Name</label>
                                        <input required value={inviteForm.firstName} onChange={e => setInviteForm({ ...inviteForm, firstName: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 transition-shadow" placeholder="Jane" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-1.5">Last Name</label>
                                        <input required value={inviteForm.lastName} onChange={e => setInviteForm({ ...inviteForm, lastName: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 transition-shadow" placeholder="Doe" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Work Email</label>
                                    <input required type="email" value={inviteForm.email} onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 transition-shadow" placeholder="jane@company.com" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Temporary Password</label>
                                    <input required type="password" value={inviteForm.password} onChange={e => setInviteForm({ ...inviteForm, password: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 transition-shadow" placeholder="••••••••" />
                                    <p className="mt-1.5 text-xs text-slate-500 font-medium">They will be required to change this upon first login.</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Platform Role</label>
                                    <select value={inviteForm.roleName} onChange={e => setInviteForm({ ...inviteForm, roleName: e.target.value })} className="block w-full rounded-xl border-0 py-2.5 px-3 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 transition-shadow cursor-pointer">
                                        <option value="RECRUITER">Recruiter (Standard Access)</option>
                                        <option value="INTERVIEWER">Interviewer (Limited Access)</option>
                                        <option value="ADMIN">Admin (Full Control)</option>
                                    </select>
                                </div>
                                {inviteError && <p className="text-sm font-medium text-red-500 bg-red-50 p-3 rounded-xl border border-red-100">{inviteError}</p>}
                                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                                    <button type="button" onClick={() => setShowInvite(false)} className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">Cancel</button>
                                    <button type="submit" className="rounded-full bg-[#0a0f1a] px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition-colors">Send Invitation</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
