import { userPresenceManager } from '@/lib/userPresence'

// Store active SSE connections with user info
export const connections = new Map<string, Map<string, { writer: any, userId: string }>>()

// Helper function to add connection
export function addConnection(conversationId: string, writer: any, userId: string) {
  if (!connections.has(conversationId)) {
    connections.set(conversationId, new Map())
  }
  const clientId = `${userId}_${Date.now()}`
  connections.get(conversationId)!.set(clientId, { writer, userId })
  
  // Track global user presence using shared manager
  userPresenceManager.addUserConnection(userId, clientId)
  
  return clientId
}

// Helper function to remove connection
export function removeConnection(conversationId: string, clientId: string, userId?: string) {
  const conversationConnections = connections.get(conversationId)
  if (conversationConnections) {
    const connection = conversationConnections.get(clientId)
    const actualUserId = userId || connection?.userId
    
    conversationConnections.delete(clientId)
    if (conversationConnections.size === 0) {
      connections.delete(conversationId)
    }
    
    // Update global user presence using shared manager
    if (actualUserId) {
      const userWentOffline = userPresenceManager.removeUserConnection(actualUserId, clientId)
      if (userWentOffline) {
        // Broadcast user status change to relevant conversations
        broadcastUserStatus(conversationId, actualUserId, false)
      }
    }
  }
}

// Helper function to broadcast message to all connections in a conversation
export async function broadcastToConversation(conversationId: string, message: any, excludeUserId?: string) {
  const conversationConnections = connections.get(conversationId)
  if (conversationConnections) {
    const messageData = `data: ${JSON.stringify(message)}\n\n`
    
    // Send to all connected clients for this conversation (optionally excluding sender)
    const clientIds = Array.from(conversationConnections.keys())
    console.log(`📡 Broadcasting message to ${clientIds.length} connections in conversation ${conversationId}${excludeUserId ? ` (excluding user ${excludeUserId})` : ''}`);
    
    let sentCount = 0;
    for (const clientId of clientIds) {
      const connection = conversationConnections.get(clientId)
      if (connection) {
        // Skip sending to excluded user (typically the message sender)
        if (excludeUserId && connection.userId === excludeUserId) {
          console.log(`⏭️ Skipping broadcast to sender: client ${clientId} (user ${connection.userId})`);
          continue;
        }

        try {
          // Use enqueue instead of write for consistency with status broadcasting
          connection.writer.enqueue(new TextEncoder().encode(messageData))
          console.log(`✅ Message sent to client ${clientId} (user ${connection.userId})`);
          sentCount++;
        } catch (error) {
          console.error(`❌ Error writing message to client ${clientId}:`, error)
          // Only remove connection and mark offline for actual stream errors, not temporary write issues
          const errorMessage = error instanceof Error ? error.message : String(error);
          if (error instanceof TypeError || errorMessage.includes('stream') || errorMessage.includes('closed')) {
            conversationConnections.delete(clientId)
            console.log(`🔄 Removed failed connection ${clientId}, broadcasting user ${connection.userId} as offline`);
            broadcastUserStatus(conversationId, connection.userId, false)
          } else {
            console.log(`⚠️ Temporary write error for client ${clientId}, keeping connection alive`);
          }
        }
      }
    }
    console.log(`📊 Message broadcast completed: sent to ${sentCount} recipients`);
  }
}

// Broadcast unread count updates to a specific user across all their active connections
export async function broadcastUnreadCountToUser(userId: string, unreadCount: number) {
  console.log(`🔢 Broadcasting unread count update: User ${userId} now has ${unreadCount} unread messages`);
  
  const unreadData = {
    type: 'unread-count-update',
    userId: userId,
    unreadCount: unreadCount,
    timestamp: new Date().toISOString()
  }
  
  const messageData = `data: ${JSON.stringify(unreadData)}\n\n`
  let broadcastCount = 0;
  
  // Broadcast to all conversations where this user has active connections
  for (const [conversationId, conversationConnections] of Array.from(connections.entries())) {
    for (const [clientId, connection] of Array.from(conversationConnections.entries())) {
      if (connection.userId === userId) {
        try {
          connection.writer.enqueue(new TextEncoder().encode(messageData))
          broadcastCount++;
          console.log(`✅ Unread count sent to user ${userId} in conversation ${conversationId}`);
        } catch (error) {
          console.error(`❌ Error sending unread count to user ${userId} in conversation ${conversationId}:`, error);
          // Clean up failed connection
          conversationConnections.delete(clientId);
        }
      }
    }
  }
  
  console.log(`📊 Unread count broadcast completed: sent to ${broadcastCount} connections for user ${userId}`);
}

// Broadcast typing indicator to other participants
export function broadcastTyping(conversationId: string, userId: string, isTyping: boolean) {
  console.log(`⌨️ Broadcasting typing: User ${userId} is ${isTyping ? 'typing' : 'stopped typing'} in conversation ${conversationId}`);
  
  const conversationConnections = connections.get(conversationId)
  if (!conversationConnections) {
    console.log(`⚠️ No connections found for conversation ${conversationId}`);
    return;
  }

  const typingData = {
    type: 'typing-indicator',
    conversationId: conversationId,
    userId: userId,
    isTyping: isTyping,
    timestamp: new Date().toISOString()
  }

  const messageData = `data: ${JSON.stringify(typingData)}\n\n`
  console.log(`⌨️ Typing message to broadcast:`, typingData);
  
  // Send to all OTHER participants (not the user who is typing)
  const clientIds = Array.from(conversationConnections.keys())
  let recipientCount = 0;
  
  for (const clientId of clientIds) {
    const connection = conversationConnections.get(clientId)
    if (connection && connection.userId !== userId) {
      try {
        connection.writer.enqueue(new TextEncoder().encode(messageData))
        console.log(`✅ Sent typing indicator for user ${userId} to client ${clientId} (user ${connection.userId})`)
        recipientCount++;
      } catch (error) {
        console.error('Error sending typing indicator:', error)
        conversationConnections.delete(clientId)
      }
    } else if (connection?.userId === userId) {
      console.log(`⏭️ Skipping broadcast to self: client ${clientId} (user ${connection.userId})`)
    }
  }
  
  console.log(`⌨️ Typing indicator sent to ${recipientCount} recipients`)
}

// Broadcast user online/offline status to other participants
export function broadcastUserStatus(conversationId: string, userId: string, isOnline?: boolean) {
  // Use global presence status if not explicitly provided
  const actualOnlineStatus = isOnline !== undefined ? isOnline : userPresenceManager.isUserOnline(userId);
  console.log(`📢 Broadcasting status: User ${userId} is ${actualOnlineStatus ? 'ONLINE' : 'OFFLINE'} in conversation ${conversationId} (global check: ${userPresenceManager.isUserOnline(userId)})`);
  
  const conversationConnections = connections.get(conversationId)
  if (!conversationConnections) {
    console.log(`⚠️ No connections found for conversation ${conversationId}`);
    return;
  }

  const statusData = {
    type: 'user-status',
    conversationId: conversationId,
    userId: userId,
    isOnline: actualOnlineStatus,
    timestamp: new Date().toISOString()
  }

  const messageData = `data: ${JSON.stringify(statusData)}\n\n`
  console.log(`📤 Status message to broadcast:`, statusData);
  
  // Send status to all OTHER participants (not the user whose status changed)
  const clientIds = Array.from(conversationConnections.keys())
  let recipientCount = 0;
  
  console.log(`🎯 Broadcasting to ${clientIds.length} total connections in conversation ${conversationId}`);
  
  for (const clientId of clientIds) {
    const connection = conversationConnections.get(clientId)
    if (connection && connection.userId !== userId) {
      try {
        connection.writer.enqueue(new TextEncoder().encode(messageData))
        console.log(`✅ Sent ${actualOnlineStatus ? 'ONLINE' : 'OFFLINE'} status for user ${userId} to client ${clientId} (user ${connection.userId})`);
        recipientCount++;
      } catch (error) {
        console.error('Error sending status to client:', error)
        conversationConnections.delete(clientId)
      }
    } else if (connection && connection.userId === userId) {
      console.log(`⏭️ Skipping broadcast to self: client ${clientId} (user ${connection.userId})`);
    }
  }
  
  console.log(`📊 Status broadcast sent to ${recipientCount} recipients`);
}