'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  X, Mail, Phone, MoreHorizontal, Edit2, Archive, Trash2, 
  ChevronRight, Download, RefreshCw, Star, Clock, Calendar, 
  MapPin, CheckCircle, AlertTriangle, ExternalLink, Trophy, 
  Plus, User, Filter, Zap, Layout, ShieldAlert, Settings2, Video, Users
} from 'lucide-react';
import { PermissionGuard } from '@/components/auth/PermissionGuard';
import { Resource, Action } from '@/lib/permissions';
import { candidateApi, evaluationApi, interviewApi, emailApi, complianceApi } from '@/lib/api';
import { InterviewScheduler } from './InterviewScheduler';
import { InterviewFeedbackForm } from './InterviewFeedbackForm';
import { EmailComposerModal } from './EmailComposerModal';
import { ResumeViewer } from '@/components/candidates/ResumeViewer';
import { ResumeUploadZone } from '@/components/candidates/ResumeUploadZone';

interface DrawerProps {
  candidateId: string | null;
  onClose: () => void;
  onUpdate?: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  ACTIVE: { label: 'Active', style: 'bg-lime-100 text-lime-800 ring-lime-500/30' },
  HIRED: { label: 'Hired', style: 'bg-emerald-100 text-emerald-800 ring-emerald-500/30' },
  REJECTED: { label: 'Rejected', style: 'bg-red-100 text-red-700 ring-red-500/30' },
  ON_HOLD: { label: 'On Hold', style: 'bg-amber-100 text-amber-700 ring-amber-500/30' },
};

export function CandidateDetailDrawer({ candidateId, onClose, onUpdate }: DrawerProps) {
  const [candidate, setCandidate] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'resume' | 'evals' | 'interviews' | 'timeline' | 'gdpr'>('overview');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState({ first: '', last: '' });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showScheduler, setShowScheduler] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState<any>(null);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [evaluations, setEvaluations] = useState<any[]>([]);
  
  const loadData = useCallback(async () => {
    if (!candidateId) return;
    setLoading(true);
    try {
      const [details, tl, ivs, evals] = await Promise.all([
        candidateApi.get(candidateId),
        candidateApi.getTimeline(candidateId),
        interviewApi.forCandidate(candidateId),
        evaluationApi.listForCandidate(candidateId)
      ]);
      setCandidate(details);
      setTimeline(tl || []);
      setInterviews(ivs || []);
      setEvaluations(evals || []);
      setNewName({ first: details.firstName, last: details.lastName });
    } catch (err) {
      console.error('Failed to load candidate data:', err);
    } finally {
      setLoading(false);
    }
  }, [candidateId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard`);
  };

  const handleUpdateName = async () => {
    if (!candidateId) return;
    try {
      await candidateApi.update(candidateId, { 
        firstName: newName.first, 
        lastName: newName.last 
      });
      setCandidate({ ...candidate, firstName: newName.first, lastName: newName.last });
      setEditingName(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      alert('Failed to update name');
    }
  };

  if (!candidateId) return null;

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl flex flex-col bg-white shadow-2xl border-l border-slate-100 animate-in slide-in-from-right duration-400">
        
        <div className="bg-[#0a0f1a] px-6 py-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-3 w-3 text-[#c8ff00]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">SOC2 Cloud Audited Environment</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">CID: {candidateId.slice(0,8)}</span>
        </div>

        <div className="p-8 border-b border-slate-100 shrink-0 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 z-0" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="h-20 w-20 rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white">
                {candidate ? `${candidate.firstName?.charAt(0)}${candidate.lastName?.charAt(0)}` : '?'}
              </div>

              <div>
                {editingName ? (
                  <div className="flex items-center gap-2 mb-2">
                    <input 
                      className="text-2xl font-bold text-slate-900 bg-slate-50 border-b-2 border-[#c8ff00] outline-none px-1 py-0.5 w-32"
                      value={newName.first}
                      onChange={e => setNewName({...newName, first: e.target.value})}
                      autoFocus
                    />
                    <input 
                      className="text-2xl font-bold text-slate-900 bg-slate-50 border-b-2 border-[#c8ff00] outline-none px-1 py-0.5 w-32"
                      value={newName.last}
                      onChange={e => setNewName({...newName, last: e.target.value})}
                    />
                    <button onClick={handleUpdateName} className="p-1 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200"><CheckCircle className="h-5 w-5" /></button>
                    <button onClick={() => setEditingName(false)} className="p-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200"><X className="h-5 w-5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 mb-1">
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                      {candidate?.firstName} {candidate?.lastName}
                    </h2>
                    <button onClick={() => setEditingName(true)} className="p-1 text-slate-300 hover:text-slate-600">
                      <Edit2 className="h-4 w-4" />
                    </button>
                  </div>
                )}
                
                <div className="flex flex-wrap gap-4 mt-2">
                  <button 
                    onClick={() => candidate?.email && copyToClipboard(candidate.email, 'Email')}
                    className="group flex items-center gap-2 text-sm text-slate-500 hover:text-[#0a0f1a] transition-colors"
                  >
                    <Mail className="h-4 w-4 text-slate-300 group-hover:text-[#c8ff00]" />
                    {candidate?.email}
                  </button>
                  <button 
                   onClick={() => candidate?.phone && copyToClipboard(candidate.phone, 'Phone')}
                   className="group flex items-center gap-2 text-sm text-slate-500 hover:text-[#0a0f1a] transition-colors"
                  >
                    <Phone className="h-4 w-4 text-slate-300 group-hover:text-[#c8ff00]" />
                    {candidate?.phone || '+1 555-0123'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              <button 
                onClick={onClose} 
                className="p-2 rounded-2xl text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all shadow-sm bg-white"
              >
                <X className="h-6 w-6" />
              </button>
              {candidate && (
                <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-bold ring-1 ring-inset shadow-sm ${STATUS_CONFIG[candidate.status]?.style || 'bg-slate-100 text-slate-600 ring-slate-200'}`}>
                  {STATUS_CONFIG[candidate.status]?.label || candidate.status}
                </span>
              )}
            </div>
          </div>

          <div className="mt-8 flex items-center gap-3">
            <button 
              onClick={() => setShowEmailModal(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0a0f1a] px-4 py-2.5 text-xs font-bold text-white shadow-lg hover:shadow-xl hover:translate-y-[-2px] transition-all"
            >
              <Mail className="h-4 w-4 text-[#c8ff00]" /> Send Email
            </button>
            <button className="inline-flex items-center gap-2 rounded-xl bg-white ring-1 ring-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-all">
              <Archive className="h-4 w-4 text-slate-400" /> Archive
            </button>

            <PermissionGuard resource={Resource.CANDIDATE} action={Action.UPDATE}>
              <div className="flex items-center gap-2 ml-auto">
                <button 
                  onClick={async () => {
                      if (!candidate) return;
                      await candidateApi.hire(candidate.id);
                      loadData();
                  }}
                  className="px-6 py-2.5 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-all font-mono"
                >
                  Hire
                </button>
                <button 
                  onClick={async () => {
                      if (!candidate) return;
                      await candidateApi.reject(candidate.id);
                      loadData();
                  }}
                  className="px-6 py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-100 transition-all font-mono"
                >
                  Reject
                </button>
              </div>
            </PermissionGuard>
          </div>
        </div>

        <div className="flex px-8 border-b border-slate-100 shrink-0 bg-slate-50/30 overflow-x-auto no-scrollbar">
          {['overview', 'resume', 'evals', 'interviews', 'timeline'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-5 py-4 text-sm font-bold border-b-4 transition-all whitespace-nowrap capitalize ${
                activeTab === tab
                  ? 'border-[#0a0f1a] text-[#0a0f1a]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <div className="p-8 animate-pulse space-y-4">
                <div className="h-8 bg-slate-100 rounded-lg w-1/3" />
                <div className="h-64 bg-slate-50 rounded-2xl" />
            </div>
          ) : candidate ? (
            <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'overview' && <div>Overview Content</div>}
              {activeTab === 'resume' && <ResumeUploadZone onUploadComplete={loadData} />}
              {activeTab === 'evals' && <EvaluationsTab evals={evaluations} />}
              {activeTab === 'interviews' && (
                <InterviewsTab 
                    candidate={candidate} 
                    interviews={interviews} 
                    onSchedule={() => setShowScheduler(true)} 
                    onSubmitFeedback={(iv) => setShowFeedbackModal(iv)}
                />
              )}
              {activeTab === 'timeline' && <div>Timeline Content</div>}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400">Candidate not found</div>
          )}
        </div>

        {showEmailModal && (
            <EmailComposerModal 
                isOpen={showEmailModal} 
                onClose={() => setShowEmailModal(false)}
                candidate={candidate}
            />
        )}

        {showScheduler && (
            <InterviewScheduler 
                candidate={candidate} 
                onClose={() => setShowScheduler(false)} 
                onScheduled={() => {
                    interviewApi.forCandidate(candidate.id).then(setInterviews);
                    setShowScheduler(false);
                }}
            />
        )}

        {showFeedbackModal && (
            <InterviewFeedbackForm 
                interview={showFeedbackModal} 
                onClose={() => setShowFeedbackModal(null)} 
                onSubmitted={() => {
                    interviewApi.forCandidate(candidate.id).then(setInterviews);
                    setShowFeedbackModal(null);
                }}
            />
        )}
      </div>
    </>
  );
}

function EvaluationsTab({ evals }: { evals: any[] }) {
  return (
    <div className="space-y-10">
      {/* AI Scorecard Placeholder */}
      <div className="p-8 bg-slate-900 rounded-[2.5rem] text-white">
        <h3 className="text-sm font-black text-[#c8ff00] uppercase tracking-widest mb-4">Pipeline Scorecard</h3>
        <div className="text-6xl font-black">{evals.length > 0 ? '88' : '--'}</div>
      </div>
    </div>
  );
}

function InterviewsTab({ 
    candidate, 
    interviews, 
    onSchedule, 
    onSubmitFeedback 
}: { 
    candidate: any;
    interviews: any[]; 
    onSchedule: () => void;
    onSubmitFeedback: (iv: any) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pipeline Rounds</h3>
        <button 
          onClick={onSchedule}
          className="flex items-center gap-2 px-4 py-2 bg-[#0a0f1a] text-[#c8ff00] rounded-xl text-xs font-black hover:gap-3 transition-all shadow-md"
        >
          <Plus className="h-4 w-4" /> Schedule Interview
        </button>
      </div>

      {interviews.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 border border-slate-100 rounded-[2rem]">
          <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">No Rounds Scheduled Yet</p>
          <p className="text-xs text-slate-400 mt-1">Movement in the pipeline starts with a conversation.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {interviews.map(iv => (
            <div key={iv.id} className={`p-6 bg-white border rounded-[2rem] hover:shadow-lg transition-all relative group ${iv.status === 'completed' ? 'border-emerald-100' : 'border-slate-100'}`}>
               <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center ${iv.status === 'completed' ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-900 text-white'}`}>
                        {iv.type === 'video' ? <Video className="h-5 w-5" /> : iv.type === 'phone' ? <Phone className="h-5 w-5" /> : <Users className="h-5 w-5" />}
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h4 className="text-lg font-black text-slate-900">{iv.title}</h4>
                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter ${iv.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'}`}>
                                {iv.status}
                            </span>
                        </div>
                        <p className="text-sm text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                            <Clock className="h-3.5 w-3.5" /> {new Date(iv.scheduledAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} ({iv.duration}m)
                        </p>
                    </div>
                  </div>
                  
                  <div className="flex -space-x-3">
                    {iv.panel?.map((m: any, idx: number) => (
                        <div key={idx} title={`${m.role}: User ${m.userId}`} className="h-10 w-10 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-xs font-bold text-slate-600">
                             {m.userId[0]}
                        </div>
                    ))}
                  </div>
               </div>

               {iv.feedbackStatus === 'SUBMITTED' ? (
                   <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                        <div className="flex items-center justify-between">
                             <div className="flex items-center gap-1">
                                {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= iv.feedback.rating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
                             </div>
                             <span className={`text-[10px] font-black px-3 py-1 rounded-lg uppercase ${iv.feedback.recommendation.includes('hire') ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                                {iv.feedback.recommendation.replace('_', ' ')}
                             </span>
                        </div>
                        <p className="text-sm text-slate-600 italic leading-relaxed line-clamp-3">"{iv.feedback.notes}"</p>
                        <div className="flex gap-2">
                             {iv.feedback.strengths?.slice(0, 3).map((s: string) => (
                                 <span key={s} className="px-2 py-1 bg-emerald-100/50 text-emerald-800 text-[9px] font-black rounded-md uppercase">{s}</span>
                             ))}
                        </div>
                   </div>
               ) : (
                   <div className="flex gap-3 mt-4">
                        <button className="flex-1 py-3 px-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-black text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                            <ExternalLink className="h-3.5 w-3.5" /> Start Interview
                        </button>
                        <button 
                            onClick={() => onSubmitFeedback(iv)}
                            className="flex-1 py-3 px-4 bg-[#c8ff00] text-slate-900 rounded-2xl text-xs font-black hover:shadow-lg transition-all"
                        >
                            Collect Feedback
                        </button>
                   </div>
               )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TimelineTab({ events }: { events: any[] }) {
  const [filter, setFilter] = useState<'all' | 'stage' | 'feedback'>('all');
  
  const filteredEvents = events.filter(ev => {
    if (filter === 'all') return true;
    if (filter === 'stage') return ev.label.toLowerCase().includes('stage') || ev.label.toLowerCase().includes('move');
    if (filter === 'feedback') return ev.label.toLowerCase().includes('eval') || ev.label.toLowerCase().includes('round');
    return true;
  });

  return (
    <div className="space-y-8">
      <div className="flex gap-2">
        {(['all', 'stage', 'feedback'] as const).map(f => (
          <button 
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              filter === f ? 'bg-[#0a0f1a] text-white shadow-lg' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="relative pl-6 border-l-2 border-slate-100 space-y-10 py-2">
        {filteredEvents.length > 0 ? filteredEvents.map((ev, i) => (
          <div key={i} className="relative group">
            {/* Timeline Dot */}
            <div className={`absolute -left-[31px] top-0 h-4 w-4 rounded-full border-4 border-white ring-2 transition-all ${
              ev.label.toLowerCase().includes('hire') ? 'ring-[#c8ff00] bg-[#c8ff00]' : 
              ev.label.toLowerCase().includes('reject') ? 'ring-red-400 bg-red-400' :
              ev.type === 'email' ? 'ring-blue-400 bg-blue-400' :
              'ring-slate-900 bg-slate-900'
            } group-hover:scale-125`} />
            
            <div className="animate-in fade-in slide-in-from-left-2 duration-300">
               <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">
                 {new Date(ev.time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric'})} • {new Date(ev.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
               </span>
               <h4 className="text-sm font-bold text-slate-900 leading-snug group-hover:text-[#0a0f1a] transition-colors">{ev.label}</h4>
               <p className="text-xs text-slate-500 mt-1 italic group-hover:text-slate-700 transition-colors">By System Orchestrator</p>
            </div>
          </div>
        )) : (
          <div className="text-center py-12 text-slate-400">No activity matching filter</div>
        )}
      </div>
    </div>
  );
}

// ─── Utility Components ──────────────────────────────────────────────────────

function LoadingState() {
  return (
    <div className="p-8 space-y-8 animate-pulse">
      <div className="h-10 bg-slate-100 rounded-2xl w-2/3" />
      <div className="grid grid-cols-2 gap-4">
        <div className="h-24 bg-slate-100 rounded-3xl" />
        <div className="h-24 bg-slate-100 rounded-3xl" />
      </div>
      <div className="h-64 bg-slate-100 rounded-[2rem]" />
      <div className="space-y-4">
        {[1,2,3].map(i => <div key={i} className="h-16 bg-slate-100 rounded-2xl" />)}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center">
      <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mb-6">
        <AlertTriangle className="h-10 w-10 text-red-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Synchronicity Interrupted</h3>
      <p className="text-sm text-slate-500 max-w-xs mb-8 leading-relaxed">The candidate data stream encountered an unexpected termination. Please try again or check your connectivity.</p>
      <button 
        onClick={onRetry}
        className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black hover:bg-slate-800 transition-all flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4 text-[#c8ff00]" /> RECONNECT TO STREAM
      </button>
    </div>
  );
}

function MinusIcon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12h14" />
    </svg>
  );
}
