import React, { useEffect, useRef } from 'react';

interface MatrixRainCanvasProps {
  opacity?: number;
  className?: string;
  theme?: 'cyber-emerald' | 'cyber-purple' | 'matrix-green';
}

export const MatrixRainCanvas: React.FC<MatrixRainCanvasProps> = ({
  opacity = 0.25,
  className = '',
  theme = 'cyber-emerald'
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 600);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    // Matrix characters: mix of Katakana, binary, SQL operators, and Greek symbols
    const chars = '010101SELECT_WHERE_SUM_AVG_COUNT_ROUND_AURAQL_λ_Σ_Ω_π_0x8F_0xA4_ｱｶｻﾀﾅﾊﾏﾔﾗﾜ01';
    const fontSize = 13;
    const columns = Math.floor(width / fontSize);
    const drops: number[] = new Array(columns).fill(1).map(() => Math.floor(Math.random() * -50));

    let lastTime = 0;
    const fps = 28;
    const interval = 1000 / fps;

    const render = (time: number) => {
      animationFrameId = requestAnimationFrame(render);

      const delta = time - lastTime;
      if (delta < interval) return;
      lastTime = time - (delta % interval);

      // Semi-transparent fade background for trailing effect
      ctx.fillStyle = 'rgba(5, 7, 15, 0.12)';
      ctx.fillRect(0, 0, width, height);

      ctx.font = `${fontSize}px "Courier New", monospace`;

      for (let i = 0; i < drops.length; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        // Color styling based on theme
        if (theme === 'cyber-emerald') {
          // Leading char is bright cyan-white, tail is electric emerald/violet
          ctx.fillStyle = drops[i] * fontSize > height - 100 ? '#a7f3d0' : '#10b981';
          if (Math.random() > 0.88) {
            ctx.fillStyle = '#818cf8'; // occasional purple flicker
          }
        } else if (theme === 'cyber-purple') {
          ctx.fillStyle = Math.random() > 0.85 ? '#e9d5ff' : '#a855f7';
        } else {
          ctx.fillStyle = '#00ff66';
        }

        ctx.fillText(char, x, y);

        // Reset drop to top with randomized delay
        if (y > height && Math.random() > 0.975) {
          drops[i] = 0;
        }

        drops[i]++;
      }
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 pointer-events-none transition-opacity duration-1000 ${className}`}
      style={{ opacity }}
    />
  );
};
