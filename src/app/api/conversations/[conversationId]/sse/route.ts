import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { userPresenceManager } from '@/lib/userPresence'
import { connections, addConnection, removeConnection, broadcastUserStatus } from '@/lib/sse'

export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const url = new URL(request.url);
  const currentUserId = url.searchParams.get('currentUserId');
  const currentUserContact = url.searchParams.get('currentUserContact');
  
  console.log(`�🚨🚨 SSE CONNECTION ATTEMPT 🚨🚨🚨`);
  console.log(`�🔌 SSE Connection request for conversation: ${params.conversationId}`);
  console.log(`🔍 URL parameters:`, { currentUserId, currentUserContact, url: request.url });
  console.log(`⏰ Timestamp: ${new Date().toISOString()}`);
  try {
    const session = await getServerSession(authOptions)
    const url = new URL(request.url)
    const currentUserId = url.searchParams.get('currentUserId')
    const currentUserContact = url.searchParams.get('currentUserContact')
    
    let currentUser = null

    // Try NextAuth session first
    if (session?.user?.email) {
      currentUser = await prisma.user.findUnique({
        where: { email: session.user.email }
      })
    }
    
    // Fallback to direct user lookup if no session or user not found
    if (!currentUser) {
      if (currentUserId) {
        currentUser = await prisma.user.findUnique({
          where: { id: currentUserId }
        })
      } else if (currentUserContact) {
        const decodedContact = decodeURIComponent(currentUserContact)
        currentUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: decodedContact },
              { phone: decodedContact }
            ]
          }
        })
      }
    }

    if (!currentUser) {
      console.log(`❌ SSE: No user found for conversation ${params.conversationId}`);
      // Temporary: Use a dummy user for testing
      currentUser = { id: 'temp_user_' + Math.random().toString(36).substr(2, 9) };
      console.log(`🔧 Using temporary user: ${currentUser.id}`);
    } else {
      console.log(`👤 SSE: User ${currentUser.id} connecting to conversation ${params.conversationId}`);
    }

    const conversationId = params.conversationId

    // For 'global' connections, allow any authenticated user
    if (conversationId !== 'global') {
      // Verify user is part of this specific conversation
      const conversation = await prisma.conversation.findFirst({
        where: {
          id: conversationId,
          OR: [
            { participant1Id: currentUser.id },
            { participant2Id: currentUser.id }
          ]
        }
      })

      if (!conversation) {
        return NextResponse.json({ error: 'Conversation not found or access denied' }, { status: 404 })
      }
    } else {
      console.log(`🌐 Global SSE connection for user ${currentUser.id}`);
    }

    // Create SSE stream
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder()
        
        // Create writer for this connection
        const writer = controller as any
        
        // Add connection to the map with user ID
        const clientId = addConnection(conversationId, writer, currentUser.id)
        console.log(`✅ Added connection ${clientId} for user ${currentUser.id} to conversation ${conversationId}`);
        
        // Send current participants' status to the new connection
        const conversationConnections = connections.get(conversationId)
        if (conversationConnections) {
          const onlineUsers = Array.from(new Set(
            Array.from(conversationConnections.values()).map((conn: { writer: any, userId: string }) => conn.userId)
          ))
          console.log(`👥 Online users in conversation ${conversationId}:`, onlineUsers);
          
          // Send status of all currently online users to this new connection
          for (const userId of onlineUsers) {
            if (userId !== currentUser.id) {
              const userIsOnline = userPresenceManager.isUserOnline(userId)
              try {
                const statusMessage = `data: ${JSON.stringify({
                  type: 'user-status',
                  conversationId: conversationId,
                  userId: userId,
                  isOnline: userIsOnline,
                  timestamp: new Date().toISOString()
                })}\n\n`
                writer.enqueue(encoder.encode(statusMessage))
                console.log(`📤 Sent ${userIsOnline ? 'online' : 'offline'} status for user ${userId} to new connection ${clientId} (${currentUser.id})`);
              } catch (error) {
                console.error('Error sending initial status:', error)
              }
            }
          }
        }
        
        // Broadcast that this user is now online to others
        console.log(`🔄 About to broadcast ${currentUser.id}'s online status to conversation ${conversationId}`);
        broadcastUserStatus(conversationId, currentUser.id, true)
        console.log(`📡 Broadcasted online status for user ${currentUser.id} in conversation ${conversationId}`);
        
        // Send initial connection message
        const initMessage = `data: ${JSON.stringify({ 
          type: 'connected', 
          conversationId,
          timestamp: new Date().toISOString()
        })}\n\n`
        
        try {
          writer.enqueue(encoder.encode(initMessage))
        } catch (error) {
          console.error('Error sending initial SSE message:', error)
        }
        
        // Keep connection alive with periodic heartbeat - more frequent for better disconnect detection
        const heartbeatInterval = setInterval(() => {
          try {
            const heartbeat = `data: ${JSON.stringify({ 
              type: 'heartbeat', 
              timestamp: new Date().toISOString() 
            })}\n\n`
            writer.enqueue(encoder.encode(heartbeat))
          } catch (error) {
            console.error('❌ Heartbeat failed - connection lost:', error)
            clearInterval(heartbeatInterval)
            removeConnection(conversationId, clientId, currentUser.id)
            console.log(`📢 Broadcasting OFFLINE status due to heartbeat failure for user ${currentUser.id}`)
            // Force broadcast offline status
            broadcastUserStatus(conversationId, currentUser.id, false)
          }
        }, 15000) // Heartbeat every 15 seconds for faster disconnect detection
        
        // Clean up on close
        request.signal.addEventListener('abort', () => {
          console.log(`🔌 SSE Connection aborted for user ${currentUser.id} in conversation ${conversationId}`);
          clearInterval(heartbeatInterval)
          removeConnection(conversationId, clientId, currentUser.id)
          console.log(`📢 Broadcasting OFFLINE status due to connection abort for user ${currentUser.id}`)
          // Force broadcast offline status
          broadcastUserStatus(conversationId, currentUser.id, false)
        })

        // Note: WritableStreamDefaultWriter doesn't support addEventListener
        // Cleanup will be handled by abort signal and heartbeat timeout
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    })

  } catch (error) {
    console.error('SSE endpoint error:', error)
    return NextResponse.json(
      { error: 'Failed to establish SSE connection' },
      { status: 500 }
    )
  }
}