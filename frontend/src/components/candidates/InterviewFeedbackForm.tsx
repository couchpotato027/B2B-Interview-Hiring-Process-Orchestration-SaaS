'use client';

import React, { useState } from 'react';
import { X, Star, ThumbsUp, ThumbsDown, MessageSquare, ShieldCheck, AlertCircle, Save } from 'lucide-react';
import { interviewApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
    interview: any;
    onClose: () => void;
    onSubmitted?: () => void;
}

export function InterviewFeedbackForm({ interview, onClose, onSubmitted }: Props) {
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState({
        rating: 4,
        recommendation: 'hire' as const,
        notes: '',
        strengths: [] as string[],
        weaknesses: [] as string[]
    });

    const [newStrength, setNewStrength] = useState('');
    const [newWeakness, setNewWeakness] = useState('');

    const handleAddStrength = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newStrength.trim()) {
            setFeedback({ ...feedback, strengths: [...feedback.strengths, newStrength.trim()] });
            setNewStrength('');
        }
    };

    const handleAddWeakness = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && newWeakness.trim()) {
            setFeedback({ ...feedback, weaknesses: [...feedback.weaknesses, newWeakness.trim()] });
            setNewWeakness('');
        }
    };

    const handleRemove = (type: 'strengths' | 'weaknesses', index: number) => {
        const list = [...feedback[type]];
        list.splice(index, 1);
        setFeedback({ ...feedback, [type]: list });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!feedback.notes) {
            toast.error('Detailed notes are required');
            return;
        }

        setLoading(true);
        try {
            await interviewApi.submitFeedback(interview.id, feedback);
            toast.success('Feedback submitted!');
            onSubmitted?.();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Submission failed');
        } finally {
            setLoading(false);
        }
    };

    const recommendations = [
        { id: 'strong_hire', label: 'Strong Hire', color: 'bg-emerald-500' },
        { id: 'hire', label: 'Hire', color: 'bg-emerald-400' },
        { id: 'maybe', label: 'Maybe', color: 'bg-amber-400' },
        { id: 'no_hire', label: 'No Hire', color: 'bg-red-400' },
        { id: 'strong_no_hire', label: 'Strong No Hire', color: 'bg-red-600' }
    ];

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-3xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#0a0f1a] flex items-center justify-center">
                            <ShieldCheck className="h-6 w-6 text-[#c8ff00]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Interview Feedback</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Round: {interview.title || 'Technical Interview'}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm text-slate-400 hover:text-slate-900">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Overall Sentiment */}
                    <div className="space-y-6">
                        <label className="text-xs font-black text-slate-900 uppercase tracking-widest block text-center">OVERALL RECOMMENDATION</label>
                        <div className="flex flex-wrap justify-center gap-3">
                            {recommendations.map(r => (
                                <button
                                    key={r.id}
                                    type="button"
                                    onClick={() => setFeedback({...feedback, recommendation: r.id as any})}
                                    className={`px-6 py-3 rounded-2xl text-xs font-black transition-all ${feedback.recommendation === r.id ? `${r.color} text-white shadow-lg scale-105 ring-4 ring-offset-2 ring-slate-100` : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
                                >
                                    {r.label.toUpperCase()}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-center items-center gap-2 pt-4">
                            {[1, 2, 3, 4, 5].map(s => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => setFeedback({...feedback, rating: s})}
                                    className="p-1 hover:scale-125 transition-transform"
                                >
                                    <Star className={`h-10 w-10 ${s <= feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        {/* Strengths */}
                        <div className="space-y-4">
                             <div className="flex items-center gap-2">
                                <ThumbsUp className="h-4 w-4 text-emerald-500" />
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Key Strengths</label>
                             </div>
                             <div className="space-y-2">
                                <input 
                                    placeholder="Add strength and press Enter..."
                                    value={newStrength}
                                    onChange={e => setNewStrength(e.target.value)}
                                    onKeyDown={handleAddStrength}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none"
                                />
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {feedback.strengths.map((s, i) => (
                                        <span key={i} className="flex items-center gap-2 px-3 py-2 bg-emerald-50 text-emerald-700 text-[10px] font-black rounded-xl uppercase">
                                            {s} <X onClick={() => handleRemove('strengths', i)} className="h-3 w-3 cursor-pointer" />
                                        </span>
                                    ))}
                                </div>
                             </div>
                        </div>

                        {/* Weaknesses */}
                        <div className="space-y-4">
                             <div className="flex items-center gap-2">
                                <ThumbsDown className="h-4 w-4 text-red-500" />
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gaps / Concerns</label>
                             </div>
                             <div className="space-y-2">
                                <input 
                                    placeholder="Add weakness and press Enter..."
                                    value={newWeakness}
                                    onChange={e => setNewWeakness(e.target.value)}
                                    onKeyDown={handleAddWeakness}
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none"
                                />
                                <div className="flex flex-wrap gap-2 pt-2">
                                    {feedback.weaknesses.map((w, i) => (
                                        <span key={i} className="flex items-center gap-2 px-3 py-2 bg-red-50 text-red-700 text-[10px] font-black rounded-xl uppercase">
                                            {w} <X onClick={() => handleRemove('weaknesses', i)} className="h-3 w-3 cursor-pointer" />
                                        </span>
                                    ))}
                                </div>
                             </div>
                        </div>
                    </div>

                    {/* Detailed Notes */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <MessageSquare className="h-4 w-4 text-blue-500" />
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Detailed Assessment Notes</label>
                        </div>
                        <textarea 
                            rows={6}
                            required
                            value={feedback.notes}
                            onChange={e => setFeedback({...feedback, notes: e.target.value})}
                            className="w-full p-6 bg-slate-50 border border-slate-100 rounded-[2rem] text-sm font-bold focus:ring-4 focus:ring-[#c8ff00]/20 outline-none transition-all resize-none leading-relaxed"
                            placeholder="Provide detailed context for your recommendation. What specific examples did the candidate provide? How did they perform on technical tasks?"
                        />
                    </div>

                    <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-amber-900 uppercase">System Visibility</p>
                            <p className="text-xs text-amber-700 mt-1 font-medium italic">This feedback will be shared with the hiring team during the decision meeting. It will not be shared with the candidate.</p>
                        </div>
                    </div>
                </form>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all shadow-sm">
                        DISCARD
                    </button>
                    <button 
                        onClick={handleSubmit}
                        disabled={loading}
                        className="flex-[1.5] py-4 px-6 bg-[#0a0f1a] text-[#c8ff00] rounded-3xl text-sm font-black disabled:opacity-50 hover:shadow-2xl transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                        {loading ? 'SUBMITTING...' : (
                            <><Save className="h-4 w-4" /> SUBMIT FINAL FEEDBACK</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
