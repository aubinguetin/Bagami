'use client'

import { useEffect } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { useQueryClient } from '@tanstack/react-query'

function initFirebase() {
  if (getApps().length > 0) return getApps()[0]
  return initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
  })
}

export default function FcmProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  useEffect(() => {
    const app = initFirebase()
    const messaging = getMessaging(app)

    const register = async () => {
      try {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') return

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY as string,
          serviceWorkerRegistration: swReg,
        })

        const userId = typeof window !== 'undefined' ? (localStorage.getItem('bagami_user_id') || '') : ''
        if (userId && token) {
          await fetch('/api/notifications/register-fcm', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId, token, platform: 'web' }),
          })
        }
      } catch {}
    }

    register()

    onMessage(messaging, payload => {
      const event = new CustomEvent('bagami-notification', { detail: payload })
      window.dispatchEvent(event)
      queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
    })
  }, [queryClient])

  return children as React.ReactElement
}
