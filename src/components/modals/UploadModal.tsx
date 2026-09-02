import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '../../engine/duckdb';

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
        } else {
          // Simple robust CSV parser
          const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
          if (lines.length < 2) throw new Error('CSV must contain header and at least one row');
          const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));

          for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
            const row: Record<string, any> = {};
            headers.forEach((h, idx) => {
              const val = values[idx];
              const numVal = Number(val);
              row[h] = !isNaN(numVal) && val !== '' ? numVal : val;
            });
            rows.push(row);
          }
        }

        // Register in DuckDB
        db.registerCustomTable(tableName, rows);
        setFileDetails({ name: tableName, count: rows.length });
        setStatus('done');
        onDatasetImported(tableName, rows.length);
      } catch (err: any) {
        setStatus('error');
        setErrorMsg(err.message || 'Failed to parse file');
      }
    };

    reader.onerror = () => {
      setStatus('error');
      setErrorMsg('Failed reading file');
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-dark-950/80 backdrop-blur-sm">
      <div className="glass-card rounded-2xl p-6 max-w-lg w-full border border-white/[0.1] shadow-2xl relative">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-950 border border-brand-500/30 flex items-center justify-center text-brand-400">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono">Import Custom Dataset</h3>
              <p className="text-xs text-slate-400">Loads into DuckDB-Wasm memory (100% private)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dropzone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all ${
            dragOver
              ? 'border-brand-500 bg-brand-950/30 glow-purple-sm'
              : 'border-white/10 hover:border-brand-500/40 bg-dark-900/60'
          }`}
        >
          <FileText className="w-10 h-10 text-brand-400 mb-3" />
          <p className="text-sm font-semibold text-white mb-1">
            Drag & drop CSV or JSON file here
          </p>
          <p className="text-xs text-slate-400 mb-4">
            Supports standard comma-separated tabular files up to 500,000 rows
          </p>

          <label className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-medium text-xs font-mono cursor-pointer transition-colors shadow-md shadow-brand-600/30">
            <span>Browse Computer</span>
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

        {/* Feedback states */}
        {status === 'parsing' && (
          <div className="mt-4 p-3 rounded-xl bg-brand-950/60 border border-brand-500/30 text-xs text-brand-300 flex items-center gap-2 font-mono">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-ping" />
            <span>Ingesting table into DuckDB-Wasm columnar buffer...</span>
          </div>
        )}

        {status === 'done' && fileDetails && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between font-mono">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Loaded table: <strong>{fileDetails.name}</strong> ({fileDetails.count} rows)</span>
            </div>
            <button
              onClick={onClose}
              className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-[11px] font-bold"
            >
              Done
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="mt-4 p-3 rounded-xl bg-rose-950/60 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>
    </div>
  );
};
