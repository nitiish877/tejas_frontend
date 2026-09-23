import React, { useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { Logo } from './Logo';
import { registerAccount, loginAccount, setAuthToken, loginWithFirebase, fetchAuthProviders } from '../utils/api';
import { firebaseEnabled, signInWithGooglePopup } from '../firebaseClient';
import {
  Mail,
  Lock,
  User as UserIcon,
  ArrowRight,
  X,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (user: UserProfile) => void;
  isDark: boolean;
  initialMode?: 'signin' | 'register';
  getApiUrl: (path: string) => string;
  notice?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isDark,
  initialMode = 'signin',
  getApiUrl,
  notice,
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [providers, setProviders] = useState<{ email: boolean; google: boolean }>({
    email: true,
    google: firebaseEnabled,
  });

  // Ask server which providers are actually configured
  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    fetchAuthProviders(getApiUrl)
      .then((res) => {
        if (mounted) setProviders({ email: res.email !== false, google: !!res.google });
      })
      .catch(() => {
        // If server doesn't respond, fall back to local firebaseEnabled check
      });
    return () => {
      mounted = false;
    };
  }, [isOpen, getApiUrl]);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setGoogleLoading(true);
    try {
      if (!firebaseEnabled) {
        throw new Error('Google sign-in is not configured. Please use email/password.');
      }
      const idToken = await signInWithGooglePopup();
      const result = await loginWithFirebase(getApiUrl, idToken);
      setAuthToken(result.token);
      onLoginSuccess(result.user);
      onClose();
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      const code = err?.code || '';
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed the popup — not an error worth showing
      } else if (code === 'auth/popup-blocked') {
        setErrorMessage('Popup blocked by browser. Please allow popups and try again.');
      } else if (code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized in Firebase. Add it in Firebase Console → Authentication → Settings → Authorized domains.');
      } else {
        setErrorMessage(err?.message || 'Google sign-in failed. Please try again.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      const result =
        mode === 'register'
          ? await registerAccount(getApiUrl, { name: name.trim(), email: email.trim(), password })
          : await loginAccount(getApiUrl, { email: email.trim(), password });

      setAuthToken(result.token);
      onLoginSuccess(result.user);
      setPassword('');
      onClose();
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMessage(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = () => {
    const guestUser: UserProfile = {
      id: 'user_guest',
      name: 'Tejas User',
      email: '',
      provider: 'guest',
    };
    onLoginSuccess(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/75 backdrop-blur-sm flex justify-center items-start sm:items-center min-h-screen animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-md my-auto max-h-[92vh] flex flex-col rounded-2xl border shadow-2xl overflow-hidden transition-all ${
          isDark ? 'bg-[#212121] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-zinc-800/60 shrink-0">
          <div className="flex items-center gap-2">
            <Logo size="sm" glowing={false} />
            <span className="font-bold text-base tracking-tight">Tejas Account</span>
          </div>
          <button
            id="close-auth-modal-btn"
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-xl transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:px-6 overflow-y-auto flex-1 space-y-4">
          {/* Heading */}
          <div className="text-center py-1">
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'register' ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Sign in to save your chats, subscriptions & preferences
            </p>
          </div>

          {/* Notice */}
          {notice && (
            <div
              className={`mb-1 rounded-xl border px-3 py-2 text-xs ${
                isDark ? 'bg-blue-500/10 border-blue-500/30 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              🔗 {notice}
            </div>
          )}

          {/* Google button */}
          {providers.google && (
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={googleLoading || loading}
              className={`w-full py-2.5 px-4 rounded-xl border flex items-center justify-center gap-2.5 text-sm font-semibold transition-all disabled:opacity-60 ${
                isDark
                  ? 'bg-white text-zinc-900 hover:bg-zinc-100 border-zinc-200'
                  : 'bg-white text-zinc-900 hover:bg-zinc-100 border-zinc-300 shadow-sm'
              }`}
            >
              {googleLoading ? (
                <Loader2 className="w-4 h-4 animate-spin text-zinc-700" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48" aria-hidden="true">
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.5 0 10.4-2.1 14.1-5.5l-6.5-5.5c-2 1.5-4.7 2.4-7.6 2.4-5.2 0-9.6-3.1-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.3 5.6l6.5 5.5C37.4 39.5 44 34.5 44 24c0-1.3-.1-2.3-.4-3.5z" />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          )}

          {/* Divider */}
          {providers.google && providers.email && (
            <div className={`flex items-center gap-2 py-1 text-[11px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              <div className={`flex-1 h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
              <span>OR</span>
              <div className={`flex-1 h-px ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
            </div>
          )}

          {/* Email form (only if enabled) */}
          {providers.email && (
            <>
              {/* Tabs */}
              <div className="flex items-center p-1 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'signin'
                      ? 'bg-white text-zinc-950 shadow-md'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMessage(null);
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                    mode === 'register'
                      ? 'bg-white text-zinc-950 shadow-md'
                      : isDark
                      ? 'text-zinc-400 hover:text-zinc-200'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>

              {errorMessage && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <form onSubmit={handleEmailSubmit} className="space-y-3">
                {mode === 'register' && (
                  <div>
                    <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your Full Name"
                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all ${
                          isDark
                            ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                            : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                        }`}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>
                </div>

                <div>
                  <label className={`block text-xs font-medium mb-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="•••••••• (min. 8 characters)"
                      className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all ${
                        isDark
                          ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                          : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                      }`}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white text-zinc-950 dark:bg-white dark:text-zinc-950 hover:bg-zinc-200 flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>{mode === 'register' ? 'Create Account' : 'Sign In'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </>
          )}

          {/* Footer — Guest */}
          <div className={`pt-3 border-t flex items-center justify-between text-xs ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <span className={`${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              {mode === 'register' ? 'Already have an account? Use Sign In tab.' : 'New here? Use Register tab.'}
            </span>
            <button
              type="button"
              onClick={handleGuestLogin}
              className={`hover:underline ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}
            >
              Continue as Guest
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};