import React, { useState, useEffect, useRef } from 'react';
import { ChatSession, Message, UserProfile, AppSettings, HFStatus, ThemeMode, SubscriptionPlanType } from './types';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { ChatInput } from './components/ChatInput';
import { UserProfileModal } from './components/UserProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { TokenGuideModal } from './components/TokenGuideModal';
import { SubscriptionModal } from './components/SubscriptionModal';
import { PaymentItem, PaymentModal } from './components/PaymentModal';
import { UpdateModal } from './components/UpdateModal';
import { getClientVersion, isVersionDismissed, AppVersionInfo } from './version';
import { playNotificationChime } from './utils/audio';

const STORAGE_KEY_CHATS = 'llama_chatbot_sessions_v1';
const STORAGE_KEY_USER = 'llama_chatbot_user_v1';
const STORAGE_KEY_SETTINGS = 'llama_chatbot_settings_v1';

const DEFAULT_USER: UserProfile = {
  id: 'user_guest',
  name: 'Tejas User',
  email: '',
  provider: 'guest',
};

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  notificationsEnabled: true,
  customHfToken: '',
  customBackendUrl: '',
  systemPrompt: 'You are Tejas, an intelligent, fast, and polite AI assistant. Always match the response length directly to the user\'s query: keep simple questions concise and direct (1-3 sentences), and provide structured explanations only for complex or coding queries.',
  responseStyle: 'adaptive',
  selectedModel: 'meta-llama/Llama-3.2-1B-Instruct',
  subscriptionPlan: 'free',
};

export default function App() {
  // Persistence state loaders
  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHATS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to parse saved chats', e);
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<UserProfile>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Clear any old hardcoded username
        if (
          parsed.name === 'Nitish Vishwakarma' ||
          parsed.email === 'nitishvishwakarma1332@gmail.com' ||
          parsed.id === 'user_default'
        ) {
          return DEFAULT_USER;
        }
        return parsed;
      }
    } catch (e) {
      console.error('Failed to parse user', e);
    }
    return DEFAULT_USER;
  });

  const [settings, setSettings] = useState<AppSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SETTINGS);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Automatically upgrade to adaptive prompt if still on old generic prompt
        if (
          !parsed.systemPrompt ||
          parsed.systemPrompt.includes('Provide clean, well-formatted answers with markdown, clear headings, and concise explanations.')
        ) {
          parsed.systemPrompt = DEFAULT_SETTINGS.systemPrompt;
        }
        if (!parsed.responseStyle) {
          parsed.responseStyle = 'adaptive';
        }
        // Clean out any old hardcoded domains from user's storage
        if (
          parsed.customBackendUrl?.includes('railway.app') ||
          parsed.customBackendUrl?.includes('onrender.com') ||
          parsed.customBackendUrl?.includes('tejasbacked')
        ) {
          parsed.customBackendUrl = '';
        }
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch (e) {
      console.error('Failed to parse settings', e);
    }
    return DEFAULT_SETTINGS;
  });

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isTempChatActive, setIsTempChatActive] = useState(false);
  const [tempChatMessages, setTempChatMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Modals & Drawers state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userProfileOpen, setUserProfileOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [tokenGuideOpen, setTokenGuideOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingPaymentItem, setPendingPaymentItem] = useState<PaymentItem | null>(null);
  const [highlightPlan, setHighlightPlan] = useState<SubscriptionPlanType>('cat');

  const handleOpenSubscription = (plan: SubscriptionPlanType = 'cat') => {
    setHighlightPlan(plan);
    setSubscriptionModalOpen(true);
  };

  const handleInitiateCheckout = (item: PaymentItem) => {
    setPendingPaymentItem(item);
    setPaymentModalOpen(true);
  };

  const handleSelectFreePlan = () => {
    setSettings((prev) => ({
      ...prev,
      subscriptionPlan: 'free',
      selectedModel: 'meta-llama/Llama-3.2-1B-Instruct',
      subscriptionExpiresAt: undefined,
    }));
  };

  const handlePaymentSuccess = (
    plan: SubscriptionPlanType,
    modelId: string,
    durationDays: number,
    paymentId: string
  ) => {
    const now = Date.now();
    const expiresAt = now + durationDays * 24 * 60 * 60 * 1000;
    setSettings((prev) => ({
      ...prev,
      subscriptionPlan: plan,
      selectedModel: modelId,
      subscriptionStartedAt: now,
      subscriptionExpiresAt: expiresAt,
      lastPaymentId: paymentId,
    }));
    playNotificationChime();
  };

  // Subscription duration auto-revert: automatically revert to free tier once month/duration finishes
  useEffect(() => {
    const checkSubscriptionExpiry = () => {
      if (
        settings.subscriptionPlan &&
        settings.subscriptionPlan !== 'free' &&
        settings.subscriptionExpiresAt
      ) {
        if (Date.now() > settings.subscriptionExpiresAt) {
          setSettings((prev) => ({
            ...prev,
            subscriptionPlan: 'free',
            selectedModel: 'meta-llama/Llama-3.2-1B-Instruct',
            subscriptionExpiresAt: undefined,
          }));
        }
      }
    };

    checkSubscriptionExpiry();
    const timer = setInterval(checkSubscriptionExpiry, 5000);
    return () => clearInterval(timer);
  }, [settings.subscriptionPlan, settings.subscriptionExpiresAt]);

  // HF Status info from backend
  const [hfStatus, setHfStatus] = useState<HFStatus | null>(null);

  // Helper to resolve backend endpoint from environment variables (e.g. VITE_BACKEND_URL on Netlify) or custom config
  const getApiUrl = (path: string): string => {
    let base = (
      import.meta.env.VITE_BACKEND_URL ||
      import.meta.env.VITE_API_URL ||
      settings.customBackendUrl ||
      ''
    ).trim().replace(/\/$/, '');

    // If user provided a domain without protocol, auto-prepend https://
    if (base && !base.startsWith('http://') && !base.startsWith('https://')) {
      base = `https://${base}`;
    }

    return base ? `${base}${path}` : path;
  };

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
    } catch (e) {
      console.error('Failed to save chats', e);
    }
  }, [chats]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(currentUser));
    } catch (e) {
      console.error('Failed to save user', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to save settings', e);
    }
  }, [settings]);

  const [serverState, setServerState] = useState<'checking' | 'ready' | 'waking_up' | 'offline'>('checking');
  const [updateModalOpen, setUpdateModalOpen] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<AppVersionInfo | null>(null);
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);

  // Version check function (automatic on startup and manual via Settings)
  const checkForUpdates = async (manual = false) => {
    if (manual) setIsCheckingUpdates(true);
    try {
      const res = await fetch(getApiUrl('/api/version'));
      if (res.ok) {
        const data: AppVersionInfo = await res.json();
        if (data && data.version) {
          setUpdateInfo(data);
          const currentVer = getClientVersion();
          if (data.version !== currentVer) {
            if (manual || !isVersionDismissed(data.version)) {
              setUpdateModalOpen(true);
            }
          } else if (manual) {
            alert(`Tejas AI is up to date (v${currentVer}).`);
          }
        }
      } else if (manual) {
        alert('Could not check updates from server.');
      }
    } catch (err) {
      console.warn('Update check failed:', err);
      if (manual) {
        alert('Unable to connect to server. Please check your internet connection.');
      }
    } finally {
      if (manual) setIsCheckingUpdates(false);
    }
  };

  // Check for updates automatically after app boots
  useEffect(() => {
    const timer = setTimeout(() => {
      checkForUpdates(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, [settings.customBackendUrl]);

  // Fetch server status on mount and when backend URL changes, with Render cold-start detection
  useEffect(() => {
    let isMounted = true;
    let retryTimer: any = null;

    const checkServerHealth = async () => {
      const hasCustomUrl = Boolean(
        (
          settings.customBackendUrl ||
          import.meta.env.VITE_API_URL ||
          import.meta.env.VITE_BACKEND_URL ||
          ''
        ).trim()
      );

      // If user configured a backend and it takes longer than 2.5s, it's likely a Render cold-start
      const slowTimer = setTimeout(() => {
        if (isMounted && hasCustomUrl) {
          setServerState('waking_up');
        }
      }, 2500);

      try {
        const res = await fetch(getApiUrl('/api/status'));
        clearTimeout(slowTimer);
        const contentType = res.headers.get('content-type') || '';

        if (res.ok && contentType.includes('application/json')) {
          const data = await res.json();
          if (isMounted) {
            setHfStatus(data);
            setServerState('ready');
          }
        } else {
          if (isMounted) {
            // If response is HTML or missing, and no custom URL configured, mark offline (no fake waking banner)
            setServerState(hasCustomUrl ? 'waking_up' : 'offline');
            if (hasCustomUrl) {
              retryTimer = setTimeout(checkServerHealth, 6000);
            }
          }
        }
      } catch (err) {
        clearTimeout(slowTimer);
        if (isMounted) {
          setServerState(hasCustomUrl ? 'waking_up' : 'offline');
          if (hasCustomUrl) {
            // Retry polling until Render container finishes cold booting
            retryTimer = setTimeout(checkServerHealth, 6000);
          }
        }
      }
    };

    checkServerHealth();

    return () => {
      isMounted = false;
      if (retryTimer) clearTimeout(retryTimer);
    };
  }, [settings.customBackendUrl]);

  // System theme preference listener
  const [systemPrefersDark, setSystemPrefersDark] = useState(true);
  useEffect(() => {
    const matchMedia = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemPrefersDark(matchMedia.matches);
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches);
    matchMedia.addEventListener('change', listener);
    return () => matchMedia.removeEventListener('change', listener);
  }, []);

  // Compute effective theme (Dark vs Bright)
  const isDark =
    settings.theme === 'dark'
      ? true
      : settings.theme === 'bright'
      ? false
      : systemPrefersDark;

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      document.body.style.backgroundColor = '#090d16';
    } else {
      document.documentElement.classList.remove('dark');
      document.body.style.backgroundColor = '#f8fafc';
    }
  }, [isDark]);

  // Set default active chat if none selected
  useEffect(() => {
    if (!isTempChatActive && !activeChatId && chats.length > 0) {
      setActiveChatId(chats[0].id);
    }
  }, [chats, activeChatId, isTempChatActive]);

  // Get current active messages
  const currentChat = chats.find((c) => c.id === activeChatId);
  const activeMessages: Message[] = isTempChatActive
    ? tempChatMessages
    : currentChat
    ? currentChat.messages
    : [];

  // Chat handlers
  const handleNewChat = () => {
    setIsTempChatActive(false);
    const newSession: ChatSession = {
      id: 'chat_' + Date.now(),
      title: 'New Conversation',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setChats((prev) => [newSession, ...prev]);
    setActiveChatId(newSession.id);
  };

  const handleStartTempChat = () => {
    setIsTempChatActive(true);
    setTempChatMessages([]);
  };

  const handleSelectChat = (id: string) => {
    setIsTempChatActive(false);
    setActiveChatId(id);
  };

  const handleTogglePinChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isPinned: !c.isPinned } : c))
    );
  };

  const handleDeleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter((c) => c.id !== id);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleUpdateUserName = (newName: string) => {
    setCurrentUser((prev) => ({ ...prev, name: newName }));
  };

  const handleLogout = () => {
    setCurrentUser(DEFAULT_USER);
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  const handleLoginSuccess = (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {}
  };

  const handleSaveCustomToken = (token: string) => {
    setSettings((prev) => ({ ...prev, customHfToken: token }));
  };

  const handleStopStreaming = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsStreaming(false);
  };

  // Main streaming request to Llama 3.2 REST API
  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    let targetChatId = activeChatId;
    let targetTitle = 'New Conversation';

    // Create session if none exists
    if (!isTempChatActive && (!targetChatId || !currentChat)) {
      targetTitle = text.slice(0, 32) + (text.length > 32 ? '...' : '');
      const newSession: ChatSession = {
        id: 'chat_' + Date.now(),
        title: targetTitle,
        messages: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      targetChatId = newSession.id;
      setChats((prev) => [newSession, ...prev]);
      setActiveChatId(newSession.id);
    }

    const userMessage: Message = {
      id: 'msg_user_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const assistantMessageId = 'msg_assistant_' + (Date.now() + 1);
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now() + 1,
      status: 'streaming',
    };

    if (isTempChatActive) {
      setTempChatMessages((prev) => [...prev, userMessage, assistantMessage]);
    } else {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === targetChatId) {
            const isFirst = c.messages.length === 0;
            const updatedTitle = isFirst
              ? text.slice(0, 32) + (text.length > 32 ? '...' : '')
              : c.title;
            return {
              ...c,
              title: updatedTitle,
              updatedAt: Date.now(),
              messages: [...c.messages, userMessage, assistantMessage],
            };
          }
          return c;
        })
      );
    }

    setIsStreaming(true);
    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const historyToSend = [
        ...activeMessages.filter((m) => m.content.trim().length > 0),
        userMessage,
      ];

      const response = await fetch(getApiUrl('/api/chat'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: historyToSend,
          userToken: settings.customHfToken,
          systemPrompt: settings.systemPrompt,
          preferredModel: settings.selectedModel,
          responseStyle: settings.responseStyle || 'adaptive',
          userProfile: currentUser,
        }),
        signal: controller.signal,
      });

      if (!response.ok && !response.headers.get('content-type')?.includes('event-stream')) {
        if (response.status === 404) {
          throw new Error(
            'Backend server not reached (HTTP 404). Please ensure your backend URL is set in VITE_BACKEND_URL environment variable on Netlify.'
          );
        }
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      if (!response.body) {
        throw new Error('ReadableStream not supported in response');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let accumulatedText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed.startsWith('data:')) {
            const dataStr = trimmed.slice(5).trim();
            try {
              const parsed = JSON.parse(dataStr);
              if (parsed.text) {
                accumulatedText += parsed.text;

                // Update message in state
                if (isTempChatActive) {
                  setTempChatMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: accumulatedText }
                        : m
                    )
                  );
                } else {
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === targetChatId
                        ? {
                            ...c,
                            messages: c.messages.map((m) =>
                              m.id === assistantMessageId
                                ? { ...m, content: accumulatedText }
                                : m
                            ),
                          }
                        : c
                    )
                  );
                }
              }
            } catch {
              // Ignore chunk parse error
            }
          }
        }
      }

      // Mark complete
      if (isTempChatActive) {
        setTempChatMessages((prev) =>
          prev.map((m) =>
            m.id === assistantMessageId ? { ...m, status: 'complete' } : m
          )
        );
      } else {
        setChats((prev) =>
          prev.map((c) =>
            c.id === targetChatId
              ? {
                  ...c,
                  messages: c.messages.map((m) =>
                    m.id === assistantMessageId ? { ...m, status: 'complete' } : m
                  ),
                }
              : c
          )
        );
      }

      // Play chime if enabled
      if (settings.notificationsEnabled) {
        playNotificationChime();
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream aborted by user');
      } else {
        console.error('Chat streaming error:', err);
        const errorText = `\n\n⚠️ *Streaming error: ${err.message || 'Failed to connect to Llama 3.2 model endpoint'}*`;
        if (isTempChatActive) {
          setTempChatMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? { ...m, content: (m.content || '') + errorText, status: 'error' }
                : m
            )
          );
        } else {
          setChats((prev) =>
            prev.map((c) =>
              c.id === targetChatId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId
                        ? { ...m, content: (m.content || '') + errorText, status: 'error' }
                        : m
                    ),
                  }
                : c
            )
          );
        }
      }
    } finally {
      setIsStreaming(false);
      abortControllerRef.current = null;
    }
  };

  const handleRegenerate = () => {
    if (activeMessages.length === 0 || isStreaming) return;
    const lastUserMsg = [...activeMessages].reverse().find((m) => m.role === 'user');
    if (!lastUserMsg) return;

    // Pop the last assistant message
    if (isTempChatActive) {
      setTempChatMessages((prev) => {
        const lastIdx = prev.map((m) => m.role).lastIndexOf('assistant');
        if (lastIdx !== -1) {
          const copy = [...prev];
          copy.splice(lastIdx, 1);
          return copy;
        }
        return prev;
      });
    } else if (activeChatId) {
      setChats((prev) =>
        prev.map((c) => {
          if (c.id === activeChatId) {
            const lastIdx = c.messages.map((m) => m.role).lastIndexOf('assistant');
            if (lastIdx !== -1) {
              const copy = [...c.messages];
              copy.splice(lastIdx, 1);
              return { ...c, messages: copy };
            }
          }
          return c;
        })
      );
    }

    handleSendMessage(lastUserMsg.content);
  };

  const isAnyModalOpen =
    userProfileOpen ||
    settingsOpen ||
    authModalOpen ||
    tokenGuideOpen ||
    subscriptionModalOpen ||
    paymentModalOpen;

  return (
    <div
      className={`flex h-screen w-screen overflow-hidden ${
        isDark ? 'bg-[#212121] text-zinc-100' : 'bg-white text-zinc-900'
      }`}
    >
      {/* Sidebar Drawer */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        chats={chats}
        activeChatId={activeChatId}
        onSelectChat={handleSelectChat}
        onNewChat={handleNewChat}
        onStartTempChat={handleStartTempChat}
        isTempChatActive={isTempChatActive}
        onTogglePinChat={handleTogglePinChat}
        onDeleteChat={handleDeleteChat}
        currentUser={currentUser}
        onOpenProfile={() => setUserProfileOpen(true)}
        onOpenSettings={() => setSettingsOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        onOpenSubscription={() => handleOpenSubscription()}
        subscriptionPlan={settings.subscriptionPlan || 'free'}
        isDark={isDark}
      />

      {/* Main Content Area (offset by sidebar on desktop) */}
      <main className="flex-1 flex flex-col h-full overflow-hidden md:pl-72 sm:md:pl-80 transition-all">
        <ChatArea
          messages={activeMessages}
          isStreaming={isStreaming}
          isTempChatActive={isTempChatActive}
          onOpenSidebar={() => setSidebarOpen(true)}
          currentUser={currentUser}
          onRegenerate={handleRegenerate}
          onSelectPromptSuggestion={(prompt) => handleSendMessage(prompt)}
          selectedModel={settings.selectedModel}
          onSelectModel={(modelId) => setSettings((prev) => ({ ...prev, selectedModel: modelId }))}
          subscriptionPlan={settings.subscriptionPlan || 'free'}
          subscriptionExpiresAt={settings.subscriptionExpiresAt}
          onOpenSubscription={(plan) => handleOpenSubscription(plan || 'cat')}
          onOpenSettings={() => setSettingsOpen(true)}
          onOpenAuth={() => setAuthModalOpen(true)}
          isDark={isDark}
          serverState={serverState}
          updateInfo={updateInfo}
          onOpenUpdateModal={() => setUpdateModalOpen(true)}
          renderCenteredInput={() => (
            <ChatInput
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              isDark={isDark}
              isCentered={true}
            />
          )}
        />

        {/* Bottom Input Field (Only shown after 1st message) */}
        {activeMessages.length > 0 && (
          <ChatInput
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
            isDark={isDark}
            isCentered={false}
          />
        )}
      </main>

      {/* User Profile Modal */}
      <UserProfileModal
        user={currentUser}
        isOpen={userProfileOpen}
        onClose={() => setUserProfileOpen(false)}
        onUpdateName={handleUpdateUserName}
        onLogout={handleLogout}
        onOpenAuth={() => setAuthModalOpen(true)}
        isDark={isDark}
      />

      {/* App Settings Modal (Dark, Bright, System themes, Notifications toggle, Logout) */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        settings={settings}
        onUpdateSettings={(newSettings) =>
          setSettings((prev) => ({ ...prev, ...newSettings }))
        }
        currentUser={currentUser}
        onLogout={handleLogout}
        onOpenSubscription={(plan) => handleOpenSubscription(plan || 'cat')}
        isDark={isDark}
        onCheckForUpdates={() => checkForUpdates(true)}
        isCheckingUpdates={isCheckingUpdates}
      />

      {/* Over-the-Air App Update Modal */}
      <UpdateModal
        isOpen={updateModalOpen}
        onClose={() => setUpdateModalOpen(false)}
        updateInfo={updateInfo}
        isDark={isDark}
      />

      {/* Auth Modal (Google OAuth, Email/Password, Guest mode) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
        isDark={isDark}
      />

      {/* Subscription & Model Plans Modal */}
      <SubscriptionModal
        isOpen={subscriptionModalOpen}
        onClose={() => setSubscriptionModalOpen(false)}
        currentPlan={settings.subscriptionPlan || 'free'}
        highlightPlan={highlightPlan}
        onSelectFreePlan={handleSelectFreePlan}
        onInitiateCheckout={handleInitiateCheckout}
        subscriptionExpiresAt={settings.subscriptionExpiresAt}
        isDark={isDark}
      />

      {/* Secure Payment Simulation Modal */}
      {pendingPaymentItem && (
        <PaymentModal
          isOpen={paymentModalOpen}
          onClose={() => setPaymentModalOpen(false)}
          item={pendingPaymentItem}
          onPaymentSuccess={handlePaymentSuccess}
          isDark={isDark}
        />
      )}

      {/* Hugging Face Token Guide & APK Testing Setup (hidden from default UI) */}
      <TokenGuideModal
        isOpen={tokenGuideOpen}
        onClose={() => setTokenGuideOpen(false)}
        customHfToken={settings.customHfToken}
        onSaveToken={handleSaveCustomToken}
        hfStatus={hfStatus}
        isDark={isDark}
      />
    </div>
  );
}
