import { NextRequest, NextResponse } from 'next/server'
import { sendNotificationToUser } from '@/lib/push/fcm'

export async function POST(request: NextRequest) {
  try {
    const { userId, title, body, data } = await request.json()

    if (!userId || !title || !body) {
      return NextResponse.json({ error: 'userId, title, body required' }, { status: 400 })
    }

    const result = await sendNotificationToUser({ userId, title, body, data })
    return NextResponse.json({ success: true, sent: result.sent })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to send test push' }, { status: 500 })
  }
}
