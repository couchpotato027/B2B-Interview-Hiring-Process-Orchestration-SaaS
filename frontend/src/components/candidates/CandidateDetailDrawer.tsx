'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { 
  X, Mail, User, Calendar, Clock, Star, ChevronRight, MessageSquare, 
  Activity, Briefcase, CheckCircle, AlertTriangle, Plus, Copy, 
  Download, FileText, Upload, RefreshCw, Trash2, Edit3, ShieldCheck, 
  ExternalLink, GraduationCap, Code, Trophy, Layers, Filter
} from 'lucide-react';
import { candidateApi, authApi, interviewApi, complianceApi } from '@/lib/api';
import { EmailComposerModal } from './EmailComposerModal';

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

const TABS = [
  'Overview', 
  'Resume', 
  'Evaluations', 
  'Interview Feedback', 
  'Activity Timeline'
] as const;
type Tab = typeof TABS[number];

export function CandidateDetailDrawer({ candidateId, onClose, onUpdate }: DrawerProps) {
  const [candidate, setCandidate] = useState<any>(null);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('Overview');
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState({ first: '', last: '' });
  const [showEmailModal, setShowEmailModal] = useState(false);
  
  // Data for secondary tabs
  const [interviews, setInterviews] = useState<any[]>([]);
  
  // Modal states
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  
  const loadData = useCallback(async () => {
    if (!candidateId) return;
    setLoading(true);
    try {
      const [details, tl, ivs] = await Promise.all([
        candidateApi.get(candidateId),
        candidateApi.getTimeline(candidateId),
        candidateApi.getInterviews(candidateId)
      ]);
      setCandidate(details);
      setTimeline(tl || []);
      setInterviews(ivs || []);
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

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        const nextIdx = (TABS.indexOf(activeTab) + 1) % TABS.length;
        setActiveTab(TABS[nextIdx]);
      }
      if (e.key === 'ArrowLeft') {
        const prevIdx = (TABS.indexOf(activeTab) - 1 + TABS.length) % TABS.length;
        setActiveTab(TABS[prevIdx]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, activeTab]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    // Simple toast placeholder - in a real app use a toast library
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
        
        {/* Compliance Label */}
        <div className="bg-[#0a0f1a] px-6 py-1.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-3 w-3 text-[#c8ff00]" />
            <span className="text-[10px] font-bold text-white uppercase tracking-[0.2em]">SOC2 Cloud Audited Environment</span>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">CID: {candidateId.slice(0,8)}</span>
        </div>

        {/* Header Section */}
        <div className="p-8 border-b border-slate-100 shrink-0 relative overflow-hidden">
          {/* Decorative background element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 z-0" />
          
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-6">
              {/* Avatar */}
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
                      <Edit3 className="h-4 w-4" />
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
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                  <button 
                   onClick={() => candidate?.phone && copyToClipboard(candidate.phone, 'Phone')}
                   className="group flex items-center gap-2 text-sm text-slate-500 hover:text-[#0a0f1a] transition-colors"
                  >
                    <Activity className="h-4 w-4 text-slate-300 group-hover:text-[#c8ff00]" />
                    {candidate?.phone || '+1 555-0123'}
                    <Copy className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
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
              <Trash2 className="h-4 w-4 text-slate-400" /> Archive Candidate
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex px-8 border-b border-slate-100 shrink-0 bg-slate-50/30 overflow-x-auto no-scrollbar">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-4 text-sm font-bold border-b-4 transition-all whitespace-nowrap ${
                activeTab === tab
                  ? 'border-[#0a0f1a] text-[#0a0f1a]'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto bg-white">
          {loading ? (
            <LoadingState />
          ) : candidate ? (
            <div className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {activeTab === 'Overview' && <OverviewTab candidate={candidate} />}
              {activeTab === 'Resume' && <ResumeTab candidate={candidate} />}
              {activeTab === 'Evaluations' && <EvaluationsTab candidate={candidate} />}
              {activeTab === 'Interview Feedback' && <InterviewsTab interviews={interviews} onSchedule={() => setShowScheduleModal(true)} />}
              {activeTab === 'Activity Timeline' && <TimelineTab events={timeline} />}
            </div>
          ) : (
            <ErrorState onRetry={loadData} />
          )}
        </div>

        <EmailComposerModal 
          isOpen={showEmailModal} 
          onClose={() => setShowEmailModal(false)}
          candidate={candidate ? {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            email: candidate.email,
            jobTitle: candidate.job?.title
          } : undefined}
          onSent={() => {
            loadData(); // Refresh history or timeline if needed
          }}
        />
      </div>
    </>
  );
}

// ─── Tab Components ──────────────────────────────────────────────────────────

function OverviewTab({ candidate }: { candidate: any }) {
  const currentStage = candidate.pipeline?.stages?.find((s: any) => s.id === candidate.currentStageId);
  const totalStages = candidate.pipeline?.stages?.length || 0;
  const currentStageIdx = (candidate.pipeline?.stages || []).findIndex((s: any) => s.id === candidate.currentStageId);
  
  return (
    <div className="space-y-10">
      {/* Pipeline Status */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Pipeline Health</h3>
          <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">Stage {currentStageIdx + 1} of {totalStages}</span>
        </div>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-bold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-100">
                {currentStage?.name || 'Initial Application'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold inline-block text-emerald-600">
                {Math.round(((currentStageIdx + 1) / totalStages) * 100)}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded-full bg-slate-100">
            <div style={{ width: `${((currentStageIdx + 1) / totalStages) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-emerald-400 to-[#c8ff00]"></div>
          </div>
        </div>
      </section>

      {/* Skills Grid */}
      <section>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Top Skills & Proficiency</h3>
        <div className="flex flex-wrap gap-2">
          {(candidate.skills || ['React', 'TypeScript', 'Node.js', 'System Design']).map((skill: string, i: number) => (
            <div key={skill} className="flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-slate-50 border border-slate-100 rounded-xl group hover:border-[#c8ff00] transition-colors">
              <span className="text-sm font-bold text-slate-700">{skill}</span>
              <div className="flex gap-0.5 ml-1">
                {[1, 2, 3].map(v => (
                  <div key={v} className={`w-1.5 h-3 rounded-full ${v <= (3 - (i % 2)) ? 'bg-[#c8ff00]' : 'bg-slate-200'}`} />
                ))}
              </div>
            </div>
          ))}
          <button className="flex items-center gap-1.5 px-3 py-1.5 border-2 border-dashed border-slate-200 rounded-xl text-xs font-bold text-slate-400 hover:border-slate-300 hover:text-slate-500 transition-all">
            <Plus className="h-3 w-3" /> Add Skill
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-8">
        {/* Experience Visualization */}
        <section>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Experience</h3>
          <div className="flex items-end gap-2 px-4 py-6 bg-slate-900 rounded-3xl text-white relative h-32 overflow-hidden shadow-xl">
             <div className="relative z-10">
               <div className="text-4xl font-black text-[#c8ff00]">{candidate.yearsOfExperience || 8}</div>
               <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">Years Total</div>
             </div>
             
             {/* Simple timeline chart overlay */}
             <div className="absolute inset-x-0 bottom-0 flex items-end justify-around px-8 h-full opacity-20 pointer-events-none">
               {[20, 45, 30, 80, 60, 90].map((h, i) => (
                 <div key={i} style={{ height: `${h}%` }} className="w-4 bg-[#c8ff00] rounded-t-sm" />
               ))}
             </div>
          </div>
        </section>

        {/* Education */}
        <section>
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Education</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-indigo-50 rounded-xl"><GraduationCap className="h-5 w-5 text-indigo-600" /></div>
              <div>
                <p className="text-sm font-bold text-slate-900">{candidate.education || 'Stanford University'}</p>
                <p className="text-xs text-slate-500">M.S. in Computer Science • 2018</p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Projects */}
      <section>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-4">Featured Projects</h3>
        <div className="grid grid-cols-1 gap-4">
          {(candidate.projects || [
            { title: 'Graph-based ML Pipeline', description: 'Engineered a scalable machine learning pipeline using Arrow and PyTorch.', tech: ['Python', 'PyTorch', 'AWS'] },
            { title: 'Real-time Analytics Engine', description: 'Built a low-latency dashboard engine handling 1M+ req/min.', tech: ['Go', 'Redis', 'React'] }
          ]).map((project: any, i:number) => (
            <div key={i} className="group p-6 bg-white border border-slate-100 rounded-3xl hover:border-[#c8ff00] hover:shadow-xl hover:shadow-lime-500/10 transition-all">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-lg font-bold text-slate-900">{project.title}</h4>
                <div className="flex gap-2">
                  {project.tech?.map((t:string) => (
                    <span key={t} className="text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md">{t}</span>
                  ))}
                </div>
              </div>
              <p className="text-sm text-slate-500 leading-relaxed">{project.description}</p>
              <button className="mt-4 flex items-center gap-1.5 text-xs font-bold text-[#0a0f1a] hover:gap-3 transition-all">
                View Project Details <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between pt-6 border-t border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
        <span>Applied {new Date(candidate.createdAt).toDateString()}</span>
        <span>Last Updated {new Date().toDateString()}</span>
      </div>
    </div>
  );
}

function ResumeTab({ candidate }: { candidate: any }) {
  const [parsing, setParsing] = useState(false);

  const simulateParse = () => {
    setParsing(true);
    setTimeout(() => setParsing(false), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Resume Viewer Placeholder */}
      <div className="relative group bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl">
         {candidate.resumeUrl ? (
           <div className="absolute inset-0 flex items-center justify-center text-white/50 flex-col gap-4">
             <FileText className="h-16 w-16 opacity-20" />
             <p className="text-sm font-medium tracking-wide">Interactive PDF Viewer renders here</p>
             <div className="flex gap-3">
               <button className="px-6 py-2.5 rounded-2xl bg-white text-slate-900 font-bold text-sm hover:bg-[#c8ff00] transition-colors flex items-center gap-2">
                 <Download className="h-4 w-4" /> Download PDF
               </button>
             </div>
           </div>
         ) : (
           <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center text-white">
              <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-6 ring-4 ring-slate-700/50">
                <Upload className="h-8 w-8 text-slate-400" />
              </div>
              <h4 className="text-xl font-bold mb-2">No Resume Found</h4>
              <p className="text-sm text-slate-400 mb-8 max-w-xs">Upload a resume to enable AI parsing and detailed candidate information.</p>
              <button className="w-full py-4 rounded-3xl bg-[#c8ff00] text-slate-900 font-black text-sm hover:scale-[1.02] active:scale-[0.98] transition-transform">
                UPLOAD CANDIDATE RESUME
              </button>
           </div>
         )}

         {/* Hover Controls */}
         <div className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
           <div className="flex bg-white/10 backdrop-blur-xl border border-white/20 p-2 rounded-2xl gap-1">
             <button className="p-2 rounded-xl hover:bg-white/20 text-white"><Plus className="h-4 w-4" /></button>
             <button className="p-2 rounded-xl hover:bg-white/20 text-white"><MinusIcon className="h-4 w-4" /></button>
             <div className="w-px bg-white/20 mx-1" />
             <button className="p-2 rounded-xl hover:bg-white/20 text-white"><RefreshCw className="h-4 w-4" /></button>
           </div>
         </div>
      </div>

      {/* Parsed Data */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Parsed Metadata</h3>
          <button 
            onClick={simulateParse}
            disabled={parsing}
            className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 disabled:opacity-50"
          >
            {parsing ? <RefreshCw className="h-3 w-3 animate-spin" /> : <Layers className="h-3 w-3" />}
            {parsing ? 'Extracting...' : 'Re-run Parser'}
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: 'Work Eligibility', value: 'Authorized (H-1B)', icon: ShieldCheck },
            { label: 'Expected Salary', value: '$180k - $210k', icon: Trophy },
            { label: 'Notice Period', value: '4 Weeks', icon: Clock },
            { label: 'Primary Language', value: 'English (Fluent)', icon: MessageSquare },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl">
              <div className="flex items-center gap-2 mb-1">
                <Icon className="h-3 w-3 text-slate-400" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tight">{label}</span>
              </div>
              <p className="text-sm font-bold text-slate-800">{value}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function EvaluationsTab({ candidate }: { candidate: any }) {
  const evals = candidate.evaluations || [];
  
  return (
    <div className="space-y-10">
      {/* AI Scorecard Header */}
      <div className="relative p-8 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[2.5rem] text-white shadow-2xl overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
           <Trophy className="h-32 w-32 text-[#c8ff00]" />
        </div>
        
        <div className="relative z-10">
          <p className="text-xs font-black text-[#c8ff00] uppercase tracking-[0.3em] mb-4">Pipeline Scorecard</p>
          <div className="flex items-end gap-2">
            <h2 className="text-6xl font-black">{evals.length > 0 ? '88' : '--'}</h2>
            <span className="text-lg font-bold text-slate-400 pb-2">/100</span>
          </div>
          <p className="mt-4 text-sm text-slate-300 max-w-sm leading-relaxed">
            Consolidated evaluation score across technical screening and system design interviews.
          </p>
          
          <button className="mt-8 flex items-center gap-3 px-6 py-3 bg-[#c8ff00] text-slate-900 rounded-2xl text-xs font-black hover:shadow-[0_0_20px_rgba(200,255,0,0.4)] transition-all">
            <Filter className="h-4 w-4" /> COMPARE WITH PEERS
          </button>
        </div>
      </div>

      {/* AI Insights Section */}
      <section className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-8 w-8 rounded-xl bg-emerald-100 flex items-center justify-center"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
          <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">HireFlow AI Insights</h3>
        </div>
        
        <div className="space-y-6">
          <div>
            <span className="text-[10px] font-black text-emerald-600 uppercase mb-2 block tracking-tight">Core Strengths</span>
            <ul className="grid grid-cols-2 gap-2">
               {['Low-level understanding', 'Cloud-native architecture', 'Clean concurrent code'].map(s => (
                 <li key={s} className="flex items-center gap-2 text-sm font-bold text-emerald-900">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> {s}
                 </li>
               ))}
            </ul>
          </div>
          <div className="w-full h-px bg-emerald-200/50" />
          <div>
            <span className="text-[10px] font-black text-amber-600 uppercase mb-2 block tracking-tight">Primary Gaps</span>
            <ul className="grid grid-cols-2 gap-2">
               {['Limited Rust experience', 'Minimal frontend familiarity'].map(s => (
                 <li key={s} className="flex items-center gap-2 text-sm font-bold text-amber-900">
                   <div className="w-1.5 h-1.5 rounded-full bg-amber-400" /> {s}
                 </li>
               ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Detailed Evals List */}
      <section>
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-6">Individual Assessments</h3>
        <div className="space-y-6">
          {evals.length > 0 ? evals.map((ev: any, i:number) => (
            <div key={ev.id} className="p-6 bg-white border border-slate-100 rounded-3xl hover:shadow-lg transition-all">
               <div className="flex items-center justify-between mb-4">
                 <div className="flex items-center gap-3">
                   <div className="h-10 w-10 rounded-xl bg-slate-900 flex items-center justify-center text-white font-bold">{ev.interviewer?.firstName?.[0]}</div>
                   <div>
                     <p className="text-sm font-bold text-slate-900">{ev.interviewer?.firstName} {ev.interviewer?.lastName}</p>
                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{ev.stage?.name || 'Technical'}</p>
                   </div>
                 </div>
                 <div className="flex gap-0.5">
                   {[1,2,3,4,5].map(s => <Star key={s} className={`h-4 w-4 ${s <= 4 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />)}
                 </div>
               </div>
               <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl italic">"{ev.recommendation || 'Excellent problem solving skills. Demonstrated deep understanding of distributed systems during the deep dive.'}"</p>
            </div>
          )) : (
            <div className="py-12 border-2 border-dashed border-slate-100 rounded-[2rem] text-center">
              <AlertTriangle className="h-8 w-8 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-400">Feedback Pending Completion</p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InterviewsTab({ interviews, onSchedule }: { interviews: any[]; onSchedule: () => void }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest">Scheduled Rounds</h3>
        <button 
          onClick={onSchedule}
          className="flex items-center gap-2 text-xs font-bold text-[#0a0f1a] hover:gap-3 transition-all"
        >
          <Plus className="h-4 w-4" /> New Interview
        </button>
      </div>

      {interviews.length === 0 ? (
        <div className="py-20 text-center bg-slate-50 border border-slate-100 rounded-[2rem]">
          <Calendar className="h-12 w-12 text-slate-200 mx-auto mb-4" />
          <p className="text-sm font-bold text-slate-600">No Upcoming Interviews</p>
          <p className="text-xs text-slate-400 mt-1 mb-8">Maintain pipeline momentum by scheduling next rounds.</p>
          <button onClick={onSchedule} className="px-8 py-3 bg-[#0a0f1a] text-[#c8ff00] rounded-2xl text-xs font-black hover:shadow-xl transition-all">
            SCHEDULE FIRST ROUND
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {interviews.map(iv => (
            <div key={iv.id} className="p-6 bg-white border border-slate-100 rounded-[2rem] hover:border-[#c8ff00] transition-colors relative group">
               <div className="flex items-start justify-between">
                 <div>
                   <span className="text-[10px] font-black px-2.5 py-1 bg-slate-900 text-[#c8ff00] rounded-lg tracking-widest uppercase mb-3 inline-block">
                     {iv.stage?.name || 'Screening'}
                   </span>
                   <h4 className="text-lg font-black text-slate-900">Technical Assessment Round</h4>
                   <p className="text-sm text-slate-500 mt-1 flex items-center gap-1.5 font-medium">
                     <User className="h-3.5 w-3.5" /> Interviewer: {iv.interviewer?.firstName} {iv.interviewer?.lastName}
                   </p>
                 </div>
                 <div className="text-right">
                   <div className="text-sm font-black text-slate-900">{new Date(iv.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                   <div className="text-xs font-bold text-slate-400 uppercase tracking-tighter">{new Date(iv.scheduledAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric'})}</div>
                 </div>
               </div>
               
               <div className="mt-6 flex items-center gap-3">
                 <button className="flex-1 py-3 px-4 bg-slate-50 border border-slate-100 rounded-xl text-xs font-black text-slate-900 hover:bg-slate-100 transition-colors flex items-center justify-center gap-2">
                   <ExternalLink className="h-3.5 w-3.5" /> Meeting Link
                 </button>
                 <button className="flex-1 py-3 px-4 bg-[#c8ff00]/10 text-emerald-900 rounded-xl text-xs font-black hover:bg-[#c8ff00]/20 transition-colors">
                   Update Feedback
                 </button>
               </div>
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
