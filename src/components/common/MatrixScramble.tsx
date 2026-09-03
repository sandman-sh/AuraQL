import React, { useState, useEffect } from 'react';

interface MatrixScrambleProps {
  text: string;
  className?: string;
  scrambleOnMount?: boolean;
}

const MATRIX_CHARS = '01ｱｶｻﾀﾅﾊﾏﾔﾗﾜSELECT_WHERE_SUM_AVG_Ω_λ_π_0x8F_01';

export const MatrixScramble: React.FC<MatrixScrambleProps> = ({
  text,
  className = '',
  scrambleOnMount = true
}) => {
  const [displayText, setDisplayText] = useState<string>(text);
  const [isScrambling, setIsScrambling] = useState<boolean>(false);

  const triggerScramble = () => {
    if (isScrambling) return;
    setIsScrambling(true);

    let iteration = 0;
    const maxIterations = text.length * 2;
    const interval = setInterval(() => {
      setDisplayText(
        text
          .split('')
          .map((char, index) => {
            if (char === ' ' || char === '\n') return char;
            if (index < iteration / 2) {
              return text[index];
            }
            return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
          })
          .join('')
      );

      iteration++;
      if (iteration >= maxIterations) {
        clearInterval(interval);
        setDisplayText(text);
        setIsScrambling(false);
      }
    }, 28);
  };

  useEffect(() => {
    if (scrambleOnMount) {
      triggerScramble();
    }
  }, [text]);

  return (
    <span
      onMouseEnter={triggerScramble}
      className={`cursor-pointer transition-colors ${className}`}
      title="Hover to re-scramble Matrix cipher"
    >
      {displayText}
    </span>
  );
};
