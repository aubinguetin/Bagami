import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendNotificationToUser } from '@/lib/push/fcm'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json().catch(() => ({}))
    const inputUserId = (body?.userId as string) || ''
    const title = (body?.title as string) || 'Bagami Test Notification'
    const message = (body?.body as string) || 'This is a test web push notification.'

    const userId = session?.user?.id || inputUserId || ''
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const created = await prisma.notification.create({
      data: {
        userId,
        type: 'test',
        title,
        message,
        relatedId: '/notifications',
        isRead: false,
      },
    })

    const res = await sendNotificationToUser({ userId, title, body: message, data: { link: '/notifications' } })

    return NextResponse.json({ success: true, sent: res.sent, notificationId: created.id })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send test notification' }, { status: 500 })
  }
}

