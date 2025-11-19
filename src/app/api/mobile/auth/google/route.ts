import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'

function getAllowedClientIds(): string[] {
  const ids: string[] = []
  if (process.env.GOOGLE_CLIENT_ID) ids.push(process.env.GOOGLE_CLIENT_ID)
  if (process.env.GOOGLE_IOS_CLIENT_ID) ids.push(process.env.GOOGLE_IOS_CLIENT_ID)
  if (process.env.GOOGLE_ANDROID_CLIENT_ID) ids.push(process.env.GOOGLE_ANDROID_CLIENT_ID)
  return ids.filter(Boolean)
}

async function verifyGoogleIdToken(idToken: string) {
  const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
  if (!res.ok) {
    return null
  }
  const data = await res.json()
  const allowed = getAllowedClientIds()
  if (allowed.length > 0 && !allowed.includes(data.aud)) {
    return null
  }
  if (!data.email || data.email_verified !== 'true') {
    return null
  }
  return {
    email: data.email as string,
    name: (data.name as string) || null,
    picture: (data.picture as string) || null,
    sub: data.sub as string,
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const idToken = body?.idToken as string
    if (!idToken) {
      return NextResponse.json({ error: 'idToken is required' }, { status: 400 })
    }

    const verified = await verifyGoogleIdToken(idToken)
    if (!verified) {
      return NextResponse.json({ error: 'Invalid Google id_token' }, { status: 401 })
    }

    let user = await prisma.user.findUnique({ where: { email: verified.email } })
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: verified.email,
          name: verified.name || undefined,
          image: verified.picture || undefined,
          emailVerified: new Date(),
          role: 'user',
        },
      })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'ACCOUNT_SUSPENDED', code: 'ACCOUNT_SUSPENDED' }, { status: 403 })
    }

    const secret = process.env.NEXTAUTH_SECRET
    if (!secret) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const token = jwt.sign(
      {
        sub: user.id,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role || 'user',
        },
        role: user.role || 'user',
        isActive: user.isActive,
        provider: 'google_mobile',
      },
      secret,
      { expiresIn: '30d' }
    )

    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
        role: user.role || 'user',
      },
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

