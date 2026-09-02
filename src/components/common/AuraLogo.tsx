import React from 'react';

interface AuraLogoProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

export const AuraLogo: React.FC<AuraLogoProps> = ({ size = 28, className = '', glow = true }) => {
  return (
    <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
      {glow && (
        <div
          className="absolute inset-0 bg-brand-500/30 blur-md rounded-none pointer-events-none"
          style={{ width: size, height: size }}
        />
      )}
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative z-10"
      >
        <defs>
          <linearGradient id="prismBorder" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" />
            <stop offset="50%" stopColor="#9333EA" />
            <stop offset="100%" stopColor="#6B21A8" />
          </linearGradient>
          <linearGradient id="prismFacet1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3B0764" stopOpacity="0.8" />
          </linearGradient>
          <linearGradient id="prismFacet2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#C084FC" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#581C87" stopOpacity="0.6" />
          </linearGradient>
          <linearGradient id="coreEnergy" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00F0FF" />
            <stop offset="100%" stopColor="#A855F7" />
          </linearGradient>
        </defs>

        {/* Outer Isometric Faceted Hexagon */}
        <polygon
          points="24,2 45,13.5 45,34.5 24,46 3,34.5 3,13.5"
          stroke="url(#prismBorder)"
          strokeWidth="2.5"
          fill="#07090E"
        />

        {/* Top Diamond Facet */}
        <polygon points="24,2 45,13.5 24,24 3,13.5" fill="url(#prismFacet1)" />

        {/* Right Lower Facet */}
        <polygon points="24,24 45,13.5 45,34.5 24,46" fill="url(#prismFacet2)" />

        {/* Left Lower Facet */}
        <polygon points="24,24 3,13.5 3,34.5 24,46" fill="url(#prismFacet1)" fillOpacity="0.6" />

        {/* Glowing Center Quantum Energy Core */}
        <polygon points="24,14 33,24 24,34 15,24" fill="url(#coreEnergy)" />
        <circle cx="24" cy="24" r="2.5" fill="#FFFFFF" />
      </svg>
    </div>
  );
};
