import { useState, type FormEvent } from 'react';
import { Car, Lock, Mail, AlertCircle, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { login, type AuthUser } from '../api';

interface LoginProps {
  onLoginSuccess: (user: AuthUser) => void;
}

export default function Login({ onLoginSuccess }: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const user = await login(email, password);
      onLoginSuccess(user);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Échec de la connexion. Vérifiez vos identifiants.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setEmail('test@primeauto.com');
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1120] p-4 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      {/* Background ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-40 -left-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Card Header with Logo */}
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25">
            <Car className="h-8 w-8 text-white" />
          </div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">
            prime<span className="text-blue-500">Auto</span>
          </h1>
          <p className="mt-2 text-sm text-slate-400">
            Gestion intelligente et suivi de votre flotte automobile
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-[#151f32]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">Se connecter</h2>
            <p className="text-xs text-slate-400">Connectez-vous à votre espace gestionnaire ou employé</p>
          </div>

          {error && (
            <div className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Adresse email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nom@primeauto.com"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">
                Mot de passe
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pr-4 pl-10 text-sm text-white placeholder-slate-500 transition-all focus:border-blue-500 focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-600/30 transition-all hover:from-blue-500 hover:to-indigo-500 hover:shadow-blue-500/40 focus:ring-2 focus:ring-blue-500/50 focus:outline-none disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Connexion en cours...</span>
                </>
              ) : (
                <>
                  <span>Se connecter</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Helper */}
          <div className="mt-6 border-t border-slate-800/80 pt-5">
            <button
              type="button"
              onClick={handleFillDemo}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700/60 bg-slate-800/50 py-2.5 text-xs font-medium text-slate-300 transition hover:bg-slate-800 hover:text-white"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-400" />
              Remplir avec l'utilisateur de test (Gestionnaire)
            </button>
            <div className="mt-2 text-center text-[11px] text-slate-500">
              Email: <code className="text-slate-400">test@primeauto.com</code> • Mdp: <code className="text-slate-400">password123</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
