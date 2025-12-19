/**
 * Firebase Authentication Helpers (Client-side)
 *
 * Provides functions for social authentication (Google, Facebook)
 * Used in client components
 */

import {
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  User,
  UserCredential
} from 'firebase/auth';
import { auth } from './config';

// ==================== SOCIAL AUTH PROVIDERS ====================

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Optional: Configure providers
googleProvider.setCustomParameters({
  prompt: 'select_account' // Force account selection even if one account is available
});

// ==================== SIGN IN METHODS ====================

/**
 * Sign in with Google
 */
export async function signInWithGoogle(): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(`Google sign in failed: ${error.message}`);
  }
}

/**
 * Sign in with Facebook
 */
export async function signInWithFacebook(): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    const result = await signInWithPopup(auth, facebookProvider);
    return result;
  } catch (error: any) {
    console.error('Facebook sign in error:', error);
    throw new Error(`Facebook sign in failed: ${error.message}`);
  }
}

/**
 * Sign in with email and password
 * (For users who prefer email instead of social)
 */
export async function signInWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error: any) {
    console.error('Email sign in error:', error);
    throw new Error(`Email sign in failed: ${error.message}`);
  }
}

/**
 * Create account with email and password
 */
export async function signUpWithEmail(
  email: string,
  password: string
): Promise<UserCredential> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return result;
  } catch (error: any) {
    console.error('Email sign up error:', error);
    throw new Error(`Email sign up failed: ${error.message}`);
  }
}

// ==================== SIGN OUT ====================

/**
 * Sign out current user
 */
export async function signOut(): Promise<void> {
  if (!auth) {
    throw new Error('Firebase not initialized');
  }

  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(`Sign out failed: ${error.message}`);
  }
}

// ==================== USER UTILITIES ====================

/**
 * Get current Firebase user
 */
export function getCurrentUser(): User | null {
  if (!auth) {
    return null;
  }
  return auth.currentUser;
}

/**
 * Get ID token for current user (for server authentication)
 */
export async function getIdToken(): Promise<string | null> {
  const user = getCurrentUser();
  if (!user) {
    return null;
  }

  try {
    const token = await user.getIdToken();
    return token;
  } catch (error) {
    console.error('Error getting ID token:', error);
    return null;
  }
}

/**
 * Listen to auth state changes
 */
export function onAuthStateChanged(callback: (user: User | null) => void) {
  if (!auth) {
    callback(null);
    return () => {};
  }

  return auth.onAuthStateChanged(callback);
}

// ==================== HELPER FUNCTIONS ====================

/**
 * Extract provider from Firebase user
 */
export function getProvider(user: User): 'GOOGLE' | 'FACEBOOK' | 'EMAIL' | 'PHONE' {
  const providerId = user.providerData[0]?.providerId;

  if (providerId === 'google.com') return 'GOOGLE';
  if (providerId === 'facebook.com') return 'FACEBOOK';
  if (providerId === 'phone') return 'PHONE';
  return 'EMAIL';
}

/**
 * Format Firebase user for our backend
 */
export function formatFirebaseUser(user: User) {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || undefined,
    photoURL: user.photoURL || undefined,
    provider: getProvider(user)
  };
}
