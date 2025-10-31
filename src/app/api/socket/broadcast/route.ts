import { NextRequest, NextResponse } from 'next/server'
import { socketManager } from '@/lib/socket'

export async function POST(req: NextRequest) {
  try {
    const { conversationId, messageData } = await req.json()
    
    // Broadcast new message to conversation participants
    socketManager.broadcastToConversation(conversationId, 'new-message', messageData)
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Socket broadcast error:', error)
    return NextResponse.json(
      { error: 'Failed to broadcast message' },
      { status: 500 }
    )
  }
}