'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, LogIn, UserPlus } from 'lucide-react';

export function LoginForm() {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRegister, setIsRegister] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/auth/check-setup')
      .then((res) => res.json())
      .then((data) => {
        setIsRegister(!data.hasUsers);
        setChecking(false);
      })
      .catch(() => setChecking(false));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const email = form.get('email') as string;
    const password = form.get('password') as string;
    const name = form.get('name') as string;

    const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
    const body = isRegister ? { name, email, password } : { email, password };

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error || 'Erro ao autenticar');
      setLoading(false);
      return;
    }

    router.push('/');
    router.refresh();
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-6 w-6 border-2 border-white/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="rounded-2xl border border-white/10 bg-black/40 p-6 shadow-2xl backdrop-blur-xl">
        <h2 className="text-lg font-semibold text-white">
          {isRegister ? 'Criar sua conta' : 'Bem-vindo de volta'}
        </h2>
        <p className="mt-1 text-sm text-white/50">
          {isRegister
            ? 'Configure seu acesso ao TraderPro'
            : 'Acesse sua conta para operar'}
        </p>

        {error && (
          <div className="mt-4 rounded-lg bg-rose-500/20 border border-rose-500/30 p-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {isRegister && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-white/70">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                placeholder="Seu nome"
                className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/70">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              placeholder="seu@email.com"
              className="mt-1.5 block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-medium text-white/70">
                Senha
              </label>
              {!isRegister && (
                <button
                  type="button"
                  className="text-xs text-amber-400/70 hover:text-amber-400 font-medium cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              )}
            </div>
            <div className="relative mt-1.5">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isRegister ? 'new-password' : 'current-password'}
                required
                minLength={6}
                placeholder={isRegister ? 'Minimo 6 caracteres' : 'Digite sua senha'}
                className="block w-full rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 pr-10 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500/50 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 cursor-pointer"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
        </div>

        {!isRegister && (
          <div className="flex items-center gap-2 mt-5">
            <input
              type="checkbox"
              id="remember"
              className="rounded border-white/20 bg-white/5 text-amber-500 focus:ring-amber-500/40"
            />
            <label htmlFor="remember" className="text-sm text-white/50">
              Manter conectado
            </label>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-black shadow-lg shadow-amber-500/20 hover:bg-amber-400 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {loading ? (
            <>
              <div className="h-4 w-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              {isRegister ? 'Criando conta...' : 'Entrando...'}
            </>
          ) : isRegister ? (
            <>
              <UserPlus className="h-4 w-4" />
              Criar conta
            </>
          ) : (
            <>
              <LogIn className="h-4 w-4" />
              Entrar
            </>
          )}
        </button>
      </div>

      <p className="text-center text-[10px] text-white/30">
        Seus dados ficam armazenados localmente. Sem cloud.
      </p>
    </form>
  );
}
