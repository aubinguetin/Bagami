import { Server as SocketIOServer } from 'socket.io'
import { Server as HTTPServer } from 'http'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export class SocketManager {
  private static instance: SocketManager
  private io: SocketIOServer | null = null

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager()
    }
    return SocketManager.instance
  }

  initializeSocket(server: HTTPServer): SocketIOServer {
    if (this.io) {
      return this.io
    }

    console.log('🚀 Initializing Socket.IO server...')
    
    this.io = new SocketIOServer(server, {
      path: '/api/socket/io',
      cors: {
        origin: process.env.NEXTAUTH_URL || "http://localhost:3002",
        methods: ["GET", "POST"],
        credentials: true
      }
    })

    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token
        if (!token) {
          return next(new Error('Authentication token required'))
        }

        // For now, we'll pass the user info from client
        const { userId, userEmail } = socket.handshake.auth
        
        if (!userId || !userEmail) {
          return next(new Error('User information required'))
        }
        
        // Attach user info to socket
        socket.userId = userId
        socket.userEmail = userEmail
        console.log(`👤 User authenticated: ${socket.userEmail}`)
        next()
      } catch (error) {
        console.error('Socket auth error:', error)
        next(new Error('Authentication error'))
      }
    })

    // Connection handling
    this.io.on('connection', (socket) => {
      console.log(`🔌 User connected: ${socket.userEmail} (${socket.id})`)
      
      // Join user to their personal room
      socket.join(`user-${socket.userId}`)
      
      // Emit user online status
      socket.broadcast.emit('user-online', {
        userId: socket.userId,
        userEmail: socket.userEmail
      })
      
      // Handle joining conversation rooms
      socket.on('join-conversation', (conversationId: string) => {
        socket.join(`conversation-${conversationId}`)
        console.log(`💬 User ${socket.userEmail} joined conversation ${conversationId}`)
      })
      
      // Handle leaving conversation rooms
      socket.on('leave-conversation', (conversationId: string) => {
        socket.leave(`conversation-${conversationId}`)
        console.log(`👋 User ${socket.userEmail} left conversation ${conversationId}`)
      })
      
      // Handle new message events
      socket.on('send-message', async (data) => {
        try {
          const { conversationId, content, messageType = 'text', messageId } = data
          
          // Broadcast to all users in the conversation (except sender)
          socket.to(`conversation-${conversationId}`).emit('new-message', {
            id: messageId,
            conversationId,
            content,
            messageType,
            senderId: socket.userId,
            senderEmail: socket.userEmail,
            createdAt: new Date().toISOString(),
            isRead: false
          })
          
          console.log(`📨 Message sent in conversation ${conversationId} by ${socket.userEmail}`)
        } catch (error) {
          console.error('Send message error:', error)
          socket.emit('message-error', { 
            message: 'Failed to send message',
            error: error instanceof Error ? error.message : 'Unknown error'
          })
        }
      })
      
      // Handle message read events
      socket.on('mark-messages-read', (data) => {
        const { conversationId, messageIds } = data
        
        // Notify other users in conversation that messages were read
        socket.to(`conversation-${conversationId}`).emit('messages-read', {
          conversationId,
          messageIds,
          readBy: socket.userId,
          readAt: new Date().toISOString()
        })
        
        console.log(`👀 Messages marked as read in conversation ${conversationId}`)
      })
      
      // Handle typing indicators
      socket.on('typing-start', (data) => {
        const { conversationId } = data
        socket.to(`conversation-${conversationId}`).emit('user-typing', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          isTyping: true
        })
      })
      
      socket.on('typing-stop', (data) => {
        const { conversationId } = data
        socket.to(`conversation-${conversationId}`).emit('user-typing', {
          userId: socket.userId,
          userEmail: socket.userEmail,
          isTyping: false
        })
      })
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 User disconnected: ${socket.userEmail} (${reason})`)
        
        // Emit user offline status
        socket.broadcast.emit('user-offline', {
          userId: socket.userId,
          userEmail: socket.userEmail
        })
      })
      
      // Handle connection errors
      socket.on('error', (error) => {
        console.error(`❌ Socket error for ${socket.userEmail}:`, error)
      })
    })

    console.log('✅ Socket.IO server initialized')
    return this.io
  }

  getIO(): SocketIOServer | null {
    return this.io
  }

  // Broadcast message to conversation
  broadcastToConversation(conversationId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`conversation-${conversationId}`).emit(event, data)
    }
  }

  // Broadcast to user
  broadcastToUser(userId: string, event: string, data: any) {
    if (this.io) {
      this.io.to(`user-${userId}`).emit(event, data)
    }
  }
}

// Extend socket type to include user info
declare module 'socket.io' {
  interface Socket {
    userId?: string
    userEmail?: string
  }
}

export const socketManager = SocketManager.getInstance()