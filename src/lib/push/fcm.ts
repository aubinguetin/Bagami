import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'
import { prisma } from '@/lib/prisma'

function getPrivateKey() {
  const key = process.env.FIREBASE_PRIVATE_KEY || ''
  return key.replace(/\\n/g, '\n')
}

function ensureInitialized() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID as string,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL as string,
        privateKey: getPrivateKey(),
      }),
    })
  }
}

export async function sendNotificationToUser(params: {
  userId: string
  title: string
  body: string
  data?: Record<string, string>
}) {
  ensureInitialized()
  const tokens = await prisma.fcmToken.findMany({
    where: { userId: params.userId, isActive: true },
    select: { id: true, token: true, platform: true },
  })

  if (tokens.length === 0) return { success: false, sent: 0 }

  const unreadCount = await prisma.notification.count({
    where: { userId: params.userId, isRead: false },
  })

  const messaging = getMessaging()
  const payload = {
    notification: { title: params.title, body: params.body },
    data: {
      type: 'bagami_notification',
      unreadCount: String(unreadCount),
      ...(params.data || {}),
    },
  }

  const response = await messaging.sendEachForMulticast({
    tokens: tokens.map((t) => t.token),
    ...payload,
  })

  // Deactivate invalid tokens (not registered/invalid)
  try {
    const toDeactivateIds: string[] = []
    response.responses.forEach((r, idx) => {
      if (!r.success) {
        const code = (r.error && (r.error as any).code) || ''
        if (
          code === 'messaging/registration-token-not-registered' ||
          code === 'messaging/invalid-registration-token' ||
          code === 'messaging/invalid-argument'
        ) {
          const tokenRecord = tokens[idx]
          if (tokenRecord?.id) toDeactivateIds.push(tokenRecord.id)
        }
      }
    })
    if (toDeactivateIds.length > 0) {
      await prisma.fcmToken.updateMany({
        where: { id: { in: toDeactivateIds } },
        data: { isActive: false },
      })
    }
  } catch (cleanupError) {
    console.error('FCM token cleanup error', cleanupError)
  }

  return { success: true, sent: response.successCount }
}
