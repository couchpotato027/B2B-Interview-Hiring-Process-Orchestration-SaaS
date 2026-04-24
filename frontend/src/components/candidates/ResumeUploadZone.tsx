'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, XCircle, X, Loader2, FileIcon } from 'lucide-react';
import axios, { CancelTokenSource } from 'axios';
import { toast } from 'react-hot-toast';

interface UploadedFile {
  id: string;
  file: File;
  progress: number;
  speed: string;
  timeRemaining: string;
  status: 'uploading' | 'processing_text' | 'processing_ai' | 'success' | 'error';
  errorText?: string;
  cancelSource: CancelTokenSource;
  previewText?: string; // Text extracted for DOCX/TXT or dummy for UI testing
  candidateData?: any;
}

export function ResumeUploadZone({ onUploadComplete }: { onUploadComplete?: (data: any) => void }) {
  const [uploads, setUploads] = useState<UploadedFile[]>([]);
  const [isProcessingBatch, setIsProcessingBatch] = useState(false);

  const processFile = async (uploadIdx: number, file: File) => {
    // We simulate the multi-stage post-upload processing as requested by user
    const updateStatus = (status: UploadedFile['status'], patch: Partial<UploadedFile> = {}) => {
      setUploads(prev => prev.map((u, i) => i === uploadIdx ? { ...u, status, ...patch } : u));
    };

    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const source = axios.CancelToken.source();

    updateStatus('uploading', { cancelSource: source });

    const formData = new FormData();
    formData.append('file', file);

    const startTime = Date.now();

    try {
      const res = await axios.post(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/v1/candidates/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        cancelToken: source.token,
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            const timeElapsed = (Date.now() - startTime) / 1000;
            const speedMbps = (progressEvent.loaded / 1024 / 1024 / timeElapsed).toFixed(1);
            const remainingBytes = progressEvent.total - progressEvent.loaded;
            const timeRemainingSecs = Math.round(remainingBytes / (progressEvent.loaded / timeElapsed));
            
            updateStatus('uploading', {
              progress: percentCompleted,
              speed: `${speedMbps} MB/s`,
              timeRemaining: `${timeRemainingSecs}s remaining`
            });
          }
        }
      });

      // Post-upload feedback stages
      updateStatus('processing_text');
      
      // Artificial delay for UI feedback as requested
      await new Promise(r => setTimeout(r, 2000));
      updateStatus('processing_ai', { previewText: 'Extracting key data points and routing capabilities...' });
      
      await new Promise(r => setTimeout(r, 3000));
      updateStatus('success', { 
        progress: 100, 
        candidateData: res.data 
      });
      
      if (onUploadComplete) onUploadComplete(res.data);
      toast.success(`${file.name} processed successfully`);

    } catch (err: any) {
      if (axios.isCancel(err)) {
        updateStatus('error', { errorText: 'Upload cancelled' });
      } else {
        updateStatus('error', { errorText: err.response?.data?.message || err.message || 'Upload failed' });
        toast.error(`Failed to process ${file.name}`);
      }
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    rejectedFiles.forEach(rf => {
      toast.error(`${rf.file.name}: ${rf.errors?.[0]?.message || 'Invalid file layer'}`);
    });

    const newUploads = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      progress: 0,
      speed: '0 MB/s',
      timeRemaining: 'Calculating...',
      status: 'uploading' as const,
      cancelSource: axios.CancelToken.source()
    }));

    setUploads(prev => [...prev, ...newUploads]);

    // Process parallel uploads (batch upload)
    setIsProcessingBatch(true);
    const startIndex = uploads.length;
    
    newUploads.forEach((u, i) => {
      // Small simulated staggered start
      setTimeout(() => {
        processFile(startIndex + i, u.file);
      }, i * 500);
    });

  }, [uploads.length]);

  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt']
    },
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const cancelUpload = (idx: number) => {
    const upload = uploads[idx];
    if (upload.status === 'uploading' || upload.status === 'processing_text' || upload.status === 'processing_ai') {
      upload.cancelSource.cancel('User cancelled upload');
    }
    setUploads(prev => prev.filter((_, i) => i !== idx));
  };

  const getStatusIcon = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
      case 'processing_text': return <FileText className="h-4 w-4 animate-pulse text-purple-500" />;
      case 'processing_ai': return <Loader2 className="h-4 w-4 animate-spin text-[#c8ff00]" />;
      case 'success': return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusText = (status: UploadedFile['status']) => {
    switch (status) {
      case 'uploading': return 'Uploading file...';
      case 'processing_text': return 'Extracting text...';
      case 'processing_ai': return 'AI analyzing skills...';
      case 'success': return 'Complete!';
      case 'error': return 'Failed';
    }
  };

  return (
    <div className="w-full space-y-4">
      <div 
        {...getRootProps()} 
        className={`relative overflow-hidden w-full h-48 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
          isDragAccept ? 'border-[#c8ff00] bg-[#c8ff00]/5 ring-4 ring-[#c8ff00]/20' : 
          isDragReject ? 'border-red-400 bg-red-50' : 
          isDragActive ? 'border-blue-400 bg-blue-50' :
          'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'
        }`}
      >
        <input {...getInputProps()} />
        <div className={`p-4 rounded-2xl mb-3 shadow-sm transition-transform duration-300 ${isDragActive ? 'scale-110 -translate-y-2' : ''} ${
          isDragAccept ? 'bg-[#c8ff00] text-slate-900' : 
          isDragReject ? 'bg-red-500 text-white' : 
          'bg-white text-slate-400'
        }`}>
          <UploadCloud className="h-8 w-8" />
        </div>
        <p className="text-sm font-bold text-slate-700">
          {isDragAccept ? "Drop files now..." : 
           isDragReject ? "File type not supported" : 
           "Drag & drop resume here or click to browse"}
        </p>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
          Accepts .PDF, .DOCX, .TXT (Max 10MB)
        </p>
      </div>

      {uploads.length > 0 && (
        <div className="space-y-3 mt-8">
          <div className="flex items-center justify-between px-2">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
              Processing Queue
              {uploads.some(u => u.status === 'uploading' || u.status === 'processing_ai') && (
                <span className="w-2 h-2 rounded-full bg-[#c8ff00] animate-pulse" />
              )}
            </h4>
            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-md">
              {uploads.filter(u => u.status === 'success').length} / {uploads.length} Done
            </span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 pb-1">
            {uploads.map((upload, idx) => (
              <div key={upload.id} className="relative z-10 bg-white border border-slate-100 shadow-sm rounded-2xl p-4 overflow-hidden group">
                {/* Background Progress Bar */}
                {upload.status === 'uploading' && (
                  <div 
                    className="absolute inset-y-0 left-0 bg-blue-50/50 -z-10 transition-all duration-300 ease-out" 
                    style={{ width: `${upload.progress}%` }} 
                  />
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 w-full preview-container">
                    <div className="h-10 w-10 shrink-0 rounded-xl bg-slate-50 flex items-center justify-center border border-slate-100 text-slate-400">
                      <FileIcon className="h-5 w-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-bold text-slate-800 truncate pr-4">
                          {upload.file.name}
                        </p>
                        
                        <div className="flex items-center gap-2 shrink-0">
                           <span className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                             {getStatusIcon(upload.status)}
                             {getStatusText(upload.status)}
                           </span>
                        </div>
                      </div>

                      {/* Detailed Progress UI */}
                      {upload.status === 'uploading' && (
                        <div className="flex items-center gap-4 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          <span>{upload.progress}%</span>
                          <span>{upload.speed}</span>
                          <span className="text-blue-500">{upload.timeRemaining}</span>
                        </div>
                      )}

                      {/* Preview / Post-Processing UI */}
                      {(upload.status === 'processing_text' || upload.status === 'processing_ai') && (
                        <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2 overflow-hidden">
                          <div className={`h-full bg-[#c8ff00] ${upload.status === 'processing_text' ? 'w-1/3' : 'w-2/3 animate-pulse'}`} />
                        </div>
                      )}

                      {upload.status === 'success' && upload.candidateData && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {upload.candidateData.skills?.slice(0, 3).map((skill: string) => (
                            <span key={skill} className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100">
                              {skill}
                            </span>
                          ))}
                          {upload.candidateData.skills?.length > 3 && (
                            <span className="px-2 py-0.5 bg-slate-50 text-slate-500 text-[10px] font-bold rounded-md border border-slate-100">
                              +{upload.candidateData.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {upload.status === 'error' && (
                        <p className="text-xs font-medium text-red-500 mt-1">{upload.errorText}</p>
                      )}
                    </div>
                  </div>

                  <button 
                    onClick={() => cancelUpload(idx)} 
                    className="p-1.5 text-slate-400 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
