'use client';

import React, { useState, useEffect } from 'react';
import { X, Send, Eye, FileText, ChevronDown, Check, AlertCircle, Info, RefreshCw } from 'lucide-react';
import { emailApi } from '@/lib/api';

interface EmailComposerModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    jobTitle?: string;
  };
  onSent?: () => void;
}

export function EmailComposerModal({ isOpen, onClose, candidate, onSent }: EmailComposerModalProps) {
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [to, setTo] = useState(candidate?.email || '');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
      if (candidate) setTo(candidate.email);
    }
  }, [isOpen, candidate]);

  const loadTemplates = async () => {
    try {
      const data = await emailApi.getTemplates();
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates');
    }
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setSubject(replaceVariables(template.subject));
      // In a real app, you'd fetch the full body content for the template
      setBody(getTemplateBody(templateId));
    }
  };

  const replaceVariables = (text: string) => {
    if (!candidate) return text;
    return text
      .replace(/\{\{candidateName\}\}/g, `${candidate.firstName} ${candidate.lastName}`)
      .replace(/\{\{jobTitle\}\}/g, candidate.jobTitle || 'our open position')
      .replace(/\{\{companyName\}\}/g, 'HireFlow');
  };

  const getTemplateBody = (id: string) => {
    const vars = {
      name: candidate ? `${candidate.firstName} ${candidate.lastName}` : 'Candidate',
      job: candidate?.jobTitle || 'the position',
      company: 'HireFlow'
    };

    switch (id) {
      case 'app_received':
        return `Hi ${vars.name},\n\nThank you for applying for the ${vars.job} position at ${vars.company}. We have received your application and our team is currently reviewing it.\n\nWe will get back to you within 3-5 business days.\n\nBest regards,\nThe ${vars.company} Team`;
      case 'stage_moved':
        return `Hi ${vars.name},\n\nGreat news! Your application for the ${vars.job} position has been moved to the next stage of our hiring process.\n\nPlease stay tuned for further instructions regarding the next steps.\n\nBest regards,\nThe ${vars.company} Team`;
      case 'interview_invitation':
        return `Hi ${vars.name},\n\nWe would like to invite you for an interview for the ${vars.job} position. We are excited to learn more about your experience and tell you more about the role.\n\nPlease let us know your availability for a 45-minute call next week.\n\nBest regards,\nThe ${vars.company} Team`;
      case 'rejection':
        return `Hi ${vars.name},\n\nThank you for your interest in the ${vars.job} position at ${vars.company}. After careful consideration, we have decided to move forward with other candidates at this time.\n\nWe appreciate the time you took to apply and wish you the best in your job search.\n\nBest regards,\nThe ${vars.company} Team`;
      default:
        return '';
    }
  };

  const handleSend = async () => {
    if (!to || !subject || !body) {
      setError('Please fill in all fields');
      return;
    }

    setSending(true);
    setError('');
    try {
      await emailApi.send({
        to,
        subject,
        body: body.replace(/\n/g, '<br>'), // Simple HTML conversion
        candidateId: candidate?.id
      });
      if (onSent) onSent();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to send email');
    } finally {
      setSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="bg-[#0a0f1a] px-8 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-[#c8ff00] flex items-center justify-center">
              <Send className="h-5 w-5 text-slate-900" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Compose Message</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Powered by Resend Engine</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-white transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="flex flex-col h-[600px]">
          {/* Main Form Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                <AlertCircle className="h-5 w-5" /> {error}
              </div>
            )}

            {/* Template Selector */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Choose Template</label>
              <div className="relative group">
                <select
                  value={selectedTemplateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 appearance-none focus:border-[#c8ff00] focus:bg-white outline-none transition-all group-hover:border-slate-200"
                >
                  <option value="">Select a template...</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 pointer-events-none" />
              </div>
            </div>

            {/* Recipients */}
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">To</label>
                 <input 
                   value={to}
                   onChange={e => setTo(e.target.value)}
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:border-[#c8ff00] focus:bg-white outline-none transition-all"
                   placeholder="recipient@email.com"
                 />
               </div>
               <div className="space-y-2">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Cc</label>
                 <input 
                   disabled
                   className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-300 cursor-not-allowed"
                   placeholder="Optional"
                 />
               </div>
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Subject Line</label>
              <input 
                value={subject}
                onChange={e => setSubject(e.target.value)}
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm font-bold text-slate-900 focus:border-[#c8ff00] focus:bg-white outline-none transition-all"
                placeholder="Message Subject"
              />
            </div>

            {/* Body */}
            <div className="space-y-2 relative">
              <div className="flex items-center justify-between px-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Message Body</label>
                <div className="flex gap-2">
                  <button 
                   onClick={() => setPreviewMode(!previewMode)}
                   className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${previewMode ? 'bg-[#c8ff00] text-slate-900' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                  >
                    {previewMode ? <Eye className="h-3 w-3" /> : <RefreshCw className="h-3 w-3" />}
                    {previewMode ? 'Editing' : 'Preview'}
                  </button>
                </div>
              </div>
              
              {previewMode ? (
                <div className="w-full min-h-[200px] bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm text-slate-700 whitespace-pre-wrap font-medium leading-relaxed">
                  {replaceVariables(body)}
                </div>
              ) : (
                <textarea 
                  value={body}
                  onChange={e => setBody(e.target.value)}
                  className="w-full min-h-[200px] bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-6 text-sm font-bold text-slate-900 focus:border-[#c8ff00] focus:bg-white outline-none transition-all resize-none"
                  placeholder="Type your message here..."
                />
              )}

              {/* Variables Helper */}
              <div className="flex flex-wrap gap-2 mt-4">
                {['{{candidateName}}', '{{jobTitle}}', '{{companyName}}'].map(v => (
                  <button 
                    key={v}
                    onClick={() => setBody(prev => prev + v)}
                    className="px-2.5 py-1 bg-slate-100 text-[10px] font-mono text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-8 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
               <div className="flex items-center gap-1.5">
                 <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
                 Queue Status: Ready
               </div>
               <div className="flex items-center gap-1.5">
                 <Check className="h-4 w-4 text-[#c8ff00]" /> High Priority
               </div>
            </div>
            
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="px-6 py-3.5 rounded-2xl text-xs font-black text-slate-500 hover:text-slate-900 transition-colors"
              >
                DISCARD
              </button>
              <button 
                onClick={handleSend}
                disabled={sending}
                className="px-8 py-3.5 bg-slate-900 text-[#c8ff00] rounded-2xl text-xs font-black hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-3 disabled:opacity-50 disabled:translate-y-0"
              >
                {sending ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                {sending ? 'SENDING...' : 'SEND MESSAGE'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
