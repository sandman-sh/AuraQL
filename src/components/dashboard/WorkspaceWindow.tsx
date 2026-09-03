import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GripVertical, Maximize2, Minimize2, ChevronDown, ChevronUp } from 'lucide-react';

interface WorkspaceWindowProps {
  id: string;
  title: string;
  icon: React.ReactNode;
  statusBadge?: string;
  widthPct?: number; // Dynamic width percentage (default 50)
  heightPx?: number; // Optional controlled height
  onHeightChange?: (height: number) => void;
  isFullWidth?: boolean;
  onSetWidth?: (pct: number) => void;
  isMinimized: boolean;
  onToggleMinimize: () => void;
  isMaximized: boolean;
  onToggleMaximize: () => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onDragEnd: (e: React.DragEvent) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
}

export const WorkspaceWindow: React.FC<WorkspaceWindowProps> = ({
  id,
  title,
  icon,
  statusBadge,
  widthPct = 50,
  heightPx,
  onHeightChange,
  isFullWidth = false,
  onSetWidth,
  isMinimized,
  onToggleMinimize,
  isMaximized,
  onToggleMaximize,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isDragOver,
  headerActions,
  children
}) => {
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [internalHeight, setInternalHeight] = useState<number | undefined>(heightPx);
  const startYRef = useRef(0);
  const startHeightRef = useRef(0);
  const windowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heightPx !== undefined) {
      setInternalHeight(heightPx);
    }
  }, [heightPx]);

  const handleResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizingHeight(true);
    startYRef.current = e.clientY;
    const currentH = windowRef.current ? windowRef.current.offsetHeight : (internalHeight || 440);
    startHeightRef.current = currentH;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = 'ns-resize';
  }, [internalHeight]);

  useEffect(() => {
    if (!isResizingHeight) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startYRef.current;
      const rawHeight = startHeightRef.current + deltaY;
      const clampedHeight = Math.min(1400, Math.max(220, Math.round(rawHeight)));
      setInternalHeight(clampedHeight);
      if (onHeightChange) {
        onHeightChange(clampedHeight);
      }
    };

    const handleMouseUp = () => {
      setIsResizingHeight(false);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isResizingHeight, onHeightChange]);

  return (
    <div
      ref={windowRef}
      draggable={!isResizingHeight}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      style={{
        // Dynamic width percentage
        flex: isFullWidth ? '1 1 100%' : `0 0 ${widthPct}%`,
        maxWidth: isFullWidth ? '100%' : `${widthPct}%`,
        // Dynamic height if resized or controlled
        height: isMaximized
          ? undefined
          : isMinimized
          ? undefined
          : internalHeight
          ? `${internalHeight}px`
          : undefined,
        minHeight: isMinimized ? undefined : '240px',
        contain: 'paint layout'
      }}
      className={`w-full transition-all duration-150 flex flex-col min-w-0 overflow-hidden ${
        isMaximized
          ? 'fixed inset-2 sm:inset-6 z-50 bg-white dark:bg-dark-950 border-2 border-black dark:border-purple-500 shadow-2xl overflow-y-auto !w-auto !max-w-none !flex-none !h-auto'
          : 'relative border-2 border-black dark:border-purple-500 shadow-md dark:shadow-[0_0_16px_rgba(168,85,247,0.22)]'
      } ${
        isDragging
          ? 'opacity-30 scale-[0.98] border-2 border-dashed border-brand-500'
          : ''
      } ${
        isDragOver
          ? 'ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-dark-950 scale-[1.005]'
          : ''
      }`}
    >
      {/* Window Environment Header Bar */}
      <div className="h-10 px-3 bg-slate-100 dark:bg-dark-900 border-b-2 border-black dark:border-purple-500 flex items-center justify-between select-none shrink-0 transition-colors shadow-sm min-w-0">
        {/* Left: Drag Handle & Title */}
        <div className="flex items-center gap-2 min-w-0 overflow-hidden">
          <div
            className="cursor-grab active:cursor-grabbing p-1 text-slate-500 dark:text-slate-400 hover:text-black dark:hover:text-purple-400 hover:bg-slate-200 dark:hover:bg-dark-800 transition-colors shrink-0"
            title="Drag to swap or rearrange window position"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <div className="flex items-center gap-2 text-black dark:text-white font-mono text-xs font-bold truncate min-w-0">
            <span className="text-black dark:text-purple-400 shrink-0">{icon}</span>
            <span className="truncate uppercase tracking-wider text-[11px]">{title}</span>
          </div>

          {statusBadge && (
            <span className="hidden xl:inline-block text-[9px] font-mono px-1.5 py-0.5 rounded-none bg-black text-white dark:bg-purple-950 dark:text-purple-300 border border-black dark:border-purple-500/40 shrink-0 font-bold">
              {statusBadge}
            </span>
          )}
        </div>

        {/* Right: Window Controls */}
        <div className="flex items-center gap-1.5 shrink-0 ml-2">
          {headerActions}

          {/* Quick Dynamic Split Adjusters (Hidden when maximized or mobile) */}
          {!isMaximized && onSetWidth && (
            <div className="hidden xl:flex items-center bg-white dark:bg-dark-950 border border-black dark:border-purple-500/40 p-0.5 font-mono text-[9px]">
              {[35, 50, 65].map((pct) => (
                <button
                  key={pct}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSetWidth(pct);
                  }}
                  className={`px-1.5 py-0.5 rounded-none transition-colors ${
                    Math.round(widthPct) === pct && !isFullWidth
                      ? 'bg-black text-white dark:bg-purple-600 dark:text-white font-bold shadow-sm'
                      : 'text-slate-700 dark:text-slate-400 hover:text-black dark:hover:text-white'
                  }`}
                  title={`Set window width to ${pct}% (sibling automatically becomes ${100 - pct}%)`}
                >
                  {pct}%
                </button>
              ))}
            </div>
          )}

          {/* Minimize / Expand Toggle */}
          <button
            onClick={onToggleMinimize}
            className="p-1 rounded-none text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-dark-800 transition-colors"
            title={isMinimized ? 'Expand Window' : 'Minimize Window'}
          >
            {isMinimized ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
          </button>

          {/* Maximize / Restore Toggle */}
          <button
            onClick={onToggleMaximize}
            className={`p-1 rounded-none transition-colors ${
              isMaximized
                ? 'text-black dark:text-purple-400 bg-slate-200 dark:bg-purple-950/60 font-bold'
                : 'text-slate-600 hover:text-black dark:text-slate-400 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-dark-800'
            }`}
            title={isMaximized ? 'Restore Window Size' : 'Maximize Window (Focus Mode)'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Window Body - Strict Container Isolation */}
      {!isMinimized && (
        <div className="flex-1 w-full min-w-0 min-h-0 overflow-y-auto overflow-x-hidden animate-fadeIn bg-white dark:bg-dark-950 flex flex-col">
          {children}
        </div>
      )}

      {/* Interactive Bottom Downward Resizing Handle */}
      {!isMinimized && !isMaximized && (
        <div
          onMouseDown={handleResizeMouseDown}
          onDoubleClick={() => {
            setInternalHeight(undefined);
            if (onHeightChange) onHeightChange(440);
          }}
          className={`h-2.5 w-full bg-slate-100 dark:bg-dark-900 hover:bg-black/10 dark:hover:bg-purple-500/20 active:bg-black/20 dark:active:bg-purple-500/40 cursor-ns-resize border-t-2 border-black dark:border-purple-500 flex items-center justify-center group select-none shrink-0 transition-colors z-20 relative ${
            isResizingHeight ? 'bg-black/15 dark:bg-purple-500/30' : ''
          }`}
          title="Drag down or up to resize window height (Double-click to reset)"
        >
          {/* Grip pill */}
          <div
            className={`h-[3px] rounded-full transition-all ${
              isResizingHeight
                ? 'bg-black dark:bg-purple-400 w-24 shadow-md'
                : 'bg-black/60 dark:bg-purple-400/60 group-hover:bg-black dark:group-hover:bg-purple-300 w-14 group-hover:w-24'
            }`}
          />

          {/* Floating height pill during drag */}
          {isResizingHeight && internalHeight && (
            <div className="absolute -top-7 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-none bg-black dark:bg-purple-950 border border-black dark:border-purple-500 text-white font-mono text-[9px] font-bold shadow-xl whitespace-nowrap pointer-events-none z-30">
              Height: {internalHeight}px
            </div>
          )}
        </div>
      )}
    </div>
  );
};

