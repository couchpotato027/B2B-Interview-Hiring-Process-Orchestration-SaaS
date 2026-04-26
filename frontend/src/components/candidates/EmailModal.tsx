'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Loader2, ChevronDown, Info } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface EmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    recipientCount: number;
    onSend: (subject: string, body: string) => Promise<void>;
    candidateName?: string; // Optional: for single candidate context
}

const TEMPLATES = [
    {
        id: 'app_received',
        name: 'Application Received',
        subject: 'We received your application!',
        body: 'Hi {{candidateName}},\n\nThank you for applying for the position. We have received your application and our team is currently reviewing it.\n\nWe will get back to you within 3-5 business days.\n\nBest regards,\nThe Hiring Team'
    },
    {
        id: 'interview_invite',
        name: 'Interview Invitation',
        subject: 'Invitation to Interview',
        body: 'Hi {{candidateName}},\n\nWe would like to invite you for an interview. We are excited to learn more about your experience and tell you more about the role.\n\nPlease let us know your availability for a call next week.\n\nBest regards,\nThe Hiring Team'
    },
    {
        id: 'rejection',
        name: 'Application Update',
        subject: 'Regarding your application',
        body: 'Hi {{candidateName}},\n\nThank you for your interest in the position. After careful consideration, we have decided to move forward with other candidates at this time.\n\nWe appreciate the time you took to apply and wish you the best in your job search.\n\nBest regards,\nThe Hiring Team'
    }
];

export default function EmailModal({ isOpen, onClose, recipientCount, onSend, candidateName }: EmailModalProps) {
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setSubject('');
            setBody('');
            setSelectedTemplateId('');
        }
    }, [isOpen]);

    const handleTemplateChange = (templateId: string) => {
        setSelectedTemplateId(templateId);
        const template = TEMPLATES.find(t => t.id === templateId);
        if (template) {
            let processedBody = template.body;
            if (candidateName) {
                processedBody = processedBody.replace(/\{\{candidateName\}\}/g, candidateName);
            }
            setSubject(template.subject);
            setBody(processedBody);
        }
    };

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSending(true);
        try {
            await onSend(subject, body);
            toast.success(`Successfully sent email(s).`);
            onClose();
        } catch (err: any) {
            toast.error(`Failed to send: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-2 sm:p-4">
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />
                <div className="relative transform overflow-hidden rounded-3xl bg-white p-4 sm:p-8 shadow-2xl w-full max-w-2xl transition-all border border-slate-100">
                    <div className="flex items-center justify-between mb-6 sm:mb-8">
                        <div>
                            <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                                {recipientCount > 1 ? 'Bulk Email' : 'Send Email'}
                            </h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Sending to <span className="font-bold text-[#0a0f1a]">{recipientCount}</span> {recipientCount > 1 ? 'selected candidates' : 'candidate'}
                            </p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-slate-600 bg-slate-50 p-2.5 rounded-full transition-colors border border-slate-100">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Template Selector */}
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Quick Templates</label>
                            <div className="relative group">
                                <select
                                    value={selectedTemplateId}
                                    onChange={(e) => handleTemplateChange(e.target.value)}
                                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold text-slate-900 appearance-none focus:border-[#c8ff00] focus:bg-white outline-none transition-all group-hover:border-slate-200"
                                >
                                    <option value="">Select a template...</option>
                                    {TEMPLATES.map(t => (
                                        <option key={t.id} value={t.id}>{t.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Subject</label>
                            <input 
                                required 
                                value={subject} 
                                onChange={e => setSubject(e.target.value)}
                                placeholder="e.g., Update regarding your application at HireFlow"
                                className="block w-full rounded-xl border-2 border-slate-100 py-3 px-4 text-slate-900 shadow-sm focus:border-[#c8ff00] sm:text-sm outline-none bg-slate-50 placeholder:text-slate-400 font-bold transition-all" 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-1">Email Body</label>
                            <textarea 
                                required 
                                value={body} 
                                onChange={e => setBody(e.target.value)}
                                rows={8}
                                placeholder="Type your message here..."
                                className="block w-full rounded-xl border-2 border-slate-100 py-3 px-4 text-slate-900 shadow-sm focus:border-[#c8ff00] sm:text-sm outline-none bg-slate-50 placeholder:text-slate-400 resize-none font-medium leading-relaxed transition-all" 
                            />
                        </div>

                        <div className="flex flex-col sm:flex-row items-center justify-between pt-6 sm:pt-8 border-t border-slate-100 gap-4">
                            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-100">
                                <Info className="h-3.5 w-3.5 text-[#c8ff00]" />
                                <span>Use <code className="text-[#0a0f1a] font-black">{"{{candidateName}}"}</code> for personalization.</span>
                            </div>
                            <div className="flex w-full sm:w-auto gap-3">
                                <button type="button" onClick={onClose} className="flex-1 sm:flex-none rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-700 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 transition-colors">
                                    Cancel
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={isSending}
                                    className="flex-1 sm:flex-none flex items-center justify-center gap-2 rounded-full bg-[#0a0f1a] px-8 py-3 text-sm font-black text-white shadow-lg hover:bg-slate-800 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4 text-[#c8ff00]" />}
                                    <span className="whitespace-nowrap">Send {recipientCount > 1 ? `to ${recipientCount}` : ''}</span>
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
