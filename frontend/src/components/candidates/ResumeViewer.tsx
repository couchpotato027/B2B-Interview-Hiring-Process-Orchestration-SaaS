'use client';

import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Loader2, Plus, Minus, Download, RefreshCw, FileText } from 'lucide-react';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configure worker for react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface ResumeViewerProps {
  url: string | null;
  onRefreshParse?: () => void;
  className?: string;
}

export function ResumeViewer({ url, onRefreshParse, className }: ResumeViewerProps) {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function handleZoomIn() {
    setScale(s => Math.min(s + 0.2, 3.0));
  }

  function handleZoomOut() {
    setScale(s => Math.max(s - 0.2, 0.5));
  }

  if (!url) {
    return (
      <div className={`flex flex-col items-center justify-center p-12 text-center text-slate-500 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] ${className}`}>
        <FileText className="h-16 w-16 opacity-30 mb-4" />
        <p className="text-sm font-medium">No resume available to preview</p>
      </div>
    );
  }

  return (
    <div className={`relative group bg-slate-900 rounded-[2.5rem] overflow-hidden aspect-[4/5] shadow-2xl flex flex-col ${className}`}>
      
      {/* Controls Overlay */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-[-10px] group-hover:translate-y-0">
        <div className="flex bg-slate-900/80 backdrop-blur-xl border border-white/10 p-2 rounded-2xl gap-1 shadow-lg">
          <button onClick={handleZoomIn} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors" title="Zoom In"><Plus className="h-4 w-4" /></button>
          <button onClick={handleZoomOut} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors" title="Zoom Out"><Minus className="h-4 w-4" /></button>
          <div className="w-px bg-white/20 mx-1" />
          <button onClick={() => window.open(url, '_blank')} className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors" title="Download"><Download className="h-4 w-4" /></button>
          {onRefreshParse && (
            <>
              <div className="w-px bg-white/20 mx-1" />
              <button onClick={onRefreshParse} className="p-2 rounded-xl hover:bg-white/10 text-[#c8ff00] transition-colors" title="Re-parse Data"><RefreshCw className="h-4 w-4" /></button>
            </>
          )}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-900">
          <Loader2 className="h-8 w-8 text-[#c8ff00] animate-spin" />
        </div>
      )}

      {/* PDF Document Viewer */}
      <div className="flex-1 overflow-auto bg-slate-800">
        <div className="min-h-full flex items-center justify-center p-4">
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            loading={null}
            className="shadow-xl"
            error={<div className="text-white p-4">Failed to load PDF. Please try downloading it instead.</div>}
          >
            <Page
              pageNumber={pageNumber}
              scale={scale}
              renderTextLayer={true}
              renderAnnotationLayer={true}
              className="bg-white transition-transform duration-200"
            />
          </Document>
        </div>
      </div>

      {/* Footer Controls */}
      {numPages && numPages > 1 && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl p-1 shadow-lg">
          <button 
            disabled={pageNumber <= 1}
            onClick={() => setPageNumber(p => p - 1)}
            className="px-4 py-2 text-white font-bold text-sm disabled:opacity-30 transition-opacity"
          >
            Prev
          </button>
          <div className="px-4 py-2 text-white/70 font-semibold text-sm border-x border-white/10">
            {pageNumber} / {numPages}
          </div>
          <button 
            disabled={pageNumber >= numPages}
            onClick={() => setPageNumber(p => p + 1)}
            className="px-4 py-2 text-white font-bold text-sm disabled:opacity-30 transition-opacity"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
