'use client';

import { useEffect, useState } from 'react';

export function LoginHero() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  return (
    <div className="relative flex flex-col justify-between h-full w-full overflow-hidden" style={{ background: '#0C0C0F' }}>
      {/* Background gradients */}
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 45%, #0C0C0F 0%, #060608 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 80% 60% at 40% 50%, rgba(245,158,11,0.04) 0%, transparent 100%)' }} />
      <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse 50% 40% at 70% 60%, rgba(16,185,129,0.03) 0%, transparent 100%)' }} />

      {/* Grid pattern */}
      <div className="absolute inset-0 opacity-[0.012]" style={{
        backgroundImage: 'linear-gradient(rgba(245,158,11,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.3) 1px, transparent 1px)',
        backgroundSize: '80px 80px',
      }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-between h-full px-10 py-10 xl:px-16 2xl:px-20">

        {/* Top — Status */}
        <div className="flex items-center gap-2" style={{
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.6s ease 0.2s',
        }}>
          <div className="w-2 h-2 rounded-full" style={{ background: '#10B981', boxShadow: '0 0 8px rgba(16,185,129,0.6)' }} />
          <span style={{ color: '#E4E4E7', fontSize: '11px', letterSpacing: '0.15em', fontWeight: 500, textTransform: 'uppercase' }}>
            Mercado Aberto
          </span>
        </div>

        {/* Center — Brand */}
        <div className="flex flex-col justify-center flex-1 max-w-2xl">

          {/* Logo wordmark */}
          <h1 className="whitespace-nowrap text-5xl xl:text-6xl 2xl:text-7xl font-extrabold tracking-tight" style={{
            lineHeight: 1,
            opacity: phase >= 1 ? 1 : 0,
            transform: phase >= 1 ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.7s cubic-bezier(.4,0,.2,1)',
          }}>
            <span style={{ color: '#FAFAFA' }}>Trader</span>
            <span style={{
              background: 'linear-gradient(135deg, #F59E0B, #D97706)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 0 30px rgba(245,158,11,0.35))',
            }}>Pro</span>
          </h1>

          {/* Divider */}
          <div className="mt-8 mb-8" style={{
            opacity: phase >= 2 ? 1 : 0,
            transition: 'opacity 0.6s ease 0s',
          }}>
            <div className="h-px w-24" style={{ background: 'linear-gradient(90deg, #F59E0B, transparent)' }} />
          </div>

          {/* Tagline */}
          <p className="text-xl xl:text-2xl 2xl:text-3xl leading-relaxed" style={{
            color: 'rgba(245,158,11,0.45)',
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.7s cubic-bezier(.4,0,.2,1) 0.1s',
          }}>
            Onde disciplina vira{' '}
            <span style={{ color: 'rgba(245,158,11,0.85)', fontWeight: 700 }}>metodo</span>
          </p>
          <p className="text-xl xl:text-2xl 2xl:text-3xl leading-relaxed" style={{
            color: 'rgba(245,158,11,0.3)',
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.7s cubic-bezier(.4,0,.2,1) 0.2s',
          }}>
            e gestao vira{' '}
            <span style={{ color: '#FAFAFA', fontWeight: 700 }}>resultado.</span>
          </p>

          {/* Stats */}
          <div className="flex items-center gap-12 mt-12" style={{
            opacity: phase >= 2 ? 1 : 0,
            transform: phase >= 2 ? 'translateY(0)' : 'translateY(12px)',
            transition: 'all 0.7s cubic-bezier(.4,0,.2,1) 0.35s',
          }}>
            {[
              { value: 'WIN', label: 'Mini Indice' },
              { value: 'B3', label: 'Bolsa' },
              { value: 'R$0.20', label: 'Por Ponto' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl xl:text-4xl font-bold" style={{ color: '#FAFAFA' }}>{stat.value}</p>
                <p className="text-[10px] uppercase tracking-[0.15em] mt-1.5" style={{ color: 'rgba(245,158,11,0.35)' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom — Trust */}
        <div className="flex flex-col gap-3" style={{
          opacity: phase >= 2 ? 1 : 0,
          transition: 'opacity 0.8s ease 0.5s',
        }}>
          <div className="flex items-center gap-6">
            {['Dados Locais', 'SQLite Seguro', 'Sem Cloud'].map((label) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#F59E0B', opacity: 0.4 }} />
                <span style={{ fontSize: '10px', color: 'rgba(250,250,250,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', fontWeight: 500 }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
          <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(245,158,11,0.1), transparent)' }} />
          <p style={{ fontSize: '10px', color: 'rgba(250,250,250,0.15)' }}>
            &copy; 2026 TraderPro — Gestao de Operacoes WIN
          </p>
        </div>
      </div>

      {/* Right edge glow */}
      <div className="absolute top-0 right-0 w-px h-full" style={{ background: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.15), transparent)' }} />
    </div>
  );
}
