'use client';

import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, Video, MapPin, Phone, Users, Check, AlertCircle, Plus, Trash2 } from 'lucide-react';
import { interviewApi, authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface Props {
    candidate: any;
    onClose: () => void;
    onScheduled?: () => void;
}

export function InterviewScheduler({ candidate, onClose, onScheduled }: Props) {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [panel, setPanel] = useState<any[]>([{ userId: '', role: 'lead' }]);
    const [form, setForm] = useState({
        title: 'Technical Assessment',
        type: 'video' as const,
        stageId: candidate.currentStageId || '',
        date: '',
        time: '',
        duration: 60,
        notes: ''
    });

    useEffect(() => {
        authApi.listUsers().then(setUsers).catch(console.error);
    }, []);

    const addPanelMember = () => {
        setPanel([...panel, { userId: '', role: 'shadow' }]);
    };

    const removePanelMember = (index: number) => {
        if (panel.length === 1) return;
        setPanel(panel.filter((_, i) => i !== index));
    };

    const updatePanelMember = (index: number, userId: string, role: string) => {
        const newPanel = [...panel];
        newPanel[index] = { userId, role };
        setPanel(newPanel);
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validation
        if (!form.date || !form.time) {
            toast.error('Please select date and time');
            return;
        }

        if (panel.some(p => !p.userId)) {
            toast.error('Please select all interviewers');
            return;
        }

        setLoading(true);
        try {
            const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
            await interviewApi.schedule({
                candidateId: candidate.id,
                stageId: form.stageId,
                title: form.title,
                type: form.type,
                scheduledAt,
                duration: form.duration,
                notes: form.notes,
                panel: panel
            });

            toast.success('Interview scheduled successfully!');
            onScheduled?.();
            onClose();
        } catch (err: any) {
            toast.error(err.message || 'Scheduling failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-[#0a0f1a] flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-[#c8ff00]" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Schedule Interview</h2>
                            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Candidate: {candidate.firstName} {candidate.lastName}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm text-slate-400 hover:text-slate-900">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSchedule} className="flex-1 overflow-y-auto p-8 space-y-8">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Interview Title</label>
                            <input 
                                required
                                value={form.title}
                                onChange={e => setForm({...form, title: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none transition-all"
                                placeholder="e.g. Technical System Design"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'phone', icon: Phone, label: 'Phone' },
                                    { id: 'video', icon: Video, label: 'Video' },
                                    { id: 'onsite', icon: MapPin, label: 'On-site' },
                                    { id: 'technical', icon: Clock, label: 'Technical' }
                                ].map(t => (
                                    <button
                                        key={t.id}
                                        type="button"
                                        onClick={() => setForm({...form, type: t.id as any})}
                                        className={`flex items-center gap-2 p-3 rounded-xl border text-xs font-black transition-all ${form.type === t.id ? 'bg-[#0a0f1a] text-[#c8ff00] border-[#0a0f1a]' : 'bg-white border-slate-100 text-slate-600 hover:border-slate-300'}`}
                                    >
                                        <t.icon className="h-4 w-4" /> {t.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                            <input 
                                type="date"
                                required
                                value={form.date}
                                onChange={e => setForm({...form, date: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Start Time</label>
                            <input 
                                type="time"
                                required
                                value={form.time}
                                onChange={e => setForm({...form, time: e.target.value})}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Duration</label>
                            <select 
                                value={form.duration}
                                onChange={e => setForm({...form, duration: Number(e.target.value)})}
                                className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none transition-all cursor-pointer"
                            >
                                <option value={30}>30 mins</option>
                                <option value={60}>1 hour</option>
                                <option value={90}>1.5 hours</option>
                                <option value={120}>2 hours</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Users className="h-4 w-4" /> Interview Panel
                            </label>
                            <button 
                                type="button" 
                                onClick={addPanelMember}
                                className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase"
                            >
                                + Add Interviewer
                            </button>
                        </div>
                        <div className="space-y-3">
                            {panel.map((member, i) => (
                                <div key={i} className="flex gap-3 group animate-in slide-in-from-left-2 duration-300">
                                    <div className="flex-1">
                                        <select 
                                            required
                                            value={member.userId}
                                            onChange={e => updatePanelMember(i, e.target.value, member.role)}
                                            className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none transition-all cursor-pointer"
                                        >
                                            <option value="">Select Interviewer...</option>
                                            {users.map(u => (
                                                <option key={u.id} value={u.id}>{u.firstName} {u.lastName} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-40">
                                        <select 
                                            value={member.role}
                                            onChange={e => updatePanelMember(i, member.userId, e.target.value as any)}
                                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-[10px] font-black uppercase focus:ring-2 focus:ring-[#c8ff00] outline-none transition-all cursor-pointer"
                                        >
                                            <option value="lead">Lead</option>
                                            <option value="shadow">Shadow</option>
                                            <option value="observer">Observer</option>
                                        </select>
                                    </div>
                                    <button 
                                        type="button" 
                                        disabled={panel.length === 1}
                                        onClick={() => removePanelMember(i)}
                                        className="p-4 text-red-300 hover:text-red-500 transition-colors disabled:opacity-0"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Internal Notes / Agenda</label>
                        <textarea 
                            rows={3}
                            value={form.notes}
                            onChange={e => setForm({...form, notes: e.target.value})}
                            className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-[#c8ff00] outline-none transition-all resize-none"
                            placeholder="Points to cover, shared rubric, etc..."
                        />
                    </div>
                    
                    <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div>
                            <p className="text-xs font-black text-blue-900 uppercase">Calendar Sync Active</p>
                            <p className="text-xs text-blue-700 mt-1 font-medium italic">Confirmed interview will automatically create calendar events and send invites to all participants.</p>
                        </div>
                    </div>
                </form>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0">
                    <button type="button" onClick={onClose} className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all">
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSchedule}
                        disabled={loading}
                        className="flex-[1.5] py-4 px-6 bg-[#0a0f1a] text-[#c8ff00] rounded-3xl text-sm font-black disabled:opacity-50 hover:shadow-2xl transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                        {loading ? 'SCHEDULING...' : (
                            <><Check className="h-4 w-4" /> CONFIRM & SEND INVITES</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
