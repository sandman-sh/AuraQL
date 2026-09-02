import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { StudioWorkspace } from './components/dashboard/StudioWorkspace';
import { Database, Sparkles, Cpu } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

  // Sync with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      if (window.location.hash === '#/app') {
        setCurrentView('app');
      } else {
        setCurrentView('landing');
      }
    };

    if (window.location.hash === '#/app') {
      setCurrentView('app');
    }

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleLaunchApp = () => {
    setIsInitializing(true);
    setTimeout(() => {
      setIsInitializing(false);
      setCurrentView('app');
      window.location.hash = '#/app';
    }, 600);
  };

  const handleReturnHome = () => {
    setCurrentView('landing');
    window.location.hash = '#/';
  };

  return (
    <>
      {/* Sleek Workspace Transition / Loading Gate */}
      {isInitializing && (
        <div className="fixed inset-0 z-50 bg-dark-950/90 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 selection:bg-brand-500/30">
          <div className="relative mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500 to-purple-800 flex items-center justify-center text-white shadow-xl shadow-brand-500/30 border border-brand-400/40 animate-pulse">
              <Database className="w-8 h-8" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </div>

          <h3 className="text-xl font-bold text-white mb-2 font-mono tracking-tight">
            Mounting Aura Studio Workspace
          </h3>
          <p className="text-sm text-slate-400 max-w-sm mb-4">
            Instantiating DuckDB-Wasm columnar buffer & registering WebMCP tool schema...
          </p>

          <div className="w-48 h-1.5 bg-dark-800 rounded-full overflow-hidden border border-white/10">
            <div className="h-full bg-gradient-to-r from-brand-600 via-brand-400 to-purple-300 rounded-full animate-shimmer w-full" />
          </div>
        </div>
      )}

      {/* Primary Route Views */}
      {currentView === 'landing' ? (
        <LandingPage onLaunchApp={handleLaunchApp} />
      ) : (
        <StudioWorkspace onReturnHome={handleReturnHome} />
      )}
    </>
  );
};
export default App;
