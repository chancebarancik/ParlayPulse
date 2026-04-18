import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { AppUser } from '../lib/types';

interface AuthContextValue {
  user: AppUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (
    email: string,
    password: string,
  ) => Promise<{ needsEmailConfirmation: boolean }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then(async (resp) => {
        if (!resp.ok) throw new Error('Failed to load session');
        return (await resp.json()) as { user: AppUser | null };
      })
      .then((data) => {
        setUser(data.user);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const signIn = async (email: string, password: string) => {
    const resp = await fetch('/api/auth/signin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
    const data = (await resp.json().catch(() => null)) as
      | { user?: AppUser; error?: string }
      | null;
    if (!resp.ok || !data?.user) {
      throw new Error(data?.error ?? 'Sign in failed');
    }
    setUser(data.user);
  };

  const signUp = async (email: string, password: string) => {
    const resp = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    });
    const data = (await resp.json().catch(() => null)) as
      | { user?: AppUser; error?: string; needsEmailConfirmation?: boolean }
      | null;
    if (!resp.ok || !data?.user) {
      throw new Error(data?.error ?? 'Sign up failed');
    }
    setUser(data.user);
    return { needsEmailConfirmation: Boolean(data.needsEmailConfirmation) };
  };

  const signOut = async () => {
    const resp = await fetch('/api/auth/signout', {
      method: 'POST',
      credentials: 'same-origin',
    });
    if (!resp.ok) throw new Error('Sign out failed');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
