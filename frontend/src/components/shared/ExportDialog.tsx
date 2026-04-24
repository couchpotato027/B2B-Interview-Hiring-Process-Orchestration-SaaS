'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, FileJson, FileSpreadsheet, X, Loader2, CheckCircle } from 'lucide-react';
import { exchangeApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  filters?: any;
}

export function ExportDialog({ isOpen, onClose, filters }: ExportDialogProps) {
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState<'csv' | 'json'>('csv');

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await exchangeApi.exportCandidates(format, filters);
      
      // Handle file download
      const blob = new Blob([format === 'json' ? JSON.stringify(response, null, 2) : response], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `candidates_export_${Date.now()}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success('Backup generated successfully');
      onClose();
    } catch (err) {
      toast.error('Export failed. Please check permissions.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center">
                    <Download className="h-8 w-8 text-[#c8ff00]" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Export Intelligence</h3>
                    <p className="text-xs text-slate-500 font-medium">Generate SOC 2 compliant data backups.</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X className="h-8 w-8" /></button>
        </div>

        <div className="p-8 space-y-8">
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Select Protocol</p>
                <div className="grid grid-cols-2 gap-4">
                    <button 
                        onClick={() => setFormat('csv')}
                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${format === 'csv' ? 'border-slate-900 bg-slate-50 dark:bg-slate-900' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                        <FileSpreadsheet className={`h-8 w-8 ${format === 'csv' ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${format === 'csv' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>CSV Spreadsheet</span>
                    </button>
                    <button 
                        onClick={() => setFormat('json')}
                        className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 ${format === 'json' ? 'border-slate-900 bg-slate-50 dark:bg-slate-900' : 'border-slate-100 dark:border-slate-800'}`}
                    >
                        <FileJson className={`h-8 w-8 ${format === 'json' ? 'text-slate-900 dark:text-white' : 'text-slate-300'}`} />
                        <span className={`text-xs font-black uppercase tracking-widest ${format === 'json' ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>JSON Object</span>
                    </button>
                </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="h-4 w-4 text-emerald-500" />
                    <span className="text-xs font-bold text-slate-700 dark:text-white">Encrypted Transfer</span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium">Your export will be generated with full PII masking options if configured. This session is audited for compliance.</p>
            </div>
        </div>

        <div className="p-8 bg-slate-50 dark:bg-slate-900/50 flex flex-col gap-3">
            <button 
                onClick={handleExport}
                disabled={loading}
                className="w-full py-5 bg-slate-900 dark:bg-[#c8ff00] dark:text-slate-900 text-white rounded-3xl text-sm font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Download className="h-5 w-5" />}
                Initialize Export
            </button>
            <button onClick={onClose} className="text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-900">Cancel Request</button>
        </div>
      </motion.div>
    </div>
  );
}
