import React, { useState } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider 
} from 'firebase/auth';
import { auth } from '../firebase';
import { X, Mail, Lock } from 'lucide-react';

interface AuthModalProps {
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setLoading(true);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content fade-in" style={{ padding: '32px' }}>
        <button
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'rgba(255,255,255,0.7)' }}
        >
          <X size={20} />
        </button>

        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '8px', color: '#60a5fa' }}>
            {isLogin ? 'Welcome Back' : 'Join GeoJournal'}
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.6)', margin: 0 }}>
            {isLogin ? 'Sign in to access your journal' : 'Create an account to start mapping your memories'}
          </p>
        </div>

        {error && (
          <div style={{ backgroundColor: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.5)', color: '#fca5a5', padding: '12px', borderRadius: '12px', marginBottom: '24px', fontSize: '0.875rem', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '4px', marginLeft: '4px' }}>Email</label>
            <div className="relative">
              <Mail style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="glass-input w-full"
                style={{ paddingLeft: '40px' }}
                placeholder="you@example.com"
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, color: 'rgba(255,255,255,0.7)', marginBottom: '4px', marginLeft: '4px' }}>Password</label>
            <div className="relative">
              <Lock style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.4)' }} size={18} />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="glass-input w-full"
                style={{ paddingLeft: '40px' }}
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="glass-btn glass-btn-primary w-full flex items-center justify-center"
            style={{ padding: '12px', marginTop: '16px', fontWeight: 600 }}
          >
            {loading ? (
              <div style={{ width: '20px', height: '20px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: 'white', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            ) : (
              isLogin ? 'Sign In' : 'Sign Up'
            )}
          </button>
        </form>

        <div className="flex items-center gap-4" style={{ margin: '24px 0', color: 'rgba(255,255,255,0.3)' }}>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', flex: 1 }}></div>
          <span style={{ fontSize: '0.875rem' }}>OR</span>
          <div style={{ height: '1px', background: 'rgba(255,255,255,0.1)', flex: 1 }}></div>
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="glass-btn w-full flex items-center justify-center gap-3"
          style={{ padding: '12px', fontWeight: 500 }}
        >
          <svg viewBox="0 0 24 24" style={{ width: '20px', height: '20px' }}>
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Continue with Google
        </button>

        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)', marginTop: '24px', marginBottom: 0 }}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button 
            onClick={() => setIsLogin(!isLogin)}
            style={{ color: '#60a5fa', background: 'transparent', border: 'none', cursor: 'pointer', fontWeight: 500 }}
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
};
