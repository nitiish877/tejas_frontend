import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  Auth,
  GoogleAuthProvider,
  GithubAuthProvider,
  OAuthProvider,
  signInWithPopup,
} from 'firebase/auth';

const firebaseConfig = {
  apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || '',
  authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
  projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || '',
  storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || '',
  messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
  appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || '',
};

export const firebaseEnabled = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;

if (firebaseEnabled) {
  try {
    app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
    authInstance = getAuth(app);
  } catch (e) {
    console.error('Firebase init failed:', e);
  }
}

export const firebaseAuth = authInstance;

// ---- Google ----
export async function signInWithGooglePopup(): Promise<string> {
  if (!firebaseAuth) throw new Error('Google sign-in is not configured.');
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(firebaseAuth, provider);
  return await result.user.getIdToken();
}

// ---- GitHub ----
export async function signInWithGitHubPopup(): Promise<string> {
  if (!firebaseAuth) throw new Error('GitHub sign-in is not configured.');
  const provider = new GithubAuthProvider();
  // Request email scope (private emails ke liye zaroori)
  provider.addScope('user:email');
  const result = await signInWithPopup(firebaseAuth, provider);
  return await result.user.getIdToken();
}

// ---- Microsoft ----
export async function signInWithMicrosoftPopup(): Promise<string> {
  if (!firebaseAuth) throw new Error('Microsoft sign-in is not configured.');
  const provider = new OAuthProvider('microsoft.com');
  provider.setCustomParameters({
    // Force account picker (optional but recommended)
    prompt: 'select_account',
  });
  // Email scope (Microsoft Graph se email fetch karta hai)
  provider.addScope('email');
  provider.addScope('openid');
  provider.addScope('profile');
  const result = await signInWithPopup(firebaseAuth, provider);
  return await result.user.getIdToken();
}