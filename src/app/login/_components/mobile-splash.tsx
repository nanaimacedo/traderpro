'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export function MobileSplash() {
  const [show, setShow] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const shown = sessionStorage.getItem('tp-splash-shown');
    if (shown) {
      setShow(false);
      return;
    }
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShow(false);
        sessionStorage.setItem('tp-splash-shown', '1');
      }, 800);
    }, 3500);
    return () => clearTimeout(timer);
  }, []);

  if (!show) {
    return (
      <div className="mb-6 lg:hidden w-full flex flex-col items-center">
        <Image src="/logo.png" alt="TraderPro" width={180} height={54} priority />
        <p className="mt-1.5 text-xs text-zinc-500 text-center">
          Gestao de Operacoes WIN
        </p>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'linear-gradient(180deg, #0C0C0F 0%, #18181B 50%, #0C0C0F 100%)' }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
        backgroundSize: '40px 40px',
      }} />

      {/* Ambient glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full splash-glow" />

      {/* Logo */}
      <div className="relative z-10 splash-logo">
        <Image src="/logo.png" alt="TraderPro" width={260} height={78} priority />
      </div>

      {/* Tagline */}
      <p className="relative z-10 mt-4 text-sm tracking-wide text-center splash-tagline" style={{ color: 'rgba(245,158,11,0.5)' }}>
        Onde disciplina vira{' '}
        <span style={{ color: 'rgba(245,158,11,0.8)', fontWeight: 600 }}>resultado</span>
      </p>

      {/* Decorative line */}
      <div className="relative z-10 mt-6 splash-line">
        <div className="h-px w-16 mx-auto" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.4), transparent)' }} />
      </div>

      {/* Loading dots */}
      <div className="relative z-10 mt-8 splash-dots flex gap-2">
        {[0, 1, 2].map(i => (
          <div
            key={i}
            className="w-1.5 h-1.5 rounded-full splash-dot"
            style={{ animationDelay: `${i * 250}ms` }}
          />
        ))}
      </div>

      <style>{`
        .splash-glow {
          background: radial-gradient(circle, rgba(245,158,11,0.08) 0%, transparent 70%);
          animation: glowPulse 3s ease-in-out 1.5s infinite;
        }
        .splash-logo {
          opacity: 0;
          animation: fadeInUp 1s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
        }
        .splash-tagline {
          opacity: 0;
          animation: fadeInUp 0.9s cubic-bezier(0.16, 1, 0.3, 1) 1s both;
        }
        .splash-line {
          opacity: 0;
          animation: expandLine 0.8s ease-out 1.8s both;
        }
        .splash-dots {
          opacity: 0;
          animation: fadeIn 0.6s ease 2.2s both;
        }
        .splash-dot {
          background: rgba(245,158,11,0.4);
          animation: dotPulse 1.2s ease-in-out infinite;
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes expandLine {
          from { opacity: 0; transform: scaleX(0); }
          to { opacity: 1; transform: scaleX(1); }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.3); }
        }
        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
        }
      `}</style>
    </div>
  );
}
