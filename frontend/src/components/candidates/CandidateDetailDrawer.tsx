'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, User, Briefcase, Star, Clock, 
    ArrowRight, UserPlus, Mail, Phone,
    FileText, Calendar, Shield, ExternalLink, RefreshCw
} from 'lucide-react';
import { candidateApi, authApi, API_ROOT } from '@/lib/api';
import toast from 'react-hot-toast';
import EmailModal from './EmailModal';
import { InterviewScheduler } from './InterviewScheduler';

interface CandidateDetailDrawerProps {
    candidateId: string | null;
    isOpen: boolean;
    onClose: () => void;
    availableStages: Array<{ id: string; name: string }>;
    onUpdate: () => void;
}

export function CandidateDetailDrawer({ 
    candidateId, 
    isOpen, 
    onClose, 
    availableStages,
    onUpdate 
}: CandidateDetailDrawerProps) {
    const [candidate, setCandidate] = useState<any>(null);
    const [loading, setLoading] = useState(false);
    const [users, setUsers] = useState<any[]>([]);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [showScheduler, setShowScheduler] = useState(false);

    useEffect(() => {
        if (isOpen && candidateId) {
            loadCandidate();
            loadUsers();
        }
    }, [isOpen, candidateId]);

    const loadCandidate = async () => {
        setLoading(true);
        try {
            const data = await candidateApi.get(candidateId!);
            setCandidate(data);
        } catch (err) {
            toast.error('Failed to load candidate details');
            onClose();
        } finally {
            setLoading(false);
        }
    };

    const loadUsers = async () => {
        try {
            const list = await authApi.listUsers();
            setUsers(list);
        } catch (err) { console.error('Failed to load users', err); }
    };

    const handleMoveStage = async (newStageId: string) => {
        try {
            await candidateApi.moveStage(candidateId!, newStageId);
            toast.success('Moved to new stage');
            loadCandidate();
            onUpdate();
        } catch (err: any) {
            toast.error(err.message || 'Failed to move stage');
        }
    };

    const handleAssign = async (userId: string) => {
        try {
            await candidateApi.assignRecruiter(candidateId!, userId);
            toast.success('Recruiter assigned');
            loadCandidate();
            onUpdate();
        } catch (err: any) {
            toast.error(err.message || 'Failed to assign recruiter');
        }
    };

    const handleRefreshAnalysis = async () => {
        setLoading(true);
        try {
            await candidateApi.getFeedback(candidateId!);
            toast.success('AI analysis updated');
            await loadCandidate();
            onUpdate();
        } catch (err: any) {
            toast.error(err.message || 'Analysis failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[100]"
                    />
                    <motion.div 
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white shadow-2xl z-[110] flex flex-col overflow-hidden"
                    >
                        {loading || !candidate ? (
                            <div className="flex-1 flex items-center justify-center">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0a0f1a]" />
                            </div>
                        ) : (
                            <>
                                {/* Header */}
                                <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-[#0a0f1a] text-white">
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-[#c8ff00] text-[#0a0f1a] flex items-center justify-center text-xl font-bold shadow-lg">
                                            {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                                        </div>
                                        <div>
                                            <h2 className="text-xl font-bold">{candidate.firstName} {candidate.lastName}</h2>
                                            <p className="text-sm text-slate-400">{candidate.email}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => setShowEmailModal(true)}
                                            className="p-2 hover:bg-white/10 rounded-full transition-colors text-[#c8ff00]"
                                            title="Send Email"
                                        >
                                            <Mail className="h-5 w-5" />
                                        </button>
                                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                                            <X className="h-6 w-6" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1 overflow-y-auto p-6 space-y-8 no-scrollbar">
                                    {/* Action Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Current Stage</label>
                                            <select 
                                                value={candidate.currentStageId}
                                                onChange={(e) => handleMoveStage(e.target.value)}
                                                className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                                            >
                                                {availableStages.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 block">Assigned Recruiter</label>
                                            <select 
                                                value={candidate.assignedRecruiterId || ''}
                                                onChange={(e) => handleAssign(e.target.value)}
                                                className="w-full bg-transparent text-sm font-bold text-slate-900 focus:outline-none cursor-pointer"
                                            >
                                                <option value="">Unassigned</option>
                                                {users.map(u => (
                                                    <option key={u.id} value={u.id}>{u.firstName} {u.lastName}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Score Card */}
                                    <div className="p-6 rounded-3xl bg-[#c8ff00]/10 border border-[#c8ff00]/20 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                                            <Star className="h-20 w-20 text-[#c8ff00]" fill="currentColor" />
                                        </div>
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Star className="h-5 w-5 text-[#c8ff00]" fill="currentColor" />
                                                    <span className="text-sm font-bold text-slate-900 uppercase tracking-tight">AI Matching Score</span>
                                                </div>
                                                <button 
                                                    onClick={handleRefreshAnalysis}
                                                    className="flex items-center gap-1.5 px-3 py-1 bg-[#0a0f1a] text-[#c8ff00] rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-sm"
                                                >
                                                    <RefreshCw className="h-3 w-3" /> Refresh
                                                </button>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-black text-[#0a0f1a]">{candidate.score || 0}</span>
                                                <span className="text-sm font-bold text-slate-500">/ 100</span>
                                            </div>
                                            <p className="mt-3 text-xs text-slate-600 leading-relaxed font-medium">
                                                Based on skills alignment, experience levels, and domain expertise extracted from the resume.
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Sections */}
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                Professional Summary
                                            </h3>
                                            <div className="space-y-4">
                                                <div className="flex items-start gap-4">
                                                    <div className="w-1 bg-[#c8ff00] h-full self-stretch rounded-full" />
                                                    <p className="text-sm text-slate-600 leading-relaxed italic">
                                                        "{candidate.summary || 'No summary available.'}"
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Resume Section */}
                                        <div>
                                            <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                <FileText className="h-4 w-4 text-slate-400" />
                                                Candidate Resume
                                            </h3>
                                            {candidate.resumeUrl ? (
                                                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-10 w-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-red-500">
                                                            <FileText className="h-6 w-6" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">Resume.pdf</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase">PDF Document</p>
                                                        </div>
                                                    </div>
                                                    <a 
                                                        href={candidate.resumeUrl.startsWith('http') ? candidate.resumeUrl : `${API_ROOT}/${candidate.resumeUrl.startsWith('/') ? candidate.resumeUrl.slice(1) : candidate.resumeUrl}`} 
                                                        target="_blank" 
                                                        rel="noopener noreferrer"
                                                        className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-slate-900 hover:bg-slate-50 transition-all flex items-center gap-2"
                                                    >
                                                        <ExternalLink className="h-4 w-4" /> View Full
                                                    </a>
                                                </div>
                                            ) : (
                                                <div className="p-8 rounded-2xl border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center">
                                                    <FileText className="h-8 w-8 text-slate-200 mb-2" />
                                                    <p className="text-xs font-bold text-slate-400 uppercase">No Resume Uploaded</p>
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid grid-cols-2 gap-6">
                                            <div>
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Contact Information</h3>
                                                <div className="space-y-2">
                                                    <div className="flex items-center justify-between group/email bg-white hover:bg-slate-50 p-2 -mx-2 rounded-xl border border-transparent hover:border-slate-100 transition-all cursor-pointer" onClick={() => setShowEmailModal(true)}>
                                                        <div className="flex items-center gap-2 overflow-hidden">
                                                            <div className="p-1.5 bg-slate-100 rounded-lg group-hover/email:bg-[#c8ff00] transition-colors">
                                                                <Mail className="h-4 w-4 shrink-0 text-slate-500 group-hover/email:text-[#0a0f1a]" />
                                                            </div>
                                                            <span className="truncate font-bold text-slate-700 group-hover/email:text-[#0a0f1a]">{candidate.email}</span>
                                                        </div>
                                                        <div className="flex items-center gap-1 text-[10px] font-black text-[#c8ff00] opacity-0 group-hover/email:opacity-100 uppercase tracking-widest transition-all">
                                                            Email <Mail className="h-3.5 w-3.5" />
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Phone className="h-4 w-4" /> {candidate.phone || 'N/A'}
                                                    </div>
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">System Metadata</h3>
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Clock className="h-4 w-4" /> Added {new Date(candidate.createdAt).toLocaleDateString()}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-slate-600">
                                                        <Shield className="h-4 w-4" /> {candidate.status}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Actions */}
                                <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center gap-3">
                                    <button 
                                        onClick={() => setShowScheduler(true)}
                                        className="flex-1 bg-[#0a0f1a] text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-800 transition-all active:scale-[0.98]"
                                    >
                                        <Calendar className="h-5 w-5 text-[#c8ff00]" /> Schedule Interview
                                    </button>
                                    <button className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors">
                                        <ExternalLink className="h-6 w-6" />
                                    </button>
                                </div>
                            </>
                        )}
                    </motion.div>
                </>
            )}
            <EmailModal 
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                recipientCount={1}
                candidateName={`${candidate?.firstName} ${candidate?.lastName}`}
                onSend={async (subject, body) => {
                    await candidateApi.bulkUpdate([candidateId!], 'SEND_EMAIL', { subject, body });
                }}
            />
            {showScheduler && candidate && (
                <InterviewScheduler 
                    candidate={candidate}
                    onClose={() => setShowScheduler(false)}
                    onScheduled={() => {
                        setShowScheduler(false);
                        loadCandidate();
                        onUpdate();
                    }}
                />
            )}
        </AnimatePresence>
    );
}
