import { ChatSession, UserProfile, SubscriptionPlanType } from '../types';

const TOKEN_KEY = 'tejas_auth_token_v1';
const GUEST_ID_KEY = 'tejas_guest_id_v1';

export const getAuthToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

// Anonymous guest ki pehchaan ke liye ek chhota random id — koi chat/personal
// data nahi, sirf ek id jisse server 30-din wali safety-net copy ko match kar sake.
export const getGuestId = (): string => {
  try {
    let id = localStorage.getItem(GUEST_ID_KEY);
    if (!id) {
      id = 'guest_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(GUEST_ID_KEY, id);
    }
    return id;
  } catch {
    return 'guest_temp';
  }
};

export const setAuthToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {}
};

export const clearAuthToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {}
};

export const isGuestUser = (user: UserProfile): boolean =>
  user.provider === 'guest' || !user.email || user.id === 'user_guest';

type UrlBuilder = (path: string) => string;

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(getUrl: UrlBuilder, path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) {
    const token = getAuthToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res: Response;
  try {
    res = await fetch(getUrl(path), { ...options, headers: { ...headers, ...(options.headers as any) } });
  } catch {
    throw new ApiError('Server se connect nahi ho pa raha. Internet ya backend URL check karo.', 0);
  }

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new ApiError(data?.error || `Request failed (${res.status})`, res.status);
  }

  // 200 aaya par JSON nahi: matlab /api call backend tak nahi pahunchi (host ne index.html de diya)
  if (data === null) {
    throw new ApiError(
      'Backend se galat response aaya (JSON ki jagah page mila). VITE_BACKEND_URL ya /api proxy (rewrite) check karo.',
      502
    );
  }

  return data as T;
}

export interface AuthResult {
  token: string;
  user: UserProfile;
}

// Subscription snapshot saved on the server, so logout/login keeps the user's plans
export interface ServerSubscription {
  subscriptionPlan: SubscriptionPlanType;
  ownedPlans: SubscriptionPlanType[];
  planExpiries: Partial<Record<SubscriptionPlanType, number>>;
  subscriptionStartedAt?: number;
  subscriptionExpiresAt?: number;
  lastPaymentId?: string;
}

export const registerAccount = (getUrl: UrlBuilder, body: { name: string; email: string; password: string }) =>
  request<AuthResult>(getUrl, '/api/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const loginAccount = (getUrl: UrlBuilder, body: { email: string; password: string }) =>
  request<AuthResult>(getUrl, '/api/auth/login', { method: 'POST', body: JSON.stringify(body) });
// Firebase (Google) sign-in: frontend gets an ID token from Firebase, backend
// verifies it with the Admin SDK and returns our own JWT + user record.
export const loginWithFirebase = (getUrl: UrlBuilder, idToken: string) =>
  request<AuthResult>(
    getUrl,
    '/api/auth/firebase',
    { method: 'POST', body: JSON.stringify({ idToken }) }
  );

// Fetch which sign-in providers are enabled on the server
export const fetchAuthProviders = (getUrl: UrlBuilder) =>
  request<{ email: boolean; google: boolean; github: boolean; microsoft: boolean }>(
    getUrl,
    '/api/auth/providers'
  );


export const fetchMe = (getUrl: UrlBuilder) => request<{ user: UserProfile }>(getUrl, '/api/auth/me', {}, true);

export const updateMyName = (getUrl: UrlBuilder, name: string) =>
  request<{ user: UserProfile }>(getUrl, '/api/auth/me', { method: 'PUT', body: JSON.stringify({ name }) }, true);

export const fetchServerChats = (getUrl: UrlBuilder) =>
  request<{ chats: ChatSession[] }>(getUrl, '/api/chats', {}, true);

export const saveServerChat = (getUrl: UrlBuilder, chat: ChatSession) =>
  request<{ ok: boolean }>(
    getUrl,
    `/api/chats/${encodeURIComponent(chat.id)}`,
    {
      method: 'PUT',
      body: JSON.stringify({
        title: chat.title,
        isPinned: !!chat.isPinned,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        messages: chat.messages,
      }),
    },
    true
  );

export const deleteServerChat = (getUrl: UrlBuilder, id: string) =>
  request<{ ok: boolean }>(getUrl, `/api/chats/${encodeURIComponent(id)}`, { method: 'DELETE' }, true);

// Chat me kuch badla hai ya nahi ye pakadne ke liye (pin/title/messages)
export const chatSignature = (c: ChatSession): string => {
  const last = c.messages[c.messages.length - 1];
  return `${c.updatedAt}|${c.isPinned ? 1 : 0}|${c.title}|${c.messages.length}|${last?.content?.length ?? 0}`;
};

// ---------------- EPHEMERAL (GUEST / TEMP) CHAT SYNC ----------------
// Security: guest ki normal chat aur temp chat browser me kahin store nahi hoti.
// Ye sirf background me server ko bheji jaati hai, jahan 30 din ke liye rakhi jaati
// hai (safety-net), phir apne aap delete ho jaati hai. Login ho to bhi ye zaroori
// nahi hai (login required nahi), isliye alag request path use karte hain.
export const saveEphemeralChat = async (
  getUrl: UrlBuilder,
  chat: ChatSession,
  isTemp: boolean
): Promise<void> => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = getAuthToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  else headers['X-Guest-Id'] = getGuestId();

  try {
    await fetch(getUrl(`/api/ephemeral/chats/${encodeURIComponent(chat.id)}`), {
      method: 'PUT',
      headers,
      body: JSON.stringify({
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
        isTemp,
        messages: chat.messages,
      }),
    });
  } catch {
    // Best-effort hai: backend down ho to bhi guest chat UI kaam karti rahe
  }
};

// Login/register safal hone ke baad guest ki purani safety-net copies hata do
// (asli chats ab account me migrate ho chuki hain).
export const purgeGuestEphemeralChats = async (getUrl: UrlBuilder): Promise<void> => {
  const token = getAuthToken();
  const guestId = getGuestId();
  if (!token || !guestId) return;
  try {
    await fetch(getUrl(`/api/ephemeral/guest/${encodeURIComponent(guestId)}`), {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch {
    // best-effort
  }
};

// ---------------- SHARE ----------------
export const createShareLink = (getUrl: UrlBuilder, chatId: string) =>
  request<{ shareId: string }>(getUrl, `/api/share/${encodeURIComponent(chatId)}`, { method: 'POST' }, true);

export const deleteShareLink = (getUrl: UrlBuilder, shareId: string) =>
  request<{ ok: boolean }>(getUrl, `/api/share/${encodeURIComponent(shareId)}`, { method: 'DELETE' }, true);

export interface SharedChatData {
  title: string;
  messages: ChatSession['messages'];
  ownerName: string;
  createdAt: number;
}

export const fetchSharedChat = (getUrl: UrlBuilder, shareId: string) =>
  request<SharedChatData>(getUrl, `/api/share/${encodeURIComponent(shareId)}`, {}, false);

// ---------------- SUBSCRIPTION ----------------
// Persist the subscription snapshot on the server so it survives logout/login.
export const saveSubscriptionToServer = (
  getUrl: UrlBuilder,
  data: ServerSubscription
) =>
  request<{ user: UserProfile }>(
    getUrl,
    '/api/auth/subscription',
    { method: 'PUT', body: JSON.stringify(data) },
    true
  );
  // ---------------- PAYMENTS ----------------
export interface PaymentRecord {
  id: string;
  plan: SubscriptionPlanType;
  modelId: string;
  planName: string;
  amount: number;
  period: string;
  durationDays: number;
  paymentMethod: string;
  utrNumber?: string;
  txId: string;
  createdAt: number;
}

export const savePaymentRecord = (
  getUrl: UrlBuilder,
  data: Omit<PaymentRecord, 'id'>
) =>
  request<{ ok: boolean; id: string }>(
    getUrl,
    '/api/payments',
    { method: 'POST', body: JSON.stringify(data) },
    true
  );

export const fetchMyPayments = (getUrl: UrlBuilder) =>
  request<{ payments: PaymentRecord[] }>(getUrl, '/api/payments', {}, true);

// ---------------- SHARES (list user's own) ----------------
export interface ShareRecord {
  shareId: string;
  chatId: string;
  title: string;
  createdAt: number;
}

export const fetchMyShares = (getUrl: UrlBuilder) =>
  request<{ shares: ShareRecord[] }>(getUrl, '/api/shares', {}, true);