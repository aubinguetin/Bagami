'use client'

import { useEffect } from 'react'
import { initializeApp, getApps } from 'firebase/app'
import { getMessaging, getToken, onMessage } from 'firebase/messaging'
import { useQueryClient } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'

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
  const { data: session, status } = useSession()

  useEffect(() => {
    const app = initFirebase()
    const messaging = getMessaging(app)

    const register = async () => {
      try {
        if (!process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || !process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY) {
          console.warn('FCM config missing: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID or VAPID_KEY')
          return
        }

        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          console.warn('Notification permission not granted')
          return
        }

        const swReg = await navigator.serviceWorker.register('/firebase-messaging-sw.js')
        const readyReg = await navigator.serviceWorker.ready
        ;(readyReg.active || swReg.active)?.postMessage({
          type: 'SET_FIREBASE_CONFIG',
          config: {
            apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY as string,
            authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN as string,
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID as string,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET as string,
            messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
            appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID as string,
          },
        })
        const token = await getToken(messaging, {
          vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY as string,
          serviceWorkerRegistration: swReg,
        })

        if (!token) {
          console.warn('FCM getToken returned empty token')
          return
        }

        const userId = (session?.user?.id) || (typeof window !== 'undefined' ? (localStorage.getItem('bagami_user_id') || '') : '')
        if (!userId) {
          console.warn('FCM skipped: no userId available')
          return
        }

        const res = await fetch('/api/notifications/register-fcm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, token, platform: 'web' }),
        })
        if (!res.ok) {
          console.error('Failed to register FCM token', await res.text())
        } else {
          console.log('FCM token registered for user', userId)
        }
      } catch (e) {
        console.error('FCM registration error', e)
      }
    }

    register()

    onMessage(messaging, payload => {
      try {
        console.log('FCM foreground message:', payload)
        const event = new CustomEvent('bagami-notification', { detail: payload })
        window.dispatchEvent(event)
        queryClient.invalidateQueries({ queryKey: ['unreadCount'] })
      } catch (e) {
        console.error('Error handling FCM foreground message', e)
      }
    })
  }, [queryClient, session, status])

  return children as React.ReactElement
}
