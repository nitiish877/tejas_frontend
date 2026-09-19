import React from 'react';

interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  onClick?: () => void;
  glowing?: boolean;
  animate?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  className = '',
  onClick,
  glowing = false,
  animate = false,
}) => {
  const sizeMap = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
  };

  return (
    <div
      onClick={onClick}
      className={`relative inline-flex items-center justify-center select-none transition-transform duration-200 ${
        onClick ? 'cursor-pointer hover:scale-105 active:scale-95' : ''
      } ${sizeMap[size]} ${className}`}
      title="Tejas Logo"
    >
      {/* Background Subtle Glow if active */}
      {glowing && (
        <div
          className={`absolute inset-0 rounded-xl bg-zinc-500/20 blur-sm pointer-events-none ${
            animate ? 'animate-pulse' : ''
          }`}
        />
      )}

      <svg
        viewBox="0 0 512 512"
        className="w-full h-full relative z-10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="tejasMetalDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="50%" stopColor="#27272a" />
            <stop offset="100%" stopColor="#18181b" />
          </linearGradient>
          <linearGradient id="tejasMetalLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="50%" stopColor="#52525b" />
            <stop offset="100%" stopColor="#3f3f46" />
          </linearGradient>
          <linearGradient id="tejasAccent" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e4e4e7" />
            <stop offset="100%" stopColor="#a1a1aa" />
          </linearGradient>
        </defs>

        {/* Top Triangular Spire */}
        <polygon points="256,58 304,142 256,168 208,142" fill="url(#tejasMetalLight)" stroke="#71717a" strokeWidth="2.5" />
        <polygon points="256,58 256,168 208,142" fill="url(#tejasMetalDark)" />
        <line x1="256" y1="72" x2="256" y2="154" stroke="#d4d4d8" strokeWidth="2.5" />

        {/* Bottom Triangular Spire */}
        <polygon points="256,454 304,370 256,344 208,370" fill="url(#tejasMetalDark)" stroke="#71717a" strokeWidth="2.5" />
        <polygon points="256,454 256,344 304,370" fill="url(#tejasMetalLight)" />
        <line x1="256" y1="440" x2="256" y2="358" stroke="#d4d4d8" strokeWidth="2.5" />

        {/* Outer Left Armor Wings */}
        <polygon points="144,188 214,152 180,234 112,256" fill="url(#tejasMetalLight)" stroke="#52525b" strokeWidth="2" />
        <polygon points="112,256 180,278 214,360 144,324" fill="url(#tejasMetalDark)" stroke="#52525b" strokeWidth="2" />
        <polygon points="86,240 128,256 86,272 52,256" fill="#18181b" stroke="#71717a" strokeWidth="2" />

        {/* Outer Right Armor Wings */}
        <polygon points="368,188 298,152 332,234 400,256" fill="url(#tejasMetalDark)" stroke="#52525b" strokeWidth="2" />
        <polygon points="400,256 332,278 298,360 368,324" fill="url(#tejasMetalLight)" stroke="#52525b" strokeWidth="2" />
        <polygon points="426,240 384,256 426,272 460,256" fill="#18181b" stroke="#71717a" strokeWidth="2" />

        {/* Layer Cuboid Shell Wireframe */}
        <polygon points="256,150 354,208 354,304 256,362 158,304 158,208" fill="none" stroke="#71717a" strokeWidth="2.5" strokeDasharray="6 3" opacity="0.6" />
        <polygon points="256,168 338,214 256,260 174,214" fill="url(#tejasMetalLight)" stroke="#71717a" strokeWidth="2" />
        <polygon points="174,214 256,260 256,346 174,300" fill="url(#tejasMetalDark)" stroke="#52525b" strokeWidth="2" />
        <polygon points="256,260 338,214 338,300 256,346" fill="#09090b" stroke="#52525b" strokeWidth="2" />

        {/* Central Isometric Floating Cube */}
        <polygon points="256,202 312,234 256,266 200,234" fill="#3f3f46" stroke="#a1a1aa" strokeWidth="2" />
        <polygon points="200,234 256,266 256,328 200,296" fill="#27272a" stroke="#a1a1aa" strokeWidth="2" />
        <polygon points="256,266 312,234 312,296 256,328" fill="#18181b" stroke="#a1a1aa" strokeWidth="2" />

        {/* Core Clean Accent Lines */}
        <polyline points="256,212 300,238 256,264 212,238 256,212" fill="none" stroke="#e4e4e7" strokeWidth="2" />
        <line x1="256" y1="266" x2="256" y2="328" stroke="#d4d4d8" strokeWidth="2" />
        <line x1="200" y1="234" x2="256" y2="266" stroke="#d4d4d8" strokeWidth="1.5" />
        <line x1="256" y1="266" x2="312" y2="234" stroke="#d4d4d8" strokeWidth="1.5" />

        {/* Points */}
        <circle cx="256" cy="266" r="4" fill="#ffffff" />
        <circle cx="256" cy="150" r="3" fill="#a1a1aa" />
        <circle cx="256" cy="362" r="3" fill="#a1a1aa" />
        <circle cx="158" cy="256" r="2.5" fill="#a1a1aa" />
        <circle cx="354" cy="256" r="2.5" fill="#a1a1aa" />
      </svg>
    </div>
  );
};
