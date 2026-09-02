import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Sparkles } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetImported: (tableName: string, count: number) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetImported
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [fileDetails, setFileDetails] = useState<{ name: string; count: number } | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = (file: File) => {
    setStatus('parsing');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text || !text.trim()) {
          throw new Error('File is empty');
        }

        let rows: Record<string, any>[] = [];
        const tableName = file.name
          .replace(/\.[^/.]+$/, '')
          .replace(/[^a-zA-Z0-9_]/g, '_')
          .toLowerCase() || 'custom_table';

        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (!Array.isArray(parsed)) {
            throw new Error('JSON data must be an array of objects');
          }
          rows = parsed;
        } else {
          // Quote-aware CSV line parser
          const parseCsvLine = (line: string): string[] => {
            const result: string[] = [];
            let current = '';
            let inQuotes = false;
            for (let c = 0; c < line.length; c++) {
              const char = line[c];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
                current = '';
              } else {
                current += char;
              }
            }
            result.push(current.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
            return result;
          };

          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) {
            throw new Error('CSV must contain a header row and at least one data row');
          }

          const rawHeaders = parseCsvLine(lines[0]);
          const headers = rawHeaders.map(
            (h, idx) => h.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || `col_${idx + 1}`
          );

          for (let i = 1; i < lines.length; i++) {
            const values = parseCsvLine(lines[i]);
            const row: Record<string, any> = {};
            headers.forEach((h, idx) => {
              const val = values[idx] ?? '';
              const numVal = Number(val);
              row[h] = !isNaN(numVal) && val !== '' ? numVal : val;
            });
            rows.push(row);
          }
        }

        if (rows.length === 0) {
          throw new Error('No valid records found in file');
        }

        // Register in AuraQL Engine
        auraEngine.registerCustomTable(tableName, rows);
        setFileDetails({ name: tableName, count: rows.length });
        setStatus('done');
        onDatasetImported(tableName, rows.length);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to parse data file');
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setErrorMsg('Failed reading the file from disk');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="glass-card rounded-none max-w-md w-full p-6 border border-slate-300 dark:border-white/10 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-none bg-brand-50 dark:bg-brand-950 flex items-center justify-center border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight">
              Ingest Dataset into AuraQL
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Pure client-side in-memory analytics • Zero server storage
            </p>
          </div>
        </div>

        {status === 'idle' && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`border-2 border-dashed p-8 text-center transition-all cursor-pointer rounded-none ${
              isDragging
                ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40'
                : 'border-slate-300 dark:border-white/10 hover:border-brand-500/50 bg-slate-50/50 dark:bg-dark-900/40'
            }`}
            onClick={() => document.getElementById('file-input-sharp')?.click()}
          >
            <FileText className="w-8 h-8 mx-auto text-slate-400 mb-3" />
            <p className="text-xs font-mono text-slate-700 dark:text-slate-300 mb-1 font-semibold">
              Drop CSV or JSON here, or <span className="text-brand-600 dark:text-brand-400 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Supports .csv, .json • Evaluated in client RAM via vectorized buffers
            </p>
            <input
              id="file-input-sharp"
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileProcess(e.target.files[0]);
                }
              }}
            />
          </div>
        )}

        {status === 'parsing' && (
          <div className="p-8 text-center space-y-3 font-mono">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent animate-spin mx-auto" />
            <p className="text-xs text-slate-700 dark:text-slate-300">
              Compiling in-memory columnar vectors...
            </p>
          </div>
        )}

        {status === 'done' && fileDetails && (
          <div className="p-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/40 text-left font-mono space-y-3">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <CheckCircle className="w-4 h-4" />
              <span>Dataset Successfully Ingested!</span>
            </div>
            <div className="text-[11px] text-slate-700 dark:text-slate-300 space-y-1">
              <div>Table Name: <code className="text-brand-600 dark:text-brand-400">{fileDetails.name}</code></div>
              <div>Record Count: <strong>{fileDetails.count.toLocaleString()}</strong> rows</div>
              <div>WebMCP Registration: <strong>Active</strong></div>
            </div>
            <button
              onClick={onClose}
              className="btn-sharp w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs font-bold transition-all shadow-md shadow-brand-600/30"
            >
              Enter Workspace & Explore
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-500/40 text-left font-mono space-y-3">
            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-xs">
              <AlertCircle className="w-4 h-4" />
              <span>Ingestion Failed</span>
            </div>
            <p className="text-[11px] text-rose-700 dark:text-rose-300">{errorMsg}</p>
            <button
              onClick={() => setStatus('idle')}
              className="btn-sharp w-full py-2 bg-slate-200 dark:bg-dark-900 hover:bg-slate-300 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold"
            >
              Try Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
