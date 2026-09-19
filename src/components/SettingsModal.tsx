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
  X,
  Sparkles,
  RefreshCw,
  Smartphone,
  Check,
  Cpu,
  Zap,
  Crown,
} from 'lucide-react';
import { getClientVersion } from '../version';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: Partial<AppSettings>) => void;
  currentUser: UserProfile;
  onLogout: () => void;
  onOpenSubscription: (plan?: SubscriptionPlanType) => void;
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
  onOpenSubscription,
  isDark,
  onCheckForUpdates,
  isCheckingUpdates = false,
}) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  if (!isOpen) return null;

  const themes: { id: ThemeMode; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'dark', label: 'Dark', icon: Moon },
    { id: 'bright', label: 'Bright', icon: Sun },
    { id: 'system', label: 'System', icon: Monitor },
  ];

  const handleModelChange = (modelId: string) => {
    // Immediately switch the active model as requested by user
    onUpdateSettings({ selectedModel: modelId });
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

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-3 sm:p-4 bg-black/60 backdrop-blur-sm flex justify-center items-start sm:items-center min-h-screen animate-in fade-in duration-200">
      <div
        className={`w-full max-w-md my-auto max-h-[92vh] flex flex-col rounded-2xl border shadow-xl p-5 sm:p-6 relative overflow-y-auto ${
          isDark
            ? 'bg-[#212121] border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
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
              Theme, notifications & account
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Theme Selection: Dark, Bright, System */}
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-2.5 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
              Theme
            </label>
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
          </div>

          {/* Notification Settings Toggle */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between transition-colors ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
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
          </div>

          {/* AI Model Selection */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
                  <Cpu className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm font-medium">Active AI Model</p>
                  <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Choose your preferred Tejas model
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
              <option value="meta-llama/Llama-3.2-3B-Instruct">
                Cat (3B - ₹1 Test Tier / 1 Month)
              </option>
              <option value="meta-llama/Llama-3.1-8B-Instruct">
                Chetak (8B - ₹299/mo Pro Reasoning)
              </option>
              <option value="meta-llama/Llama-3.3-70B-Instruct">
                Arka (70B - ₹799/mo Flagship Power)
              </option>
            </select>

            {/* Optional Plan Upgrade Trigger for Selected Model */}
            {(() => {
              const selected = settings.selectedModel || 'meta-llama/Llama-3.2-1B-Instruct';
              const currentPlan = settings.subscriptionPlan || 'free';

              if (
                selected === 'meta-llama/Llama-3.2-3B-Instruct' &&
                currentPlan !== 'cat' &&
                currentPlan !== 'chetak' &&
                currentPlan !== 'arka'
              ) {
                return (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs mt-1">
                    <span className="font-medium">Cat 3B selected. Unlock full 1-month pass:</span>
                    <button
                      type="button"
                      onClick={() => onOpenSubscription('cat')}
                      className="px-2.5 py-1 rounded-md bg-purple-600 hover:bg-purple-500 text-white font-semibold text-[11px] shadow-sm cursor-pointer"
                    >
                      Subscribe ₹1
                    </button>
                  </div>
                );
              }
              if (
                selected === 'meta-llama/Llama-3.1-8B-Instruct' &&
                currentPlan !== 'chetak' &&
                currentPlan !== 'arka'
              ) {
                return (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs mt-1">
                    <span className="font-medium">Chetak 8B selected. ₹299/mo tier available:</span>
                    <button
                      type="button"
                      onClick={() => onOpenSubscription('chetak')}
                      className="px-2.5 py-1 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] shadow-sm cursor-pointer"
                    >
                      Subscribe
                    </button>
                  </div>
                );
              }
              if (
                (selected === 'meta-llama/Llama-3.3-70B-Instruct' ||
                  selected === 'meta-llama/Llama-3-70B-Instruct') &&
                currentPlan !== 'arka'
              ) {
                return (
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs mt-1">
                    <span className="font-medium">Arka 70B selected. ₹799/mo flagship tier:</span>
                    <button
                      type="button"
                      onClick={() => onOpenSubscription('arka')}
                      className="px-2.5 py-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white font-semibold text-[11px] shadow-sm cursor-pointer"
                    >
                      Subscribe
                    </button>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          {/* Response Length & Conciseness */}
          <div
            className={`p-3.5 rounded-xl border flex flex-col gap-2.5 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
                <Zap className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-medium">Response Length</p>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Scale answer length directly to question complexity
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-0.5">
              <button
                id="response-style-adaptive-btn"
                type="button"
                onClick={() => onUpdateSettings({ responseStyle: 'adaptive' })}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  (settings.responseStyle || 'adaptive') === 'adaptive'
                    ? isDark
                      ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-300 shadow-sm'
                      : 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-sm'
                    : isDark
                      ? 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  ⚡ Crisp & Adaptive
                </span>
                <span className="text-[10px] opacity-80 leading-snug">
                  Short & to-the-point for simple queries, detailed only when asked
                </span>
              </button>

              <button
                id="response-style-detailed-btn"
                type="button"
                onClick={() => onUpdateSettings({ responseStyle: 'detailed' })}
                className={`p-2.5 rounded-lg border text-left flex flex-col gap-1 transition-all cursor-pointer ${
                  settings.responseStyle === 'detailed'
                    ? isDark
                      ? 'bg-blue-500/10 border-blue-500/50 text-blue-300 shadow-sm'
                      : 'bg-blue-50 border-blue-500 text-blue-900 shadow-sm'
                    : isDark
                      ? 'bg-zinc-800/40 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      : 'bg-white border-zinc-200 text-zinc-600 hover:text-zinc-900 hover:border-zinc-300'
                }`}
              >
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  📖 In-Depth & Long
                </span>
                <span className="text-[10px] opacity-80 leading-snug">
                  Longer, comprehensive multi-paragraph explanations for everything
                </span>
              </button>
            </div>
          </div>

          {/* Subscription Plans Card */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
                <Sparkles className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">Subscription & Plans</p>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {settings.subscriptionPlan && settings.subscriptionPlan !== 'free' && settings.subscriptionExpiresAt ? (
                    <span className="text-emerald-400 font-medium">
                      Active • Reverts to Free in {Math.max(0, Math.ceil((settings.subscriptionExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))} days
                    </span>
                  ) : (
                    'Cat (₹1 Test), Chetak (₹299/mo), Arka (₹799/mo)'
                  )}
                </p>
              </div>
            </div>
            <button
              id="open-subscription-from-settings-btn"
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
          </div>

          {/* App Version & Check for Updates */}
          <div
            className={`p-3.5 rounded-xl border flex items-center justify-between ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-zinc-800 text-zinc-200">
                <Smartphone className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">App Version</p>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                    v{getClientVersion()}
                  </span>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Instant over-the-air update support
                </p>
              </div>
            </div>
            {onCheckForUpdates && (
              <button
                id="check-updates-btn"
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
                <span>{isCheckingUpdates ? 'Checking...' : 'Check Update'}</span>
              </button>
            )}
          </div>

          {/* User Account summary & Logout Button */}
          <div className={`pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5 truncate pr-2">
                <div className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-100 flex items-center justify-center font-bold text-xs shrink-0">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <div className="truncate">
                  <p className="text-xs font-medium truncate">{currentUser.name}</p>
                  <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {currentUser.email}
                  </p>
                </div>
              </div>

              {!showLogoutConfirm ? (
                <button
                  id="logout-btn"
                  type="button"
                  onClick={() => setShowLogoutConfirm(true)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              ) : (
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    id="confirm-logout-btn"
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
