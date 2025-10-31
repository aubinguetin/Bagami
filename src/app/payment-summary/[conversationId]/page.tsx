'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { ArrowLeft, Package, Plane, Check, MapPin, Calendar, Scale, Shield, Loader2 } from 'lucide-react';
import { calculatePlatformFee } from '@/config/platform';
import { InsufficientBalanceModal } from '@/components/InsufficientBalanceModal';

// Helper function to get country flag emoji from country code or name
function getCountryFlag(countryCodeOrName: string): string {
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
    'Burkina Faso': '🇧🇫', 'United States': '🇺🇸', 'United Kingdom': '🇬🇧', 'South Africa': '🇿🇦'
  };
  
  return flagMap[countryCodeOrName] || '🏳️';
}

interface Conversation {
  id: string;
  delivery: {
    id: string;
    title: string;
    description: string | null;
    type: 'request' | 'offer';
    fromCountry: string;
    fromCity: string;
    toCountry: string;
    toCity: string;
    departureDate: string;
    weight: number | null;
    price: number;
    currency: string;
  };
}

export default function PaymentSummaryPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session } = useSession();
  const conversationId = params?.conversationId as string;
  
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [agreedPrice, setAgreedPrice] = useState<number>(0);
  const [agreedCurrency, setAgreedCurrency] = useState<string>('FCFA');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showInsufficientBalanceModal, setShowInsufficientBalanceModal] = useState(false);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Fetch conversation data
  useEffect(() => {
    if (!conversationId) return;

    const fetchConversation = async () => {
      try {
        console.log('🔍 Fetching conversation:', conversationId);
        const response = await fetch(`/api/conversations/${conversationId}`);
        if (!response.ok) throw new Error('Failed to fetch conversation');
        
        const data = await response.json();
        console.log('📦 Conversation data received:', data);
        console.log('💰 Delivery price from API:', data.delivery.price);
        setConversation(data);

        // Fetch messages to get agreed price
        const messagesResponse = await fetch(`/api/conversations/${conversationId}/messages`);
        if (messagesResponse.ok) {
          const messagesData = await messagesResponse.json();
          const messages = messagesData.messages || [];
          console.log('📨 Messages received:', messages.length);
          
          // Find the most recent accepted offer or use delivery price
          const offerMessages = messages
            .filter((m: any) => m.messageType === 'offer')
            .map((m: any) => {
              try {
                const offer = JSON.parse(m.content);
                return {
                  ...offer,
                  messageCreatedAt: m.createdAt // Include message timestamp
                };
              } catch {
                return null;
              }
            })
            .filter((offer: any) => offer && offer.status === 'accepted');

          console.log('💼 All accepted offers:', offerMessages);

          // Sort by message creation time (most recent first) to get the last agreed price
          const lastAcceptedOffer = offerMessages.sort((a: any, b: any) => {
            const dateA = new Date(a.messageCreatedAt).getTime();
            const dateB = new Date(b.messageCreatedAt).getTime();
            return dateB - dateA; // Most recent first
          })[0];

          if (lastAcceptedOffer) {
            console.log('✅ Found last accepted offer:', lastAcceptedOffer);
            console.log('💵 Setting agreed price to:', lastAcceptedOffer.price);
            setAgreedPrice(lastAcceptedOffer.price);
            setAgreedCurrency('FCFA'); // Always use FCFA
          } else {
            console.log('ℹ️ No accepted offer found, using delivery price:', data.delivery.price);
            setAgreedPrice(data.delivery.price);
            setAgreedCurrency('FCFA'); // Always use FCFA
          }
        } else {
          console.log('⚠️ Failed to fetch messages, using delivery price:', data.delivery.price);
          setAgreedPrice(data.delivery.price);
          setAgreedCurrency('FCFA'); // Always use FCFA
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Error fetching conversation:', error);
        setIsLoading(false);
      }
    };

    fetchConversation();
  }, [conversationId]);

  const handleConfirmPayment = async () => {
    console.log('=== PAYMENT CONFIRMATION DEBUG ===');
    console.log('Session state:', session);
    console.log('User ID:', session?.user?.id);
    console.log('Agreed Price:', agreedPrice);
    console.log('Agreed Currency:', agreedCurrency);
    console.log('Delivery Title:', conversation?.delivery?.title);
    
    if (!conversation) {
      alert('Conversation not found. Please try again.');
      return;
    }
    
    if (!session?.user?.id) {
      alert('Session expired. Please login again.');
      router.push('/auth/signin');
      return;
    }
    
    setIsProcessingPayment(true);
    try {
      // Calculate platform fee
      const feeCalculation = calculatePlatformFee(agreedPrice);
      
      console.log('Payment data:', {
        userId: session.user.id,
        amount: agreedPrice,
        description: `Payment for delivery: ${conversation.delivery.title}`
      });
      
      // Check wallet balance first
      const walletCheckResponse = await fetch(`/api/wallet/balance?userId=${session.user.id}`);
      
      if (!walletCheckResponse.ok) {
        throw new Error('Failed to check wallet balance');
      }
      
      const walletData = await walletCheckResponse.json();
      const currentBalance = walletData.balance || 0;
      
      // Check if user has sufficient balance
      if (currentBalance < agreedPrice) {
        setWalletBalance(currentBalance);
        setShowInsufficientBalanceModal(true);
        setIsProcessingPayment(false);
        return;
      }
      
      // Validate all required fields before sending
      if (!session.user.id) {
        throw new Error('User ID is missing');
      }
      
      if (!agreedPrice || agreedPrice <= 0) {
        throw new Error('Invalid payment amount');
      }
      
      if (!conversation.delivery.title) {
        throw new Error('Delivery title is missing');
      }
      
      // Deduct payment from user's wallet
      const requestBody = {
        userId: session.user.id,
        amount: agreedPrice,
        description: `Payment for delivery: ${conversation.delivery.title}`,
        category: 'Delivery Payment',
        referenceId: `DELIVERY-${conversation.delivery.id}`,
        metadata: {
          deliveryId: conversation.delivery.id,
          deliveryType: conversation.delivery.type,
          fromCity: conversation.delivery.fromCity,
          toCity: conversation.delivery.toCity,
          grossAmount: feeCalculation.grossAmount,
          platformFee: feeCalculation.feeAmount,
          netAmount: feeCalculation.netAmount
        }
      };
      
      console.log('Sending wallet debit request:', requestBody);
      
      const walletResponse = await fetch('/api/wallet/debit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      });

      if (!walletResponse.ok) {
        const error = await walletResponse.json();
        throw new Error(error.error || 'Insufficient balance in wallet');
      }

      const walletResult = await walletResponse.json();
      
      // Generate a 6-digit delivery confirmation code
      const deliveryCode = Math.floor(100000 + Math.random() * 900000).toString();
      
      // Create payment confirmation data
      const paymentData = {
        type: 'payment',
        amount: agreedPrice,
        currency: agreedCurrency,
        paidBy: session.user.name || 'User',
        paidById: session.user.id,
        deliveryId: conversation.delivery.id,
        deliveryTitle: conversation.delivery.title,
        deliveryType: conversation.delivery.type,
        paidAt: new Date().toISOString(),
        status: 'completed',
        deliveryCode: deliveryCode,
        transactionId: walletResult.transaction.id,
        newBalance: walletResult.wallet.balance,
        platformFee: feeCalculation.feeAmount,
        netAmount: feeCalculation.netAmount,
        feeRate: feeCalculation.feeRate,
        feePercentage: feeCalculation.feePercentage
      };

      // Send payment confirmation message
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: JSON.stringify(paymentData),
          messageType: 'payment'
        })
      });
      
      // Redirect back to chat with success message
      router.push(`/chat/${conversationId}?paymentSuccess=true`);
    } catch (error) {
      console.error('Error processing payment:', error);
      alert(error instanceof Error ? error.message : 'Failed to process payment. Please try again.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Conversation not found</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className={`${
        conversation.delivery.type === 'request'
          ? 'bg-gradient-to-r from-orange-600 to-orange-500'
          : 'bg-gradient-to-r from-blue-600 to-blue-500'
      } text-white shadow-lg`}>
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => router.back()}
              className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-lg font-bold absolute left-1/2 transform -translate-x-1/2">Payment Summary</h1>
            <div className="w-8"></div> {/* Spacer for balance */}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <div className="bg-white rounded-xl shadow-xl overflow-hidden">
          <div className="p-4 space-y-3">
            {/* Trip Details Card */}
            <div className={`rounded-lg p-3 border space-y-2 ${
              conversation.delivery.type === 'request'
                ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-200'
                : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200'
            }`}>
              <div className="flex items-start gap-2">
                <div className={`p-2 rounded-lg ${
                  conversation.delivery.type === 'request' ? 'bg-orange-500' : 'bg-blue-500'
                }`}>
                  {conversation.delivery.type === 'request' ? (
                    <Package className="w-4 h-4 text-white" />
                  ) : (
                    <Plane className="w-4 h-4 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-gray-900 text-sm leading-tight">{conversation.delivery.title}</h3>
                  {conversation.delivery.description && (
                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">{conversation.delivery.description}</p>
                  )}
                </div>
              </div>

              {/* Route */}
              <div className="flex items-center gap-2 text-xs">
                <MapPin className={`w-4 h-4 flex-shrink-0 ${
                  conversation.delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                }`} />
                <span className="text-gray-700 truncate">
                  <span className="font-semibold">{getCountryFlag(conversation.delivery.fromCountry)} {conversation.delivery.fromCity}</span>
                  <span className="mx-2 text-gray-400">→</span>
                  <span className="font-semibold">{getCountryFlag(conversation.delivery.toCountry)} {conversation.delivery.toCity}</span>
                </span>
              </div>

              {/* Date */}
              <div className="flex items-center gap-2 text-xs">
                <Calendar className={`w-4 h-4 flex-shrink-0 ${
                  conversation.delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                }`} />
                <span className="text-gray-700">
                  {new Date(conversation.delivery.departureDate).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  })}
                </span>
              </div>

              {/* Weight */}
              {conversation.delivery.weight && (
                <div className="flex items-center gap-2 text-xs">
                  <Scale className={`w-4 h-4 flex-shrink-0 ${
                    conversation.delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                  }`} />
                  <span className="text-gray-700">{conversation.delivery.weight} kg</span>
                </div>
              )}

              {/* Type Badge */}
              <div className="flex items-center gap-2 pt-1">
                {conversation.delivery.type === 'request' ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">
                    <Package className="w-3 h-3" />
                    Delivery Request
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                    <Plane className="w-3 h-3" />
                    Travel Offer
                  </span>
                )}
              </div>
            </div>

            {/* Price Breakdown */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-3 border border-green-200 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-green-200">
                <span className="text-xs text-gray-600">Original Price:</span>
                <span className="text-xs text-gray-500 line-through">
                  {conversation.delivery.price.toLocaleString()} {conversation.delivery.currency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-bold text-gray-900">Amount to Pay:</span>
                  {agreedPrice !== conversation.delivery.price && (
                    <p className="text-xs text-green-600 mt-0.5">✓ Negotiated</p>
                  )}
                </div>
                <span className="text-2xl font-bold text-green-600">
                  {agreedPrice.toLocaleString()} {agreedCurrency}
                </span>
              </div>
            </div>

            {/* Payment Protection Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
              <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-700">
                <p className="font-bold text-blue-900 mb-1">🔒 Payment Protection</p>
                <p className="leading-relaxed">
                  Your payment is held securely and will only be released to the {conversation.delivery.type === 'request' ? 'traveler' : 'sender'} after successful delivery confirmation.
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => router.back()}
                disabled={isProcessingPayment}
                className="flex-1 px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPayment}
                disabled={isProcessingPayment}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-2 text-sm"
              >
                {isProcessingPayment ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Confirm
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Insufficient Balance Modal */}
      <InsufficientBalanceModal
        isOpen={showInsufficientBalanceModal}
        onClose={() => setShowInsufficientBalanceModal(false)}
        requiredAmount={agreedPrice}
        currentBalance={walletBalance}
        currency={agreedCurrency}
        onPayDirectly={() => {
          // TODO: Implement direct payment method (e.g., mobile money, card payment)
          alert('Direct payment feature coming soon! Please top up your wallet for now.');
        }}
      />
    </div>
  );
}
