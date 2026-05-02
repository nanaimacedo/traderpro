import type { Metadata } from 'next';
import { LoginForm } from './_components/login-form';
import { LoginHero } from './_components/login-hero';
import { MobileSplash } from './_components/mobile-splash';

export const metadata: Metadata = {
  title: 'Login — TraderPro',
  description: 'Sistema de gestao profissional para operacoes de day trade no mini indice',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen">
      {/* LEFT PANEL — Animated brand hero (desktop) */}
      <div className="relative hidden lg:flex lg:w-[55%]">
        <LoginHero />
      </div>

      {/* RIGHT PANEL — Form */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12 bg-gradient-to-b from-zinc-50 to-white">
        {/* Mobile splash */}
        <MobileSplash />

        {/* Desktop heading */}
        <div className="hidden lg:block mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900">Bem-vindo de volta</h2>
          <p className="mt-1 text-sm text-zinc-500">Acesse sua conta para gerenciar suas operacoes</p>
        </div>

        {/* Form */}
        <div className="w-full max-w-[400px]">
          <LoginForm />
        </div>

        {/* Mobile trust badges */}
        <div className="mt-8 flex items-center gap-4 lg:hidden">
          {['Dados Locais', 'SQLite', 'Offline'].map((label) => (
            <span key={label} className="flex items-center gap-1 text-[10px] text-zinc-400">
              <span className="w-1 h-1 rounded-full bg-amber-500" />
              {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
