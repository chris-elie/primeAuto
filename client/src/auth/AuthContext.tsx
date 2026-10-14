import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { getCurrentProfile } from '../services/profiles';
import type { Profile } from '../types/database';

type AuthContextValue = {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (nom: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const loadProfile = async (nextUser: User | null) => {
      if (!active) return;
      setUser(nextUser);
      if (!nextUser) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const nextProfile = await getCurrentProfile();
        if (active) setProfile(nextProfile);
      } catch {
        if (active) setProfile(null);
      } finally {
        if (active) setLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      window.setTimeout(() => void loadProfile(session?.user ?? null), 0);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) {
        if (active) setLoading(false);
        return;
      }
      void loadProfile(data.session?.user ?? null);
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    profile,
    loading,
    async signIn(email, password) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw new Error(`Connexion impossible : ${error.message}`);
    },
    async signUp(nom, email, password) {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nom } },
      });
      if (error) throw new Error(`Inscription impossible : ${error.message}`);
    },
    async signOut() {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(`Déconnexion impossible : ${error.message}`);
    },
  }), [user, profile, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth doit être utilisé dans AuthProvider.');
  return context;
}
