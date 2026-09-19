import React, { useState } from 'react';
import { UserProfile } from '../types';
import { Logo } from './Logo';
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
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  isDark,
  initialMode = 'signin',
}) => {
  const [mode, setMode] = useState<'signin' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setErrorMessage(null);
    setLoading(true);

    try {
      const displayName =
        mode === 'register' ? name.trim() || email.split('@')[0] : email.split('@')[0];
      const user: UserProfile = {
        id: 'user_' + Date.now(),
        name: displayName,
        email: email.trim(),
        provider: 'email',
      };
      onLoginSuccess(user);
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
          isDark
            ? 'bg-[#212121] border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
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
          {/* Top Switch Tabs: Sign In / Register */}
          <div className="flex items-center p-1 rounded-xl bg-zinc-800/60 border border-zinc-700/60">
            <button
              id="tab-signin-btn"
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
              <span>Sign In / Login</span>
            </button>
            <button
              id="tab-register-btn"
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
              <span>Create Account / Register</span>
            </button>
          </div>

          {/* Heading */}
          <div className="text-center py-1">
            <h2 className="text-xl font-bold tracking-tight">
              {mode === 'register' ? 'Register New Account' : 'Welcome Back'}
            </h2>
            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {mode === 'register'
                ? 'Create a local account to manage your chats and preferences'
                : 'Sign in with your email to access your chats'}
            </p>
          </div>

          {/* Error Message Display */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Email Form */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label
                  className={`block text-xs font-medium mb-1 ${
                    isDark ? 'text-zinc-300' : 'text-zinc-700'
                  }`}
                >
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                  <input
                    id="auth-name-input"
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
              <label
                className={`block text-xs font-medium mb-1 ${
                  isDark ? 'text-zinc-300' : 'text-zinc-700'
                }`}
              >
                Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="auth-email-input"
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
              <label
                className={`block text-xs font-medium mb-1 ${
                  isDark ? 'text-zinc-300' : 'text-zinc-700'
                }`}
              >
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                <input
                  id="auth-password-input"
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="•••••••• (min. 6 characters)"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-all ${
                    isDark
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-100 placeholder-zinc-500'
                      : 'bg-white border-zinc-300 text-zinc-900 placeholder-zinc-400'
                    }`}
                />
              </div>
            </div>

            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold bg-white text-zinc-950 dark:bg-white dark:text-zinc-950 hover:bg-zinc-200 flex items-center justify-center gap-2 transition-colors shadow-sm cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>{mode === 'register' ? 'Register Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Footer switch mode & guest */}
          <div
            className={`pt-3 border-t flex items-center justify-between text-xs ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}
          >
            <button
              id="switch-auth-mode-btn"
              type="button"
              onClick={() => {
                setMode(mode === 'register' ? 'signin' : 'register');
                setErrorMessage(null);
              }}
              className={`font-semibold hover:underline ${
                isDark ? 'text-blue-400' : 'text-blue-600'
              }`}
            >
              {mode === 'register' ? 'Already have an account? Sign In' : 'New here? Register'}
            </button>
            <button
              id="skip-auth-btn"
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
