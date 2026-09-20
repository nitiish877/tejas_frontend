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
import { SharedChatView } from './components/SharedChatView';
import { getClientVersion, isVersionDismissed, AppVersionInfo } from './version';
import { playNotificationChime } from './utils/audio';
import {
  ApiError,
  chatSignature,
  clearAuthToken,
  createShareLink,
  deleteServerChat,
  fetchMe,
  fetchServerChats,
  getAuthToken,
  isGuestUser,
  purgeGuestEphemeralChats,
  saveEphemeralChat,
  saveServerChat,
  updateMyName,
} from './utils/api';

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
  selectedModel: 'meta-llama/Llama-3.2-1B-Instruct',
  subscriptionPlan: 'free',
};

export default function App() {
  // Persistence state loaders
  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      // Purani guest chats (pehle localStorage me jama hoti thi) hata do
      localStorage.removeItem(STORAGE_KEY_CHATS);
      // Guest chat sirf is tab/session tak: tab/app band hote hi khatam
      const saved = sessionStorage.getItem(STORAGE_KEY_CHATS);
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

  // "/share/<id>" URL: koi bhi (login ho ya guest) is link ko khole to read-only shared chat dikhao.
  const [sharedChatId] = useState<string | null>(() => {
    try {
      const m = window.location.pathname.match(/^\/share\/([a-zA-Z0-9]+)/);
      return m ? m[1] : null;
    } catch {
      return null;
    }
  });

  // Stable id jo poori Temp Chat session ke liye same rehti hai (ephemeral sync ke liye)
  const tempChatIdRef = useRef<string>('temp_' + Date.now());

  // Share modal state
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);
  const [isSharing, setIsSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

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

  // Guest ki chat temporary hai: sirf sessionStorage me (tab/app band = khatam, refresh pe bachi rehti hai).
  // Logged-in user ki chats browser me kahin nahi rakhi jaati, wo sirf cloud DB me rehti hain.
  useEffect(() => {
    try {
      if (isGuestUser(currentUser)) {
        sessionStorage.setItem(STORAGE_KEY_CHATS, JSON.stringify(chats));
      } else {
        sessionStorage.removeItem(STORAGE_KEY_CHATS);
      }
      localStorage.removeItem(STORAGE_KEY_CHATS);
    } catch (e) {
      console.error('Failed to save chats', e);
    }
  }, [chats, currentUser]);

  // SECURITY: Guest user ki normal chat browser me sirf is tab tak rehti hai (upar wala effect).
  // Isko permanently kahin store nahi karte — background me sirf server ko ek 30-din wali
  // safety-net copy bheji jaati hai (ephemeral_chats table), jo user ko wapas kabhi nahi dikhai
  // jaati aur khud-ba-khud 30 din baad delete ho jaati hai.
  useEffect(() => {
    if (!isGuestUser(currentUser)) return;
    const timer = setTimeout(() => {
      chats.forEach((chat) => {
        if (chat.messages.length > 0) saveEphemeralChat(getApiUrl, chat, false);
      });
    }, 1500); // debounce: baar baar keystroke pe hit na ho
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chats, currentUser]);

  // SECURITY: Temp Chat (guest ho ya logged-in) kabhi bhi permanently save nahi hoti aur
  // account me migrate nahi hoti. Sirf isi tarah 30-din ki safety-net copy jaati hai, kabhi UI
  // me wapas nahi dikhti, aur 30 din baad apne aap delete ho jaati hai.
  useEffect(() => {
    if (!isTempChatActive || tempChatMessages.length === 0) return;
    const timer = setTimeout(() => {
      saveEphemeralChat(
        getApiUrl,
        {
          id: tempChatIdRef.current,
          title: 'Temporary chat',
          messages: tempChatMessages,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        true
      );
    }, 1500);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tempChatMessages, isTempChatActive]);

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
    setChats((prev) => (isGuestUser(currentUser) ? [newSession] : [newSession, ...prev]));
    setActiveChatId(newSession.id);
  };

  const handleStartTempChat = () => {
    setIsTempChatActive(true);
    setTempChatMessages([]);
    tempChatIdRef.current = 'temp_' + Date.now();
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
    if (getAuthToken() && !isGuestUser(currentUser)) {
      deleteServerChat(getApiUrl, id).catch((err) => console.error('Chat delete sync failed', err));
    }
    syncedRef.current.delete(id);
    setChats((prev) => prev.filter((c) => c.id !== id));
    if (activeChatId === id) {
      const remaining = chats.filter((c) => c.id !== id);
      setActiveChatId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  const handleUpdateUserName = (newName: string) => {
    setCurrentUser((prev) => ({ ...prev, name: newName }));
    if (getAuthToken() && !isGuestUser(currentUser)) {
      updateMyName(getApiUrl, newName).catch((e) => console.error('Name sync failed', e));
    }
  };

  // ---- Server (DB) chat sync: sirf logged-in user ke liye ----
  const syncedRef = useRef<Map<string, string>>(new Map());
  const chatsRef = useRef<ChatSession[]>(chats);
  chatsRef.current = chats;

  const resetToGuest = () => {
    clearAuthToken();
    syncedRef.current = new Map();
    setChats([]);
    setActiveChatId(null);
    setIsTempChatActive(false);
    setCurrentUser(DEFAULT_USER);
    localStorage.removeItem(STORAGE_KEY_USER);
    localStorage.removeItem(STORAGE_KEY_CHATS);
    sessionStorage.removeItem(STORAGE_KEY_CHATS);
  };

  // Jo chats abhi server pe save nahi hui unhe upload karo. false return = session expire
  const syncPendingChats = async (): Promise<boolean> => {
    if (!getAuthToken()) return true;
    for (const chat of chatsRef.current) {
      if (chat.isTemp) continue;
      const sig = chatSignature(chat);
      if (syncedRef.current.get(chat.id) === sig) continue;
      try {
        await saveServerChat(getApiUrl, chat);
        syncedRef.current.set(chat.id, sig);
      } catch (e) {
        if (e instanceof ApiError && e.status === 401) return false;
        console.error('Chat sync failed', e);
      }
    }
    return true;
  };

  // Server ki chats ko local ke saath merge karo (jo naya ho wo jeete)
  const loadServerChats = async () => {
    try {
      const { chats: serverChats } = await fetchServerChats(getApiUrl);
      setChats((prev) => {
        const map = new Map(prev.map((c) => [c.id, c]));
        for (const sc of serverChats) {
          const local = map.get(sc.id);
          if (!local || sc.updatedAt >= local.updatedAt) {
            map.set(sc.id, sc);
            syncedRef.current.set(sc.id, chatSignature(sc));
          }
        }
        return Array.from(map.values()).sort((a, b) => b.updatedAt - a.updatedAt);
      });
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) resetToGuest();
      else console.error('Failed to load chats', e);
    }
  };

  const handleLogout = async () => {
    if (isGuestUser(currentUser)) return; // Guest ke liye logout nahi hota
    await syncPendingChats(); // logout se pehle baaki chats save kar do
    resetToGuest();
  };

  const handleLoginSuccess = async (user: UserProfile) => {
    setCurrentUser(user);
    try {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } catch (e) {}
    if (!isGuestUser(user)) {
      await syncPendingChats(); // login se pehle wali guest chats account me upload
      await loadServerChats(); // phir account ki purani chats cloud se laao
      // Ab guest ki safety-net copy (ephemeral_chats) hata do — asli data account me migrate ho chuka hai.
      // Note: Temp Chat isse touch nahi hoti — wo jaanbujhke account me kabhi save nahi hoti.
      purgeGuestEphemeralChats(getApiUrl);
    }
  };

  // Chat share karna: guest ke liye login/signup zaroori hai. Sign in karne ke baad
  // wahi chat dobara share karni padegi (jo already normal behaviour hai).
  const handleShareChat = async () => {
    if (isTempChatActive) return; // Temp chat share nahi hoti
    if (isGuestUser(currentUser)) {
      setAuthModalOpen(true);
      return;
    }
    if (!activeChatId) return;

    setIsSharing(true);
    setShareError(null);
    try {
      await syncPendingChats(); // pehle latest messages server pe save karo, phir share banao
      const { shareId } = await createShareLink(getApiUrl, activeChatId);
      const link = `${window.location.origin}/share/${shareId}`;
      setShareLink(link);
      setShareModalOpen(true);
      try {
        await navigator.clipboard.writeText(link);
      } catch {}
    } catch (e) {
      setShareError(e instanceof ApiError ? e.message : 'Share link nahi ban paya. Dobara try karo.');
      setShareModalOpen(true);
    } finally {
      setIsSharing(false);
    }
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
      setChats((prev) => (isGuestUser(currentUser) ? [newSession] : [newSession, ...prev]));
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
      let streamError = '';

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
              if (parsed.error) streamError = String(parsed.error);
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

      if (streamError && !accumulatedText) {
        throw new Error(streamError);
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
        const friendly =
          err.message === 'Failed to fetch'
            ? 'Backend se connect nahi ho pa raha. Backend URL (VITE_BACKEND_URL) aur Railway server status check karo.'
            : err.message || 'Failed to connect to Llama 3.2 model endpoint';
        const errorText = `\n\n⚠️ *Streaming error: ${friendly}*`;
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

  // "/share/<id>" link: login ho ya na ho, koi bhi isko khol sakta hai — poori app ke bajaye
  // sirf read-only shared chat dikhao.
  if (sharedChatId) {
    return <SharedChatView shareId={sharedChatId} getApiUrl={getApiUrl} isDark={isDark} />;
  }

  return (
    <div
      className={`flex h-[100dvh] w-full overflow-hidden ${
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
      <main className="flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden md:pl-72 sm:md:pl-80 transition-all">
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
          onShareChat={handleShareChat}
          isSharing={isSharing}
          canShare={!isTempChatActive && activeMessages.length > 0}
          renderCenteredInput={() => (
            <ChatInput
              onSendMessage={handleSendMessage}
              isStreaming={isStreaming}
              onStopStreaming={handleStopStreaming}
              isDark={isDark}
              isCentered={true}
              disableAutoType={isAnyModalOpen}
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
            disableAutoType={isAnyModalOpen}
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
        onOpenAuth={() => setAuthModalOpen(true)}
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
        getApiUrl={getApiUrl}
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

      {/* Share Chat Modal: link copy karo, guest ho to Sign In dikhaya jaata hai (handleShareChat me) */}
      {shareModalOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={() => setShareModalOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-2xl border shadow-xl p-5 space-y-4 ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
            }`}
          >
            <h2 className="text-base font-semibold flex items-center gap-2">
              🔗 Chat share karo
            </h2>
            {shareError ? (
              <p className="text-sm text-rose-400">{shareError}</p>
            ) : (
              <>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Ye link jisko bhi bhejoge, wo bina login kiye bhi ye chat padh sakta hai.
                </p>
                <div
                  className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                    isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
                  }`}
                >
                  <span className="truncate flex-1">{shareLink}</span>
                  <button
                    type="button"
                    onClick={() => shareLink && navigator.clipboard.writeText(shareLink)}
                    className="shrink-0 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white transition-all"
                  >
                    Copy
                  </button>
                </div>
              </>
            )}
            <button
              type="button"
              onClick={() => setShareModalOpen(false)}
              className={`w-full py-2 rounded-xl text-sm font-medium transition-colors ${
                isDark ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200' : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
              }`}
            >
              Band karo
            </button>
          </div>
        </div>
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