'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, ShieldCheck, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { exchangeApi } from '@/lib/api';
import { toast } from 'react-hot-toast';

export function ImportWizard({ isOpen, onClose, onComplete }: { isOpen: boolean; onClose: () => void; onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; errors: any[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setFile(e.target.files[0]);
      setStep(2);
    }
  };

  const executeImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const res = await exchangeApi.importCandidates(file);
      setResult(res);
      setStep(3);
      onComplete();
    } catch (err) {
      toast.error('Import protocol failure. Check CSV structure.');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-900/40">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl bg-white dark:bg-slate-950 rounded-[3rem] shadow-2xl overflow-hidden"
      >
        <div className="p-10 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-4">
                <div className="h-14 w-14 bg-slate-900 rounded-2xl flex items-center justify-center">
                    <Upload className="h-8 w-8 text-[#c8ff00]" />
                </div>
                <div>
                    <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter">Batch Intake</h3>
                    <p className="text-xs text-slate-500 font-medium">Synchronize legacy data into HireFlow.</p>
                </div>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-900"><X className="h-8 w-8" /></button>
        </div>

        <div className="p-10">
            {step === 1 && (
                <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="group border-4 border-dashed border-slate-100 dark:border-slate-800 rounded-[3rem] p-16 text-center hover:border-primary hover:bg-slate-50 dark:hover:bg-slate-900 transition-all cursor-pointer"
                >
                    <input type="file" ref={fileInputRef} className="hidden" accept=".csv" onChange={handleFileSelect} />
                    <div className="h-20 w-20 bg-slate-100 dark:bg-slate-800 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                        <FileText className="h-10 w-10 text-slate-400" />
                    </div>
                    <h4 className="text-xl font-black text-slate-900 dark:text-white mb-2">Drop CSV Manifest</h4>
                    <p className="text-sm text-slate-400 font-medium">Columns required: Email, FirstName, LastName</p>
                    <button className="mt-8 px-6 py-2 bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl text-xs font-black uppercase tracking-widest">Select File</button>
                </div>
            )}

            {step === 2 && file && (
                <div className="space-y-8">
                    <div className="p-6 bg-slate-50 dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-white dark:bg-slate-800 rounded-xl flex items-center justify-center shadow-sm">
                                <FileText className="h-6 w-6 text-slate-900 dark:text-white" />
                            </div>
                            <div>
                                <p className="text-sm font-black text-slate-900 dark:text-white">{file.name}</p>
                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{(file.size / 1024).toFixed(1)} KB READY</p>
                            </div>
                        </div>
                        <CheckCircle className="h-6 w-6 text-emerald-500" />
                    </div>

                    <div className="flex gap-4">
                        <div className="flex-1 bg-blue-50 dark:bg-blue-900/20 p-6 rounded-3xl border border-blue-100 dark:border-blue-800">
                             <ShieldCheck className="h-6 w-6 text-blue-500 mb-3" />
                             <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Deduplication</p>
                             <p className="text-xs text-slate-500 font-medium">Auto-skipping existing emails.</p>
                        </div>
                        <div className="flex-1 bg-amber-50 dark:bg-amber-900/20 p-6 rounded-3xl border border-amber-100 dark:border-amber-800">
                             <AlertCircle className="h-6 w-6 text-amber-500 mb-3" />
                             <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Mapping</p>
                             <p className="text-xs text-slate-500 font-medium">Standard columns detected.</p>
                        </div>
                    </div>

                    <button 
                        onClick={executeImport}
                        disabled={importing}
                        className="w-full py-5 bg-slate-900 dark:bg-[#c8ff00] dark:text-slate-900 text-white rounded-3xl text-sm font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                    >
                        {importing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Zap className="h-5 w-5" />}
                        Execute Batch Intake
                    </button>
                </div>
            )}

            {step === 3 && result && (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <div className="text-center">
                        <div className="h-24 w-24 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-12 w-12 text-emerald-500" />
                        </div>
                        <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">Intake Synchronized</h3>
                        <p className="text-slate-500 font-medium mt-2">The batch processing phase is complete.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] text-center">
                            <p className="text-4xl font-black text-emerald-600 mb-1">{result.success}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SUCCESSFUL</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-slate-900 p-6 rounded-[2rem] text-center">
                            <p className="text-4xl font-black text-rose-600 mb-1">{result.errors.length}</p>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EXCEPTIONS</p>
                        </div>
                    </div>

                    {result.errors.length > 0 && (
                        <div className="max-h-40 overflow-y-auto p-4 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800 space-y-2">
                             {result.errors.map((err, i) => (
                                 <div key={i} className="flex justify-between text-[10px] font-bold">
                                     <span className="text-rose-900 dark:text-rose-400 uppercase">{err.email}</span>
                                     <span className="text-rose-500">{err.error}</span>
                                 </div>
                             ))}
                        </div>
                    )}

                    <button 
                        onClick={onClose}
                        className="w-full py-5 bg-slate-900 dark:bg-white dark:text-slate-900 text-white rounded-3xl text-sm font-black shadow-xl"
                    >
                        Done
                    </button>
                </div>
            )}
        </div>
      </motion.div>
    </div>
  );
}

function Zap(props: any) {
  return <svg {...props} fill="currentColor" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>;
}
