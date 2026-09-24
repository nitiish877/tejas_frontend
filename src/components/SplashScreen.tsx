import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  isDark?: boolean;
  onFinish?: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ isDark = true, onFinish }) => {
  const [phase, setPhase] = useState<'logo' | 'coding' | 'fading'>('logo');

  useEffect(() => {
    const t1 = setTimeout(() => setPhase('coding'), 1400);
    const t2 = setTimeout(() => setPhase('fading'), 2600);
    const t3 = setTimeout(() => onFinish?.(), 3200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[999] flex items-center justify-center transition-opacity duration-600 ${
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
        {/* Logo */}
        <div className="relative mb-2">
          <div className="absolute inset-0 rounded-2xl bg-cyan-500/20 blur-2xl" />
          <div
            className={`relative w-20 h-20 rounded-2xl flex items-center justify-center border ${
              isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'
            }`}
          >
            <span
              className={`text-4xl font-black tracking-tighter ${
                isDark ? 'text-zinc-100' : 'text-zinc-900'
              }`}
            >
              T
            </span>
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
          className={`mt-6 font-mono text-xs transition-all duration-700 ${
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