'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useT } from '@/lib/i18n-helpers';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

interface FacebookSignInButtonProps {
  isSignUp?: boolean;
  className?: string;
}

export default function FacebookSignInButton({
  isSignUp = false,
  className = ""
}: FacebookSignInButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const t = useT();

  const handleFacebookSignIn = async () => {
    try {
      setIsLoading(true);
      if (Capacitor.isNativePlatform()) {
        console.log('🔵 Starting Facebook Login with Limited Login mode...');
        const result = await FirebaseAuthentication.signInWithFacebook({
          mode: 'limited', // For Android if applicable, though mainly for iOS
          useLimitedLogin: true // Explicitly use Limited Login for iOS
        } as any); // Type cast might be needed if types aren't perfectly updated in the project
        if (result.user) {
          // Get the Firebase ID token
          const tokenResult = await FirebaseAuthentication.getIdToken();

          if (tokenResult.token) {
            const signInResult = await signIn('facebook-mobile', {
              idToken: tokenResult.token,
              callbackUrl: '/deliveries',
              redirect: false,
            });

            console.log('📱 Facebook Mobile SignIn Result:', signInResult);

            if (signInResult?.ok) {
              console.log('✅ SignIn successful, redirecting to /deliveries');
              window.location.href = '/deliveries';
            } else {
              console.error('❌ SignIn failed:', signInResult?.error);
              alert(`Login failed: ${signInResult?.error}`);
            }
          }
        }
      } else {
        // Web: Use Firebase JS SDK
        const { signInWithPopup } = await import('firebase/auth');
        const { auth, facebookProvider } = await import('@/lib/firebaseClient');

        try {
          const result = await signInWithPopup(auth, facebookProvider);
          const user = result.user;
          const idToken = await user.getIdToken();

          console.log('🌐 Web Facebook Login success, verifying with backend...');

          // Reuse the facebook-mobile provider which expects an ID token
          const signInResult = await signIn('facebook-mobile', {
            idToken: idToken,
            callbackUrl: '/deliveries',
            redirect: false,
          });

          if (signInResult?.ok) {
            console.log('✅ Backend verification successful');
            window.location.href = '/deliveries';
          } else {
            console.error('❌ Backend verification failed:', signInResult?.error);
            alert(`Login failed: ${signInResult?.error}`);
          }

        } catch (firebaseError: any) {
          console.error('Firebase popup error:', firebaseError);
          if (firebaseError.code !== 'auth/popup-closed-by-user') {
            alert('Facebook login failed. Please try again.');
          }
        }
      }
    } catch (error) {
      console.error('Facebook sign-in error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const text = isSignUp ? t.authPage('socialSignIn.facebook.signUp') : t.authPage('socialSignIn.facebook.signIn');
  const loadingText = t.authPage('socialSignIn.facebook.signingIn');

  return (
    <button
      onClick={handleFacebookSignIn}
      disabled={isLoading}
      className={`w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {/* Facebook Logo SVG */}
      <svg
        className="w-5 h-5 mr-3"
        fill="#1877F2"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>

      <span className="text-sm font-medium text-gray-700">
        {isLoading ? loadingText : text}
      </span>
    </button>
  );
}