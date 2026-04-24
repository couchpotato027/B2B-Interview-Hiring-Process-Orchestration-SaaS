'use client';

import React, { useState } from 'react';
import { X, Settings, Target, Zap, Shield, GraduationCap } from 'lucide-react';
import { jobApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface ScoringWeights {
    skillMatch: number;
    experience: number;
    education: number;
    projects: number;
    culturalFit: number;
}

interface Props {
    job: { id: string; title: string, scoringWeights?: any };
    onClose: () => void;
    onUpdate?: () => void;
}

export function ScoringConfigModal({ job, onClose, onUpdate }: Props) {
    const [weights, setWeights] = useState<ScoringWeights>({
        skillMatch: job.scoringWeights?.skillMatch || 0.4,
        experience: job.scoringWeights?.experience || 0.3,
        education: job.scoringWeights?.education || 0.1,
        projects: job.scoringWeights?.projects || 0.15,
        culturalFit: job.scoringWeights?.culturalFit || 0.05,
    });
    const [saving, setSaving] = useState(false);

    const total = Object.values(weights).reduce((a, b) => a + b, 0);
    const isBalanced = Math.abs(total - 1.0) < 0.001;

    const handleSave = async () => {
        if (!isBalanced) {
            toast.error(`Weights must sum to 100% (Current: ${Math.round(total * 100)}%)`);
            return;
        }

        setSaving(true);
        try {
            await jobApi.configureScoring(job.id, weights);
            toast.success('Scoring weights updated!');
            onUpdate?.();
            onClose();
        } catch (err: any) {
            toast.error(err.message);
        } finally {
            setSaving(false);
        }
    };

    const ConfigItem = ({ label, value, field, icon: Icon, color }: any) => (
        <div className="p-4 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-[#c8ff00] transition-all">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-xl ${color} bg-opacity-10`}>
                        <Icon className={`h-4 w-4 ${color.replace('bg-', 'text-')}`} />
                    </div>
                    <span className="text-xs font-black text-slate-900 uppercase tracking-tight">{label}</span>
                </div>
                <span className="text-sm font-black text-slate-900">{Math.round(value * 100)}%</span>
            </div>
            <input 
                type="range" 
                min="0" 
                max="100" 
                step="5" 
                value={value * 100}
                onChange={(e) => setWeights({ ...weights, [field]: Number(e.target.value) / 100 })}
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-[#c8ff00]"
            />
        </div>
    );

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md" onClick={onClose} />
            
            <div className="relative w-full max-w-xl bg-white rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">Score Settings</h2>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Job: {job.title}</p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors shadow-sm text-slate-400 hover:text-slate-900">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-8 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <ConfigItem label="Core Skills" field="skillMatch" value={weights.skillMatch} icon={Target} color="bg-blue-500" />
                        <ConfigItem label="Experience" field="experience" value={weights.experience} icon={Settings} color="bg-emerald-500" />
                        <ConfigItem label="Education" field="education" value={weights.education} icon={GraduationCap} color="bg-purple-500" />
                        <ConfigItem label="Portfolio" field="projects" value={weights.projects} icon={Zap} color="bg-amber-500" />
                    </div>
                    
                    <div className="p-4 bg-slate-900 rounded-3xl">
                        <ConfigItem label="Cultural Alignment" field="culturalFit" value={weights.culturalFit} icon={Shield} color="bg-[#c8ff00]" />
                    </div>

                    <div className={`mt-8 p-4 rounded-2xl flex items-center justify-between ${isBalanced ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <div className="flex items-center gap-2">
                             <div className={`h-2 w-2 rounded-full ${isBalanced ? 'bg-emerald-500' : 'bg-red-500 animate-pulse'}`} />
                             <span className="text-xs font-black text-slate-900 uppercase">Total Allocation</span>
                        </div>
                        <span className={`text-lg font-black ${isBalanced ? 'text-emerald-600' : 'text-red-600'}`}>{Math.round(total * 100)}%</span>
                    </div>
                </div>

                <div className="p-8 bg-slate-50 border-t border-slate-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 px-6 bg-white border border-slate-200 text-slate-600 rounded-2xl text-sm font-black hover:bg-slate-50 transition-all">
                        CANCEL
                    </button>
                    <button 
                        onClick={handleSave}
                        disabled={saving || !isBalanced}
                        className="flex-1 py-4 px-6 bg-[#0a0f1a] text-[#c8ff00] rounded-2xl text-sm font-black disabled:opacity-50 hover:shadow-2xl transition-all shadow-xl"
                    >
                        {saving ? 'SAVING...' : 'APPLY WEIGHTS'}
                    </button>
                </div>
            </div>
        </div>
    );
}
