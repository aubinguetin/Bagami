import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  X,
  Package,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  User,
  MessageCircle,
  Star,
  Award,
  Shield
} from 'lucide-react';

interface DeliveryDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  delivery: any;
  setActiveConversationId: (id: string | null) => void;
  session: any;
  status: string;
}

export function DeliveryDetailsModal({ 
  isOpen, 
  onClose, 
  delivery,
  setActiveConversationId,
  session,
  status
}: DeliveryDetailsModalProps) {
  const router = useRouter();
  const [showContactConfirm, setShowContactConfirm] = useState(false);
  const [isContacting, setIsContacting] = useState(false);

  // Get current user info from session or localStorage
  const getCurrentUserInfo = () => {
    // Try to get from NextAuth session first
    if (session?.user?.id) {
      const userContact = session.user.email || (session.user as any).phone;
      return {
        userId: session.user.id,
        userContact: userContact
      };
    }
    
    // Fallback to localStorage
    const currentUserId = localStorage.getItem('bagami_user_id');
    const currentUserContact = localStorage.getItem('bagami_user_contact');
    
    return {
      userId: currentUserId,
      userContact: currentUserContact
    };
  };

  if (!isOpen || !delivery) return null;

  const handleContactClick = () => {
    setShowContactConfirm(true);
  };

  const handleConfirmContact = async () => {
    setIsContacting(true);
    try {
      console.log('Creating conversation for delivery:', delivery);
      console.log('Delivery ID:', delivery.id);
      console.log('Sender ID:', delivery.senderId || delivery.sender?.id);
      console.log('Session status:', status);
      console.log('Session data:', session);
      console.log('Local storage auth:', localStorage.getItem('bagami_authenticated'));
      
      // Get current user information for authentication fallback
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      // Create conversation with the delivery owner
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deliveryId: delivery.id,
          otherUserId: delivery.senderId || delivery.sender?.id,
          currentUserId: currentUserId,
          currentUserContact: currentUserContact
        }),
      });

      const result = await response.json();
      console.log('Conversation API response:', result);

      if (response.ok && result.conversation) {
        // Close modals and navigate to chat page
        setShowContactConfirm(false);
        onClose();
        
        console.log('🎯 Creating conversation and navigating to chat:', result.conversation.id);
        console.log('🎯 Full conversation object:', result.conversation);
        
        // Navigate directly to the new chat page
        router.push(`/chat/${result.conversation.id}`);
      } else {
        console.error('❌ Conversation creation failed:', result);
        alert(`Error: ${result.error || 'Failed to create conversation'}`);
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsContacting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[98vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className={`relative p-5 ${
          delivery.type === 'request' 
            ? 'bg-gradient-to-r from-orange-500 to-orange-600' 
            : 'bg-gradient-to-r from-blue-500 to-blue-600'
        } text-white`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {delivery.type === 'request' ? 
                  <Package className="w-6 h-6 text-white" /> :
                  <Plane className="w-6 h-6 text-white" />
                }
              </div>
              <div>
                <h2 className="text-xl font-bold">
                  {delivery.type === 'request' ? 'Delivery Request' : 'Travel Offer'}
                </h2>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-white/20 backdrop-blur-sm">
                    {delivery.type === 'request' ? 'Request' : 'Offer'}
                  </span>
                  <div className={`flex items-center space-x-1 text-xs ${
                    delivery.status === 'PENDING' ? 'text-green-200' : 'text-gray-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full ${
                      delivery.status === 'PENDING' ? 'bg-green-300' : 'bg-gray-300'
                    }`}></div>
                    <span>{delivery.status === 'PENDING' ? 'Available' : 'Inactive'}</span>
                  </div>
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content - All scrollable including buttons */}
        <div className="overflow-y-auto max-h-[calc(98vh-120px)] p-5 space-y-4">
          {/* Main Info Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Item/Service Details */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100/50 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Package className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">
                  {delivery.type === 'request' ? 'Item Details' : 'Service Details'}
                </h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Title:</span>
                  <span className="font-medium text-slate-800 text-right flex-1 ml-2">{delivery.title || 'Not specified'}</span>
                </div>
                {delivery.weight && (
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Weight:</span>
                    <span className="font-medium text-slate-800">{delivery.weight} kg</span>
                  </div>
                )}
                {delivery.description && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <span className="text-gray-600 text-xs">Description:</span>
                    <p className="text-slate-700 text-sm mt-1 leading-relaxed">{delivery.description}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Route Information */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100/50 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold text-gray-800">Route</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full mt-1"></div>
                  <div className="text-sm">
                    <span className="text-gray-600">From:</span>
                    <p className="font-medium text-slate-800">{delivery.fromCity}, {delivery.fromCountry}</p>
                  </div>
                </div>
                <div className="w-0.5 h-4 bg-gray-300 ml-1"></div>
                <div className="flex items-start space-x-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full mt-1"></div>
                  <div className="text-sm">
                    <span className="text-gray-600">To:</span>
                    <p className="font-medium text-slate-800">{delivery.toCity}, {delivery.toCountry}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline & Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gradient-to-br from-purple-50 to-purple-100/50 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Calendar className="w-5 h-5 text-purple-600" />
                <h3 className="font-semibold text-gray-800">Timeline</h3>
              </div>
              <div className="space-y-2 text-sm">
                {delivery.departureDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Departure:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(delivery.departureDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {delivery.arrivalDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Needed by:</span>
                    <span className="font-medium text-slate-800">
                      {new Date(delivery.arrivalDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {!delivery.departureDate && !delivery.arrivalDate && (
                  <div className="text-center text-gray-500 text-sm">
                    No dates specified
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100/50 rounded-2xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <DollarSign className="w-5 h-5 text-green-600" />
                <h3 className="font-semibold text-gray-800">Pricing</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-bold text-green-700 text-lg">
                    {delivery.price || 0} {delivery.currency || 'XOF'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-600" />
                  <span className="text-xs text-green-700">Payment protected</span>
                </div>
              </div>
            </div>
          </div>

          {/* Sender Information */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100/50 rounded-2xl p-4">
            <div className="flex items-center space-x-2 mb-3">
              <User className="w-5 h-5 text-orange-600" />
              <h3 className="font-semibold text-gray-800">
                {delivery.type === 'request' ? 'Sender' : 'Traveler'}
              </h3>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-orange-200 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-slate-800">{delivery.sender?.name || 'Anonymous'}</p>
                <div className="flex items-center space-x-3 mt-1 text-xs">
                  <div className="flex items-center space-x-1">
                    <Star className="w-3 h-3 text-yellow-500 fill-current" />
                    <span className="text-gray-600">4.5 (127)</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Award className="w-3 h-3 text-green-600" />
                    <span className="text-gray-600">Verified</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons - Now scrollable with content */}
          <div className="pt-4 border-t border-gray-200 mt-6">
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-white hover:shadow-sm transition-all font-medium"
              >
                Close
              </button>
              {delivery.status === 'PENDING' && (
                <button
                  onClick={handleContactClick}
                  className={`flex-1 px-6 py-3 text-white rounded-xl font-medium transition-all shadow-sm hover:shadow-md ${
                    delivery.type === 'request'
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                      : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-center space-x-2">
                    <MessageCircle className="w-4 h-4" />
                    <span>{delivery.type === 'request' ? '✓ Accept Request' : '💬 Contact Traveler'}</span>
                  </div>
                </button>
              )}
            </div>
          </div>

          {/* Transparent spacer to ensure buttons are fully visible when scrolling */}
          <div className="h-8 w-full opacity-0 pointer-events-none"></div>
        </div>
      </div>

      {/* Contact Confirmation Modal */}
      {showContactConfirm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-60 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="text-center">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-3xl flex items-center justify-center ${
                delivery.type === 'request' 
                  ? 'bg-gradient-to-br from-orange-100 to-orange-200' 
                  : 'bg-gradient-to-br from-blue-100 to-blue-200'
              }`}>
                <MessageCircle className={`w-8 h-8 ${
                  delivery.type === 'request' ? 'text-orange-600' : 'text-blue-600'
                }`} />
              </div>
              
              <h3 className="text-lg font-bold text-slate-800 mb-2">
                {delivery.type === 'request' ? '✓ Accept Request' : '💬 Start Conversation'}
              </h3>
              
              <p className="text-gray-600 text-sm mb-6 leading-relaxed">
                {delivery.type === 'request' 
                  ? `Accept this delivery request and start chatting with ${delivery.sender?.name || 'the requester'}?`
                  : `Start a conversation with ${delivery.sender?.name || 'the traveler'} about this travel offer?`
                }
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowContactConfirm(false)}
                  disabled={isContacting}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmContact}
                  disabled={isContacting}
                  className={`flex-1 px-4 py-3 text-white rounded-xl font-medium transition-all disabled:opacity-50 shadow-sm hover:shadow-md ${
                    delivery.type === 'request'
                      ? 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'
                      : 'bg-blue-500 hover:bg-blue-600 shadow-blue-200'
                  }`}
                >
                  {isContacting ? '⏳ Starting...' : '✓ Yes, Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}