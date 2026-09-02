import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { auraEngine } from '../../engine/auraql';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDatasetImported: (tableName: string, rowCount: number) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onDatasetImported
}) => {
  const [dragOver, setDragOver] = useState<boolean>(false);
  const [status, setStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [fileDetails, setFileDetails] = useState<{ name: string; count: number } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (file: File) => {
    setStatus('parsing');
    setErrorMsg('');

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = e.target?.result as string;
        let rows: Record<string, any>[] = [];
        const tableName = file.name.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase();

        if (file.name.endsWith('.json')) {
          rows = JSON.parse(text);
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
          if (lines.length < 2) throw new Error('CSV must contain a header row and at least one data row');
          const headers = parseCsvLine(lines[0]).map((h) => h.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || 'col');

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
      setErrorMsg('Failed reading file from disk');
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-dark-950/85 backdrop-blur-sm">
      <div className="glass-card rounded-none p-6 max-w-md w-full border border-slate-300 dark:border-white/[0.12] bg-white dark:bg-dark-950 shadow-2xl relative">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-none bg-brand-50 dark:bg-brand-950 border border-brand-200 dark:border-brand-500/40 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Upload className="w-3.5 h-3.5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono">Import Custom Dataset</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Loads into AuraQL in-memory buffer (100% private)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-none text-slate-400 hover:text-slate-900 dark:hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Sharp Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border border-dashed rounded-none p-7 flex flex-col items-center justify-center text-center transition-all ${
            dragOver
              ? 'border-brand-500 bg-brand-50/50 dark:bg-brand-950/40 glow-purple-sm'
              : 'border-slate-300 hover:border-brand-500/50 bg-slate-50 dark:bg-dark-900/80 dark:border-white/10'
          }`}
        >
          <FileText className="w-8 h-8 text-brand-600 dark:text-brand-400 mb-2.5" />
          <p className="text-xs font-bold text-slate-900 dark:text-white mb-1 font-mono">
            Drag & drop CSV or JSON file here
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3.5">
            Auto-detects data types and binds to WebMCP tools
          </p>

          <label className="px-3.5 py-1.5 rounded-none bg-brand-600 hover:bg-brand-500 text-white font-mono text-xs cursor-pointer transition-colors shadow-sm shadow-brand-600/30 border border-brand-400/40">
            <span>Browse Local Drive</span>
            <input
              type="file"
              accept=".csv,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleFileUpload(e.target.files[0]);
                }
              }}
            />
          </label>
        </div>

        {/* Status */}
        {status === 'parsing' && (
          <div className="mt-3 p-2.5 rounded-none bg-brand-50 dark:bg-brand-950/60 border border-brand-200 dark:border-brand-500/30 text-xs text-brand-700 dark:text-brand-300 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-none bg-brand-500 animate-ping" />
            <span>Parsing into AuraQL columnar buffer...</span>
          </div>
        )}

        {status === 'done' && fileDetails && (
          <div className="mt-3 p-2.5 rounded-none bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-500/30 text-xs text-emerald-700 dark:text-emerald-300 flex items-center justify-between font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Loaded: <strong>{fileDetails.name}</strong> ({fileDetails.count} rows)</span>
            </div>
            <button
              onClick={onClose}
              className="px-2.5 py-0.5 rounded-none bg-emerald-600 text-white text-[10px] font-bold"
            >
              Done
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-3 p-2.5 rounded-none bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-500/30 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-1.5 font-mono">
            <AlertCircle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
