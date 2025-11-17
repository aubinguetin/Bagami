import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const userId = body.userId as string | undefined
    const token = body.token as string | undefined
    const platform = (body.platform as string | undefined) || 'web'

    if (!userId || !token) {
      return NextResponse.json({ error: 'userId and token are required' }, { status: 400 })
    }

    const userExists = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!userExists) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    await prisma.fcmToken.upsert({
      where: { token },
      update: { userId, platform, isActive: true },
      create: { userId, token, platform },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to register FCM token' }, { status: 500 })
  }
}
