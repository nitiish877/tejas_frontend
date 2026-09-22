import React, { useRef, useEffect, useState } from 'react';
import { Message, SubscriptionPlanType, UserProfile } from '../types';
import { AppVersionInfo, getClientVersion } from '../version';
import { Logo } from './Logo';
import { MarkdownMessage } from './MarkdownMessage';
import {
  Menu,
  Copy,
  Check,
  RotateCcw,
  Flame,
  Sparkles,
  Crown,
  ChevronDown,
  TestTube2,
  LogIn,
  Lock,
  Radio,
  ArrowUpCircle,
  Share2,
  Loader2,
} from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  isStreaming: boolean;
  isTempChatActive: boolean;
  onOpenSidebar: () => void;
  currentUser: UserProfile;
  onRegenerate: () => void;
  onSelectPromptSuggestion: (text: string) => void;
  selectedModel?: string;
  onSelectModel?: (modelId: string) => void;
  subscriptionPlan?: SubscriptionPlanType;
  subscriptionExpiresAt?: number;
  onOpenSubscription?: (plan?: SubscriptionPlanType) => void;
  onOpenSettings?: () => void;
  onOpenAuth?: () => void;
  isDark: boolean;
  renderCenteredInput?: () => React.ReactNode;
  serverState?: 'checking' | 'ready' | 'waking_up' | 'offline';
  updateInfo?: AppVersionInfo | null;
  onOpenUpdateModal?: () => void;
  onShareChat?: () => void;
  isSharing?: boolean;
  canShare?: boolean;
}

export const ChatArea: React.FC<ChatAreaProps> = ({
  messages,
  isStreaming,
  isTempChatActive,
  onOpenSidebar,
  currentUser,
  onRegenerate,
  onSelectPromptSuggestion,
  selectedModel = 'meta-llama/Llama-3.2-1B-Instruct',
  onSelectModel,
  subscriptionPlan = 'free',
  subscriptionExpiresAt,
  onOpenSubscription,
  onOpenSettings,
  onOpenAuth,
  isDark,
  renderCenteredInput,
  serverState = 'ready',
  updateInfo,
  onOpenUpdateModal,
  onShareChat,
  isSharing = false,
  canShare = false,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const stickToBottomRef = useRef(true);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const modelMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysRemaining = subscriptionExpiresAt
    ? Math.max(0, Math.ceil((subscriptionExpiresAt - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  const getModelLabel = () => {
    switch (selectedModel) {
      case 'meta-llama/Llama-3.2-3B-Instruct':
        return {
          name: 'Cat (3B)',
          badge: daysRemaining !== null ? `${daysRemaining}d` : '₹1 Test',
          isPro: true,
          plan: 'cat',
        };
      case 'meta-llama/Llama-3.1-8B-Instruct':
        return {
          name: 'Chetak (8B)',
          badge: daysRemaining !== null ? `${daysRemaining}d` : '₹299/mo',
          isPro: true,
          plan: 'chetak',
        };
      case 'meta-llama/Llama-3.3-70B-Instruct':
      case 'meta-llama/Llama-3-70B-Instruct':
        return {
          name: 'Arka (70B)',
          badge: daysRemaining !== null ? `${daysRemaining}d` : '₹799/mo',
          isPro: true,
          plan: 'arka',
        };
      case 'meta-llama/Llama-3.2-1B-Instruct':
      default:
        return {
          name: '1B',
          badge: 'Free',
          isPro: false,
          plan: 'free',
        };
    }
  };

  const modelInfo = getModelLabel();

  // Track whether the user is near the bottom of the scroll container.
  // If yes, we auto-scroll on new messages; if not, we leave their scroll position alone.
  const handleMessagesScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    stickToBottomRef.current = distanceFromBottom < 120;
  };

  // Auto-scroll to the bottom on new messages.
  // We never use scrollIntoView() here, because that would scroll the whole page
  // (including the header) — we only scroll the messages container so the header stays visible.
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const lastMsg = messages[messages.length - 1];
    // When the user sends a message, always jump to bottom.
    // Otherwise only auto-scroll if the user was already near the bottom.
    if (lastMsg?.role === 'user') stickToBottomRef.current = true;
    if (stickToBottomRef.current) {
      el.scrollTo({ top: el.scrollHeight, behavior: isStreaming ? 'auto' : 'smooth' });
    }
  }, [messages, isStreaming]);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  const starterSuggestions = [
    'Explain quantum computing in simple terms',
    'Write a clean JavaScript debounce function',
    'Help me plan a 3-day travel itinerary',
    'Draft a polite email asking for project updates',
  ];

  const formatShortTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // ---------------------------------------------------------------
  // Animated indicators: a hash of the message id picks a stable
  // variant per message, so different messages get different
  // spinners/cursors — but the same message keeps the same one.
  // ---------------------------------------------------------------

  // Spinner variants — shown while the assistant response is still empty
  const spinnerVariants = ['dots', 'ring', 'bars', 'pulse', 'cursor'] as const;
  const getSpinnerVariant = (id: string): (typeof spinnerVariants)[number] => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return spinnerVariants[hash % spinnerVariants.length];
  };

  const renderTypingSpinner = (variant: (typeof spinnerVariants)[number]) => {
    switch (variant) {
      case 'dots':
        return (
          <span className="spinner-dots text-zinc-400">
            <span /><span /><span />
          </span>
        );
      case 'ring':
        return <span className="spinner-ring text-zinc-400" />;
      case 'bars':
        return (
          <span className="spinner-bars text-zinc-400">
            <span /><span /><span />
          </span>
        );
      case 'pulse':
        return <span className="spinner-pulse text-zinc-400" />;
      case 'cursor':
      default:
        return <span className="streaming-cursor" />;
    }
  };

  // Cursor variants — shown while the assistant is streaming text
  const cursorVariants = ['block', 'line', 'circle', 'underline', 'glow', 'x'] as const;
  const getCursorVariant = (id: string): (typeof cursorVariants)[number] => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
    return cursorVariants[hash % cursorVariants.length];
  };

  const renderStreamingCursor = (variant: (typeof cursorVariants)[number]) => {
    switch (variant) {
      case 'line':
        return <span className="streaming-cursor-line" />;
      case 'circle':
        return <span className="streaming-cursor-circle" />;
      case 'underline':
        return <span className="streaming-cursor-underline" />;
      case 'glow':
        return <span className="streaming-cursor-glow" />;
      case 'x':
        return (
          <span className="streaming-cursor-x" aria-hidden>
            <svg viewBox="0 0 24 24" width="14" height="14">
              <path d="M5 5 L19 19" className="x-line-1" />
              <path d="M19 5 L5 19" className="x-line-2" />
            </svg>
          </span>
        );
      case 'block':
      default:
        return <span className="streaming-cursor" />;
    }
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col overflow-hidden relative">
      {/* Top Header Bar */}
      <header
        className={`h-14 px-4 flex items-center justify-between border-b shrink-0 z-10 transition-colors ${
          isDark
            ? 'bg-[#212121] border-zinc-800 text-zinc-100'
            : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        <div className="flex items-center gap-3">
          {/* Logo button — opens the sidebar drawer */}
          <button
            id="header-logo-btn"
            type="button"
            onClick={onOpenSidebar}
            title="Open sidebar"
            className={`flex items-center gap-2.5 p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
            }`}
          >
            <Logo size="sm" glowing={false} />
            <span className="font-bold text-lg tracking-tight">
              Tejas
            </span>
          </button>

          {isTempChatActive && (
            <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
              isDark
                ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              <Flame className="w-3 h-3" /> Temp
            </span>
          )}
        </div>

        {/* Top right: active model pill, share, sign-in, and upgrade buttons */}
        <div className="flex items-center gap-2 relative">
          {/* Active model pill with instant dropdown */}
          <div ref={modelMenuRef} className="relative">
            <button
              id="header-model-pill-btn"
              type="button"
              onClick={() => setModelDropdownOpen((prev) => !prev)}
              title="Click to switch active model"
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                modelInfo.plan === 'arka'
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                  : modelInfo.plan === 'chetak'
                  ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
                  : modelInfo.plan === 'cat'
                  ? 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20'
                  : isDark
                  ? 'bg-zinc-800/80 hover:bg-zinc-700 border-zinc-700/80 text-zinc-300'
                  : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700'
              }`}
            >
              <span>Tejas {modelInfo.name}</span>
              <span className="text-[10px] opacity-75 font-mono">({modelInfo.badge})</span>
              <ChevronDown className={`w-3.5 h-3.5 opacity-60 transition-transform ${modelDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Instant model selection dropdown */}
            {modelDropdownOpen && (
              <div
                className={`absolute right-0 top-full mt-2 w-72 rounded-xl border shadow-xl py-1.5 z-50 ${
                  isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-200' : 'bg-white border-zinc-200 text-zinc-800'
                }`}
              >
                <div className="px-3 py-1.5 border-b border-zinc-800/40 text-[11px] font-semibold opacity-60">
                  Switch Active Model
                </div>

                {[
                  {
                    id: 'meta-llama/Llama-3.2-1B-Instruct',
                    name: '1B (Free)',
                    desc: 'Fast, lightweight & free for all',
                    badge: 'Free',
                    badgeClass: 'bg-zinc-700/50 text-zinc-300',
                    plan: 'free' as SubscriptionPlanType,
                  },
                  {
                    id: 'meta-llama/Llama-3.2-3B-Instruct',
                    name: 'Cat (3B)',
                    desc: '₹1 Test tier • Sign In Required',
                    badge: '₹1 Test',
                    badgeClass: 'bg-purple-500/20 text-purple-300 border border-purple-500/30',
                    plan: 'cat' as SubscriptionPlanType,
                  },
                  {
                    id: 'meta-llama/Llama-3.1-8B-Instruct',
                    name: 'Chetak (8B)',
                    desc: '₹299/mo Reasoning • Sign In Required',
                    badge: '₹299/mo',
                    badgeClass: 'bg-blue-500/20 text-blue-300 border border-blue-500/30',
                    plan: 'chetak' as SubscriptionPlanType,
                  },
                  {
                    id: 'meta-llama/Llama-3.3-70B-Instruct',
                    name: 'Arka (70B)',
                    desc: '₹799/mo Flagship • Sign In Required',
                    badge: '₹799/mo',
                    badgeClass: 'bg-amber-500/20 text-amber-300 border border-amber-500/30',
                    plan: 'arka' as SubscriptionPlanType,
                  },
                ].map((item) => {
                  const isSelected = selectedModel === item.id;
                  const isGuestUser =
                    currentUser.provider === 'guest' ||
                    !currentUser.email ||
                    currentUser.id === 'user_guest' ||
                    String(currentUser.id).startsWith('guest_');
                  const isLockedForGuest = isGuestUser && item.id !== 'meta-llama/Llama-3.2-1B-Instruct';

                  return (
                    <div
                      key={item.id}
                      className={`px-3 py-2 flex items-center justify-between hover:bg-zinc-800/40 cursor-pointer transition-colors ${
                        isSelected ? (isDark ? 'bg-zinc-800/70' : 'bg-zinc-100') : ''
                      }`}
                      onClick={() => {
                        if (isLockedForGuest) {
                          setModelDropdownOpen(false);
                          onOpenAuth?.();
                          return;
                        }
                        onSelectModel?.(item.id);
                        setModelDropdownOpen(false);
                      }}
                    >
                      <div className="flex flex-col">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold">{item.name}</span>
                          {isLockedForGuest && (
                            <Lock className="w-3 h-3 text-amber-400 shrink-0" />
                          )}
                          {isSelected && !isLockedForGuest && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <span className="text-[10px] opacity-70">{item.desc}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {isLockedForGuest ? (
                          <span className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300">
                            <Lock className="w-2.5 h-2.5" /> Sign In
                          </span>
                        ) : (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${item.badgeClass}`}>
                            {item.badge}
                          </span>
                        )}
                        {!isLockedForGuest && item.plan !== 'free' && subscriptionPlan !== item.plan && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectModel?.(item.id);
                              setModelDropdownOpen(false);
                              onOpenSubscription?.(item.plan);
                            }}
                            className="text-[10px] font-bold px-2 py-0.5 rounded bg-zinc-700 hover:bg-zinc-600 text-zinc-100"
                            title="Subscribe to plan"
                          >
                            Sub
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Share button — colorful, shown only when there's an actual chat to share */}
          {onShareChat && canShare && (
            <button
              id="header-share-btn"
              type="button"
              onClick={onShareChat}
              disabled={isSharing}
              title="Share this chat"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border border-transparent bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 hover:from-fuchsia-500 hover:via-purple-500 hover:to-indigo-500 text-white transition-all shadow-sm disabled:opacity-60"
            >
              {isSharing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Share2 className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Sign In / Register button (guest only) */}
          {onOpenAuth && (currentUser.provider === 'guest' || !currentUser.email || currentUser.email.includes('guest')) && (
            <button
              id="header-auth-btn"
              type="button"
              onClick={onOpenAuth}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isDark
                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-100 border-zinc-700'
                  : 'bg-white hover:bg-zinc-100 text-zinc-900 border-zinc-300 shadow-sm'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
          )}

          {/* Upgrade Plan button */}
          {onOpenSubscription && (
            <button
              id="header-upgrade-btn"
              type="button"
              onClick={() => onOpenSubscription()}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                subscriptionPlan === 'arka'
                  ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30 hover:bg-amber-500/25'
                  : subscriptionPlan === 'chetak'
                  ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30 hover:bg-blue-500/25'
                  : subscriptionPlan === 'cat'
                  ? 'bg-purple-500/15 text-purple-300 border border-purple-500/30 hover:bg-purple-500/25'
                  : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
              }`}
            >
              {subscriptionPlan === 'arka' ? (
                <Crown className="w-3.5 h-3.5 text-amber-400" />
              ) : subscriptionPlan === 'cat' ? (
                <TestTube2 className="w-3.5 h-3.5 text-purple-300" />
              ) : (
                <Sparkles className="w-3.5 h-3.5 text-blue-300" />
              )}
              <span className="hidden sm:inline">
                {subscriptionPlan === 'arka'
                  ? 'Arka Pro'
                  : subscriptionPlan === 'chetak'
                  ? 'Chetak Active'
                  : subscriptionPlan === 'cat'
                  ? 'Cat Active'
                  : 'Upgrade'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Over-the-air update available banner */}
      {updateInfo && updateInfo.version && updateInfo.version !== getClientVersion() && (
        <div className="w-full bg-gradient-to-r from-blue-600/20 via-indigo-600/20 to-blue-600/20 border-b border-blue-500/30 px-4 py-2 flex items-center justify-between text-xs text-blue-200 transition-all shadow-sm shrink-0">
          <div className="flex items-center gap-2">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
            </span>
            <span>
              <strong>Update Ready:</strong> Version <strong>v{updateInfo.version}</strong> is available.
            </span>
          </div>
          <button
            id="open-update-modal-banner-btn"
            type="button"
            onClick={onOpenUpdateModal}
            className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] shadow-sm transition-all flex items-center gap-1 cursor-pointer"
          >
            <ArrowUpCircle className="w-3.5 h-3.5" />
            <span>Update Now</span>
          </button>
        </div>
      )}

      {/* Main content: empty state (centered input) or conversation history */}
      {messages.length === 0 ? (
        /* Empty state: centered chat input */
        <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-4 overflow-y-auto">
          <div className="max-w-2xl w-full text-center space-y-6 animate-in fade-in duration-200 py-6">
            <div className="flex justify-center mb-2">
              <Logo size="lg" glowing={false} />
            </div>

            <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-inherit">
              What can I help with?
            </h1>

            {/* Centered chat input box */}
            {renderCenteredInput && (
              <div className="w-full">
                {renderCenteredInput()}
              </div>
            )}

            {/* Minimalist starter prompt chips */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-xl mx-auto">
              {starterSuggestions.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => onSelectPromptSuggestion(prompt)}
                  className={`px-3 py-1.5 rounded-full text-xs border transition-all ${
                    isDark
                      ? 'bg-zinc-800/40 hover:bg-zinc-800 border-zinc-700/60 text-zinc-300'
                      : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700'
                  }`}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* Conversation history */
        <div
          ref={scrollContainerRef}
          onScroll={handleMessagesScroll}
          className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 sm:px-6 py-6 space-y-6"
        >
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const isLastAssistant =
                !isUser &&
                index === messages.length - 1 &&
                msg.role === 'assistant';

              return (
                <div
                  key={msg.id}
                  className={`group relative flex gap-3 sm:gap-4 ${
                    isUser ? 'justify-end' : 'justify-start'
                  } items-start`}
                >
                  {/* Assistant avatar */}
                  {!isUser && (
                    <div className="shrink-0 pt-0.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center">
                        <Logo size="xs" glowing={false} />
                      </div>
                    </div>
                  )}

                  {/* Message bubble container */}
                  <div className="relative max-w-[85%] sm:max-w-[80%] flex flex-col">
                    <div
                      className={`relative rounded-2xl px-4 py-2.5 text-sm sm:text-base leading-relaxed ${
                        isUser
                          ? isDark
                            ? 'bg-[#2f2f2f] text-zinc-100 self-end'
                            : 'bg-[#f4f4f4] text-zinc-900 self-end'
                          : 'text-inherit self-start px-0 sm:px-1'
                      }`}
                    >
                      {/* Message content */}
                      {isUser ? (
                        <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                      ) : (
                        <div
                          className={`prose prose-zinc ${
                            isDark ? 'prose-invert' : ''
                          } max-w-none break-words leading-relaxed text-sm sm:text-base prose-headings:font-semibold prose-headings:mt-5 prose-headings:mb-2 prose-p:my-2 prose-li:my-0.5 prose-code:before:content-none prose-code:after:content-none`}
                        >
                          <MarkdownMessage content={msg.content} isDark={isDark} />

                          {isStreaming && isLastAssistant && (
                            msg.content.trim().length === 0
                              ? renderTypingSpinner(getSpinnerVariant(msg.id))
                              : renderStreamingCursor(getCursorVariant(msg.id))
                          )}
                        </div>
                      )}
                    </div>

                    {/* Timestamp — revealed on hover (desktop) or focus (touch) */}
                    <div
                      className={`text-[10px] text-zinc-500 mt-1 opacity-0 group-hover:opacity-100 group-focus:opacity-100 transition-opacity select-none ${
                        isUser ? 'text-right' : 'text-left ml-1'
                      }`}
                    >
                      {formatShortTime(msg.timestamp)}
                    </div>

                    {/* Assistant action buttons — icon only (no labels) */}
                    {!isUser && !isStreaming && (
                      <div className="flex items-center gap-1 mt-1 ml-1 text-zinc-400">
                        {/* Copy icon */}
                        <button
                          type="button"
                          onClick={() => handleCopy(msg.id, msg.content)}
                          title="Copy"
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-zinc-800 hover:text-zinc-200' : 'hover:bg-zinc-200 hover:text-zinc-800'
                          }`}
                        >
                          {copiedMessageId === msg.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Regenerate icon (last assistant message only) */}
                        {isLastAssistant && (
                          <button
                            type="button"
                            onClick={onRegenerate}
                            title="Regenerate"
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-zinc-800 hover:text-zinc-200' : 'hover:bg-zinc-200 hover:text-zinc-800'
                            }`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* User avatar */}
                  {isUser && (
                    <div className="shrink-0 pt-0.5">
                      <div className="w-7 h-7 rounded-full bg-zinc-700 text-zinc-200 flex items-center justify-center font-medium text-xs">
                        {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      )}
    </div>
  );
};
