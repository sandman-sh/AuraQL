import React, { useState, useRef } from 'react';

interface TypewriterHeadingProps {
  prefixText?: string;
  gradientText: string;
  className?: string;
}

export const TypewriterHeading: React.FC<TypewriterHeadingProps> = ({
  prefixText = 'In-Browser OLAP Intelligence for',
  gradientText = 'People and Their AI Agents',
  className = ''
}) => {
  const [displayedText, setDisplayedText] = useState<string>(gradientText);
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const timeoutRef = useRef<any>(null);

  const startTypingEffect = () => {
    if (isTyping) return;
    setIsTyping(true);
    setDisplayedText('');

    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    let currentIndex = 0;
    const totalChars = gradientText.length;

    const typeNextChar = () => {
      if (currentIndex <= totalChars) {
        setDisplayedText(gradientText.slice(0, currentIndex));
        currentIndex++;
        // Natural slight typing speed variance
        const delay = 22 + Math.random() * 18;
        timeoutRef.current = setTimeout(typeNextChar, delay);
      } else {
        setIsTyping(false);
      }
    };

    typeNextChar();
  };

  return (
    <h1
      onMouseEnter={startTypingEffect}
      className={`text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white max-w-5xl leading-[1.12] mb-6 font-sans select-none cursor-pointer group transition-transform ${className}`}
      title="Hover to trigger typing animation"
    >
      <span>{prefixText}</span> <br />
      <span className="relative inline-block text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-purple-500 to-accent-cyan dark:from-brand-400 dark:via-purple-300 dark:to-accent-cyan font-mono tracking-tight">
        <span>{displayedText}</span>
        <span
          className={`inline-block w-[3px] h-[0.85em] ml-1 bg-brand-500 dark:bg-accent-cyan align-middle transition-opacity ${
            isTyping ? 'animate-pulse opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        />
      </span>
    </h1>
  );
};
