import React, { useEffect, useState } from 'react';
import { Logo } from './Logo';

interface SplashScreenProps {
  isDark?: boolean;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isDark = true, onFinish }) => {
  const [phase, setPhase] = useState<'logo' | 'coding' | 'fading'>('logo');

  useEffect(() => {
    // Faster timing — total ~1.8 seconds
    const t1 = setTimeout(() => setPhase('coding'), 700);
    const t2 = setTimeout(() => setPhase('fading'), 1400);
    const t3 = setTimeout(() => onFinish?.(), 1800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center transition-opacity duration-500 ${
        phase === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{
        background: isDark
          ? 'radial-gradient(circle at 50% 40%, #1a1c20 0%, #0e0f12 60%, #050607 100%)'
          : 'radial-gradient(circle at 50% 40%, #f5f6f8 0%, #e4e6ea 60%, #d5d8dd 100%)',
      }}
    >
      {/* Faint falling code background */}
      <div className="absolute inset-0 overflow-hidden opacity-20 select-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <div
            key={i}
            className="absolute text-[10px] font-mono text-cyan-400/40 animate-[fallDown_8s_linear_infinite]"
            style={{
              left: `${(i * 7.5) % 100}%`,
              animationDelay: `${i * 0.4}s`,
              animationDuration: `${6 + (i % 5)}s`,
            }}
          >
            {Array.from({ length: 40 })
              .map(() => ['{}', ';', '</>', '=>', '0x1', '( )', '[ ]', '::', '#', '&&'][Math.floor(Math.random() * 10)])
              .join('\n')}
          </div>
        ))}
      </div>

      {/* Center content */}
      <div className="relative z-10 flex flex-col items-center gap-3 px-6 text-center">
        {/* App logo (uses the same Logo component as the rest of the app) */}
        <div className="relative mb-1">
          <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-2xl" />
          <div className="relative">
            <Logo size="xl" glowing={false} />
          </div>
        </div>

        {/* App name */}
        <h1
          className={`text-3xl font-bold tracking-tight ${
            isDark ? 'text-zinc-100' : 'text-zinc-900'
          }`}
        >
          Tejas
        </h1>

        {/* Tagline */}
        <p
          className={`text-sm font-light tracking-wide ${
            isDark ? 'text-zinc-400' : 'text-zinc-600'
          }`}
        >
          Dive deeper in code
        </p>

        {/* Coding line (appears in phase 2) */}
        <div
          className={`mt-5 font-mono text-xs transition-all duration-500 ${
            phase === 'logo' ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
          } ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}
        >
          <span className="text-zinc-500">$</span> tejas --init
          <span className="inline-block w-1.5 h-3 ml-1 bg-cyan-400 animate-pulse align-middle" />
        </div>
      </div>

      {/* Bottom hint */}
      <div
        className={`absolute bottom-8 text-[10px] tracking-widest uppercase ${
          isDark ? 'text-zinc-600' : 'text-zinc-500'
        }`}
      >
        Powered by Tejas AI
      </div>

      <style>{`
        @keyframes fallDown {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100vh); }
        }
      `}</style>
    </div>
  );
};