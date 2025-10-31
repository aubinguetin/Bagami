'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, User, Package, Plane, Check, CheckCheck, MapPin, DollarSign, Calendar, Scale, Shield, X, Key } from 'lucide-react';
import { useMessages, useSendMessage } from '@/hooks/useQueries';
import { useSSEMessages } from '@/hooks/useSSEMessages';
import { useRealtimeMessageSender } from '@/hooks/useRealtimeSocket';
import { RatingModal } from '@/components/RatingModal';
import { InsufficientBalanceModal } from '@/components/InsufficientBalanceModal';
import { calculatePlatformFee } from '@/config/platform';

// Helper function to get country flag emoji from country code or name
function getCountryFlag(countryCodeOrName: string): string {
  // Map of common country codes/names to flag emojis
  const flagMap: { [key: string]: string } = {
    'AD': '🇦🇩', 'AE': '🇦🇪', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AO': '🇦🇴', 'AQ': '🇦🇶', 'AR': '🇦🇷', 'AS': '🇦🇸', 'AT': '🇦🇹', 'AU': '🇦🇺', 'AW': '🇦🇼', 'AX': '🇦🇽', 'AZ': '🇦🇿',
    'BA': '🇧🇦', 'BB': '🇧🇧', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BF': '🇧🇫', 'BG': '🇧🇬', 'BH': '🇧🇭', 'BI': '🇧🇮', 'BJ': '🇧🇯', 'BL': '🇧🇱', 'BM': '🇧🇲', 'BN': '🇧🇳', 'BO': '🇧🇴', 'BQ': '🇧🇶', 'BR': '🇧🇷', 'BS': '🇧🇸', 'BT': '🇧🇹', 'BV': '🇧🇻', 'BW': '🇧🇼', 'BY': '🇧🇾', 'BZ': '🇧🇿',
    'CA': '🇨🇦', 'CC': '🇨🇨', 'CD': '🇨🇩', 'CF': '🇨🇫', 'CG': '🇨🇬', 'CH': '🇨🇭', 'CI': '🇨🇮', 'CK': '🇨🇰', 'CL': '🇨🇱', 'CM': '🇨🇲', 'CN': '🇨🇳', 'CO': '🇨🇴', 'CR': '🇨🇷', 'CU': '🇨🇺', 'CV': '🇨🇻', 'CW': '🇨🇼', 'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿',
    'DE': '🇩🇪', 'DJ': '🇩🇯', 'DK': '🇩🇰', 'DM': '🇩🇲', 'DO': '🇩🇴', 'DZ': '🇩🇿',
    'EC': '🇪🇨', 'EE': '🇪🇪', 'EG': '🇪🇬', 'EH': '🇪🇭', 'ER': '🇪🇷', 'ES': '🇪🇸', 'ET': '🇪🇹', 'EU': '🇪🇺',
    'FI': '🇫🇮', 'FJ': '🇫🇯', 'FK': '🇫🇰', 'FM': '🇫🇲', 'FO': '🇫🇴', 'FR': '🇫🇷', 'France': '🇫🇷',
    'GA': '🇬🇦', 'GB': '🇬🇧', 'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫', 'GG': '🇬🇬', 'GH': '🇬🇭', 'GI': '🇬🇮', 'GL': '🇬🇱', 'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶', 'GR': '🇬🇷', 'GS': '🇬🇸', 'GT': '🇬🇹', 'GU': '🇬🇺', 'GW': '🇬🇼', 'GY': '🇬🇾',
    'HK': '🇭🇰', 'HM': '🇭🇲', 'HN': '🇭🇳', 'HR': '🇭🇷', 'HT': '🇭🇹', 'HU': '🇭🇺',
    'ID': '🇮🇩', 'IE': '🇮🇪', 'IL': '🇮🇱', 'IM': '🇮🇲', 'IN': '🇮🇳', 'IO': '🇮🇴', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'IS': '🇮🇸', 'IT': '🇮🇹',
    'JE': '🇯🇪', 'JM': '🇯🇲', 'JO': '🇯🇴', 'JP': '🇯🇵',
    'KE': '🇰🇪', 'KG': '🇰🇬', 'KH': '🇰🇭', 'KI': '🇰🇮', 'KM': '🇰🇲', 'KN': '🇰🇳', 'KP': '🇰🇵', 'KR': '🇰🇷', 'KW': '🇰🇼', 'KY': '🇰🇾', 'KZ': '🇰🇿',
    'LA': '🇱🇦', 'LB': '🇱🇧', 'LC': '🇱🇨', 'LI': '🇱🇮', 'LK': '🇱🇰', 'LR': '🇱🇷', 'LS': '🇱🇸', 'LT': '🇱🇹', 'LU': '🇱🇺', 'LV': '🇱🇻', 'LY': '🇱🇾',
    'MA': '🇲🇦', 'MC': '🇲🇨', 'MD': '🇲🇩', 'ME': '🇲🇪', 'MF': '🇲🇫', 'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰', 'ML': '🇲🇱', 'MM': '🇲🇲', 'MN': '🇲🇳', 'MO': '🇲🇴', 'MP': '🇲🇵', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸', 'MT': '🇲🇹', 'MU': '🇲🇺', 'MV': '🇲🇻', 'MW': '🇲🇼', 'MX': '🇲🇽', 'MY': '🇲🇾', 'MZ': '🇲🇿',
    'NA': '🇳🇦', 'NC': '🇳🇨', 'NE': '🇳🇪', 'NF': '🇳🇫', 'NG': '🇳🇬', 'NI': '🇳🇮', 'NL': '🇳🇱', 'NO': '🇳🇴', 'NP': '🇳🇵', 'NR': '🇳🇷', 'NU': '🇳🇺', 'NZ': '🇳🇿',
    'OM': '🇴🇲',
    'PA': '🇵🇦', 'PE': '🇵🇪', 'PF': '🇵🇫', 'PG': '🇵🇬', 'PH': '🇵🇭', 'PK': '🇵🇰', 'PL': '🇵🇱', 'PM': '🇵🇲', 'PN': '🇵🇳', 'PR': '🇵🇷', 'PS': '🇵🇸', 'PT': '🇵🇹', 'PW': '🇵🇼', 'PY': '🇵🇾',
    'QA': '🇶🇦',
    'RE': '🇷🇪', 'RO': '🇷🇴', 'RS': '🇷🇸', 'RU': '🇷🇺', 'RW': '🇷🇼',
    'SA': '🇸🇦', 'SB': '🇸🇧', 'SC': '🇸🇨', 'SD': '🇸🇩', 'SE': '🇸🇪', 'SG': '🇸🇬', 'SH': '🇸🇭', 'SI': '🇸🇮', 'SJ': '🇸🇯', 'SK': '🇸🇰', 'SL': '🇸🇱', 'SM': '🇸🇲', 'SN': '🇸🇳', 'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸', 'ST': '🇸🇹', 'SV': '🇸🇻', 'SX': '🇸🇽', 'SY': '🇸🇾', 'SZ': '🇸🇿',
    'TC': '🇹🇨', 'TD': '🇹🇩', 'TF': '🇹🇫', 'TG': '🇹🇬', 'TH': '🇹🇭', 'TJ': '🇹🇯', 'TK': '🇹🇰', 'TL': '🇹🇱', 'TM': '🇹🇲', 'TN': '🇹🇳', 'TO': '🇹🇴', 'TR': '🇹🇷', 'TT': '🇹🇹', 'TV': '🇹🇻', 'TW': '🇹🇼', 'TZ': '🇹🇿',
    'UA': '🇺🇦', 'UG': '🇺🇬', 'UM': '🇺🇲', 'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿',
    'VA': '🇻🇦', 'VC': '🇻🇨', 'VE': '🇻🇪', 'VG': '🇻🇬', 'VI': '🇻🇮', 'VN': '🇻🇳', 'VU': '🇻🇺',
    'WF': '🇼🇫', 'WS': '🇼🇸',
    'XK': '🇽🇰',
    'YE': '🇾🇪', 'YT': '🇾🇹',
    'ZA': '🇿🇦', 'ZM': '🇿🇲', 'ZW': '🇿🇼',
    // Common country names
    'Burkina Faso': '🇧🇫', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'South Africa': '🇿🇦'
  };
  
  return flagMap[countryCodeOrName] || '🏳️';
}

// Utility function to mask contact information (phone/email)
const maskContactInfo = (contact: string) => {
  if (!contact) return '';
  
  // Check if it's an email
  if (contact.includes('@')) {
    const [username, domain] = contact.split('@');
    if (username.length <= 2) return contact; // Don't mask very short usernames
    
    const visibleStart = username.slice(0, 2);
    const visibleEnd = username.slice(-1);
    const maskedMiddle = '*'.repeat(Math.max(1, username.length - 3));
    
    return `${visibleStart}${maskedMiddle}${visibleEnd}@${domain}`;
  }
  
  // Check if it's a phone number (contains digits and + or -)
  if (/[\d+\-\s()]/g.test(contact)) {
    // Remove all non-digit characters to work with clean number
    const digitsOnly = contact.replace(/\D/g, '');
    if (digitsOnly.length < 6) return contact; // Don't mask very short numbers
    
    // Keep country code and last 3 digits visible
    const countryCode = contact.match(/^\+\d{1,3}/)?.[0] || '';
    const lastDigits = digitsOnly.slice(-3);
    const maskedMiddle = '*'.repeat(Math.max(3, digitsOnly.length - 6));
    
    if (countryCode) {
      return `${countryCode}${maskedMiddle}${lastDigits}`;
    } else {
      const firstDigits = digitsOnly.slice(0, 3);
      return `${firstDigits}${maskedMiddle}${lastDigits}`;
    }
  }
  
  // For other types of contact info
  if (contact.length <= 3) return contact;
  const visibleStart = contact.slice(0, 2);
  const visibleEnd = contact.slice(-1);
  const maskedMiddle = '*'.repeat(Math.max(1, contact.length - 3));
  return `${visibleStart}${maskedMiddle}${visibleEnd}`;
};

// Helper function to format time
const formatTime24Hour = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
};

// Helper function to format date separator
const formatDateSeparator = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long', 
      day: 'numeric'
    });
  }
};

export default function ChatPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const conversationId = params?.conversationId as string;
  
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [participantStatus, setParticipantStatus] = useState<{ [userId: string]: boolean }>({});
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [showDeliveryCodeModal, setShowDeliveryCodeModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [deliveryCode, setDeliveryCode] = useState('');
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const [offerPrice, setOfferPrice] = useState('');
  const [offerMessage, setOfferMessage] = useState('');
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [respondingToOfferId, setRespondingToOfferId] = useState<string | null>(null);
  const [hasUserRated, setHasUserRated] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [requiredPaymentAmount, setRequiredPaymentAmount] = useState<number>(0);
  
  const messageInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const paymentInfoRef = useRef<HTMLDivElement>(null);

  // Get current user info
  const getCurrentUserInfo = () => {
    if (session?.user?.id) {
      const userContact = session.user.email || (session.user as any).phone;
      return {
        userId: session.user.id,
        userContact: userContact
      };
    }
    
    const currentUserId = typeof window !== 'undefined' ? localStorage.getItem('bagami_user_id') : null;
    const currentUserContact = typeof window !== 'undefined' ? localStorage.getItem('bagami_user_contact') : null;
    
    return {
      userId: currentUserId,
      userContact: currentUserContact
    };
  };

  // Function to mark all messages in this conversation as read
  const markMessagesAsRead = async () => {
    try {
      const { userId, userContact } = getCurrentUserInfo();
      
      if (!userId && !userContact) {
        console.log('No user info available for marking messages as read');
        return;
      }

      const params = new URLSearchParams();
      if (userId) params.append('currentUserId', userId);
      if (userContact) params.append('currentUserContact', encodeURIComponent(userContact));
      
      const response = await fetch(`/api/conversations/${conversationId}/mark-read?${params}`, {
        method: 'PATCH'
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✅ Marked ${data.markedCount} messages as read`);
      } else {
        console.error('Failed to mark messages as read:', response.statusText);
      }
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  // Function to check if user has already rated this delivery
  const checkIfUserHasRated = async () => {
    if (!conversation?.deliveryId) return;
    
    try {
      const { userId, userContact } = getCurrentUserInfo();
      
      if (!userId && !userContact) {
        console.log('No user info available for checking reviews');
        return;
      }

      const params = new URLSearchParams();
      params.append('deliveryId', conversation.deliveryId);
      if (userId) params.append('reviewerId', userId);
      if (userContact) params.append('reviewerContact', encodeURIComponent(userContact));
      
      const response = await fetch(`/api/reviews/check?${params}`);
      
      if (response.ok) {
        const data = await response.json();
        setHasUserRated(data.hasReviewed);
        console.log('📊 Review check:', data.hasReviewed ? 'User has already rated' : 'User has not rated yet');
      } else {
        console.error('Failed to check review status:', response.statusText);
      }
    } catch (error) {
      console.error('Error checking review status:', error);
    }
  };

  // Fetch conversation and messages data
  const { data: messagesResponse, isLoading: isLoadingMessages, refetch: refetchMessages } = useMessages(conversationId);
  const sendMessageMutation = useSendMessage();
  const { sendMessage: realtimeSendMessage } = useRealtimeMessageSender();

  const conversation = messagesResponse?.conversation;
  const messages = messagesResponse?.messages || [];
  const isSending = sendMessageMutation.isPending;

  // Debug output for sender/receiver assignment
  useEffect(() => {
    if (conversation && session?.user?.id) {
      // Print relevant IDs and type for debugging button logic
      console.log('DEBUG:', {
        sessionId: session.user.id,
        deliveryType: conversation.delivery?.type,
        deliverySenderId: conversation.delivery?.senderId,
        deliveryReceiverId: conversation.delivery?.receiverId,
        otherParticipant: conversation.otherParticipant,
      });
    }
  }, [conversation, session?.user?.id]);

  // Mark messages as read when entering the chat
  useEffect(() => {
    if (conversationId && (session?.user?.id || (typeof window !== 'undefined' && localStorage.getItem('bagami_user_id')))) {
      // Small delay to ensure the messages have loaded
      const timer = setTimeout(() => {
        markMessagesAsRead();
      }, 500);

      return () => clearTimeout(timer);
    }
  }, [conversationId, session?.user?.id]);

  // Check if user has already rated when conversation loads or delivery is confirmed
  useEffect(() => {
    if (conversation?.deliveryId && hasDeliveryBeenConfirmed()) {
      checkIfUserHasRated();
    }
  }, [conversation?.deliveryId, messages.length]); // Re-check when messages change (in case delivery was just confirmed)

  // Also mark messages as read when new messages arrive (in case they arrive while viewing)
  useEffect(() => {
    if (messages.length > 0) {
      // Debounced marking to avoid too many API calls
      const timer = setTimeout(() => {
        markMessagesAsRead();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [messages.length]);

  // SSE configuration
  const sseConversationId = conversationId;
  const sseUserId = session?.user?.id || (typeof window !== 'undefined' ? localStorage.getItem('bagami_user_id') : null) || undefined;
  const sseUserContact = session?.user?.email || (session?.user as any)?.phone || (typeof window !== 'undefined' ? localStorage.getItem('bagami_user_contact') : null) || undefined;
  const bagamiAuth = typeof window !== 'undefined' ? localStorage.getItem('bagami_authenticated') : null;
  const sseEnabled = (status === 'authenticated' || bagamiAuth === 'true') && (!!session?.user?.id || !!(typeof window !== 'undefined' && localStorage.getItem('bagami_user_id')));

  // SSE for real-time messaging
  const { 
    isConnected: sseConnected, 
    error: sseError 
  } = useSSEMessages(
    sseConversationId,
    sseUserId,
    sseUserContact,
    {
      enabled: sseEnabled,
      onMessage: (message) => {
        console.log('📨 SSE Message received in chat page:', message);
      },
      onConnect: () => {
        console.log('✅ SSE Connected for conversation:', conversationId);
      },
      onDisconnect: () => {
        console.log('❌ SSE Disconnected for conversation:', conversationId);
      },
      onError: (error) => {
        console.error('SSE Error:', error);
      },
      onUserStatusChange: (userId: string, isOnline: boolean) => {
        console.log(`👤 User ${userId} status changed to:`, isOnline ? 'online' : 'offline');
        setParticipantStatus(prev => ({
          ...prev,
          [userId]: isOnline
        }));
      },
      onTypingChange: (userId: string, isTyping: boolean) => {
        const { userId: currentUserId } = getCurrentUserInfo();
        
        setTypingUsers(prev => {
          if (isTyping) {
            return prev.includes(userId) ? prev : [...prev, userId];
          } else {
            return prev.filter(id => id !== userId);
          }
        });

        if (userId !== currentUserId) {
          setOtherUserTyping(isTyping);
        }
      }
    }
  );

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on page load
  useEffect(() => {
    const timer = setTimeout(() => {
      if (messageInputRef.current && !isSending) {
        messageInputRef.current.focus();
      }
    }, 500); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [conversationId, isSending]);

  // Cleanup SSE connections on page unload
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (sseEnabled && sseUserId) {
        navigator.sendBeacon(`/api/conversations/${conversationId}/sse/disconnect`, JSON.stringify({
          userId: sseUserId,
          userContact: sseUserContact
        }));
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && sseEnabled && sseUserId) {
        fetch(`/api/conversations/${conversationId}/sse/disconnect`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: sseUserId,
            userContact: sseUserContact
          })
        }).catch(console.error);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [conversationId, sseEnabled, sseUserId, sseUserContact]);

  // Close payment info popup when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (paymentInfoRef.current && !paymentInfoRef.current.contains(event.target as Node)) {
        setShowPaymentInfo(false);
      }
    };

    if (showPaymentInfo) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [showPaymentInfo]);

  // Handle typing indicators
  const handleTyping = () => {
    if (!conversation) return;

    const handleTypingStart = () => {
      if (!isTyping) {
        setIsTyping(true);
        // Send typing indicator via SSE would be handled here
        console.log('Started typing...');
      }
    };

    const handleTypingStop = () => {
      if (isTyping) {
        setIsTyping(false);
        // Send stop typing indicator via SSE would be handled here
        console.log('Stopped typing...');
      }
    };

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    handleTypingStart();

    typingTimeoutRef.current = setTimeout(() => {
      handleTypingStop();
    }, 1000);
  };

  const handleTypingStop = () => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
    if (isTyping) {
      setIsTyping(false);
      console.log('Stopped typing...');
    }
  };

  // Send message
  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !conversation || isSending) return;

    try {
      await realtimeSendMessage({
        conversationId: conversation.id,
        content: newMessage.trim(),
        messageType: 'text'
      });
      
      setNewMessage('');
      handleTypingStop();
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Fallback to traditional API
      sendMessageMutation.mutate(
        {
          conversationId: conversation.id,
          content: newMessage.trim()
        },
        {
          onSuccess: () => {
            setNewMessage('');
          },
          onError: (fallbackError) => {
            console.error('Fallback also failed:', fallbackError);
            alert('Failed to send message. Please check your connection and try again.');
          }
        }
      );
    }
  };

  // Handle making an offer
  const handleMakeOffer = async () => {
    if (!offerPrice || !conversation) return;
    
    setIsSubmittingOffer(true);
    try {
      const offerData = {
        type: 'offer',
        price: parseFloat(offerPrice),
        currency: conversation.delivery.currency || 'XOF',
        message: offerMessage,
        deliveryId: conversation.delivery.id,
        deliveryTitle: conversation.delivery.title,
        originalPrice: conversation.delivery.price,
      };

      await realtimeSendMessage({
        conversationId: conversation.id,
        content: JSON.stringify(offerData),
        messageType: 'offer'
      });

      // Close modal and reset form
      setShowOfferModal(false);
      setOfferPrice('');
      setOfferMessage('');
    } catch (error) {
      console.error('Error sending offer:', error);
      alert('Failed to send offer. Please try again.');
    } finally {
      setIsSubmittingOffer(false);
    }
  };

  // Handle accepting or rejecting an offer
  const handleOfferResponse = async (messageId: string, action: 'accept' | 'reject') => {
    setRespondingToOfferId(messageId);
    try {
      const response = await fetch('/api/offers/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messageId,
          action,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to respond to offer');
      }

      // Refetch messages to get the updated offer status
      await refetchMessages();
    } catch (error) {
      console.error('Error responding to offer:', error);
      alert(error instanceof Error ? error.message : 'Failed to respond to offer. Please try again.');
    } finally {
      setRespondingToOfferId(null);
    }
  };

  // Handle delivery confirmation
  const handleConfirmDelivery = async () => {
    if (!deliveryCode.trim() || !conversation) return;
    
    setIsConfirmingDelivery(true);
    try {
      const paymentData = getPaymentData();
      
      if (!paymentData || !paymentData.deliveryCode) {
        alert('Payment information not found.');
        return;
      }

      // Verify the delivery code
      if (deliveryCode.trim() !== paymentData.deliveryCode) {
        alert('❌ Invalid delivery code. Please try again.');
        setIsConfirmingDelivery(false);
        return;
      }

      // Calculate net amount after platform fee
      const netAmount = paymentData.netAmount || paymentData.amount;
      const platformFee = paymentData.platformFee || 0;

      // Step 1: Credit NET payment to recipient's wallet (after platform fee)
      const walletResponse = await fetch('/api/wallet/credit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: session?.user?.id,
          amount: netAmount, // Credit the net amount (after platform fee)
          description: `Payment received for delivery: ${conversation.delivery.title}`,
          category: 'Delivery Income',
          referenceId: `DELIVERY-CONFIRM-${conversation.delivery.id}`,
          metadata: {
            deliveryId: conversation.delivery.id,
            deliveryType: conversation.delivery.type,
            paidBy: paymentData.paidBy,
            paidById: paymentData.paidById,
            originalTransactionId: paymentData.transactionId,
            grossAmount: paymentData.amount,
            platformFee: platformFee,
            netAmount: netAmount
          }
        })
      });

      if (!walletResponse.ok) {
        const error = await walletResponse.json();
        throw new Error(error.error || 'Failed to credit payment');
      }

      const walletResult = await walletResponse.json();

      // Step 2: Create delivery confirmation data
      const deliveryConfirmationData = {
        type: 'deliveryConfirmation',
        deliveryId: conversation.delivery.id,
        deliveryTitle: conversation.delivery.title,
        confirmedBy: session?.user?.name || 'User',
        confirmedById: session?.user?.id,
        confirmedAt: new Date().toISOString(),
        grossAmount: paymentData.amount, // Original amount paid
        platformFee: platformFee, // Platform fee deducted
        paymentAmount: netAmount, // Net amount received
        paymentCurrency: paymentData.currency,
        paidBy: paymentData.paidBy,
        deliveredBy: session?.user?.name || 'User',
        creditTransactionId: walletResult.transaction.id,
        newBalance: walletResult.wallet.balance
      };

      // Step 3: Send delivery confirmation message
      await realtimeSendMessage({
        conversationId: conversation.id,
        content: JSON.stringify(deliveryConfirmationData),
        messageType: 'deliveryConfirmation'
      });

      // Close the modal and reset
      setShowDeliveryCodeModal(false);
      setDeliveryCode('');
      
      // Show success message with platform fee breakdown
      alert(`✅ Delivery confirmed!\n\nGross Amount: ${paymentData.amount} ${paymentData.currency}\nPlatform Fee: -${platformFee} ${paymentData.currency}\nNet Amount Received: ${netAmount} ${paymentData.currency}\n\nNew Balance: ${walletResult.wallet.balance} ${paymentData.currency}`);
    } catch (error) {
      console.error('Error confirming delivery:', error);
      alert(error instanceof Error ? error.message : 'Failed to confirm delivery. Please try again.');
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  // Get other participant's online status
  const getOtherParticipantStatus = () => {
    if (!conversation?.otherParticipant?.id) {
      return { status: 'Offline', statusColor: 'bg-gray-400', textColor: 'text-gray-500' };
    }

    const isOnline = participantStatus[conversation.otherParticipant.id];
    
    if (isOnline) {
      return { status: 'Online', statusColor: 'bg-green-500', textColor: 'text-green-600' };
    } else {
      return { status: 'Offline', statusColor: 'bg-gray-400', textColor: 'text-gray-500' };
    }
  };

  // Get the agreed price (last accepted offer or delivery default price)
  const getAgreedPrice = () => {
    if (!conversation) return { price: 0, currency: 'XOF' };
    
    // Find the last accepted offer in messages
    const acceptedOffer = [...messages]
      .reverse()
      .find(msg => {
        if (msg.messageType === 'offer') {
          try {
            const offerData = JSON.parse(msg.content);
            return offerData.status === 'accepted';
          } catch (e) {
            return false;
          }
        }
        return false;
      });

    if (acceptedOffer) {
      try {
        const offerData = JSON.parse(acceptedOffer.content);
        return {
          price: offerData.price,
          currency: offerData.currency || conversation.delivery.currency || 'XOF'
        };
      } catch (e) {
        // Fall through to default
      }
    }

    // Default to delivery price
    return {
      price: conversation.delivery.price || 0,
      currency: conversation.delivery.currency || 'XOF'
    };
  };

  // Check if payment has been made in this conversation
  const hasPaymentBeenMade = () => {
    return messages.some(msg => msg.messageType === 'payment');
  };

  // Check if delivery has been confirmed
  const hasDeliveryBeenConfirmed = () => {
    return messages.some(msg => msg.messageType === 'deliveryConfirmation');
  };

  // Get payment data if payment exists
  const getPaymentData = () => {
    const paymentMessage = messages.find(msg => msg.messageType === 'payment');
    if (paymentMessage) {
      try {
        return JSON.parse(paymentMessage.content);
      } catch (e) {
        return null;
      }
    }
    return null;
  };

  // Group messages by date and time
  const groupMessagesByDate = (messages: any[]) => {
    const groups: { date: string; messages: any[] }[] = [];
    
    messages.forEach((message) => {
      const messageDate = new Date(message.createdAt);
      messageDate.setHours(0, 0, 0, 0);
      const dateKey = messageDate.toDateString();
      
      const existingGroup = groups.find(group => group.date === dateKey);
      if (existingGroup) {
        existingGroup.messages.push(message);
      } else {
        groups.push({
          date: dateKey,
          messages: [message]
        });
      }
    });
    
    return groups;
  };

  const groupMessagesByTime = (messages: any[]) => {
    const grouped: any[][] = [];
    let currentGroup: any[] = [];
    let lastSender: string | null = null;
    let lastTime: string | null = null;

    messages.forEach((message, index) => {
      const messageTime = formatTime24Hour(new Date(message.createdAt));
      const messageSender = message.sender?.id || 'system';
      
      if (lastSender !== messageSender || lastTime !== messageTime || currentGroup.length === 0) {
        if (currentGroup.length > 0) {
          grouped.push(currentGroup);
        }
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
      
      lastSender = messageSender;
      lastTime = messageTime;
      
      if (index === messages.length - 1) {
        grouped.push(currentGroup);
      }
    });
    
    return grouped;
  };

  // Helper function to get personalized system message content
  const getPersonalizedSystemMessage = (message: any) => {
    try {
      const structured = JSON.parse(message.content);
      
      if (structured.type === 'personalized') {
        const currentUserId = getCurrentUserInfo().userId;
        
        if (structured.deliveryType === 'request') {
          return currentUserId === structured.acceptorId 
            ? structured.acceptorMessage 
            : structured.requesterMessage;
        } else if (structured.deliveryType === 'offer') {
          return currentUserId === structured.requesterId 
            ? structured.requesterMessage 
            : structured.offerMessage;
        }
      }
    } catch (error) {
      // If parsing fails, return original content
    }
    
    return message.content;
  };

  if (isLoadingMessages) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center text-gray-500">
          <h2 className="text-xl font-semibold mb-2">Conversation not found</h2>
          <p>This conversation may have been deleted or you don't have access to it.</p>
          <button
            onClick={() => router.push('/messages')}
            className="mt-4 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
          >
            Back to Messages
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left Side - User Info */}
            <div className="flex items-center space-x-4 flex-1 min-w-0">
            <button
              onClick={() => router.push('/messages')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              title="Back to conversations"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>              <div className="w-12 h-12 bg-gradient-to-br from-orange-100 to-blue-100 rounded-full flex items-center justify-center border-2 border-white shadow-sm shrink-0">
                <User className="w-6 h-6 text-gray-600" />
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center space-x-2">
                  <h1 className="text-lg font-semibold text-gray-900 truncate">
                    {conversation.otherParticipant.name || 'Unknown User'}
                  </h1>
                  <div className="flex items-center space-x-1 shrink-0">
                    <div className={`w-3 h-3 rounded-full border-2 border-white shadow-sm ${getOtherParticipantStatus().statusColor}`}></div>
                    <span className={`text-sm font-medium ${getOtherParticipantStatus().textColor}`}>
                      {getOtherParticipantStatus().status}
                    </span>
                  </div>
                </div>
                <span className="text-sm text-gray-500 truncate">
                  {maskContactInfo(conversation.otherParticipant.email || conversation.otherParticipant.phone || '')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delivery Card - Pinned & Compact */}
      <div className="bg-gradient-to-r from-orange-50 to-blue-50 border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="bg-white rounded-lg p-3 border border-gray-200 shadow-lg">
            <div className="flex items-center space-x-3 mb-2">
              {conversation.delivery.type === 'request' ? (
                <Package className="w-4 h-4 text-orange-600" />
              ) : (
                <Plane className="w-4 h-4 text-blue-600" />
              )}
              <span className="font-semibold text-gray-900 flex-1 truncate">
                {conversation.delivery.title}
              </span>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                conversation.delivery.type === 'request' 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {conversation.delivery.type === 'request' ? 'Request' : 'Offer'}
              </span>
            </div>
            <div className="text-xs text-gray-600 space-y-1">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1">
                  📍 
                  <span className="text-sm">{getCountryFlag(conversation.delivery.fromCountry)}</span>
                  {conversation.delivery.fromCity} 
                  <span className="mx-1">→</span>
                  <span className="text-sm">{getCountryFlag(conversation.delivery.toCountry)}</span>
                  {conversation.delivery.toCity}
                </span>
                <span>💰 {conversation.delivery.price || 0} {conversation.delivery.currency || 'XOF'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>📅 {new Date(conversation.delivery.departureDate).toLocaleDateString()}</span>
                {conversation.delivery.weight && (
                  <span>⚖️ {conversation.delivery.weight} kg</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chat Messages Area */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-4 relative z-10 pb-20">
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 h-full flex flex-col">
          
          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-3">
            {groupMessagesByDate(messages).map((group, groupIndex) => (
              <div key={group.date} className="space-y-3">
                {/* Date Separator */}
                <div className="flex justify-center my-3">
                  <div className="bg-gray-100 text-gray-600 text-xs px-3 py-1 rounded-full">
                    {formatDateSeparator(new Date(group.date))}
                  </div>
                </div>
                
                {/* Messages for this date */}
                {groupMessagesByTime(group.messages).map((timeGroup, timeIndex) => (
                  <div key={`${group.date}-${timeIndex}`} className="space-y-0.5">
                    {timeGroup.map((message, messageIndex) => {
                      const isLastInTimeGroup = messageIndex === timeGroup.length - 1;
                      
                      // Parse offer data if this is an offer message
                      let offerData = null;
                      if (message.messageType === 'offer') {
                        try {
                          offerData = JSON.parse(message.content);
                        } catch (e) {
                          console.error('Failed to parse offer data:', e);
                        }
                      }

                      // Parse payment data if this is a payment message
                      let paymentData = null;
                      if (message.messageType === 'payment') {
                        try {
                          paymentData = JSON.parse(message.content);
                        } catch (e) {
                          console.error('Failed to parse payment data:', e);
                        }
                      }

                      return (
                        <div
                          key={message.id}
                          className={`flex ${
                            message.messageType === 'system' 
                              ? 'justify-center' 
                              : message.messageType === 'offer' || message.messageType === 'payment'
                              ? 'justify-center'
                              : message.sender?.id === conversation?.otherParticipant?.id 
                              ? 'justify-start' 
                              : 'justify-end'
                          }`}
                        >
                          {message.messageType === 'system' ? (
                            <div className="bg-gray-100 text-gray-600 text-sm px-3 py-2 rounded-full">
                              {getPersonalizedSystemMessage(message)}
                            </div>
                          ) : message.messageType === 'payment' && paymentData ? (
                            <div className="max-w-md w-full bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 border-2 border-green-300 rounded-xl shadow-lg p-4 space-y-3">
                              {/* Compact Payment Header */}
                              <div className="flex items-center justify-between pb-2 border-b border-green-300">
                                <div className="flex items-center gap-2">
                                  <div className="bg-green-500 text-white p-2 rounded-lg">
                                    <Check className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <h4 className="font-bold text-green-900 text-sm">Payment Successful</h4>
                                    <p className="text-xs text-green-700">
                                      {new Date(paymentData.paidAt).toLocaleDateString('en-US', { 
                                        month: 'short', 
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                      })}
                                    </p>
                                  </div>
                                </div>
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                                  {paymentData.status === 'completed' ? 'Completed' : 'Pending'}
                                </span>
                              </div>

                              {/* Compact Amount & Delivery Info Combined */}
                              <div className="bg-white rounded-xl p-3 border border-green-200">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <Package className="w-4 h-4 text-green-600" />
                                    <span className="text-xs text-gray-600">For delivery</span>
                                  </div>
                                  <div className="text-right">
                                    <div className="text-2xl font-bold text-green-600">{paymentData.amount} <span className="text-sm">{paymentData.currency}</span></div>
                                  </div>
                                </div>
                                <p className="text-sm font-medium text-gray-900 truncate">{paymentData.deliveryTitle}</p>
                                <p className="text-xs text-gray-600 mt-1">Paid by {paymentData.paidById === session?.user?.id ? 'You' : paymentData.paidBy}</p>
                              </div>

                              {/* Delivery Code Section - Compact Version */}
                              {session?.user?.id === paymentData.paidById ? (
                                /* Payer sees the code - Compact */
                                <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-300 rounded-xl p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Key className="w-4 h-4 text-purple-600" />
                                    <p className="font-bold text-purple-900 text-sm">Your Delivery Code</p>
                                  </div>
                                  <div className="bg-white rounded-lg p-2 text-center">
                                    <p className="text-2xl font-bold text-purple-600 tracking-widest font-mono">
                                      {paymentData.deliveryCode}
                                    </p>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(paymentData.deliveryCode);
                                        alert('Code copied!');
                                      }}
                                      className="mt-1 text-xs text-purple-600 hover:text-purple-700 font-medium underline"
                                    >
                                      Copy Code
                                    </button>
                                  </div>
                                  <p className="text-xs text-purple-800 mt-2">
                                    Give this code to the deliverer upon delivery
                                  </p>
                                </div>
                              ) : (
                                /* Deliverer sees instructions - Compact with NET amount */
                                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-300 rounded-xl p-3">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Key className="w-4 h-4 text-orange-600" />
                                    <p className="font-bold text-orange-900 text-sm">Delivery Confirmation</p>
                                  </div>
                                  
                                  {/* Show net amount the traveler will receive */}
                                  {paymentData.netAmount && paymentData.platformFee ? (
                                    <div className="bg-white rounded-lg p-2 mb-2 border border-orange-200">
                                      <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-gray-600">Payment Amount:</span>
                                        <span className="font-semibold">{paymentData.amount} {paymentData.currency}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="text-gray-600">Platform Fee:</span>
                                        <span className="text-red-600">-{paymentData.platformFee} {paymentData.currency}</span>
                                      </div>
                                      <div className="flex justify-between items-center text-sm font-bold border-t border-orange-200 pt-1 mt-1">
                                        <span className="text-green-700">You'll Receive:</span>
                                        <span className="text-green-700">{paymentData.netAmount} {paymentData.currency}</span>
                                      </div>
                                    </div>
                                  ) : null}
                                  
                                  <ol className="space-y-1 text-xs text-gray-700">
                                    <li className="flex gap-2"><span className="font-bold">1.</span> Deliver the item</li>
                                    <li className="flex gap-2"><span className="font-bold">2.</span> Ask {paymentData.paidBy} for the 6-digit code</li>
                                    <li className="flex gap-2"><span className="font-bold">3.</span> Enter code to receive the money in your wallet</li>
                                  </ol>
                                </div>
                              )}
                            </div>
                          ) : message.messageType === 'deliveryConfirmation' && (() => {
                            try {
                              return JSON.parse(message.content);
                            } catch {
                              return null;
                            }
                          })() ? (
                            <div className="flex justify-center w-full">
                              {(() => {
                                const confirmationData = JSON.parse(message.content);
                                return (
                                  <div className="max-w-md w-full bg-gradient-to-br from-green-50 via-teal-50 to-emerald-50 border-2 border-green-400 rounded-xl shadow-lg p-4 space-y-3">
                                    {/* Compact Confirmation Header with Amount */}
                                    <div className="flex items-center justify-between pb-2 border-b border-green-300">
                                      <div className="flex items-center gap-2">
                                        <div className="bg-gradient-to-br from-green-500 to-green-600 text-white p-2 rounded-lg">
                                          <CheckCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <h4 className="font-bold text-green-900 text-sm">Delivery Confirmed!</h4>
                                          <p className="text-xs text-green-700">
                                            {new Date(confirmationData.confirmedAt).toLocaleDateString('en-US', { 
                                              month: 'short', 
                                              day: 'numeric',
                                              hour: '2-digit',
                                              minute: '2-digit'
                                            })}
                                          </p>
                                        </div>
                                      </div>
                                      <span className="bg-white/50 backdrop-blur-sm text-green-800 px-2 py-1 rounded-full text-xs font-bold">
                                        COMPLETED
                                      </span>
                                    </div>

                                    {/* Compact Success Message & Amount Combined */}
                                    <div className="bg-white rounded-xl p-3 border border-green-300">
                                      <div className="flex items-center gap-2 mb-2">
                                        <Check className="w-4 h-4 text-green-600" />
                                        <p className="text-sm font-semibold text-green-900">
                                          {session?.user?.id === confirmationData.confirmedById ? 
                                            'You confirmed the delivery!' :
                                            'Delivery confirmed!'
                                          }
                                        </p>
                                      </div>
                                      <p className="text-xs text-gray-700 truncate">{confirmationData.deliveryTitle}</p>
                                    </div>

                                    {/* Payment Released with Platform Fee Breakdown */}
                                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl p-3">
                                      <p className="text-white/90 text-xs font-medium mb-2 text-center">Payment Released</p>
                                      
                                      {/* Show breakdown only for recipient (confirmer), simple amount for payer */}
                                      {confirmationData.platformFee && session?.user?.id === confirmationData.confirmedById ? (
                                        /* Recipient (traveler) sees full breakdown */
                                        <div className="space-y-1">
                                          <div className="flex justify-between text-xs text-white/80">
                                            <span>Gross Amount:</span>
                                            <span>{confirmationData.grossAmount} {confirmationData.paymentCurrency}</span>
                                          </div>
                                          <div className="flex justify-between text-xs text-white/80">
                                            <span>Platform Fee:</span>
                                            <span>-{confirmationData.platformFee} {confirmationData.paymentCurrency}</span>
                                          </div>
                                          <div className="border-t border-white/20 pt-1 mt-1">
                                            <div className="text-center">
                                              <div className="text-3xl font-bold text-white">
                                                {confirmationData.paymentAmount} <span className="text-lg">{confirmationData.paymentCurrency}</span>
                                              </div>
                                              <p className="text-xs text-white/90 mt-1">Net Amount Received</p>
                                            </div>
                                          </div>
                                        </div>
                                      ) : (
                                        /* Payer (sender) sees only the amount they paid */
                                        <div className="text-center">
                                          <div className="text-3xl font-bold text-white">
                                            {confirmationData.grossAmount || confirmationData.paymentAmount} <span className="text-lg">{confirmationData.paymentCurrency}</span>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          ) : message.messageType === 'offer' && offerData ? (
                            <div className={`max-w-md w-full rounded-xl shadow-lg p-3 space-y-2 border-2 ${
                              offerData.status === 'accepted' 
                                ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-300'
                                : offerData.status === 'rejected'
                                ? 'bg-gradient-to-br from-red-50 to-rose-50 border-red-300'
                                : 'bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200'
                            }`}>
                              {/* Compact Offer Header */}
                              <div className={`flex items-center justify-between pb-2 border-b ${
                                offerData.status === 'accepted' ? 'border-green-300' 
                                : offerData.status === 'rejected' ? 'border-red-300'
                                : 'border-amber-200'
                              }`}>
                                <div className="flex items-center gap-2">
                                  <div className={`text-white p-1.5 rounded-lg ${
                                    offerData.status === 'accepted' ? 'bg-green-500'
                                    : offerData.status === 'rejected' ? 'bg-red-500'
                                    : 'bg-amber-500'
                                  }`}>
                                    {offerData.status === 'accepted' ? (
                                      <Check className="w-4 h-4" />
                                    ) : offerData.status === 'rejected' ? (
                                      <X className="w-4 h-4" />
                                    ) : (
                                      <DollarSign className="w-4 h-4" />
                                    )}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900 text-sm">
                                      {offerData.status === 'accepted' ? 'Offer Accepted' 
                                        : offerData.status === 'rejected' ? 'Offer Rejected'
                                        : 'New Offer'}
                                    </h4>
                                    <p className="text-xs text-gray-600">
                                      From {message.sender?.id === session?.user?.id ? 'You' : message.sender?.name}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                  {formatTime24Hour(new Date(message.createdAt))}
                                </div>
                              </div>

                              {/* Compact Price Display */}
                              <div className="bg-white rounded-lg p-2.5">
                                <div className="flex items-center justify-between">
                                  <div className="text-sm">
                                    <span className="text-gray-500 line-through block text-xs">{offerData.originalPrice} {offerData.currency}</span>
                                    <span className="text-gray-900 font-semibold">Offered:</span>
                                  </div>
                                  <div className="text-right">
                                    <span className={`text-2xl font-bold ${
                                      offerData.status === 'accepted' ? 'text-green-600'
                                      : offerData.status === 'rejected' ? 'text-red-600'
                                      : 'text-amber-600'
                                    }`}>
                                      {offerData.price} <span className="text-sm">{offerData.currency}</span>
                                    </span>
                                    <span className={`block text-xs font-medium ${
                                      offerData.price < offerData.originalPrice 
                                        ? 'text-green-700' 
                                        : 'text-red-700'
                                    }`}>
                                      {offerData.price < offerData.originalPrice ? '↓' : '↑'} 
                                      {Math.abs(((offerData.price - offerData.originalPrice) / offerData.originalPrice) * 100).toFixed(1)}%
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Compact Delivery Title */}
                              <p className="text-xs text-gray-700 px-1 truncate">📦 {offerData.deliveryTitle}</p>

                              {/* Optional Message - Compact */}
                              {offerData.message && (
                                <div className="bg-white rounded-lg p-2">
                                  <p className="text-xs text-gray-700">{offerData.message}</p>
                                </div>
                              )}

                              {/* Compact Status Badge */}
                              {offerData.status === 'accepted' && (
                                <div className="bg-green-100 border border-green-300 rounded-lg p-2 text-center">
                                  <p className="text-xs font-semibold text-green-800">
                                    ✓ Agreed on {offerData.price} {offerData.currency}
                                  </p>
                                </div>
                              )}
                              
                              {offerData.status === 'rejected' && (
                                <div className="bg-red-100 border border-red-300 rounded-lg p-2 text-center">
                                  <p className="text-xs font-semibold text-red-800">✗ Offer declined</p>
                                </div>
                              )}

                              {/* Compact Action Buttons */}
                              {!offerData.status && message.sender?.id !== session?.user?.id && (
                                <div className="flex gap-2 pt-1">
                                  <button
                                    onClick={() => handleOfferResponse(message.id, 'accept')}
                                    disabled={respondingToOfferId === message.id}
                                    className="flex-1 bg-gradient-to-r from-green-600 to-green-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-green-700 hover:to-green-600 transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <Check className="w-4 h-4" />
                                    {respondingToOfferId === message.id ? 'Processing...' : 'Accept'}
                                  </button>
                                  <button
                                    onClick={() => handleOfferResponse(message.id, 'reject')}
                                    disabled={respondingToOfferId === message.id}
                                    className="flex-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-3 py-2 rounded-lg text-sm font-semibold hover:from-red-700 hover:to-red-600 transition-all transform hover:scale-105 shadow-md flex items-center justify-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                  >
                                    <X className="w-4 h-4" />
                                    {respondingToOfferId === message.id ? 'Processing...' : 'Decline'}
                                  </button>
                                </div>
                              )}

                              {/* Sent by you indicator - Compact */}
                              {!offerData.status && message.sender?.id === session?.user?.id && (
                                <div className="text-center text-xs text-gray-500 italic">
                                  Waiting for response...
                                </div>
                              )}
                            </div>
                          ) : (
                            <div
                              className={`max-w-sm lg:max-w-lg px-3 py-2 rounded-lg relative ${
                                message.sender?.id === conversation?.otherParticipant?.id
                                  ? 'bg-purple-600 text-white'
                                  : 'bg-orange-600 text-white'
                              }`}
                            >
                              <div className="flex items-end justify-between">
                                <p className="text-sm pr-2 flex-1">{message.content}</p>
                                {isLastInTimeGroup && (
                                  <div className={`flex items-center space-x-1 flex-shrink-0 self-end translate-y-0.5 ${
                                    message.sender?.id === conversation?.otherParticipant?.id
                                      ? 'text-purple-200'
                                      : 'text-orange-100'
                                  }`}>
                                    <p className="text-[9px] leading-none">
                                      {formatTime24Hour(new Date(message.createdAt))}
                                    </p>
                                    {message.sender?.id !== conversation?.otherParticipant?.id && (
                                      <>
                                        {message.isRead ? (
                                          <CheckCheck className="w-2 h-2 text-blue-300" />
                                        ) : (
                                          <Check className="w-2 h-2 text-orange-200" />
                                        )}
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Typing Indicator */}
          {otherUserTyping && (
            <div className="flex-shrink-0 px-4 py-2 bg-gray-50">
              <div className="flex items-center space-x-2 text-gray-500 text-sm">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                </div>
                <span>{conversation.otherParticipant.name || 'User'} is typing...</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Fixed Chat Action Buttons and Message Input at Bottom */}
      <div className="fixed bottom-0 left-0 right-0 z-50 pointer-events-auto">
        {/* Action Buttons */}
        {conversation && session?.user?.id && (
          <div className="bg-transparent">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex justify-center items-center gap-3">
              {/* Button logic with payment status */}
              {!hasPaymentBeenMade() ? (
                /* Before Payment - Show Pay and Make Offer buttons */
                <>
                  {/* Delivery type: request */}
                  {conversation.delivery.type === 'request' && (
                    <>
                      {/* Pay button for requester (sender) */}
                      {session.user.id === conversation.delivery.senderId && (
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => router.push(`/payment-summary/${conversationId}`)}
                            className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                          >
                            Pay {getAgreedPrice().price} {getAgreedPrice().currency}
                          </button>
                          <div ref={paymentInfoRef} className="relative">
                            <button 
                              onClick={() => setShowPaymentInfo(!showPaymentInfo)}
                              className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl shadow-md hover:shadow-lg border border-blue-200 transition-all duration-200 transform hover:scale-105"
                              title="Payment protection info"
                            >
                              <Shield className="w-5 h-5 text-blue-600" />
                            </button>
                            {showPaymentInfo && (
                              <div className="absolute bottom-full right-0 mb-3 w-72 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-2xl p-4 text-sm text-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                <div className="flex items-start gap-3">
                                  <div className="p-2 bg-green-100 rounded-lg">
                                    <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                                  </div>
                                  <div>
                                    <p className="text-left font-medium text-gray-800 mb-1">
                                      💎 Payment Protection
                                    </p>
                                    <p className="text-left text-gray-600 text-xs leading-relaxed">
                                      Your payment is <strong className="text-green-600">protected and secured</strong> until the goods are delivered successfully.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      {/* Make an offer button for traveler (not the sender) */}
                      {session.user.id !== conversation.delivery.senderId && (
                        <button 
                          onClick={() => setShowOfferModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          Make an offer
                        </button>
                      )}
                    </>
                  )}
                  {/* Delivery type: offer */}
                  {conversation.delivery.type === 'offer' && (
                    <>
                      {/* Both buttons for requester (not the sender) */}
                      {session.user.id !== conversation.delivery.senderId && (
                        <div className="flex items-center gap-3">
                          <button 
                            onClick={() => setShowOfferModal(true)}
                            className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex-1 min-w-[140px]"
                          >
                            Make an offer
                          </button>
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => router.push(`/payment-summary/${conversationId}`)}
                              className="bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex-1 min-w-[140px]"
                            >
                              Pay {getAgreedPrice().price} {getAgreedPrice().currency}
                            </button>
                            <div ref={paymentInfoRef} className="relative">
                              <button 
                                onClick={() => setShowPaymentInfo(!showPaymentInfo)}
                                className="p-2.5 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 rounded-xl shadow-md hover:shadow-lg border border-blue-200 transition-all duration-200 transform hover:scale-105"
                                title="Payment protection info"
                              >
                                <Shield className="w-5 h-5 text-blue-600" />
                              </button>
                              {showPaymentInfo && (
                                <div className="absolute bottom-full right-0 mb-3 w-72 bg-gradient-to-br from-white to-blue-50 border-2 border-blue-200 rounded-2xl shadow-2xl p-4 text-sm text-gray-700 animate-in fade-in slide-in-from-bottom-2 duration-200">
                                  <div className="flex items-start gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                      <Shield className="w-5 h-5 text-green-600 flex-shrink-0" />
                                    </div>
                                    <div>
                                      <p className="text-left font-medium text-gray-800 mb-1">
                                        💎 Payment Protection
                                      </p>
                                      <p className="text-left text-gray-600 text-xs leading-relaxed">
                                        Your payment is <strong className="text-green-600">protected and secured</strong> until the goods are delivered successfully.
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                      {/* Make an offer button for traveler (sender) */}
                      {session.user.id === conversation.delivery.senderId && (
                        <button 
                          onClick={() => setShowOfferModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                        >
                          Make an offer
                        </button>
                      )}
                    </>
                  )}
                </>
              ) : (
                /* After Payment - Show Confirm Delivery button or Rate button */
                <>
                  {!hasDeliveryBeenConfirmed() ? (
                    /* Show Confirm Delivery button if delivery hasn't been confirmed yet */
                    session.user.id !== getPaymentData()?.paidById && (
                      <button 
                        onClick={() => setShowDeliveryCodeModal(true)}
                        className="bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Confirm Delivery
                      </button>
                    )
                  ) : (
                    /* After delivery confirmed - Show Rate button only if user hasn't rated yet */
                    !hasUserRated && (
                      <button 
                        onClick={() => setShowRatingModal(true)}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 flex items-center gap-2"
                      >
                        <span className="text-lg">⭐</span>
                        Rate {conversation.otherParticipant.name || 'User'}
                      </button>
                    )
                  )}
                </>
              )}
            </div>
          </div>
        )}
        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
            <form onSubmit={sendMessage} className="w-full">
              <div className="flex space-x-3 items-end">
                <input
                  ref={messageInputRef}
                  type="text"
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    handleTyping();
                  }}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent text-base cursor-text"
                  disabled={isSending}
                  autoComplete="off"
                />

                <button
                  type="submit"
                  disabled={isSending || !newMessage.trim()}
                  className="px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
                >
                  {isSending ? 'Sending...' : 'Send'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Make an Offer Modal */}
      {showOfferModal && conversation && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Make an Offer</h2>
                  <p className="text-blue-100 text-sm mt-1">Propose your price</p>
                </div>
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    setOfferPrice('');
                    setOfferMessage('');
                  }}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* Delivery Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-1">Delivery</p>
                <p className="font-semibold text-gray-900">{conversation.delivery.title}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">Current price:</span>
                  <span className="font-bold text-gray-900">
                    {conversation.delivery.price || 0} {conversation.delivery.currency || 'XOF'}
                  </span>
                </div>
              </div>

              {/* Offer Price Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Your Offer Price <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={offerPrice}
                    onChange={(e) => setOfferPrice(e.target.value)}
                    placeholder="Enter your offer"
                    className="w-full pl-11 pr-20 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base font-medium"
                    step="0.01"
                    min="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-gray-500">
                    {conversation.delivery.currency || 'XOF'}
                  </span>
                </div>
              </div>

              {/* Optional Message */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Message (Optional)
                </label>
                <textarea
                  value={offerMessage}
                  onChange={(e) => setOfferMessage(e.target.value)}
                  placeholder="Add a note to your offer..."
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base resize-none"
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowOfferModal(false);
                    setOfferPrice('');
                    setOfferMessage('');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMakeOffer}
                  disabled={!offerPrice || isSubmittingOffer}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {isSubmittingOffer ? 'Sending...' : 'Send Offer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delivery Code Modal */}
      {showDeliveryCodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-5 flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <Key className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">Confirm Delivery</h3>
                <p className="text-purple-100 text-sm">Enter the 6-digit code</p>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Instructions */}
              <div className="bg-purple-50 border border-purple-200 rounded-xl p-4">
                <p className="text-sm text-purple-900 leading-relaxed">
                  🔐 The payer has a unique 6-digit delivery code. Please ask them to provide it to complete the delivery confirmation.
                </p>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Delivery Code
                </label>
                <input
                  type="text"
                  value={deliveryCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setDeliveryCode(value);
                  }}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full px-4 py-3 text-center text-2xl font-bold tracking-widest border-2 border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-2 text-center">
                  Enter the 6-digit code provided by the payer
                </p>
              </div>

              {/* Payment Info */}
              {(() => {
                const paymentData = getPaymentData();
                if (paymentData) {
                  return (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-green-900">Payment Ready</p>
                          <p className="text-xs text-green-700 mt-1">
                            {paymentData.amount} {paymentData.currency} will be released to you after confirmation
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
                return null;
              })()}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    setShowDeliveryCodeModal(false);
                    setDeliveryCode('');
                  }}
                  disabled={isConfirmingDelivery}
                  className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelivery}
                  disabled={isConfirmingDelivery || deliveryCode.length !== 6}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 hover:from-purple-700 hover:to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2"
                >
                  {isConfirmingDelivery ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    'Confirm Delivery'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rating Modal */}
      {showRatingModal && conversation && (
        <RatingModal
          isOpen={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          deliveryId={conversation.deliveryId}
          revieweeId={conversation.otherParticipant.id}
          revieweeName={conversation.otherParticipant.name || 'User'}
          onSuccess={() => {
            // Mark that user has rated and refresh messages
            setHasUserRated(true);
            refetchMessages();
            // Also re-check the rating status to be sure
            checkIfUserHasRated();
          }}
        />
      )}

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={showInsufficientBalanceModal}
        onClose={() => setShowInsufficientBalanceModal(false)}
        requiredAmount={requiredPaymentAmount}
        currentBalance={walletBalance}
        currency={conversation?.delivery?.preferredCurrency || 'XAF'}
        onPayDirectly={() => {
          // TODO: Implement direct payment method (e.g., mobile money, card payment)
          alert('Direct payment feature coming soon! Please top up your wallet for now.');
        }}
      />
    </div>
  );
}