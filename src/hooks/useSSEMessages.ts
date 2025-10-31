import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface SSEMessage {
  type: 'connected' | 'heartbeat' | 'new-message' | 'message-read' | 'typing-indicator' | 'user-status' | 'unread-count-update'
  conversationId?: string
  message?: any
  userId?: string
  isOnline?: boolean
  isTyping?: boolean
  unreadCount?: number
  timestamp: string
  [key: string]: any
}

interface UseSSEMessagesOptions {
  enabled?: boolean
  onMessage?: (message: SSEMessage) => void
  onError?: (error: Event) => void
  onConnect?: () => void
  onDisconnect?: () => void
  onUserStatusChange?: (userId: string, isOnline: boolean) => void
  onTypingChange?: (userId: string, isTyping: boolean) => void
  onUnreadCountUpdate?: (unreadCount: number) => void
}

export function useSSEMessages(
  conversationId: string | undefined, 
  currentUserId?: string,
  currentUserContact?: string,
  options: UseSSEMessagesOptions = {}
) {
  const { enabled = true, onMessage, onError, onConnect, onDisconnect, onUserStatusChange, onTypingChange, onUnreadCountUpdate } = options
  const queryClient = useQueryClient()
  const eventSourceRef = useRef<EventSource | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [reconnectAttempts, setReconnectAttempts] = useState(0)

  const cleanup = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close()
      eventSourceRef.current = null
    }
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    setIsConnected(false)
  }

  const connect = () => {
    console.log('🔍 SSE Hook Connect called:', { conversationId, enabled, currentUserId, currentUserContact });
    if (!conversationId || !enabled) {
      console.log('❌ SSE Hook Connect blocked:', { conversationId, enabled });
      return
    }

    // Don't create multiple connections
    if (eventSourceRef.current?.readyState === EventSource.OPEN) {
      return
    }

    cleanup()

    try {
      // Create SSE connection with user context for presence tracking
      const sseUrl = `/api/conversations/${conversationId}/sse?t=${Date.now()}${
        currentUserId ? `&currentUserId=${currentUserId}` : ''
      }${
        currentUserContact ? `&currentUserContact=${encodeURIComponent(currentUserContact)}` : ''
      }`
      
      console.log(`🔌 Creating SSE connection to: ${sseUrl}`);
      const eventSource = new EventSource(sseUrl)
      
      eventSourceRef.current = eventSource

      eventSource.onopen = () => {
        console.log(`📡 SSE Connected to conversation ${conversationId}`)
        setIsConnected(true)
        setError(null)
        setReconnectAttempts(0)
        onConnect?.()
      }

      eventSource.onmessage = (event) => {
        try {
          const data: SSEMessage = JSON.parse(event.data)
          console.log('📨 SSE Message received:', data)
          
          // Handle different message types
          switch (data.type) {
            case 'connected':
              console.log('✅ SSE connection confirmed')
              break
              
            case 'heartbeat':
              // Keep connection alive - no action needed
              break
              
            case 'new-message':
              console.log('🆕 New message via SSE:', data.message)
              
              // Skip processing messages sent by current user (they already have optimistic update)
              if (data.message && data.message.senderId === currentUserId) {
                console.log('⏭️ Skipping SSE message from current user (already optimistically updated)');
                return;
              }
              
              // Instantly update React Query cache for messages from other users
              queryClient.setQueryData(['messages', conversationId], (oldData: any) => {
                if (!oldData) return oldData
                
                // Check if message already exists (prevent duplicates)
                const messageExists = oldData.messages?.some(
                  (msg: any) => msg.id === data.message.id
                )
                
                if (messageExists) return oldData
                
                // Add message to the end (most recent) since messages are sorted by createdAt ASC
                return {
                  ...oldData,
                  messages: [...(oldData.messages || []), data.message]
                }
              })
              
              // Update conversations list
              queryClient.invalidateQueries({ queryKey: ['conversations'] })
              queryClient.invalidateQueries({ queryKey: ['unread-count'] })
              break
              
            case 'message-read':
              // Update message read status
              queryClient.invalidateQueries({ queryKey: ['messages', conversationId] })
              queryClient.invalidateQueries({ queryKey: ['unread-count'] })
              break
              
            case 'typing-indicator':
              // Handle typing indicators
              if (data.userId && data.isTyping !== undefined) {
                onTypingChange?.(data.userId, data.isTyping)
              }
              break
              
            case 'user-status':
              // Handle user online/offline status
              console.log(`👤 User ${data.userId} is now ${data.isOnline ? 'online' : 'offline'}`)
              
              // Call the status change callback
              if (data.userId && data.isOnline !== undefined) {
                onUserStatusChange?.(data.userId, data.isOnline)
              }
              break
              
            case 'unread-count-update':
              // Handle unread count updates
              console.log(`🔢 Received unread count update: ${data.unreadCount} unread messages`)
              
              // Only process if it's for the current user
              if (data.userId === currentUserId && data.unreadCount !== undefined) {
                onUnreadCountUpdate?.(data.unreadCount)
              }
              break
              
            default:
              console.log('Unknown SSE message type:', data.type)
          }
          
          // Call custom message handler
          onMessage?.(data)
          
        } catch (parseError) {
          console.error('Error parsing SSE message:', parseError)
        }
      }

      eventSource.onerror = (event) => {
        console.error('❌ SSE Error:', event)
        setIsConnected(false)
        setError('Connection error')
        onError?.(event)
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts < 5) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), 30000)
          console.log(`🔄 Reconnecting SSE in ${delay}ms (attempt ${reconnectAttempts + 1})`)
          
          reconnectTimeoutRef.current = setTimeout(() => {
            setReconnectAttempts(prev => prev + 1)
            connect()
          }, delay)
        } else {
          console.error('💥 Max SSE reconnection attempts reached')
          setError('Failed to maintain connection')
        }
      }

    } catch (error) {
      console.error('Error creating SSE connection:', error)
      setError('Failed to create connection')
    }
  }

  useEffect(() => {
    if (conversationId && enabled) {
      connect()
    } else {
      cleanup()
    }

    return () => {
      cleanup()
      onDisconnect?.()
    }
  }, [conversationId, enabled])

  // Reconnect when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && conversationId && enabled) {
        // Reconnect if connection was lost
        if (!eventSourceRef.current || eventSourceRef.current.readyState === EventSource.CLOSED) {
          console.log('🔄 Reconnecting SSE after tab became visible')
          connect()
        }
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange)
  }, [conversationId, enabled])

  return {
    isConnected,
    error,
    reconnectAttempts,
    connect,
    disconnect: cleanup
  }
}

// Hook for multiple conversations (e.g., for notifications)
export function useSSEGlobalMessages(userToken?: string) {
  const queryClient = useQueryClient()
  const [isConnected, setIsConnected] = useState(false)
  
  // This could be extended to listen to all user's conversations
  // For now, we'll focus on per-conversation SSE
  
  return {
    isConnected,
    connect: () => {}, 
    disconnect: () => {}
  }
}