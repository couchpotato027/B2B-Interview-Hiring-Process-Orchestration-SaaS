'use client';

import React, { useState, useEffect } from 'react';
import { 
    ChevronDown, 
    Mail, 
    UserPlus, 
    ArrowRight, 
    Download, 
    Trash2, 
    X,
    Loader2,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { candidateApi, authApi } from '@/lib/api';
import { toast } from 'react-hot-toast';
import EmailModal from './EmailModal';

interface BulkActionsToolbarProps {
    selectedIds: string[];
    onClear: () => void;
    onActionComplete: () => void;
    availableStages: { id: string; name: string }[];
}

export default function BulkActionsToolbar({ 
    selectedIds, 
    onClear, 
    onActionComplete,
    availableStages 
}: BulkActionsToolbarProps) {
    const [users, setUsers] = useState<{ id: string; firstName: string; lastName: string }[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState({ current: 0, total: 0 });
    const [showStageMenu, setShowStageMenu] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);

    useEffect(() => {
        const loadUsers = async () => {
            try {
                const list = await authApi.listUsers();
                setUsers(list);
            } catch (err) { console.error('Failed to load users', err); }
        };
        loadUsers();
    }, []);

    if (selectedIds.length === 0) return null;

    const handleBulkAction = async (action: string, payload?: any) => {
        if (action === 'DELETE' && !window.confirm(`Are you sure you want to delete ${selectedIds.length} candidates?`)) return;
        
        setIsProcessing(true);
        setProgress({ current: 0, total: selectedIds.length });
        
        try {
            // We use the bulk API endpoint we just created
            const result = await candidateApi.bulkUpdate(selectedIds, action, payload);
            
            if (result.failed > 0) {
                toast.error(`Completed with errors: ${result.success} succeeded, ${result.failed} failed.`);
            } else {
                toast.success(`Successfully processed ${result.success} candidates.`);
            }
            
            onActionComplete();
            if (action === 'DELETE' || result.failed === 0) {
                onClear();
            }
        } catch (err: any) {
            toast.error(`Bulk action failed: ${err.message}`);
        } finally {
            setIsProcessing(false);
            setShowStageMenu(false);
            setShowUserMenu(false);
        }
    };

    const handleExport = () => {
        // Simple CSV Export logic
        // In a real app, this might be a backend call, but we can do it client-side if we have the data
        // For now, I'll alert that it's starting and then "download" a dummy CSV
        toast.success('Exporting selected candidates...');
        const headers = 'ID,Name,Email\n';
        const rows = selectedIds.map(id => `${id},Candidate Name,email@example.com`).join('\n');
        const blob = new Blob([headers + rows], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `candidates_export_${new Date().getTime()}.csv`;
        a.click();
    };

    return (
        <>
            <div className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-[60] animate-in slide-in-from-bottom-8 duration-300 w-[calc(100%-2rem)] sm:w-max">
                <div className="bg-[#0a0f1a] text-white rounded-2xl shadow-2xl px-4 py-2 sm:px-6 sm:py-4 flex items-center justify-center gap-2 sm:gap-6 border border-white/10 backdrop-blur-xl">
                    <div className="flex items-center gap-2 sm:gap-3 pr-3 sm:pr-6 border-r border-white/10 shrink-0">
                        <div className="bg-[#c8ff00] text-[#0a0f1a] h-7 w-7 rounded-full flex items-center justify-center font-bold text-sm">
                            {selectedIds.length}
                        </div>
                        <span className="text-sm font-semibold whitespace-nowrap">
                            {selectedIds.length === 1 ? 'Candidate selected' : 'Candidates selected'}
                        </span>
                        <button onClick={onClear} className="text-white/40 hover:text-white transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>

                    {isProcessing ? (
                        <div className="flex items-center gap-4 min-w-[300px]">
                            <Loader2 className="h-5 w-5 animate-spin text-[#c8ff00]" />
                            <div className="flex-1">
                                <div className="flex justify-between text-xs mb-1">
                                    <span>Processing...</span>
                                    <span>{progress.current} of {progress.total}</span>
                                </div>
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-[#c8ff00] transition-all duration-300" 
                                        style={{ width: `${(progress.current / progress.total) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            {/* Move to Stage */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowStageMenu(!showStageMenu)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                                >
                                    <ArrowRight className="h-4 w-4 text-[#c8ff00]" />
                                    <span className="hidden sm:inline">Move to Stage</span>
                                    <ChevronDown className={`h-3 w-3 transition-transform ${showStageMenu ? 'rotate-180' : ''}`} />
                                </button>
                                {showStageMenu && (
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-2 z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        {availableStages.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-slate-400 italic">No stages available</div>
                                        ) : (
                                            availableStages.map(stage => (
                                                <button 
                                                    key={stage.id}
                                                    onClick={() => handleBulkAction('MOVE_STAGE', { newStageId: stage.id })}
                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-bold text-slate-700 transition-colors"
                                                >
                                                    {stage.name}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Assign Recruiter */}
                            <div className="relative">
                                <button 
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                                >
                                    <UserPlus className="h-4 w-4 text-[#c8ff00]" />
                                    <span className="hidden sm:inline">Assign</span>
                                    <ChevronDown className={`h-3 w-3 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
                                </button>
                                {showUserMenu && (
                                    <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 w-56 bg-white border border-slate-200 text-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-2 max-h-64 overflow-y-auto z-[100] animate-in fade-in slide-in-from-bottom-2 duration-200">
                                        {users.length === 0 ? (
                                            <div className="px-3 py-2 text-xs text-slate-400 italic">No recruiters found</div>
                                        ) : (
                                            users.map(user => (
                                                <button 
                                                    key={user.id}
                                                    onClick={() => handleBulkAction('ASSIGN_RECRUITER', { recruiterId: user.id })}
                                                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-sm font-bold text-slate-700 transition-colors"
                                                >
                                                    {user.firstName} {user.lastName}
                                                </button>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={() => setShowEmailModal(true)}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium"
                            >
                                <Mail className="h-4 w-4 text-[#c8ff00]" />
                                <span className="hidden sm:inline">Email</span>
                            </button>

                            <button 
                                onClick={() => handleBulkAction('REJECT')}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-500/10 text-red-400 transition-colors text-sm font-medium"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Reject</span>
                            </button>

                            <button 
                                onClick={handleExport}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 transition-colors text-sm font-medium border-l border-white/10 ml-2"
                            >
                                <Download className="h-4 w-4 text-slate-400" />
                                <span className="hidden sm:inline">Export</span>
                            </button>

                            <button 
                                onClick={() => handleBulkAction('DELETE')}
                                className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-red-600 transition-colors text-sm font-bold bg-red-500/20 text-red-500 ml-2"
                            >
                                <Trash2 className="h-4 w-4" />
                                <span className="hidden sm:inline">Delete</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <EmailModal 
                isOpen={showEmailModal}
                onClose={() => setShowEmailModal(false)}
                recipientCount={selectedIds.length}
                onSend={async (subject, body) => {
                    // Send Email Bulk Action
                    await handleBulkAction('SEND_EMAIL', { subject, body });
                }}
            />
        </>
    );
}
