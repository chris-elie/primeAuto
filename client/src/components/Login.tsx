import { useState, type FormEvent } from 'react';
import { Car, Lock, Mail, AlertCircle, ArrowRight, Loader2, UserRound } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';

export default function Login() {
  const { signIn, signUp } = useAuth();
  const [isRegistering, setIsRegistering] = useState(false);
  const [nom, setNom] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setNotice(null);
    setLoading(true);
    try {
      if (isRegistering) {
        await signUp(nom, email, password);
        setNotice('Inscription réussie. Vérifiez votre courriel pour confirmer votre compte, puis connectez-vous.');
        setIsRegistering(false);
      } else {
        await signIn(email, password);
      }
    } catch (cause: unknown) {
      setError(cause instanceof Error ? cause.message : 'Une erreur est survenue. Réessayez.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0b1120] p-4 font-sans text-slate-100 selection:bg-blue-500 selection:text-white">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 h-96 w-96 rounded-full bg-blue-600/15 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-indigo-600/15 blur-3xl" />
      </div>
      <div className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 shadow-lg shadow-blue-500/25"><Car className="h-8 w-8 text-white" /></div>
          <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white">prime<span className="text-blue-500">Auto</span></h1>
          <p className="mt-2 text-sm text-slate-400">Gestion intelligente et suivi de votre flotte automobile</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-[#151f32]/90 p-8 shadow-2xl backdrop-blur-xl">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white">{isRegistering ? 'Créer un compte' : 'Se connecter'}</h2>
            <p className="text-xs text-slate-400">Accédez à votre espace PrimeAuto</p>
          </div>
          {error && <div role="alert" className="mb-5 flex items-center gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 p-3.5 text-sm text-red-400"><AlertCircle className="h-4 w-4 shrink-0" /><span>{error}</span></div>}
          {notice && <p role="status" className="mb-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-sm text-emerald-300">{notice}</p>}
          <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
            {isRegistering && <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Nom</label><div className="relative"><UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input required value={nom} onChange={(event) => setNom(event.target.value)} placeholder="Votre nom" className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" /></div></div>}
            <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Adresse email</label><div className="relative"><Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nom@primeauto.com" className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" /></div></div>
            <div><label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-300">Mot de passe</label><div className="relative"><Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" /><input type="password" required minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••" className="w-full rounded-xl border border-slate-700/80 bg-slate-900/80 py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none" /></div></div>
            <button type="submit" disabled={loading} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-3 text-sm font-semibold text-white shadow-lg transition hover:from-blue-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-60">
              {loading ? <><Loader2 className="h-4 w-4 animate-spin" /><span>Chargement...</span></> : <><span>{isRegistering ? 'Créer le compte' : 'Se connecter'}</span><ArrowRight className="h-4 w-4" /></>}
            </button>
          </form>
          <div className="mt-6 border-t border-slate-800/80 pt-5 text-center text-xs text-slate-400">
            {isRegistering ? 'Vous avez déjà un compte ?' : 'Pas encore de compte ?'}{' '}
            <button type="button" className="font-semibold text-blue-400 hover:text-blue-300" onClick={() => { setIsRegistering(!isRegistering); setError(null); setNotice(null); }}>
              {isRegistering ? 'Se connecter' : 'Créer un compte'}
            </button>
            {isRegistering && <p className="mt-3">Les nouveaux comptes ont le rôle employé par défaut.</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
