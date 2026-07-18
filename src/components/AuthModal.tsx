import React, { useState } from 'react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { ArrowRight, Lock, Mail, ShieldCheck, Sparkles, X } from 'lucide-react';
import { auth } from '../firebase';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const runAuth = async (action: () => Promise<unknown>) => {
    setError('');
    setLoading(true);
    try {
      await action();
      onClose();
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : 'Authentication failed';
      setError(message.replace(/^Firebase:\s*/i, '').replace(/\(auth\/(.*?)\)\.?/i, '$1').replaceAll('-', ' '));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await runAuth(() => (
      isLogin
        ? signInWithEmailAndPassword(auth, email, password)
        : createUserWithEmailAndPassword(auth, email, password)
    ));
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await runAuth(() => signInWithPopup(auth, provider));
  };

  return (
    <div className="modal-overlay auth-overlay" onClick={onClose}>
      <section
        className="auth-dialog fade-in"
        role="dialog"
        aria-modal="true"
        aria-labelledby="auth-title"
        onClick={(event) => event.stopPropagation()}
      >
        <button type="button" className="auth-close" onClick={onClose} aria-label="Close sign in">
          <X size={18} />
        </button>

        <div className="auth-orbit" aria-hidden="true">
          <span><Sparkles size={18} /></span>
          <i />
          <i />
        </div>

        <div className="auth-kicker"><ShieldCheck size={14} /> Private memory atlas</div>
        <h2 id="auth-title">{isLogin ? 'Welcome back, explorer.' : 'Create your Atlas.'}</h2>
        <p className="auth-intro">
          {isLogin
            ? 'Your places, stories, and travel patterns are ready where you left them.'
            : 'Start with an account. Your username and avatar come next.'}
        </p>

        <div className="auth-mode-switch" role="tablist" aria-label="Account action">
          <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'is-active' : ''} onClick={() => { setIsLogin(true); setError(''); }}>
            Sign in
          </button>
          <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? 'is-active' : ''} onClick={() => { setIsLogin(false); setError(''); }}>
            Create account
          </button>
        </div>

        <button type="button" className="auth-google" onClick={handleGoogleSignIn} disabled={loading}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 0 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <div className="auth-divider"><span>or use email</span></div>

        {error && <div className="auth-error" role="alert">{error}</div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <label>
            <span>Email</span>
            <span className="auth-input-wrap">
              <Mail size={17} />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </span>
          </label>

          <label>
            <span>Password</span>
            <span className="auth-input-wrap">
              <Lock size={17} />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="At least 6 characters"
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                minLength={6}
                required
              />
            </span>
          </label>

          <button type="submit" className="auth-submit" disabled={loading}>
            <span>{loading ? 'Opening your Atlas…' : isLogin ? 'Enter your Atlas' : 'Build my Atlas'}</span>
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>

        <p className="auth-footnote">
          <ShieldCheck size={13} /> Memories begin private. You choose what becomes public.
        </p>
      </section>
    </div>
  );
};
