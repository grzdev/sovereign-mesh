import React from 'react';

interface MeshLogoProps {
  className?: string;
}

export const MeshLogo: React.FC<MeshLogoProps> = ({ className = "w-5 h-5" }) => {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      className={className}
      fill="none"
    >
      {/* Top Diamond / Mesh Surface */}
      <path 
        d="M12 2L2 7l10 5 10-5-10-5z" 
        fill="#00C4B4" 
        stroke="#00E5D0" 
        strokeWidth="1.5" 
        strokeLinejoin="round" 
      />
      {/* Middle Layer */}
      <path 
        d="M2 12l10 5 10-5" 
        stroke="#00C4B4" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
      {/* Bottom Layer */}
      <path 
        d="M2 17l10 5 10-5" 
        stroke="#008276" 
        strokeWidth="1.8" 
        strokeLinecap="round" 
        strokeLinejoin="round" 
      />
    </svg>
  );
};
