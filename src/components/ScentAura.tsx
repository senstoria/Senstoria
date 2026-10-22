import React from 'react';
import { FAMILY_DISPLAY_ID } from '../lib/scentNotesDict.ts';

interface ScentAuraProps {
  family?: string;
  fragranceId?: string;
  className?: string;
  children?: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'vivid';
  size?: 'sm' | 'md' | 'lg' | 'full';
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export const ScentAura: React.FC<ScentAuraProps> = ({
  family = 'woody',
  fragranceId = 'senstoria-default',
  className = '',
  children,
  intensity = 'medium',
  size = 'full'
}) => {
  const normFamily = family.toLowerCase().split('/')[0].trim();
  const palette = FAMILY_DISPLAY_ID[normFamily] || FAMILY_DISPLAY_ID.woody;

  const h = hashString(fragranceId);
  const blob1X = 20 + (h % 50);
  const blob1Y = 20 + ((h >> 2) % 40);
  const blob2X = 60 - ((h >> 4) % 35);
  const blob2Y = 65 - ((h >> 6) % 30);
  const blob3X = 40 + ((h >> 8) % 30);
  const blob3Y = 80 - ((h >> 10) % 30);

  const opacityMap = {
    subtle: 'opacity-40 dark:opacity-25',
    medium: 'opacity-65 dark:opacity-40',
    vivid: 'opacity-85 dark:opacity-60'
  };

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Radial Multi-blob Scent Aura */}
      <div 
        className={`absolute inset-0 pointer-events-none transition-opacity duration-700 blur-2xl -z-10 ${opacityMap[intensity]}`}
        aria-hidden="true"
      >
        <div 
          className="absolute rounded-full transition-transform duration-1000"
          style={{
            left: `${blob1X}%`,
            top: `${blob1Y}%`,
            width: size === 'sm' ? '120px' : size === 'md' ? '220px' : '320px',
            height: size === 'sm' ? '120px' : size === 'md' ? '220px' : '320px',
            background: `radial-gradient(circle, ${palette.tint} 0%, ${palette.mid} 70%, transparent 100%)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute rounded-full transition-transform duration-1000"
          style={{
            left: `${blob2X}%`,
            top: `${blob2Y}%`,
            width: size === 'sm' ? '100px' : size === 'md' ? '180px' : '260px',
            height: size === 'sm' ? '100px' : size === 'md' ? '180px' : '260px',
            background: `radial-gradient(circle, ${palette.mid} 0%, ${palette.tint} 60%, transparent 100%)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
        <div 
          className="absolute rounded-full transition-transform duration-1000"
          style={{
            left: `${blob3X}%`,
            top: `${blob3Y}%`,
            width: size === 'sm' ? '80px' : size === 'md' ? '140px' : '200px',
            height: size === 'sm' ? '80px' : size === 'md' ? '140px' : '200px',
            background: `radial-gradient(circle, ${palette.deep}22 0%, ${palette.mid}44 50%, transparent 100%)`,
            transform: 'translate(-50%, -50%)'
          }}
        />
      </div>

      {children}
    </div>
  );
};
