import { ChatSession, UserProfile } from '../types';

const TOKEN_KEY = 'tejas_auth_token_v1';

export const getAuthToken = (): string => {
  try {
    return localStorage.getItem(TOKEN_KEY) || '';
  } catch {
    return '';
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
  return data as T;
}

export interface AuthResult {
  token: string;
  user: UserProfile;
}

export const registerAccount = (getUrl: UrlBuilder, body: { name: string; email: string; password: string }) =>
  request<AuthResult>(getUrl, '/api/auth/register', { method: 'POST', body: JSON.stringify(body) });

export const loginAccount = (getUrl: UrlBuilder, body: { email: string; password: string }) =>
  request<AuthResult>(getUrl, '/api/auth/login', { method: 'POST', body: JSON.stringify(body) });

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