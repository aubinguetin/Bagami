'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { 
  Home,
  Package,
  User,
  Bell, 
  MessageCircle,
  Plane,
  Search,
  Users,
  Shield,
  TrendingUp,
  MapPin
} from 'lucide-react';

export default function Homepage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

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

  // Fetch unread message count
  const fetchUnreadCount = async () => {
    if (!isAuthenticated) return;
    
    try {
      const { userId: currentUserId, userContact: currentUserContact } = getCurrentUserInfo();
      
      const params = new URLSearchParams();
      if (currentUserId) params.set('currentUserId', currentUserId);
      if (currentUserContact) params.set('currentUserContact', encodeURIComponent(currentUserContact));
      
      const url = `/api/messages/unread-count${params.toString() ? '?' + params.toString() : ''}`;
      const response = await fetch(url);
      const result = await response.json();

      if (response.ok) {
        setUnreadMessageCount(result.unreadCount || 0);
      }
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  useEffect(() => {
    // Check for simple authentication flag
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      // Use a timeout to avoid router.push during render
      const timeoutId = setTimeout(() => {
        router.push('/auth');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [status, router]);

  // Enhanced polling with smart intervals and visibility detection
  useEffect(() => {
    if (!isAuthenticated) return;

    fetchUnreadCount();
    
    // Smart polling: faster when active, slower when background
    const getPollingInterval = () => {
      return document.hidden ? 30000 : 5000; // 30s background, 5s active
    };

    let interval = setInterval(fetchUnreadCount, getPollingInterval());

    // Handle visibility change for immediate updates
    const handleVisibilityChange = () => {
      clearInterval(interval);
      
      if (!document.hidden) {
        // Immediate refresh when returning to tab
        fetchUnreadCount();
      }
      
      // Restart with appropriate interval
      interval = setInterval(fetchUnreadCount, getPollingInterval());
    };

    // Listen for focus events for even faster response
    const handleFocus = () => {
      fetchUnreadCount();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, [isAuthenticated]);

  // Helper function to get consistent user info
  const getUserInfo = () => {
    if (session?.user) {
      return {
        id: session.user.id,
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        contact: session.user.email || (session.user as any).phone
      };
    }
    
    // Fallback for localStorage-based authentication
    return {
      id: localStorage.getItem('bagami_user_id'),
      name: 'User',
      contact: localStorage.getItem('bagami_user_contact')
    };
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Please sign in</h2>
          <p className="mt-2 text-sm text-gray-600">You need to be authenticated to view this page.</p>
        </div>
      </div>
    );
  }

  const userInfo = getUserInfo();

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Top Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Header */}
            <>
                {/* Hello Message */}
                <div className="flex items-center">
                  <h1 className="text-xl font-semibold text-gray-900">
                    Welcome back!
                  </h1>
                </div>

                {/* User Avatar/Menu */}
                <div className="flex items-center space-x-4">
                  {/* Messages/Notifications */}
                  <button
                    onClick={() => router.push('/messages')}
                    className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <MessageCircle className="w-6 h-6" />
                    {unreadMessageCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-medium">
                        {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                      </span>
                    )}
                  </button>

                  {/* User Profile Picture */}
                  <button
                    onClick={() => router.push('/profile')}
                    className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                  >
                    {userInfo.image ? (
                      <img src={userInfo.image} alt="Profile" className="w-8 h-8 rounded-full" />
                    ) : (
                      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-gray-600" />
                      </div>
                    )}
                  </button>
                </div>
            </>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-800 mb-4">
              Send Better.{' '}
              <span className="text-orange-500">Travel Smarter.</span>
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Connect with travelers and senders in one tap. The community-powered delivery network.
            </p>
          </div>

          {/* Main CTAs */}
          <div className="mb-12">
            {/* Delivery Inquiries Box */}
            <button
              onClick={() => router.push('/deliveries')}
              className="w-full bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-8 text-white mb-8 text-left hover:from-purple-600 hover:to-purple-700 transition-all transform hover:scale-105 cursor-pointer"
            >
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Looking for Deliveries?</h3>
                  <p className="text-purple-100">Browse available delivery requests and travel offers</p>
                </div>
                <Search className="w-12 h-12 text-purple-200" />
              </div>
              <div className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold inline-block">
                Browse Deliveries
              </div>
            </button>

            {/* Post and Offer CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <button
                onClick={() => router.push('/deliveries')}
                className="w-full bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-8 text-white text-left hover:from-orange-600 hover:to-orange-700 transition-all transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Need to Send Something?</h3>
                    <p className="text-orange-100">Connect with travelers heading your way</p>
                  </div>
                  <Package className="w-12 h-12 text-orange-200" />
                </div>
                <div className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold inline-block">
                  Post a Delivery
                </div>
              </button>

              <button
                onClick={() => router.push('/deliveries')}
                className="w-full bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-8 text-white text-left hover:from-blue-600 hover:to-blue-700 transition-all transform hover:scale-105 cursor-pointer"
              >
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Traveling Soon?</h3>
                    <p className="text-blue-100">Earn money by helping others send packages</p>
                  </div>
                  <Plane className="w-12 h-12 text-blue-200" />
                </div>
                <div className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold inline-block">
                  Offer to Carry
                </div>
              </button>
            </div>
          </div>

          {/* How It Works */}
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h3 className="text-2xl font-bold text-slate-800 mb-8 text-center">How Bagami Works</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Package className="w-8 h-8 text-orange-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Post Your Package</h4>
                <p className="text-gray-600">Describe what you want to send and where it needs to go</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Connect with Travelers</h4>
                <p className="text-gray-600">Browse verified travelers heading to your destination</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-green-600" />
                </div>
                <h4 className="text-lg font-semibold text-slate-800 mb-2">Safe & Secure</h4>
                <p className="text-gray-600">Verified users, secure payments, and delivery tracking</p>
              </div>
            </div>
          </div>

          {/* Value Propositions */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Secure Payments</h3>
              <p className="text-sm text-gray-600">
                We hold payments securely until delivery is completed and confirmed by both parties
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Data Privacy</h3>
              <p className="text-sm text-gray-600">
                Your personal information and delivery details are encrypted and protected at all times
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <TrendingUp className="w-6 h-6 text-orange-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Save Time & Money</h3>
              <p className="text-sm text-gray-600">
                Find verified travelers instantly and compare prices to get the best delivery deals
              </p>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800 mb-2">Fast Matching</h3>
              <p className="text-sm text-gray-600">
                Our smart algorithm connects you with available travelers heading to your destination ASAP
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-4 h-16 max-w-screen-xl mx-auto">
          {/* Home - Active */}
          <button
            onClick={() => router.push('/')}
            className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95"
          >
            {/* Active indicator bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-full" />
            
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-md opacity-40" />
              
              {/* Icon container */}
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-2xl shadow-lg">
                <Home className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">Home</span>
          </button>

          {/* Deliveries */}
          <button
            onClick={() => router.push('/deliveries')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <Package className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">Deliveries</span>
          </button>

          {/* Messages */}
          <button
            onClick={() => router.push('/messages')}
            className="group relative flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <div className="relative">
              <MessageCircle className="w-6 h-6 transition-transform group-hover:scale-110" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-br from-red-500 to-red-600 text-white text-[10px] rounded-full h-5 w-5 flex items-center justify-center font-bold border-2 border-white shadow-lg">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-semibold tracking-wide">Messages</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => router.push('/profile')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <User className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">Profile</span>
          </button>
        </div>
      </nav>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:block fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 space-y-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors bg-orange-100 text-orange-700"
          >
            <Home className="w-5 h-5" />
            <span className="font-medium">Home</span>
          </button>
          
          <button
            onClick={() => router.push('/deliveries')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <Package className="w-5 h-5" />
            <span className="font-medium">Deliveries</span>
          </button>

          <button
            onClick={() => router.push('/messages')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <div className="relative">
              <MessageCircle className="w-5 h-5" />
              {unreadMessageCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center font-medium">
                  {unreadMessageCount > 99 ? '99+' : unreadMessageCount}
                </span>
              )}
            </div>
            <span className="font-medium">Messages</span>
          </button>
          
          <button
            onClick={() => router.push('/profile')}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
          >
            <User className="w-5 h-5" />
            <span className="font-medium">Profile</span>
          </button>
        </div>
      </aside>
    </div>
  );
}