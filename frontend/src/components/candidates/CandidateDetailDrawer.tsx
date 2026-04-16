'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { X, Mail, User, Calendar, Clock, Star, ChevronRight, MessageSquare, Activity, Briefcase, CheckCircle, AlertTriangle, Plus } from 'lucide-react';
import { candidateApi, authApi, interviewApi } from '@/lib/api';

interface DrawerProps {
    candidateId: string | null;
    onClose: () => void;
    onUpdate?: () => void;
}

const STATUS_STYLES: Record<string, string> = {
    ACTIVE: 'bg-lime-100 text-lime-800 ring-lime-500/30',
    HIRED: 'bg-emerald-100 text-emerald-800 ring-emerald-500/30',
    REJECTED: 'bg-red-100 text-red-700 ring-red-500/30',
};

const TABS = ['Overview', 'Evaluations', 'Interviews', 'Activity'] as const;
type Tab = typeof TABS[number];

export function CandidateDetailDrawer({ candidateId, onClose, onUpdate }: DrawerProps) {
    const [candidate, setCandidate] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>('Overview');
    const [showScheduleModal, setShowScheduleModal] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [scheduleForm, setScheduleForm] = useState({
        interviewerId: '', scheduledAt: '', stageId: '', notes: '',
    });
    const [scheduleError, setScheduleError] = useState('');
    const [scheduleLoading, setScheduleLoading] = useState(false);

    const load = useCallback(async () => {
        if (!candidateId) return;
        setLoading(true);
        try {
            const data = await candidateApi.get(candidateId);
            setCandidate(data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    }, [candidateId]);

    useEffect(() => { load(); }, [load]);

    useEffect(() => {
        // Load users for interviewer select
        authApi.listUsers().then(setUsers).catch(() => {});
    }, []);

    // Close on Escape key
    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleScheduleInterview = async (e: React.FormEvent) => {
        e.preventDefault();
        setScheduleError('');
        setScheduleLoading(true);
        try {
            await interviewApi.schedule({
                candidateId: candidateId!,
                interviewerId: scheduleForm.interviewerId,
                stageId: scheduleForm.stageId,
                scheduledAt: scheduleForm.scheduledAt,
                notes: scheduleForm.notes,
            });
            setShowScheduleModal(false);
            setScheduleForm({ interviewerId: '', scheduledAt: '', stageId: '', notes: '' });
            load(); // Refresh to show new interview
        } catch (err: any) {
            setScheduleError(err.message || 'Failed to schedule interview');
        } finally {
            setScheduleLoading(false);
        }
    };

    if (!candidateId) return null;

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Drawer */}
            <div className="fixed inset-y-0 right-0 z-50 w-full max-w-xl flex flex-col bg-white shadow-2xl border-l border-slate-100 animate-in slide-in-from-right duration-300">

                {/* Header */}
                <div className="flex items-start justify-between p-6 border-b border-slate-100 shrink-0">
                    {loading ? (
                        <div className="space-y-2 animate-pulse">
                            <div className="h-6 w-48 bg-slate-200 rounded" />
                            <div className="h-4 w-32 bg-slate-100 rounded" />
                        </div>
                    ) : candidate ? (
                        <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center text-white text-xl font-bold shadow-lg shrink-0">
                                {candidate.firstName?.charAt(0)}{candidate.lastName?.charAt(0)}
                            </div>
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">{candidate.firstName} {candidate.lastName}</h2>
                                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                                    <Mail className="h-3.5 w-3.5" />
                                    {candidate.email}
                                </p>
                            </div>
                        </div>
                    ) : null}

                    <div className="flex items-center gap-2 shrink-0">
                        {candidate && (
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${STATUS_STYLES[candidate.status] || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                                {candidate?.status}
                            </span>
                        )}
                        <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-slate-100 px-6 shrink-0 bg-slate-50/50">
                    {TABS.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                                activeTab === tab
                                    ? 'border-[#c8ff00] text-slate-900'
                                    : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="space-y-4 animate-pulse">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-xl" />)}
                        </div>
                    ) : !candidate ? (
                        <div className="text-center py-12 text-slate-500">Failed to load candidate details.</div>
                    ) : (
                        <>
                            {activeTab === 'Overview' && <OverviewTab candidate={candidate} />}
                            {activeTab === 'Evaluations' && <EvaluationsTab evaluations={candidate.evaluations || []} />}
                            {activeTab === 'Interviews' && (
                                <InterviewsTab
                                    interviews={candidate.interviews || []}
                                    onSchedule={() => setShowScheduleModal(true)}
                                    onRefresh={load}
                                />
                            )}
                            {activeTab === 'Activity' && <ActivityTab candidate={candidate} />}
                        </>
                    )}
                </div>

                {/* Footer Quick Actions */}
                {candidate && (
                    <div className="shrink-0 px-6 py-4 border-t border-slate-100 flex gap-3 bg-white">
                        <button
                            onClick={() => setShowScheduleModal(true)}
                            className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[#0a0f1a] px-4 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 transition-colors"
                        >
                            <Calendar className="h-4 w-4 text-[#c8ff00]" />
                            Schedule Interview
                        </button>
                    </div>
                )}
            </div>

            {/* Schedule Interview Modal */}
            {showScheduleModal && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setShowScheduleModal(false)} />
                    <div className="relative rounded-2xl bg-white shadow-2xl w-full max-w-md p-6 z-10 animate-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold text-slate-900">Schedule Interview</h3>
                            <button onClick={() => setShowScheduleModal(false)} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                        </div>
                        <form onSubmit={handleScheduleInterview} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Interviewer</label>
                                <select
                                    required
                                    value={scheduleForm.interviewerId}
                                    onChange={e => setScheduleForm(f => ({ ...f, interviewerId: e.target.value }))}
                                    className="w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                                >
                                    <option value="">Select interviewer...</option>
                                    {users.map((u: any) => (
                                        <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Date & Time</label>
                                <input
                                    required type="datetime-local"
                                    value={scheduleForm.scheduledAt}
                                    onChange={e => setScheduleForm(f => ({ ...f, scheduledAt: e.target.value }))}
                                    className="w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Stage</label>
                                <select
                                    required
                                    value={scheduleForm.stageId}
                                    onChange={e => setScheduleForm(f => ({ ...f, stageId: e.target.value }))}
                                    className="w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50"
                                >
                                    <option value="">Select stage...</option>
                                    {(candidate?.pipeline?.stages || []).map((s: any) => (
                                        <option key={s.id} value={s.id}>{s.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1.5">Notes (optional)</label>
                                <textarea
                                    rows={2}
                                    value={scheduleForm.notes}
                                    onChange={e => setScheduleForm(f => ({ ...f, notes: e.target.value }))}
                                    className="w-full rounded-xl border-0 py-2.5 px-3 text-sm ring-1 ring-slate-200 focus:ring-2 focus:ring-[#c8ff00] outline-none bg-slate-50 resize-none"
                                />
                            </div>
                            {scheduleError && (
                                <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-xl">{scheduleError}</p>
                            )}
                            <div className="flex justify-end gap-3 pt-2">
                                <button type="button" onClick={() => setShowScheduleModal(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50">Cancel</button>
                                <button type="submit" disabled={scheduleLoading} className="px-5 py-2 rounded-xl text-sm font-semibold bg-[#0a0f1a] text-white hover:bg-slate-800 disabled:opacity-50">
                                    {scheduleLoading ? 'Scheduling...' : 'Schedule'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function OverviewTab({ candidate }: { candidate: any }) {
    const pipeline = candidate.pipeline;
    const stages = pipeline?.stages || [];
    const currentIdx = stages.findIndex((s: any) => s.id === candidate.currentStageId);

    return (
        <div className="space-y-6">
            {/* Stage Progress */}
            {stages.length > 0 && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Pipeline Progress</p>
                    <div className="flex items-center gap-1 flex-wrap">
                        {stages.map((stage: any, i: number) => (
                            <React.Fragment key={stage.id}>
                                <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                    i < currentIdx ? 'bg-[#c8ff00]/30 text-slate-700' :
                                    i === currentIdx ? 'bg-[#c8ff00] text-slate-900 shadow-sm' :
                                    'bg-white text-slate-400 border border-slate-200'
                                }`}>
                                    {i < currentIdx && <CheckCircle className="h-3 w-3" />}
                                    {stage.name}
                                </div>
                                {i < stages.length - 1 && <ChevronRight className="h-3 w-3 text-slate-300 shrink-0" />}
                            </React.Fragment>
                        ))}
                    </div>
                </div>
            )}

            {/* Info Grid */}
            <div className="grid grid-cols-2 gap-3">
                {[
                    { label: 'Pipeline', value: candidate.pipeline?.name, icon: Briefcase },
                    { label: 'Current Stage', value: candidate.currentStage?.name || 'Unassigned', icon: Activity },
                    { label: 'Applied', value: new Date(candidate.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: Calendar },
                    { label: 'Job', value: candidate.job?.title || '—', icon: User },
                ].map(({ label, value, icon: Icon }) => (
                    <div key={label} className="rounded-xl bg-slate-50 p-4 border border-slate-100">
                        <div className="flex items-center gap-2 mb-1">
                            <Icon className="h-3.5 w-3.5 text-slate-400" />
                            <p className="text-xs font-medium text-slate-500">{label}</p>
                        </div>
                        <p className="text-sm font-semibold text-slate-900 truncate">{value || '—'}</p>
                    </div>
                ))}
            </div>

            {/* Evaluation summary if any */}
            {candidate.evaluations?.length > 0 && (
                <div className="rounded-2xl bg-slate-50 p-4 border border-slate-100">
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Evaluation Summary</p>
                    <div className="flex items-center gap-4">
                        <div className="text-3xl font-black text-slate-900">
                            {Math.round(candidate.evaluations.reduce((sum: number, e: any) => sum + (e.overallScore || 0), 0) / candidate.evaluations.length)}
                            <span className="text-sm font-normal text-slate-400">/100</span>
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-700">{candidate.evaluations.length} evaluation{candidate.evaluations.length !== 1 ? 's' : ''}</p>
                            <p className="text-xs text-slate-500">Average overall score</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function EvaluationsTab({ evaluations }: { evaluations: any[] }) {
    if (!evaluations.length) return (
        <div className="text-center py-12">
            <Star className="mx-auto h-10 w-10 text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-500">No evaluations yet</p>
            <p className="text-xs text-slate-400 mt-1">Evaluations will appear here after interviews</p>
        </div>
    );

    return (
        <div className="space-y-4">
            {evaluations.map((ev: any) => (
                <div key={ev.id} className="rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="text-sm font-bold text-slate-900">{ev.interviewer?.firstName} {ev.interviewer?.lastName}</p>
                            <p className="text-xs text-slate-500">{ev.stage?.name} • {new Date(ev.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-1">
                            {[1,2,3,4,5].map(s => (
                                <Star key={s} className={`h-4 w-4 ${s <= Math.round((ev.overallScore || 0)/20) ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                        {[
                            { label: 'Skill', value: ev.skillMatchScore },
                            { label: 'Experience', value: ev.experienceScore },
                            { label: 'Projects', value: ev.projectRelevanceScore },
                        ].map(({ label, value }) => (
                            <div key={label} className="bg-slate-50 rounded-lg p-2 text-center">
                                <p className="text-xs text-slate-500">{label}</p>
                                <p className="text-sm font-bold text-slate-900">{value ?? '—'}</p>
                            </div>
                        ))}
                    </div>
                    {ev.strengths && <p className="text-xs text-emerald-700 bg-emerald-50 rounded-lg px-3 py-2">✓ {ev.strengths}</p>}
                    {ev.weaknesses && <p className="text-xs text-red-700 bg-red-50 rounded-lg px-3 py-2 mt-2">✗ {ev.weaknesses}</p>}
                </div>
            ))}
        </div>
    );
}

function InterviewsTab({ interviews, onSchedule, onRefresh }: { interviews: any[]; onSchedule: () => void; onRefresh: () => void }) {
    return (
        <div className="space-y-4">
            <button
                onClick={onSchedule}
                className="w-full flex items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 py-3 text-sm font-medium text-slate-500 hover:border-[#c8ff00] hover:text-slate-700 transition-colors"
            >
                <Plus className="h-4 w-4" /> Schedule New Interview
            </button>

            {interviews.length === 0 ? (
                <div className="text-center py-8">
                    <Calendar className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm text-slate-500">No interviews scheduled</p>
                </div>
            ) : interviews.map((iv: any) => (
                <div key={iv.id} className="rounded-2xl border border-slate-100 p-5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm font-bold text-slate-900">{iv.type?.replace('_', ' ')} Interview</p>
                            <p className="text-xs text-slate-500 mt-0.5">
                                with {iv.interviewer?.firstName} {iv.interviewer?.lastName}
                            </p>
                        </div>
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ring-inset ${
                            iv.feedbackStatus === 'SUBMITTED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                            'bg-blue-50 text-blue-700 ring-blue-200'
                        }`}>
                            {iv.feedbackStatus === 'SUBMITTED' ? 'Feedback Given' : 'Pending Feedback'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{new Date(iv.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {iv.notes && (
                        <p className="mt-2 text-xs text-slate-600 bg-slate-50 rounded-lg px-3 py-2">{iv.notes}</p>
                    )}
                </div>
            ))}
        </div>
    );
}

function ActivityTab({ candidate }: { candidate: any }) {
    // Build timeline from available data
    const events: { time: Date; label: string; type: 'stage' | 'eval' | 'interview' | 'created' }[] = [
        { time: new Date(candidate.createdAt), label: 'Candidate added to system', type: 'created' },
        ...(candidate.evaluations || []).map((e: any) => ({
            time: new Date(e.createdAt),
            label: `Evaluated by ${e.interviewer?.firstName || 'Unknown'} — Score: ${e.overallScore ?? 'N/A'}`,
            type: 'eval' as const,
        })),
        ...(candidate.interviews || []).map((i: any) => ({
            time: new Date(i.scheduledAt),
            label: `${i.type} interview with ${i.interviewer?.firstName || 'Unknown'} — ${i.status}`,
            type: 'interview' as const,
        })),
    ].sort((a, b) => b.time.getTime() - a.time.getTime());

    const iconFor = (type: string) => {
        switch (type) {
            case 'created': return <User className="h-4 w-4 text-slate-600" />;
            case 'eval': return <Star className="h-4 w-4 text-amber-500" />;
            case 'interview': return <Calendar className="h-4 w-4 text-blue-500" />;
            default: return <Activity className="h-4 w-4 text-slate-400" />;
        }
    };

    return (
        <div className="space-y-1">
            {events.length === 0 ? (
                <div className="text-center py-12">
                    <Activity className="mx-auto h-10 w-10 text-slate-200 mb-3" />
                    <p className="text-sm text-slate-500">No activity recorded yet</p>
                </div>
            ) : events.map((ev, i) => (
                <div key={i} className="flex gap-4 pb-4">
                    <div className="flex flex-col items-center">
                        <div className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                            {iconFor(ev.type)}
                        </div>
                        {i < events.length - 1 && <div className="w-px flex-1 bg-slate-100 my-1" />}
                    </div>
                    <div className="pt-1 pb-4">
                        <p className="text-sm font-medium text-slate-800">{ev.label}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                            {ev.time.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {ev.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}
