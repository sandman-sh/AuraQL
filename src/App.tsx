import React, { useState, useEffect } from 'react';
import { LandingPage } from './components/landing/LandingPage';
import { StudioWorkspace } from './components/dashboard/StudioWorkspace';
import { AuraLogo } from './components/common/AuraLogo';
import { Sparkles } from 'lucide-react';

export const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<'landing' | 'app'>('landing');
  const [isInitializing, setIsInitializing] = useState<boolean>(false);

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
    }, 500);
  };

  const handleReturnHome = () => {
    setCurrentView('landing');
    window.location.hash = '#/';
  };

  return (
    <>
      {/* Sharp Workspace Transition / Loading Gate */}
      {isInitializing && (
        <div className="fixed inset-0 z-50 bg-white/95 dark:bg-dark-950/95 backdrop-blur-md flex flex-col items-center justify-center text-center p-6 selection:bg-brand-500/30 transition-colors">
          <div className="relative mb-6">
            <AuraLogo size={48} glow={true} />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-none bg-emerald-500 flex items-center justify-center text-white shadow-md">
              <Sparkles className="w-3 h-3" />
            </div>
          </div>

          <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 font-mono tracking-tight">
            Mounting Aura Studio Workspace
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-4 font-mono">
            Compiling AuraQL columnar buffers & binding WebMCP document.modelContext...
          </p>

          <div className="w-48 h-1 bg-slate-200 dark:bg-dark-900 rounded-none overflow-hidden border border-slate-300 dark:border-white/10">
            <div className="h-full bg-gradient-to-r from-brand-600 via-brand-400 to-purple-300 rounded-none animate-shimmer w-full" />
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
