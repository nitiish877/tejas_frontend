import React, { useState } from 'react';
import { AppSettings, SubscriptionPlanType, ThemeMode, UserProfile } from '../types';
import {
  Settings,
  Moon,
  Sun,
  Monitor,
  Bell,
  BellOff,
  LogOut,
  LogIn,
  X,
  Sparkles,
  RefreshCw,
  Smartphone,
  Check,
  Cpu,
  Crown,
  Share2,
  Receipt,
  User as UserIcon,
  ChevronRight,
} from 'lucide-react';
import { getClientVersion } from '../version';
import { isGuestUser } from '../utils/api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenAuth?: () => void;
  onOpenProfile?: () => void;
  onOpenSubscription: (plan?: SubscriptionPlanType) => void;
  onOpenPaymentHistory?: () => void;
  onOpenSharedChats?: () => void;
  isDark: boolean;
  onCheckForUpdates?: () => void;
  isCheckingUpdates?: boolean;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  currentUser,
  onLogout,
  onOpenAuth,
  onOpenProfile,
  onOpenSubscription,
  onOpenPaymentHistory,
  onOpenSharedChats,
  isDark,
  onCheckForUpdates,
  isCheckingUpdates = false,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const isGuest = isGuestUser(currentUser);

  if (!isOpen) return null;

  const themes: { id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'bright', label: 'Bright', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  const handleModelChange = (modelId: string) => {
    const planMap: Record<string, SubscriptionPlanType> = {
      'meta-llama/Llama-3.2-1B-Instruct': 'free',
      'meta-llama/Llama-3.2-3B-Instruct': 'cat',
      'meta-llama/Llama-3.1-8B-Instruct': 'chetak',
      'meta-llama/Llama-3.3-70B-Instruct': 'arka',
    };
    onUpdateSettings({
      selectedModel: modelId,
      subscriptionPlan: planMap[modelId] || 'free',
    });
  };

  const getPlanBadge = () => {
    const plan = settings.subscriptionPlan || 'free';
    if (plan === 'arka') {
      return {
        name: 'Arka (70B) Pro',
        className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
      };
    }
    if (plan === 'chetak') {
      return {
        name: 'Chetak (8B)',
        className: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
      };
    }
    if (plan === 'cat') {
      return {
        name: 'Cat (3B) Test',
        className: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      };
    }
    return {
      name: 'Free Tier',
      className: isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-700 border-zinc-300',
    };
  };

  const currentBadge = getPlanBadge();

  const SectionLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
      {children}
    </label>
  );

  const CardWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-3.5 rounded-xl border ${isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-sm flex justify-center items-start sm:items-center min-h-screen animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md my-auto max-h-[92vh] flex flex-col rounded-2xl border shadow-xl p-5 sm:p-6 relative overflow-y-auto ${
          isDark ? 'bg-[#212121] border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Close Button */}
        <button
          id="close-settings-modal-btn"
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors ${
            isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-100 text-zinc-500'
          }`}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 text-zinc-200 flex items-center justify-center">
            <Settings className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold tracking-tight">Settings</h2>
            <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Preferences, subscriptions & account
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* ==================== GENERAL ==================== */}
          <SectionLabel>General</SectionLabel>

          {/* Theme */}
          <div className="grid grid-cols-3 gap-2">
            {themes.map((t) => {
              const Icon = t.icon;
              const isSelected = settings.theme === t.id;
              return (
                <button
                  key={t.id}
                  id={`theme-btn-${t.id}`}
                  type="button"
                  onClick={() => onUpdateSettings({ theme: t.id })}
                  className={`py-2.5 px-3 rounded-xl border flex flex-col items-center gap-1.5 text-xs font-medium transition-all ${
                    isSelected
                      ? isDark
                        ? 'bg-zinc-700 border-zinc-500 text-white'
                        : 'bg-zinc-200 border-zinc-400 text-zinc-900'
                      : isDark
                      ? 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      : 'bg-zinc-50 border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          {/* Sound Notifications */}
          <CardWrapper className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${settings.notificationsEnabled ? 'bg-zinc-800 text-zinc-200' : isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>
                {settings.notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
              </div>
              <div>
                <p className="text-sm font-medium">Sound Notifications</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Chime when response finishes streaming
                </p>
              </div>
            </div>
            <button
              id="toggle-notifications-btn"
              type="button"
              role="switch"
              aria-checked={settings.notificationsEnabled}
              onClick={() => onUpdateSettings({ notificationsEnabled: !settings.notificationsEnabled })}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 focus:outline-none ${
                settings.notificationsEnabled ? 'bg-zinc-100 dark:bg-white' : isDark ? 'bg-zinc-700' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  settings.notificationsEnabled
                    ? 'translate-x-6 bg-zinc-900 dark:bg-zinc-950'
                    : 'translate-x-0 bg-white'
                }`}
              />
            </button>
          </CardWrapper>

          {/* ==================== SHARED CHATS ==================== */}
          <SectionLabel>Shared Chats</SectionLabel>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenSharedChats?.();
            }}
            disabled={isGuest}
            className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              isDark
                ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 disabled:opacity-50'
                : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-500/30">
                <Share2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">My Shared Chats</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isGuest ? 'Sign in to view your shared chats' : 'History of chats you have shared'}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
          </button>

          {/* ==================== MODEL ==================== */}
          <SectionLabel>Model</SectionLabel>
          <CardWrapper className="flex flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
                  <Cpu className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active AI Model</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {settings.ownedPlans && settings.ownedPlans.length > 0
                      ? 'Switch between your free and active subscription models'
                      : 'Upgrade a plan to unlock more models'}
                  </p>
                </div>
              </div>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${currentBadge.className}`}>
                {currentBadge.name}
              </span>
            </div>

            <select
              id="select-model-dropdown"
              value={settings.selectedModel || 'meta-llama/Llama-3.2-1B-Instruct'}
              onChange={(e) => handleModelChange(e.target.value)}
              className={`w-full text-xs rounded-lg px-3 py-2.5 border outline-none font-medium ${
                isDark
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-200 focus:border-zinc-500'
                  : 'bg-white border-zinc-300 text-zinc-800 focus:border-zinc-500'
              }`}
            >
              <option value="meta-llama/Llama-3.2-1B-Instruct">
                1B (Free Tier - Fast & Lightweight)
              </option>
              {(settings.ownedPlans || []).includes('cat') && (
                <option value="meta-llama/Llama-3.2-3B-Instruct">
                  Cat (3B - Active Subscription)
                </option>
              )}
              {(settings.ownedPlans || []).includes('chetak') && (
                <option value="meta-llama/Llama-3.1-8B-Instruct">
                  Chetak (8B - Active Subscription)
                </option>
              )}
              {(settings.ownedPlans || []).includes('arka') && (
                <option value="meta-llama/Llama-3.3-70B-Instruct">
                  Arka (70B - Active Subscription)
                </option>
              )}
            </select>
          </CardWrapper>

          {/* ==================== PAYMENT & SUBSCRIPTION ==================== */}
          <SectionLabel>Payment & Subscription</SectionLabel>

          {/* Payment History */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenPaymentHistory?.();
            }}
            disabled={isGuest}
            className={`w-full text-left p-3.5 rounded-xl border flex items-center justify-between transition-all ${
              isDark
                ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900 disabled:opacity-50'
                : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100 disabled:opacity-50'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-medium">Payment History</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {isGuest ? 'Sign in to view payments' : 'View all payments & download receipts'}
                </p>
              </div>
            </div>
            <ChevronRight className={`w-4 h-4 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
          </button>

          {/* Manage Subscription */}
          <CardWrapper className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Manage Subscription</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {settings.subscriptionPlan && settings.subscriptionPlan !== 'free' && settings.subscriptionExpiresAt ? (
                    <span className="text-emerald-400 font-medium">
                      Active • Reverts in {Math.max(0, Math.ceil((settings.subscriptionExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} days
                    </span>
                  ) : (
                    'Cat (₹1), Chetak (₹299/mo), Arka (₹799/mo)'
                  )}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenSubscription();
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Crown className="w-3.5 h-3.5 text-amber-300" />
              <span>{settings.subscriptionPlan && settings.subscriptionPlan !== 'free' ? 'Manage' : 'Upgrade'}</span>
            </button>
          </CardWrapper>

          {/* ==================== APP VERSION ==================== */}
          <SectionLabel>App Version</SectionLabel>
          <CardWrapper className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Version</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    v{getClientVersion()}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Instant over-the-air updates
                </p>
              </div>
            </div>
            {onCheckForUpdates && (
              <button
                type="button"
                onClick={onCheckForUpdates}
                disabled={isCheckingUpdates}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                  isDark
                    ? 'border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200'
                    : 'border-zinc-300 bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
                }`}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isCheckingUpdates ? 'animate-spin text-blue-400' : ''}`} />
                <span>{isCheckingUpdates ? 'Checking...' : 'Check'}</span>
              </button>
            )}
          </CardWrapper>

          {/* ==================== PROFILE ==================== */}
          <SectionLabel>Profile</SectionLabel>
          <CardWrapper>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (isGuest) {
                    onClose();
                    onOpenAuth?.();
                    return;
                  }
                  onClose();
                  onOpenProfile?.();
                }}
                className="flex items-center gap-2.5 truncate pr-2 flex-1 text-left rounded-lg -m-1 p-1 transition-colors hover:bg-zinc-800/40"
                title={isGuest ? 'Sign in to manage profile' : 'Open profile'}
              >
                <div className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-100 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium truncate">{currentUser.name}</p>
                  <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {isGuest ? 'Guest • Tap to sign in' : currentUser.email}
                  </p>
                </div>
                <ChevronRight className={`w-4 h-4 ml-auto shrink-0 ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`} />
              </button>

              {!isGuest && (
                <>
                  {!showLogoutConfirm ? (
                    <button
                      type="button"
                      onClick={() => setShowLogoutConfirm(true)}
                      className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 transition-colors shrink-0 ml-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => {
                          onLogout();
                          setShowLogoutConfirm(false);
                          onClose();
                        }}
                        className="px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-600 text-white hover:bg-rose-700 transition-colors"
                      >
                        Confirm
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowLogoutConfirm(false)}
                        className={`px-2 py-1 rounded-lg text-xs ${isDark ? 'text-zinc-400 hover:bg-zinc-800' : 'text-zinc-600 hover:bg-zinc-200'}`}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardWrapper>
        </div>
      </div>
    </div>
  );
};