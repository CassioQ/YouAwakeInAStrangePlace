
import React from 'react';

interface MushroomIconProps {
  className?: string;
}

const MushroomIcon: React.FC<MushroomIconProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 100 100" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
      aria-label="Mushroom Icon"
    >
      <g>
        {/* Cap */}
        <path 
          d="M20,50 Q50,20 80,50 A25,25 0 0,1 20,50 Z" 
          fill="#D43B4A" // Red color for cap
          stroke="#A02C37"
          strokeWidth="2"
        />
        {/* Spots on cap */}
        <circle cx="35" cy="40" r="5" fill="#F0E4D0" />
        <circle cx="50" cy="33" r="6" fill="#F0E4D0" />
        <circle cx="65" cy="40" r="5" fill="#F0E4D0" />
        <circle cx="45" cy="48" r="4" fill="#F0E4D0" />
        <circle cx="58" cy="48" r="3" fill="#F0E4D0" />

        {/* Stem */}
        <path 
          d="M40,50 Q40,80 45,85 L55,85 Q60,80 60,50 Z" 
          fill="#78C1D1" // Bluish color for stem
          stroke="#5A9EAA"
          strokeWidth="2"
        />
      </g>
    </svg>
  );
};

export default MushroomIcon;
