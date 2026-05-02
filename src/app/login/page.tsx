import type { Metadata } from 'next';
import { LoginForm } from './_components/login-form';

export const metadata: Metadata = {
  title: 'Login — TraderPro',
  description: 'Sistema de gestao profissional para operacoes de day trade no mini indice',
};

export default function LoginPage() {
  return (
    <div className="relative min-h-screen w-full">
      {/* Background image — full screen */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: "url('/login-bg.png')" }}
      />

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content */}
      <div className="relative z-10 flex min-h-screen items-center justify-end px-6 py-12 lg:px-20 xl:px-32">
        <div className="w-full max-w-[420px]">
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-extrabold tracking-tight">
              <span className="text-white drop-shadow-lg">Trader</span>
              <span className="text-amber-500 drop-shadow-lg">Pro</span>
            </h1>
            <p className="mt-2 text-sm text-white/60">
              Onde disciplina vira metodo e gestao vira resultado
            </p>
          </div>

          {/* Form */}
          <LoginForm />

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-4">
            {['Dados Locais', 'SQLite Seguro', 'Sem Cloud'].map((label) => (
              <div key={label} className="flex items-center gap-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-amber-500/60" />
                <span className="text-[10px] font-medium uppercase tracking-wider text-white/40">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
