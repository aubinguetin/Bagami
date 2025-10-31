import { NextRequest, NextResponse } from 'next/server'
import { userPresenceManager } from '@/lib/userPresence'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const userId = searchParams.get('userId')
  const userIds = searchParams.get('userIds')?.split(',')
  
  if (userId) {
    // Single user query
    const isOnline = userPresenceManager.isUserOnline(userId)
    return NextResponse.json({
      userId,
      isOnline,
      connectionCount: userPresenceManager.getUserConnectionCount(userId)
    })
  }
  
  if (userIds && userIds.length > 0) {
    // Multiple users query
    const presenceData: { [key: string]: boolean } = {}
    for (const id of userIds) {
      presenceData[id.trim()] = userPresenceManager.isUserOnline(id.trim())
    }
    return NextResponse.json({ presence: presenceData })
  }
  
  return NextResponse.json({ error: 'userId or userIds parameter is required' }, { status: 400 })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userIds } = body
    
    if (!Array.isArray(userIds)) {
      return NextResponse.json({ error: 'userIds must be an array' }, { status: 400 })
    }
    
    const presenceStatuses = userIds.map(userId => ({
      userId,
      isOnline: userPresenceManager.isUserOnline(userId),
      connectionCount: userPresenceManager.getUserConnectionCount(userId)
    }))
    
    return NextResponse.json({
      presenceStatuses,
      allOnlineUsers: userPresenceManager.getAllOnlineUsers(),
      stats: userPresenceManager.getPresenceStats()
    })
  } catch (error) {
    console.error('Error checking user presence:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}