import { useEffect, useState, useRef } from 'react'
import { useQueryClient } from '@tanstack/react-query'

// Import getCurrentUserInfo for proper user ID handling
const getCurrentUserInfo = () => {
  const userId = (typeof window !== 'undefined' && localStorage.getItem('bagami_user_id')) || null;
  const userContact = (typeof window !== 'undefined' && localStorage.getItem('bagami_user_contact')) || null;
  
  return {
    userId,
    userContact
  };
};

// Simple real-time message listener hook (using polling for now)
export function useRealtimeMessages(conversationId?: string) {
  const [typingUsers, setTypingUsers] = useState<{ userId: string; userEmail: string }[]>([])
  
  // For now, we'll use rapid polling instead of true real-time
  // This provides near real-time experience without Socket.IO complexity
  
  return { typingUsers }
}

// Real-time message sending hook with optimistic updates
export function useRealtimeMessageSender() {
  const queryClient = useQueryClient()

  const sendMessage = async (data: {
    conversationId: string
    content: string
    messageType?: string
  }) => {
    // Get current user info
    const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
    
    // Generate temporary message ID for optimistic update
    const tempMessageId = `temp-${Date.now()}-${Math.random()}`
    
    const optimisticMessage = {
      id: tempMessageId,
      conversationId: data.conversationId,
      content: data.content,
      messageType: data.messageType || 'text',
      senderId: currentUserId || 'current-user',
      createdAt: new Date().toISOString(),
      isRead: false,
      isOptimistic: true // Flag to identify optimistic updates
    }

    try {
      // Optimistically update the UI first for instant feedback
      queryClient.setQueryData(['messages', data.conversationId], (oldData: any) => {
        if (!oldData) return oldData
        
        // Add message to the end (most recent) since messages are sorted by createdAt ASC
        return {
          ...oldData,
          messages: [...oldData.messages, optimisticMessage]
        }
      })

      // Send to API for persistence
      const response = await fetch(`/api/conversations/${data.conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: data.content,
          messageType: data.messageType || 'text',
          currentUserId: currentUserId,
          currentUserContact: currentUserContact,
          tempId: tempMessageId
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to send message')
      }

      const result = await response.json()
      const savedMessage = result.message

      // Replace optimistic update with real data
      queryClient.setQueryData(['messages', data.conversationId], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          messages: oldData.messages.map((msg: any) => 
            msg.id === tempMessageId ? { ...savedMessage, isOptimistic: false } : msg
          )
        }
      })

      // Trigger immediate refresh of related queries for near real-time experience
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['conversations'] })
        queryClient.invalidateQueries({ queryKey: ['unread-count'] })
      }, 100)

      return savedMessage
    } catch (error) {
      console.error('Failed to send message:', error)
      
      // Remove optimistic update on error
      queryClient.setQueryData(['messages', data.conversationId], (oldData: any) => {
        if (!oldData) return oldData
        return {
          ...oldData,
          messages: oldData.messages.filter((msg: any) => msg.id !== tempMessageId)
        }
      })
      
      throw error
    }
  }

  return { sendMessage }
}

// Typing indicator hook with SSE integration
export function useTypingIndicator(conversationId?: string) {
  const [isTyping, setIsTyping] = useState(false)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  const sendTypingStatus = async (isTypingStatus: boolean) => {
    if (!conversationId) {
      return
    }
    
    try {
      const response = await fetch(`/api/conversations/${conversationId}/typing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          isTyping: isTypingStatus
        })
      })
      
      if (!response.ok) {
        console.error(`Failed to send typing status: ${response.status} ${response.statusText}`)
      }
    } catch (error) {
      console.error('Failed to send typing status:', error)
    }
  }

  return {
    handleTypingStart: () => {
      if (!conversationId) {
        return
      }
      
      if (!isTyping) {
        setIsTyping(true)
        sendTypingStatus(true)
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      
      // Auto-stop typing after 3 seconds of inactivity
      typingTimeoutRef.current = setTimeout(() => {
        setIsTyping(false)
        sendTypingStatus(false)
      }, 3000)
    },
    handleTypingStop: () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTyping) {
        setIsTyping(false)
        sendTypingStatus(false)
      }
    },
    isTyping
  }
}

// Connection status hook (simplified - shows online/offline based on network)
export function useConnectionStatus() {
  const [isOnline, setIsOnline] = useState(true)
  
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  return {
    isConnected: isOnline,
    connectionStatus: isOnline ? 'connected' : 'disconnected' as const,
    statusColor: isOnline ? 'green' : 'red',
    statusText: isOnline ? 'Online' : 'Offline'
  }
}