import React, { useState } from 'react';
import {
  Upload,
  X,
  Database,
  Sparkles,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  TrendingUp,
  BarChart2
} from 'lucide-react';
import { auraEngine } from '../../engine/auraql';
import { DATASETS_METADATA } from '../../engine/datasets';

interface DatasetSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDataset: (tableName: string) => void;
  canClose?: boolean;
}

export const DatasetSelectorModal: React.FC<DatasetSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectDataset,
  canClose = true
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'parsing' | 'done' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  // Simple CSV quote-aware line splitter
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

  const processFile = async (file: File) => {
    setUploadStatus('parsing');
    setErrorMsg('');

    try {
      const text = await file.text();
      if (!text || !text.trim()) {
        throw new Error('Selected file is empty.');
      }

      const tableName = file.name
        .replace(/\.[^/.]+$/, '')
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .toLowerCase() || 'custom_table';

      let rows: Record<string, any>[] = [];

      if (file.name.endsWith('.json')) {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error('JSON file must be an array of objects.');
        }
        rows = parsed;
      } else {
        const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
        if (lines.length < 2) {
          throw new Error('CSV must contain a header row and at least one data row.');
        }
        const rawHeaders = parseCsvLine(lines[0]);
        const headers = rawHeaders.map(
          (h, idx) => h.replace(/[^a-zA-Z0-9_]/g, '_').toLowerCase() || `col_${idx + 1}`
        );

        for (let i = 1; i < lines.length; i++) {
          const values = parseCsvLine(lines[i]);
          if (values.length === 0 || (values.length === 1 && values[0] === '')) continue;
          const rowObj: Record<string, any> = {};
          headers.forEach((h, idx) => {
            const rawVal = values[idx] ?? '';
            if (rawVal === '') {
              rowObj[h] = null;
            } else if (!isNaN(Number(rawVal)) && rawVal.trim() !== '') {
              rowObj[h] = Number(rawVal);
            } else if (rawVal.toLowerCase() === 'true') {
              rowObj[h] = true;
            } else if (rawVal.toLowerCase() === 'false') {
              rowObj[h] = false;
            } else {
              rowObj[h] = rawVal;
            }
          });
          rows.push(rowObj);
        }
      }

      if (rows.length === 0) {
        throw new Error('No valid records found in file.');
      }

      auraEngine.registerCustomTable(tableName, rows, true);
      setUploadStatus('done');
      setTimeout(() => {
        onSelectDataset(tableName);
        onClose();
      }, 500);
    } catch (err: any) {
      setUploadStatus('error');
      setErrorMsg(err.message || 'Failed to parse dataset.');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleLoadSample = (sampleKey: string) => {
    auraEngine.loadPreloadedDataset(sampleKey);
    onSelectDataset(sampleKey);
    onClose();
  };

  const sampleDatasets = [
    {
      key: 'ecommerce_sales',
      title: 'E-Commerce Sales',
      icon: '🛒',
      rows: '15 records',
      desc: 'Orders, line items, unit economics, gross margins, buyer regions',
      badge: 'Relational'
    },
    {
      key: 'saas_churn_metrics',
      title: 'SaaS Account Churn',
      icon: '📈',
      rows: '10 records',
      desc: 'B2B subscription health, seat utilization, NPS, churn risk tiers',
      badge: 'Cohort Risk'
    },
    {
      key: 'cloud_software_financials',
      title: 'Cloud Software Comps',
      icon: '☁️',
      rows: '8 records',
      desc: 'Public cloud software metrics: quarterly revenue ($M), YoY growth, margins',
      badge: 'Public Comps'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-white dark:bg-dark-950 border-2 border-black dark:border-purple-500/70 shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-brand-600 text-white rounded-none shadow-sm">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-slate-900 dark:text-white font-mono flex items-center gap-2">
                <span>Select Dataset to Begin</span>
                <span className="text-[10px] px-2 py-0.5 bg-brand-100 dark:bg-brand-950 text-brand-700 dark:text-brand-300 font-semibold border border-brand-300 dark:border-brand-500/30">
                  Zero-Server OLAP
                </span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                No preloaded data is running. Upload your own file or choose a demo dataset to test:
              </p>
            </div>
          </div>

          {canClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
              title="Close (Open empty workspace)"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-6 font-mono text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* OPTION 1: Upload Your Own Dataset */}
            <div className="border-2 border-dashed border-slate-300 dark:border-purple-500/40 bg-slate-50/50 dark:bg-dark-900/50 p-4 sm:p-5 flex flex-col justify-between hover:border-brand-500 transition-colors group">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                    <Upload className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                    <span>Option A: Upload Your Data</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-300 dark:border-emerald-600/40">
                    100% RAM Privacy
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
                  Drag and drop any enterprise tabular CSV or JSON. Schema is inferred on the fly with sub-10ms query execution.
                </p>

                {/* Dropzone */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`p-6 border border-slate-200 dark:border-white/10 text-center transition-all bg-white dark:bg-dark-950 ${
                    isDragging ? 'border-brand-500 bg-brand-50/20 dark:bg-brand-950/20 scale-[0.99]' : ''
                  }`}
                >
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-brand-600 dark:text-brand-400 mb-2 opacity-80" />
                  <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1">
                    Drop .csv or .json here
                  </p>
                  <p className="text-[10px] text-slate-400 font-sans mb-3">
                    or select from your computer
                  </p>

                  <label className="inline-block px-3 py-1.5 bg-slate-900 hover:bg-brand-600 dark:bg-dark-800 dark:hover:bg-brand-600 text-white text-[11px] font-mono cursor-pointer transition-colors shadow-sm">
                    <span>Browse Files</span>
                    <input
                      type="file"
                      accept=".csv,.json"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {uploadStatus === 'parsing' && (
                  <div className="mt-3 p-2 bg-brand-50 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 text-[11px] text-center animate-pulse">
                    Parsing schema & compiling columnar heap...
                  </div>
                )}
                {uploadStatus === 'done' && (
                  <div className="mt-3 p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-[11px] text-center font-bold">
                    ✓ Dataset loaded successfully! Opening studio...
                  </div>
                )}
                {uploadStatus === 'error' && (
                  <div className="mt-3 p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 text-[11px] text-center">
                    ✕ {errorMsg}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Zero cloud upload. Your data never leaves this browser tab.</span>
              </div>
            </div>

            {/* OPTION 2: Load Demo Dataset */}
            <div className="border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-dark-900/50 p-4 sm:p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2 font-mono">
                    <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                    <span>Option B: Load Demo Dataset</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 font-bold border border-brand-300 dark:border-brand-500/30">
                    1-Click Test
                  </span>
                </div>
                <p className="text-[11px] font-sans text-slate-600 dark:text-slate-400 leading-relaxed mb-3">
                  Explore pre-seeded sample data to test SQL aggregations, anomaly detection, and WebMCP agent commands:
                </p>

                <div className="space-y-2.5">
                  {sampleDatasets.map((ds) => (
                    <div
                      key={ds.key}
                      onClick={() => handleLoadSample(ds.key)}
                      className="p-3 bg-white dark:bg-dark-950 border border-slate-200 dark:border-white/10 hover:border-brand-500 hover:shadow-md cursor-pointer transition-all group flex items-center justify-between"
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{ds.icon}</span>
                          <span className="font-bold text-xs text-slate-900 dark:text-white font-mono group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors truncate">
                            {ds.title}
                          </span>
                          <span className="text-[9px] text-slate-500 dark:text-slate-400 font-sans">
                            ({ds.rows})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 font-sans mt-1 line-clamp-1">
                          {ds.desc}
                        </p>
                      </div>

                      <button
                        type="button"
                        className="px-2.5 py-1 text-[10px] font-mono bg-slate-100 dark:bg-dark-850 group-hover:bg-brand-600 text-slate-700 dark:text-slate-300 group-hover:text-white transition-colors shrink-0 flex items-center gap-1"
                      >
                        <span>Load</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-white/10 flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-400 font-sans">
                <Zap className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <span>Pre-formatted schemas ready for Claude & ChatGPT WebMCP tools.</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-dark-900/80 flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400">
          <span>Engine Status: Vectorized Columnar Heap Ready</span>
          {canClose && (
            <button
              onClick={onClose}
              className="text-slate-600 dark:text-slate-300 hover:underline text-xs"
            >
              Skip to Empty Studio →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
