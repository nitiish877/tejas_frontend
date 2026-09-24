import React, { useState } from 'react';
import { ChatSession, SubscriptionPlanType, UserProfile } from '../types';
import { Logo } from './Logo';
import {
  Plus,
  Pin,
  Trash2,
  Settings,
  X,
  Search,
  MessageSquare,
  Flame,
  Sparkles,
  Crown,
  TestTube2,
  LogIn,
  Download,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  activeChatId: string | null;
  onSelectChat: (id: string) => void;
  onNewChat: () => void;
  onStartTempChat: () => void;
  isTempChatActive: boolean;
  onTogglePinChat: (id: string, e: React.MouseEvent) => void;
  onDeleteChat: (id: string, e: React.MouseEvent) => void;
  currentUser: UserProfile;
  onOpenProfile: () => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  onOpenSubscription?: (plan?: SubscriptionPlanType) => void;
  subscriptionPlan?: SubscriptionPlanType;
  isDark: boolean;
  appDownloadUrl?: string;
}

// Detect if the current runtime is an INSTALLED app (APK / TWA / PWA standalone / WebView).
// If yes → hide the "Download App" button. Web browsers always show it.
function isRunningAsInstalledApp(): boolean {
  try {
    // 1) PWA standalone mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      if (
        window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        window.matchMedia('(display-mode: minimal-ui)').matches
      ) {
        return true;
      }
    }

    // 2) iOS PWA
    if ((window.navigator as any).standalone === true) {
      return true;
    }

    // 3) Android TWA
    if (typeof document !== 'undefined' && document.referrer) {
      if (document.referrer.startsWith('android-app://')) return true;
    }

    // 4) URL query param — most reliable for custom APK wrappers
    //    If the APK loads `https://your-app.vercel.app/?app=1`, we detect it here.
    try {
      const params = new URLSearchParams(window.location.search);
      if (params.get('app') === '1') return true;
    } catch {}

    // 5) Android WebView — many markers
    const ua = (navigator.userAgent || '').toLowerCase();
    const uaOriginal = navigator.userAgent || '';

    if (ua.includes('tejasapp')) return true;
    if (ua.includes('; wv)')) return true;
    if (ua.includes('webview')) return true;
    if (ua.includes('wv)')) return true;
    if (/version\/\d+\.\d+.*mobile safari/i.test(uaOriginal) && ua.includes('android')) {
      return true;
    }
    if (ua.includes('android') && ua.includes('safari') && !ua.includes('chrome')) {
      return true;
    }
    if (ua.includes('; wv;') || ua.includes(' wv ')) return true;
    if (ua.includes('okhttp')) return true;
    if (ua.includes('cfnetwork') && ua.includes('darwin') && !ua.includes('safari')) {
      return true;
    }

    // 6) Native bridge objects (Capacitor / Cordova / custom APK)
    if ((window as any).Android || (window as any).TejasAndroid) return true;
    if ((window as any).Capacitor || (window as any).cordova) return true;
    if ((window as any).ReactNativeWebView) return true;

    return false;
  } catch {
    return false;
  }
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  chats,
  activeChatId,
  onSelectChat,
  onNewChat,
  onStartTempChat,
  isTempChatActive,
  onTogglePinChat,
  onDeleteChat,
  currentUser,
  onOpenProfile,
  onOpenSettings,
  onOpenAuth,
  onOpenSubscription,
  subscriptionPlan = 'free',
  isDark,
  appDownloadUrl,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Whether we're running inside an installed app (APK / PWA / WebView).
  // Computed once on mount — display mode doesn't change at runtime.
  const [isInstalledApp] = useState<boolean>(() => isRunningAsInstalledApp());

  const filteredChats = chats.filter((c) =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedChats = filteredChats.filter((c) => c.isPinned);
  const recentChats = filteredChats.filter((c) => !c.isPinned);

  // Show the Download App button on web browsers only, never inside the installed app.
  const showDownloadButton = Boolean(appDownloadUrl) && !isInstalledApp;

  const handleDownloadApp = () => {
    if (!appDownloadUrl) return;
    try {
      // Standard download via anchor — works in Chrome, Firefox, Edge, most Android browsers.
      const a = document.createElement('a');
      a.href = appDownloadUrl;
      a.download = 'Tejas.apk';
      a.rel = 'noopener';
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Download failed, opening in new tab:', err);
      try {
        window.open(appDownloadUrl, '_blank', 'noopener,noreferrer');
      } catch {}
    }
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 sm:w-80 flex flex-col border-r transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        } ${
          isDark
            ? 'bg-[#171717] border-zinc-800 text-zinc-200'
            : 'bg-[#f9f9f9] border-zinc-200 text-zinc-800'
        }`}
      >
        {/* Top Header */}
        <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <div className="flex items-center gap-3">
            <Logo size="sm" glowing={false} />
            <span className="font-bold text-lg tracking-tight text-inherit">
              Tejas
            </span>
          </div>

          <button
            id="close-sidebar-btn"
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg md:hidden transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400' : 'hover:bg-zinc-200 text-zinc-600'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: New Chat & Temp Chat */}
        <div className="p-3 space-y-2">
          <button
            id="new-chat-btn"
            type="button"
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className={`w-full py-2.5 px-3 rounded-xl text-sm font-medium border flex items-center justify-between transition-all ${
              isDark
                ? 'bg-zinc-800/80 hover:bg-zinc-700/80 border-zinc-700/60 text-zinc-100 shadow-sm'
                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-900 shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New chat</span>
            </div>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${isDark ? 'bg-zinc-700 text-zinc-300' : 'bg-zinc-100 text-zinc-500'}`}>
              Ctrl+K
            </span>
          </button>

          <button
            id="temp-chat-btn"
            type="button"
            onClick={() => {
              onStartTempChat();
              if (window.innerWidth < 768) onClose();
            }}
            className={`w-full py-2 px-3 rounded-xl text-xs font-medium border flex items-center justify-center gap-2 transition-all ${
              isTempChatActive
                ? isDark
                  ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                  : 'bg-amber-50 border-amber-300 text-amber-900'
                : isDark
                ? 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-600'
            }`}
          >
            <Flame className={`w-3.5 h-3.5 ${isTempChatActive ? 'text-amber-400' : 'text-zinc-400'}`} />
            <span>{isTempChatActive ? 'Temporary chat active' : 'Temporary chat'}</span>
          </button>

          <div className="relative pt-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
            <input
              id="search-chats-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className={`w-full pl-8 pr-3 py-1.5 rounded-lg text-xs border focus:outline-none focus:ring-1 focus:ring-zinc-400 transition-colors ${
                isDark
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-200 placeholder-zinc-500'
                  : 'bg-white border-zinc-200 text-zinc-800 placeholder-zinc-400'
              }`}
            />
          </div>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-3">
          {pinnedChats.length > 0 && (
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                <Pin className="w-3 h-3 rotate-45" />
                <span>Pinned</span>
              </div>
              {pinnedChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeChatId === chat.id && !isTempChatActive
                      ? isDark
                        ? 'bg-zinc-800 text-white'
                        : 'bg-zinc-200 text-zinc-900'
                      : isDark
                      ? 'hover:bg-zinc-800/60 text-zinc-300'
                      : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <Pin className="w-3 h-3 text-zinc-400 shrink-0 rotate-45" />
                    <span className="truncate">{chat.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title="Unpin chat"
                      onClick={(e) => onTogglePinChat(chat.id, e)}
                      className="p-1 hover:text-white transition-colors"
                    >
                      <Pin className="w-3.5 h-3.5 rotate-45 fill-current" />
                    </button>
                    <button
                      type="button"
                      title="Delete chat"
                      onClick={(e) => onDeleteChat(chat.id, e)}
                      className="p-1 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Chats
            </div>

            {filteredChats.length === 0 ? (
              <div className="px-3 py-6 text-center text-xs text-zinc-500">
                {searchQuery ? 'No matching chats found' : 'No conversation history'}
              </div>
            ) : (
              recentChats.map((chat) => (
                <div
                  key={chat.id}
                  onClick={() => {
                    onSelectChat(chat.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group relative flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium cursor-pointer transition-colors ${
                    activeChatId === chat.id && !isTempChatActive
                      ? isDark
                        ? 'bg-zinc-800 text-white'
                        : 'bg-zinc-200 text-zinc-900'
                      : isDark
                      ? 'hover:bg-zinc-800/60 text-zinc-300'
                      : 'hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <MessageSquare className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                    <span className="truncate">{chat.title}</span>
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      title="Pin chat to top"
                      onClick={(e) => onTogglePinChat(chat.id, e)}
                      className="p-1 hover:text-white transition-colors"
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      title="Delete chat"
                      onClick={(e) => onDeleteChat(chat.id, e)}
                      className="p-1 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Download App Button — hidden inside installed app */}
        {showDownloadButton && (
          <div className="px-3 pb-2">
            <button
              id="sidebar-download-app-btn"
              type="button"
              onClick={handleDownloadApp}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 border transition-all ${
                isDark
                  ? 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download App</span>
            </button>
          </div>
        )}

        {/* Subscription / Plan quick access */}
        {onOpenSubscription && (
          <div className="px-3 pb-2">
            <button
              id="sidebar-upgrade-plan-btn"
              type="button"
              onClick={() => onOpenSubscription()}
              className={`w-full py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                isDark
                  ? 'bg-zinc-800/60 hover:bg-zinc-800 border-zinc-800 text-zinc-300'
                  : 'bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700'
              }`}
            >
              <div className="flex items-center gap-2">
                {subscriptionPlan === 'arka' ? (
                  <Crown className="w-3.5 h-3.5" />
                ) : subscriptionPlan === 'chetak' ? (
                  <Sparkles className="w-3.5 h-3.5" />
                ) : subscriptionPlan === 'cat' ? (
                  <TestTube2 className="w-3.5 h-3.5" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>
                  {subscriptionPlan === 'arka'
                    ? 'Tejas Arka (70B)'
                    : subscriptionPlan === 'chetak'
                    ? 'Tejas Chetak (8B)'
                    : subscriptionPlan === 'cat'
                    ? 'Tejas Cat (3B)'
                    : 'Try 1 month for ₹1'}
                </span>
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                {subscriptionPlan === 'free' ? 'then ₹199' : 'Active'}
              </span>
            </button>
          </div>
        )}

        {/* Register / Sign In Prompt Banner if guest */}
        {onOpenAuth && (currentUser.provider === 'guest' || !currentUser.email || currentUser.email.includes('guest')) && (
          <div className="px-3 py-2 border-t border-zinc-800/80">
            <button
              id="sidebar-auth-btn"
              type="button"
              onClick={() => {
                onOpenAuth();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full py-2 px-3 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 flex items-center justify-center gap-2 transition-all shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Log In / Register</span>
            </button>
          </div>
        )}

        {/* Sidebar Bottom: User Account & Settings */}
        <div className={`p-2.5 border-t ${isDark ? 'border-zinc-800 bg-zinc-900/50' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex items-center justify-between gap-1.5">
            <button
              id="user-account-btn"
              type="button"
              onClick={onOpenProfile}
              title="Change your name"
              className={`flex-1 flex items-center gap-2.5 p-2 rounded-xl text-left transition-colors truncate ${
                isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-200/80'
              }`}
            >
              <div className="w-8 h-8 rounded-full bg-zinc-700 text-zinc-100 flex items-center justify-center font-semibold text-xs shrink-0">
                {currentUser.name ? currentUser.name[0].toUpperCase() : 'T'}
              </div>
              <div className="truncate flex-1">
                <p className="text-xs font-medium truncate leading-tight">{currentUser.name || 'Tejas User'}</p>
                <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  {currentUser.email ? currentUser.email : 'Guest • Click to sign in'}
                </p>
              </div>
            </button>

            <button
              id="sidebar-settings-btn"
              type="button"
              onClick={onOpenSettings}
              title="Settings"
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100' : 'hover:bg-zinc-200 text-zinc-500 hover:text-zinc-900'
              }`}
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};