/**
 * Firebase Login Component
 *
 * Provides login buttons for Google, Facebook, and Email authentication
 * Uses Firebase Authentication client-side
 */

'use client';

import { useState } from 'react';
import {
  signInWithGoogle,
  signInWithFacebook,
  signInWithEmail,
  formatFirebaseUser
} from '@/lib/firebase/auth';
import { loginWithFirebase } from '@/lib/actions';

interface FirebaseLoginProps {
  isSignup?: boolean;
}

export function FirebaseLogin({ isSignup = false }: FirebaseLoginProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sign in with Firebase
      const result = await signInWithGoogle();
      const firebaseUser = result.user;

      // Format user data
      const userData = formatFirebaseUser(firebaseUser);

      // Create/link user in our database
      const dbUser = await loginWithFirebase(userData);

      // Store user in session/localStorage
      localStorage.setItem('user', JSON.stringify(dbUser.user));

      // Redirect or update UI
      if (dbUser.isNewUser) {
        window.location.href = '/auth/complete-profile';
      } else {
        window.location.href = '/';
      }
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err.message || 'Failed to login with Google');
    } finally {
      setLoading(false);
    }
  };

  const handleFacebookLogin = async () => {
    setLoading(true);
    setError(null);

    try {
      // Sign in with Firebase
      const result = await signInWithFacebook();
      const firebaseUser = result.user;

      // Format user data
      const userData = formatFirebaseUser(firebaseUser);

      // Create/link user in our database
      const dbUser = await loginWithFirebase(userData);

      // Store user in session/localStorage
      localStorage.setItem('user', JSON.stringify(dbUser));

      // Redirect or update UI
      window.location.href = '/';
    } catch (err: any) {
      console.error('Facebook login error:', err);
      setError(err.message || 'Failed to login with Facebook');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full max-w-sm">
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <button
        onClick={handleGoogleLogin}
        disabled={loading}
        className="flex items-center justify-center gap-3 bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <span>Loading...</span>
        ) : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span>{isSignup ? 'Sign up with Google' : 'Continue with Google'}</span>
          </>
        )}
      </button>

{/* 
      <button
        onClick={handleFacebookLogin}
        disabled={loading}
        className="flex items-center justify-center gap-3 bg-[#1877F2] text-white px-6 py-3 rounded-lg hover:bg-[#166FE5] disabled:opacity-50 disabled:cursor-not-allowed transition"
      >
        {loading ? (
          <span>Loading...</span>
        ) : (
          <>
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            <span>{isSignup ? 'Sign up with Facebook' : 'Continue with Facebook'}</span>
          </>
        )}
      </button>
       */}

      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">
            {isSignup ? 'Or register with email' : 'Or use password (temporary)'}
          </span>
        </div>
      </div>

      {!isSignup && (
        <div className="text-center text-sm text-gray-600">
          <p>Existing users can still login with password</p>
          <p className="text-xs text-gray-500 mt-1">
            Link your account to Google/Facebook to remove password requirement
          </p>
        </div>
      )}
    </div>
  );
}
