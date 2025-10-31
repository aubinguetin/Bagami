import { NextRequest, NextResponse } from 'next/server'
import { userPresenceManager } from '@/lib/userPresence'
import { broadcastUserStatus } from '@/lib/sse'

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  try {
    const body = await request.json()
    const { userId, conversationId } = body

    if (!userId || !conversationId) {
      return NextResponse.json(
        { error: 'Missing userId or conversationId' },
        { status: 400 }
      )
    }

    console.log(`🔌 Explicit disconnect request for user ${userId} in conversation ${conversationId}`)

    // Remove all connections for this user (simulate complete disconnect)
    const userConnections = userPresenceManager.getUserConnectionCount(userId)
    console.log(`🔍 User ${userId} has ${userConnections} active connections`)
    
    // Force user offline by removing all their connections
    // We'll generate fake connection IDs to clean up
    for (let i = 0; i < userConnections + 1; i++) {
      const fakeConnectionId = `disconnect_cleanup_${Date.now()}_${i}`
      const userWentOffline = userPresenceManager.removeUserConnection(userId, fakeConnectionId)
      
      if (userWentOffline || i === userConnections) {
        // Force broadcast offline status
        console.log(`📢 Force broadcasting OFFLINE status for user ${userId}`)
        broadcastUserStatus(conversationId, userId, false)
        break
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User disconnected successfully' 
    })

  } catch (error) {
    console.error('Disconnect endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to process disconnect' },
      { status: 500 }
    )
  }
}