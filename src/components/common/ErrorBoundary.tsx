import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { AuraLogo } from './AuraLogo';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Aura Analytics] Uncaught error caught by boundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.hash = '#/';
    window.location.reload();
  };

  private handleGoHome = () => {
    window.location.hash = '#/';
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-dark-950 text-slate-900 dark:text-white flex flex-col items-center justify-center p-6 font-mono selection:bg-brand-500/30">
          <div className="glass-card max-w-lg w-full p-8 border border-rose-500/40 rounded-none shadow-2xl text-center space-y-5">
            <div className="flex justify-center mb-2">
              <AuraLogo size={36} />
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-950/80 border border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-400 text-xs font-bold uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Runtime Recovery Intercept</span>
            </div>

            <div>
              <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-white mb-2">
                Aura Studio Encountered an Error
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 font-sans leading-relaxed">
                The application intercepted a runtime exception. In-memory data is isolated to protect browser state.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-slate-900 text-rose-400 text-[11px] text-left border border-slate-800 rounded-none overflow-x-auto max-h-32">
                <code>{this.state.error.message || String(this.state.error)}</code>
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <button
                onClick={this.handleReload}
                className="btn-sharp w-full sm:w-auto px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold flex items-center justify-center gap-2 border border-brand-400/40 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleGoHome}
                className="btn-sharp w-full sm:w-auto px-4 py-2 bg-slate-200 dark:bg-dark-900 hover:bg-slate-300 dark:hover:bg-dark-800 text-slate-800 dark:text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 border border-slate-300 dark:border-white/10"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Return to Landing</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
