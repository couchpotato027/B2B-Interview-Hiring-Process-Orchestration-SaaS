'use client';

import React, { useState } from 'react';
import { X, Send, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientCount: number;
    onSend: (subject: string, body: string) => Promise<void>;
}

export default function EmailModal({ isOpen, onClose, recipientCount, onSend }: EmailModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await onSend(subject, body);
            toast.success(`Successfully sent emails to ${recipientCount} candidates.`);
            onClose();
        } catch (err: any) {
            toast.error(`Failed to send emails: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
                <div className="relative transform overflow-hidden rounded-2xl bg-white p-6 shadow-2xl w-full max-w-2xl transition-all">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h3 className="text-xl font-bold text-slate-900 tracking-tight">Bulk Email</h3>
                            <p className="text-sm text-slate-500 mt-1">Sending to <span className="font-bold text-[#0a0f1a]">{recipientCount}</span> selected candidates</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subject</label>
                            <input 
                                required 
                                value={subject} 
                                onChange={e => setSubject(e.target.value)}
                                placeholder="e.g., Update regarding your application at HireFlow"
                                className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 placeholder:text-slate-400" 
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email Body</label>
                            <textarea 
                                required 
                                value={body} 
                                onChange={e => setBody(e.target.value)}
                                rows={8}
                                placeholder="Type your message here..."
                                className="block w-full rounded-xl border-0 py-3 px-4 text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 focus:ring-2 focus:ring-inset focus:ring-[#c8ff00] sm:text-sm outline-none bg-slate-50 placeholder:text-slate-400 resize-none font-sans" 
                            />
                        </div>

                        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
                             <div className="text-[11px] text-slate-400 max-w-[300px]">
                                Each candidate will receive a personalized email with their respective details.
                            </div>
                            <div className="flex gap-3">
                                <button type="button" onClick={onClose} className="rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSending}
                                    className="flex items-center gap-2 rounded-full bg-[#0a0f1a] px-8 py-2.5 text-sm font-bold text-white shadow-lg hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-[#c8ff00]" />}
                                    Send to {recipientCount} Candidates
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
