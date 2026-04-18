import { useState, type FormEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';

export function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      if (mode === 'signin') {
        await signIn(email, password);
      } else {
        const { needsEmailConfirmation } = await signUp(email, password);
        setInfo(
          needsEmailConfirmation
            ? 'Check your email to confirm your account, then sign in.'
            : 'Account created. You are signed in.',
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-ink text-white text-xl font-bold mb-3">
            P
          </div>
          <h1 className="text-2xl font-bold tracking-tight">ParlayPulse</h1>
          <p className="text-sm text-muted mt-1">AI-Powered Parlay Generator</p>
        </div>
        <form
          onSubmit={submit}
          className="bg-white border border-line rounded-2xl p-6 space-y-4"
        >
          <div>
            <label className="block text-xs text-muted font-medium mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-xs text-muted font-medium mb-1">Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input"
              placeholder="••••••••"
            />
          </div>
          {error && <div className="text-xs text-loss">{error}</div>}
          {info && <div className="text-xs text-win">{info}</div>}
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-lg bg-ink text-white text-sm font-semibold hover:bg-black disabled:opacity-50 transition-colors"
          >
            {busy ? '…' : mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'signin' ? 'signup' : 'signin'));
              setError(null);
              setInfo(null);
            }}
            className="w-full text-xs text-muted hover:text-ink"
          >
            {mode === 'signin'
              ? "Don't have an account? Sign up"
              : 'Already have an account? Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
