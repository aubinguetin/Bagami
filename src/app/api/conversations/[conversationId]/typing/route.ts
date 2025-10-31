import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { broadcastTyping } from '@/lib/sse'

export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  console.log('🚨🚨 TYPING API ENDPOINT HIT! 🚨🚨')
  try {
    const session = await getServerSession(authOptions)
    const { conversationId } = params
    const { isTyping } = await request.json()

    console.log('📋 Request details:', { conversationId, isTyping, hasSession: !!session })

    // Get user ID from session
    const actualUserId = session?.user?.id
    
    if (!actualUserId) {
      console.log('❌ No user ID in session:', session)
      return NextResponse.json({ error: 'User not authenticated' }, { status: 401 })
    }

    console.log(`⌨️ Typing API called: user ${actualUserId} ${isTyping ? 'started' : 'stopped'} typing in conversation ${conversationId}`)

    // Broadcast typing status to other participants via SSE
    broadcastTyping(conversationId, actualUserId, isTyping)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error handling typing indicator:', error)
    return NextResponse.json(
      { error: 'Failed to send typing indicator' },
      { status: 500 }
    )
  }
}