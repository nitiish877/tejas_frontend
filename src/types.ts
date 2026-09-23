export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
  status?: 'streaming' | 'complete' | 'error';
  // "Ask about this" — reference to a snippet the user selected from an earlier message
  contextText?: string;
  contextMessageId?: string;
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
  // Every plan the user has bought (may be multiple — Cat + Chetak + Arka all at once)
  ownedPlans?: SubscriptionPlanType[];
  // Expiry timestamp per plan, so each plan expires independently
  planExpiries?: Partial<Record<SubscriptionPlanType, number>>;
}

// Model → plan mapping (used to keep the "active plan" in sync with the selected model)
export const MODEL_TO_PLAN: Record<string, SubscriptionPlanType> = {
  'meta-llama/Llama-3.2-1B-Instruct': 'free',
  'meta-llama/Llama-3.2-3B-Instruct': 'cat',
  'meta-llama/Llama-3.1-8B-Instruct': 'chetak',
  'meta-llama/Llama-3.3-70B-Instruct': 'arka',
  'meta-llama/Llama-3-70B-Instruct': 'arka',
};

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