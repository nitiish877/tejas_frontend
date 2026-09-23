import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

// Sign in with Google via popup. Returns the Firebase ID token.
export async function signInWithGooglePopup(): Promise<string> {
  if (!firebaseAuth) {
    throw new Error('Google sign-in is not configured. Contact support.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(firebaseAuth, provider);
  const idToken = await result.user.getIdToken();
  return idToken;
}