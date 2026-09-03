import React, { useState, useEffect, useRef, useCallback } from 'react';

interface SplitGutterProps {
  onSplitChange: (newPct: number) => void;
  currentPct: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
  direction?: 'horizontal' | 'vertical';
}

export const SplitGutter: React.FC<SplitGutterProps> = ({
  onSplitChange,
  currentPct,
  containerRef,
  direction = 'horizontal'
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startPosRef = useRef(0);

  const isVertical = direction === 'vertical';

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startPosRef.current = isVertical ? e.clientY : e.clientX;
    document.body.style.userSelect = 'none';
    document.body.style.cursor = isVertical ? 'row-resize' : 'col-resize';
  }, [isVertical]);

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();

      if (isVertical) {
        const containerHeight = rect.height;
        if (containerHeight <= 0) return;
        const offsetY = e.clientY - rect.top;
        const rawPct = (offsetY / containerHeight) * 100;
        // Clamp between 20% and 80% to prevent rows from collapsing
        const clampedPct = Math.min(80, Math.max(20, Math.round(rawPct)));
        onSplitChange(clampedPct);
      } else {
        const containerWidth = rect.width;
        if (containerWidth <= 0) return;
        const offsetX = e.clientX - rect.left;
        const rawPct = (offsetX / containerWidth) * 100;
        // Clamp between 20% and 80% to prevent columns from collapsing
        const clampedPct = Math.min(80, Math.max(20, Math.round(rawPct)));
        onSplitChange(clampedPct);
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
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
  }, [isDragging, containerRef, onSplitChange, isVertical]);

  if (isVertical) {
    return (
      <div
        onMouseDown={handleMouseDown}
        className={`w-full flex items-center justify-center relative group select-none shrink-0 cursor-row-resize z-20 transition-all ${
          isDragging
            ? 'h-3 bg-brand-500/20 my-1'
            : 'h-2 hover:h-3 my-0.5 bg-transparent hover:bg-brand-500/10'
        }`}
        title="Drag up or down to resize row heights (50/50 default)"
      >
        {/* Horizontal Grip Line */}
        <div
          className={`h-[2px] rounded-full transition-all ${
            isDragging
              ? 'bg-brand-500 w-32 shadow-lg shadow-brand-500/50 scale-x-125'
              : 'bg-slate-300 dark:bg-white/20 group-hover:bg-brand-500 w-16 group-hover:w-28'
          }`}
        />

        {/* Floating Percentage Badge during Drag */}
        {isDragging && (
          <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-none bg-slate-900 dark:bg-black border border-brand-500 text-white font-mono text-[9px] font-bold shadow-2xl whitespace-nowrap pointer-events-none z-30">
            Top: {Math.round(currentPct)}% / Bottom: {Math.round(100 - currentPct)}%
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onMouseDown={handleMouseDown}
      className={`hidden lg:flex items-center justify-center relative group select-none shrink-0 cursor-col-resize z-20 transition-all ${
        isDragging
          ? 'w-3 bg-brand-500/20'
          : 'w-2 hover:w-3 bg-transparent hover:bg-brand-500/10'
      }`}
      title="Drag to dynamically resize windows (50/50 default)"
    >
      {/* Central Grip Indicator */}
      <div
        className={`w-[2px] h-12 rounded-full transition-all ${
          isDragging
            ? 'bg-brand-500 h-20 shadow-lg shadow-brand-500/50 scale-y-125'
            : 'bg-slate-300 dark:bg-white/20 group-hover:bg-brand-500 group-hover:h-16'
        }`}
      />

      {/* Floating Percentage Badge during Drag */}
      {isDragging && (
        <div className="absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-none bg-slate-900 dark:bg-black border border-brand-500 text-white font-mono text-[9px] font-bold shadow-2xl whitespace-nowrap pointer-events-none z-30">
          {Math.round(currentPct)}% / {Math.round(100 - currentPct)}%
        </div>
      )}
    </div>
  );
};

