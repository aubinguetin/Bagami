'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error'
  joinConversation: (conversationId: string) => void
  leaveConversation: (conversationId: string) => void
  sendMessage: (data: {
    conversationId: string
    content: string
    messageType?: string
    messageId?: string
  }) => void
  markMessagesAsRead: (data: {
    conversationId: string
    messageIds: string[]
  }) => void
  startTyping: (conversationId: string) => void
  stopTyping: (conversationId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  connectionStatus: 'disconnected',
  joinConversation: () => {},
  leaveConversation: () => {},
  sendMessage: () => {},
  markMessagesAsRead: () => {},
  startTyping: () => {},
  stopTyping: () => {},
})

interface SocketProviderProps {
  children: ReactNode
}

export function SocketProvider({ children }: SocketProviderProps) {
  const { data: session } = useSession()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected')

  useEffect(() => {
    if (!session?.user?.id || !session?.user?.email) {
      return
    }

    console.log('🔌 Initializing Socket.IO connection...')
    setConnectionStatus('connecting')

    // Create socket connection
    const newSocket = io({
      path: '/api/socket/io',
      auth: {
        token: 'authenticated', // You can use JWT token here if needed
        userId: session.user.id,
        userEmail: session.user.email
      },
      autoConnect: true
    })

    // Connection event handlers
    newSocket.on('connect', () => {
      console.log('✅ Socket connected:', newSocket.id)
      setIsConnected(true)
      setConnectionStatus('connected')
    })

    newSocket.on('disconnect', (reason) => {
      console.log('❌ Socket disconnected:', reason)
      setIsConnected(false)
      setConnectionStatus('disconnected')
    })

    newSocket.on('connect_error', (error) => {
      console.error('❌ Socket connection error:', error)
      setConnectionStatus('error')
    })

    newSocket.on('error', (error) => {
      console.error('❌ Socket error:', error)
    })

    // Set up global message listeners
    newSocket.on('new-message', (message) => {
      console.log('📨 New message received:', message)
      // This will be handled by individual hooks
    })

    newSocket.on('messages-read', (data) => {
      console.log('👀 Messages read:', data)
      // This will be handled by individual hooks
    })

    newSocket.on('user-typing', (data) => {
      console.log('⌨️ User typing:', data)
      // This will be handled by individual hooks
    })

    newSocket.on('user-online', (data) => {
      console.log('🟢 User online:', data)
    })

    newSocket.on('user-offline', (data) => {
      console.log('🔴 User offline:', data)
    })

    setSocket(newSocket)

    // Cleanup on unmount
    return () => {
      console.log('🧹 Cleaning up socket connection')
      newSocket.disconnect()
      setSocket(null)
      setIsConnected(false)
      setConnectionStatus('disconnected')
    }
  }, [session?.user?.id, session?.user?.email])

  // Helper functions
  const joinConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('join-conversation', conversationId)
      console.log(`🔗 Joined conversation: ${conversationId}`)
    }
  }

  const leaveConversation = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('leave-conversation', conversationId)
      console.log(`👋 Left conversation: ${conversationId}`)
    }
  }

  const sendMessage = (data: {
    conversationId: string
    content: string
    messageType?: string
    messageId?: string
  }) => {
    if (socket && isConnected) {
      socket.emit('send-message', data)
      console.log(`📤 Message sent to conversation: ${data.conversationId}`)
    }
  }

  const markMessagesAsRead = (data: {
    conversationId: string
    messageIds: string[]
  }) => {
    if (socket && isConnected) {
      socket.emit('mark-messages-read', data)
      console.log(`✅ Marked messages as read in conversation: ${data.conversationId}`)
    }
  }

  const startTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-start', { conversationId })
    }
  }

  const stopTyping = (conversationId: string) => {
    if (socket && isConnected) {
      socket.emit('typing-stop', { conversationId })
    }
  }

  const value: SocketContextType = {
    socket,
    isConnected,
    connectionStatus,
    joinConversation,
    leaveConversation,
    sendMessage,
    markMessagesAsRead,
    startTyping,
    stopTyping,
  }

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  )
}

export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}

export default SocketContext