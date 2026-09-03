import React, { useState } from 'react';
import { Upload, X, CheckCircle, AlertCircle, FileText, Sparkles, Database, Layers } from 'lucide-react';
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
  const [importedSummary, setImportedSummary] = useState<{
    tables: { name: string; count: number }[];
    totalRows: number;
  } | null>(null);

  if (!isOpen) return null;

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

  const processSingleFile = (file: File): Promise<{ name: string; count: number }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          if (!text || !text.trim()) {
            throw new Error(`File ${file.name} is empty`);
          }

          let rows: Record<string, any>[] = [];
          const tableName = file.name
            .replace(/\.[^/.]+$/, '')
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .toLowerCase() || 'custom_table';

          if (file.name.endsWith('.json')) {
            const parsed = JSON.parse(text);
            if (!Array.isArray(parsed)) {
              throw new Error(`JSON in ${file.name} must be an array of objects`);
            }
            rows = parsed;
          } else {
            const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
            if (lines.length < 2) {
              throw new Error(`${file.name} must contain a header row and at least one data row`);
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
            throw new Error(`No valid records found in ${file.name}`);
          }

          // Register table in AuraQL columnar memory
          auraEngine.registerCustomTable(tableName, rows);
          resolve({ name: tableName, count: rows.length });
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsText(file);
    });
  };

  const handleFilesProcess = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setStatus('parsing');
    setErrorMsg('');

    try {
      const results: { name: string; count: number }[] = [];
      let totalRows = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.name.endsWith('.csv') || file.name.endsWith('.json')) {
          const res = await processSingleFile(file);
          results.push(res);
          totalRows += res.count;
        }
      }

      if (results.length === 0) {
        throw new Error('Please select valid .csv or .json files');
      }

      setImportedSummary({ tables: results, totalRows });
      setStatus('done');
      // Set the first imported table active
      onDatasetImported(results[0].name, results[0].count);
    } catch (err: any) {
      setStatus('error');
      setErrorMsg(err.message || 'Failed parsing one or more files');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesProcess(e.dataTransfer.files);
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 selection:bg-brand-500/30">
      <div className="w-full max-w-lg bg-white dark:bg-dark-950 border border-slate-300 dark:border-white/10 rounded-none shadow-2xl p-6 relative transition-colors">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-none hover:bg-slate-100 dark:hover:bg-dark-900 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-none bg-brand-50 dark:bg-brand-950 flex items-center justify-center border border-brand-200 dark:border-brand-500/40 text-brand-600 dark:text-brand-400">
            <Upload className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white font-mono tracking-tight flex items-center gap-2">
              <span>Ingest Datasets into AuraQL</span>
              <span className="text-[9px] px-1.5 py-0.5 bg-brand-100 dark:bg-brand-900/60 text-brand-700 dark:text-brand-300 font-bold uppercase">
                Multi-Table Support
              </span>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Upload single or multiple CSV/JSON tables • Zero-server in-memory storage
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
              Drop single or multiple CSV / JSON files here, or <span className="text-brand-600 dark:text-brand-400 underline">browse</span>
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
              Supports selecting multiple files simultaneously • Vectorized into client RAM
            </p>
            <input
              id="file-input-sharp"
              type="file"
              accept=".csv,.json"
              multiple
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFilesProcess(e.target.files);
                }
              }}
            />
          </div>
        )}

        {status === 'parsing' && (
          <div className="p-8 text-center border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 font-mono">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent animate-spin mx-auto mb-3" />
            <p className="text-xs text-slate-800 dark:text-slate-200 font-semibold mb-1">
              Ingesting & Vectorizing Tables...
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">
              Inferring schemas, types, and compiling columnar memory buffers
            </p>
          </div>
        )}

        {status === 'done' && importedSummary && (
          <div className="p-4 border border-emerald-300 dark:border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/30 font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>
                Successfully Ingested {importedSummary.tables.length} Table{importedSummary.tables.length > 1 ? 's' : ''}!
              </span>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1.5 py-1">
              {importedSummary.tables.map((t) => (
                <div
                  key={t.name}
                  className="flex items-center justify-between p-2 bg-white dark:bg-dark-900 border border-emerald-200 dark:border-emerald-500/20 text-[11px]"
                >
                  <span className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Database className="w-3 h-3 text-brand-600 dark:text-brand-400" />
                    <span>{t.name}</span>
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-mono">
                    {t.count.toLocaleString()} rows
                  </span>
                </div>
              ))}
            </div>

            <div className="text-[10px] text-slate-600 dark:text-slate-400 font-sans border-t border-emerald-200 dark:border-emerald-500/20 pt-2 flex items-center justify-between">
              <span>Total rows loaded: <strong>{importedSummary.totalRows.toLocaleString()}</strong></span>
              <span className="text-brand-600 dark:text-brand-400 font-mono">Registered in WebMCP</span>
            </div>

            <div className="pt-1 flex gap-2">
              <button
                onClick={onClose}
                className="btn-sharp w-full py-2 bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs font-mono transition-colors shadow-sm"
              >
                Open Studio Workspace
              </button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="p-4 border border-rose-300 dark:border-rose-500/30 bg-rose-50/60 dark:bg-rose-950/30 font-mono text-xs space-y-3">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Ingestion Error</span>
            </div>
            <p className="text-[11px] text-slate-700 dark:text-slate-300 font-sans">
              {errorMsg}
            </p>
            <button
              onClick={() => setStatus('idle')}
              className="btn-sharp w-full py-1.5 bg-slate-200 hover:bg-slate-300 dark:bg-dark-800 dark:hover:bg-dark-700 text-slate-800 dark:text-slate-200 text-xs font-mono font-semibold"
            >
              Try Another File
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
