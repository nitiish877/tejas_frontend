export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: 'streaming' | 'complete' | 'error';
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  isPinned?: boolean;
  isTemp?: boolean;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  provider: 'email' | 'google' | 'github' | 'guest';
}

export type ThemeMode = 'dark' | 'bright' | 'system';

export type SubscriptionPlanType = 'free' | 'cat' | 'chetak' | 'arka';

export interface AppSettings {
  theme: ThemeMode;
  notificationsEnabled: boolean;
  customHfToken: string;
  customBackendUrl?: string;
  systemPrompt: string;
  responseStyle?: 'adaptive' | 'detailed';
  selectedModel?: string;
  subscriptionPlan?: SubscriptionPlanType;
  subscriptionStartedAt?: number;
  subscriptionExpiresAt?: number;
  lastPaymentId?: string;
}

export interface HFStatus {
  status: string;
  model: string;
  hasTokenInEnv: boolean;
  instructions?: {
    step1: string;
    step2: string;
    step3: string;
    step4: string;
  };
}
