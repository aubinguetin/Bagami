'use client';

import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef, useMemo, useCallback } from 'react';
import { 
  Package,
  User,
  LogOut, 
  Bell, 
  MessageCircle,
  Plane,
  MapPin,
  Calendar,
  DollarSign,
  Search,
  Star,
  Edit2,
  Trash2,
  Plus,
  ArrowLeft,
  RefreshCw,
  Home,
  X,
  Filter
} from 'lucide-react';
import { getCountriesList } from '@/data/locations';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';

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
import { PullToRefreshIndicator } from '@/components/PullToRefreshIndicator';
import { 
  useDeliveries, 
  useRefreshDeliveries
} from '@/hooks/useQueries';
import { PostModal } from '@/components/PostModal';
import { AlertModal } from '@/components/AlertModal';
import { DeliveryDetailsModal } from '@/components/DeliveryDetailsModal';

// SearchableSelect component for country filters with optimization
function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label 
}: {
  value: string;
  onChange: (value: string) => void;
  options: { code: string; name: string }[];
  placeholder: string;
  label: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  // Debounce search term for better performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Memoized filtering for optimal performance
  const filteredOptions = useMemo(() => {
    if (!debouncedTerm.trim()) {
      return options;
    }
    
    const lowerSearchTerm = debouncedTerm.toLowerCase();
    return options.filter(option =>
      option.name.toLowerCase().includes(lowerSearchTerm) ||
      option.code.toLowerCase().includes(lowerSearchTerm)
    );
  }, [options, debouncedTerm]);
  
  const selectedOption = options.find(option => option.code === value);
  
  // Optimized callback to clear search and close dropdown
  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

  // Optimized callback to select option
  const handleSelect = useCallback((optionCode: string) => {
    onChange(optionCode);
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-3 py-2 pr-10 text-left border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
        >
          {selectedOption ? selectedOption.name : placeholder}
        </button>
        
        {/* Clear button */}
        {value && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleClear();
            }}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
            title="Clear selection"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
              />
              {searchTerm !== debouncedTerm && (
                <div className="text-xs text-gray-500 mt-1 px-2">Searching...</div>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto">
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left hover:bg-gray-50"
              >
                {placeholder}
              </button>
              {filteredOptions.map((option) => (
                <button
                  key={option.code}
                  onClick={() => handleSelect(option.code)}
                  className="w-full px-3 py-2 text-left hover:bg-gray-50"
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DeliveriesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  
  // Filters and search state
  const [activeFilter, setActiveFilter] = useState<'all' | 'requests' | 'offers'>('all');
  const [showMineOnly, setShowMineOnly] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [departureCountry, setDepartureCountry] = useState('');
  const [destinationCountry, setDestinationCountry] = useState('');
  const [dateSort, setDateSort] = useState<'newest' | 'oldest'>('newest');
  const [showFilters, setShowFilters] = useState(true);

  // Debounce search query
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Modal states
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<any>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showPostModal, setShowPostModal] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<any>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [allDeliveries, setAllDeliveries] = useState<any[]>([]);

  const countries = getCountriesList();

  // Get current user info from session or localStorage
  const getCurrentUserInfo = () => {
    if (session?.user?.id) {
      const userContact = session.user.email || (session.user as any).phone;
      return {
        userId: session.user.id,
        userContact: userContact
      };
    }
    
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

  // Authentication check
  useEffect(() => {
    const bagamiAuth = localStorage.getItem('bagami_authenticated');
    
    if (status === 'authenticated' || bagamiAuth === 'true') {
      setIsAuthenticated(true);
    } else if (status === 'unauthenticated' && !bagamiAuth) {
      const timeoutId = setTimeout(() => {
        router.push('/auth');
      }, 0);
      return () => clearTimeout(timeoutId);
    }
  }, [status, router]);

  // Use React Query for deliveries with smart caching
  const deliveryFilters = {
    filter: activeFilter,
    searchQuery: debouncedSearchQuery,
    departureCountry,
    destinationCountry,
    mineOnly: showMineOnly,
    page: currentPage,
    limit: 20
  };

  const { 
    data: deliveryResponse, 
    isLoading, 
    error,
    refetch: refetchDeliveries 
  } = useDeliveries(deliveryFilters);

  // Handle pagination data
  const pagination = deliveryResponse?.pagination;

  // Reset accumulated deliveries when filters change
  useEffect(() => {
    setCurrentPage(1);
    setAllDeliveries([]);
  }, [activeFilter, debouncedSearchQuery, departureCountry, destinationCountry, showMineOnly]);

  // Accumulate deliveries when new page loads
  useEffect(() => {
    if (deliveryResponse?.deliveries) {
      if (currentPage === 1) {
        setAllDeliveries(deliveryResponse.deliveries);
      } else {
        setAllDeliveries(prev => [...prev, ...deliveryResponse.deliveries]);
      }
    }
  }, [deliveryResponse, currentPage]);

  // Sort deliveries by date
  const sortedDeliveries = useMemo(() => {
    const sorted = [...allDeliveries];
    return sorted.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      
      if (dateSort === 'newest') {
        return dateB.getTime() - dateA.getTime(); // Newest first
      } else {
        return dateA.getTime() - dateB.getTime(); // Oldest first
      }
    });
  }, [allDeliveries, dateSort]);

  const deliveries = sortedDeliveries;

  const loadMore = () => {
    if (pagination?.hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  };

  // Pull-to-refresh functionality
  const deliveryContainerRef = useRef<HTMLDivElement>(null);
  const { 
    bindToElement: bindDeliveryContainer,
    isPulling: isDeliveryPulling,
    isRefreshing: isDeliveryRefreshing,
    pullDistance: deliveryPullDistance,
    canRefresh: canRefreshDeliveries
  } = usePullToRefresh({
    onRefresh: async () => {
      await refetchDeliveries();
    },
    threshold: 60
  });

  // Bind pull-to-refresh to the container
  useEffect(() => {
    bindDeliveryContainer(deliveryContainerRef.current);
  }, [bindDeliveryContainer]);

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

  // Handler functions for delivery management
  const handleEditDelivery = (delivery: any) => {
    setEditingDelivery(delivery);
    setShowPostModal(true);
  };

  const handleDeleteDelivery = async (delivery: any) => {
    if (!confirm('Are you sure you want to delete this delivery? This action cannot be undone.')) {
      return;
    }

    try {
      const currentUserId = localStorage.getItem('bagami_user_id');
      const currentUserContact = localStorage.getItem('bagami_user_contact');
      
      const response = await fetch(`/api/deliveries/${delivery.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentUserId,
          currentUserContact
        }),
      });

      if (response.ok) {
        refetchDeliveries();
        alert('Delivery deleted successfully!');
      } else {
        const error = await response.json();
        alert(`Failed to delete delivery: ${error.error}`);
      }
    } catch (error) {
      console.error('Error deleting delivery:', error);
      alert('Network error. Please try again.');
    }
  };

  const handleViewDetails = (delivery: any) => {
    setSelectedDelivery(delivery);
    setShowDeliveryModal(true);
  };

  const handleSignOut = async () => {
    setIsAuthenticated(false);
    localStorage.removeItem('bagami_authenticated');
    localStorage.removeItem('bagami_user_contact');
    localStorage.removeItem('bagami_user_id');
    localStorage.removeItem('bagami_user_name');
    
    setTimeout(async () => {
      if (session) {
        await signOut({ callbackUrl: '/auth' });
      } else {
        router.push('/auth');
      }
    }, 0);
  };

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Center - Title */}
            <div className="flex-1 flex justify-center">
              <h1 className="text-2xl font-bold text-slate-800">Deliveries</h1>
            </div>

            {/* Right side - Post button only */}
            <div className="flex items-center">
              <button
                onClick={() => setShowPostModal(true)}
                className="bg-orange-600 hover:bg-orange-700 text-white p-3 rounded-full transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-8">
          {/* Enhanced Search Row */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2 z-10" />
              <input
                type="text"
                placeholder="Search cities, countries, or destinations..."
                className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoComplete="off"
              />
              
              {/* Clear button */}
              {searchQuery.length > 0 && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-8 top-1/2 transform -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors z-10"
                  title="Clear search"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
              
              {/* Search Loading Indicator */}
              {searchQuery !== debouncedSearchQuery && searchQuery.length >= 2 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-orange-500 border-t-transparent"></div>
                </div>
              )}
            </div>
          </div>

          {/* Country Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <SearchableSelect
              value={departureCountry}
              onChange={setDepartureCountry}
              options={countries}
              placeholder="All departure countries"
              label="From Country"
            />
            
            <SearchableSelect
              value={destinationCountry}
              onChange={setDestinationCountry}
              options={countries}
              placeholder="All destination countries"
              label="To Country"
            />
          </div>
          
          {/* Filter Toggle Button */}
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-800">Filters</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                showFilters 
                  ? 'bg-orange-100 text-orange-600 hover:bg-orange-200' 
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span className="text-sm font-medium">
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </span>
            </button>
          </div>
          
          {/* Filters Section */}
          {showFilters && (
          <div className="space-y-4">
            {/* Primary Filters - Type Selection */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">Post Type</h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setActiveFilter('all')}
                  className={`px-4 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilter === 'all' 
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25' 
                      : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                  }`}
                >
                  <Package className="w-4 h-4" />
                  All Posts
                </button>
                <button
                  onClick={() => setActiveFilter('requests')}
                  className={`px-4 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilter === 'requests' 
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25' 
                      : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                  }`}
                >
                  <Search className="w-4 h-4" />
                  Requests
                </button>
                <button
                  onClick={() => setActiveFilter('offers')}
                  className={`px-4 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    activeFilter === 'offers' 
                      ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/25' 
                      : 'bg-white text-gray-700 hover:bg-orange-50 hover:text-orange-600 border border-gray-200'
                  }`}
                >
                  <Plane className="w-4 h-4" />
                  Offers
                </button>
              </div>
            </div>

            {/* Secondary Filters - View Options */}
            <div className="bg-gray-50 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-gray-600 mb-3 uppercase tracking-wide">View Options</h3>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setShowMineOnly(!showMineOnly)}
                  className={`px-4 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center gap-2 ${
                    showMineOnly 
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/25' 
                      : 'bg-white text-gray-700 hover:bg-purple-50 hover:text-purple-600 border border-gray-200'
                  }`}
                >
                  <User className="w-4 h-4" />
                  My Posts Only
                </button>

                <div className="w-px h-8 bg-gray-300"></div>

                <button
                  onClick={() => setDateSort(dateSort === 'newest' ? 'oldest' : 'newest')}
                  className="px-4 py-2.5 rounded-full font-medium transition-all duration-200 flex items-center gap-2 bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-600 border border-gray-200"
                >
                  <Calendar className="w-4 h-4" />
                  {dateSort === 'newest' ? 'Newest First' : 'Oldest First'}
                </button>
              </div>
            </div>

            {/* Clear All Filters */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  setSearchQuery('');
                  setDepartureCountry('');
                  setDestinationCountry('');
                  setShowMineOnly(false);
                  setDateSort('newest');
                }}
                className="px-4 py-2 rounded-lg font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200 flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Clear All Filters
              </button>
            </div>

            {/* Action Button */}
            <div className="flex justify-center">
              <button
                onClick={() => setShowAlertModal(true)}
                className="px-6 py-3 rounded-full font-medium transition-all duration-200 flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/25 hover:shadow-xl hover:shadow-blue-600/30"
              >
                <Bell className="w-5 h-5" />
                Create Alert
              </button>
            </div>
          </div>
          )}
        </div>

        {/* Delivery Cards */}
        <div 
          ref={deliveryContainerRef}
          className="relative grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto"
        >
          {/* Pull-to-refresh indicator */}
          <PullToRefreshIndicator
            isPulling={isDeliveryPulling}
            isRefreshing={isDeliveryRefreshing}
            pullDistance={deliveryPullDistance}
            canRefresh={canRefreshDeliveries}
          />

          {isLoading ? (
            // Loading state
            Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                    <div>
                      <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-gray-200 rounded-full w-16"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded"></div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-6 h-6 bg-gray-200 rounded-full"></div>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            ))
          ) : deliveries.length > 0 ? (
            // Delivery cards
            deliveries.map((delivery) => (
              <div 
                key={delivery.id} 
                className={`bg-white rounded-2xl shadow-sm border-2 transition-all duration-200 relative cursor-pointer overflow-hidden group hover:shadow-lg hover:scale-[1.02] ${
                  delivery.type === 'request' 
                    ? 'border-orange-100 hover:border-orange-200' 
                    : 'border-blue-100 hover:border-blue-200'
                }`}
                onClick={() => !(delivery as any).isOwnedByCurrentUser && handleViewDetails(delivery)}
              >
                {/* Top accent bar */}
                <div className={`h-1 w-full ${
                  delivery.type === 'request' ? 'bg-gradient-to-r from-orange-400 to-orange-600' : 'bg-gradient-to-r from-blue-400 to-blue-600'
                }`} />
                
                {/* Expired indicator for user's own posts */}
                {delivery.isExpired && delivery.isOwnedByCurrentUser && (
                  <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-medium shadow-md z-10">
                    Expired
                  </div>
                )}
                
                <div className="p-4">
                  {/* Header with icon, title and type badge */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start space-x-3 flex-1 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm flex-shrink-0 ${
                        delivery.type === 'request' ? 'bg-gradient-to-br from-orange-100 to-orange-200' : 'bg-gradient-to-br from-blue-100 to-blue-200'
                      }`}>
                        {delivery.type === 'request' ? 
                          <Package className="w-5 h-5 text-orange-600" /> :
                          <Plane className="w-5 h-5 text-blue-600" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 text-base leading-5 mb-1 overflow-hidden" style={{
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const
                        }}>{delivery.title}</p>
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">{delivery.weight ? `${delivery.weight} kg` : 'Weight TBD'}</span>
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold shadow-sm whitespace-nowrap flex-shrink-0 ml-2 ${
                      delivery.type === 'request' 
                        ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white' 
                        : 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    }`}>
                      {delivery.type === 'request' ? 'REQUEST' : 'OFFER'}
                    </span>
                  </div>

                  {/* Route and details section */}
                  <div className="space-y-2 mb-3">
                    {/* Route with enhanced styling and flags */}
                    <div className="bg-gray-50 rounded-lg p-2 border border-gray-100">
                      <div className="flex items-center space-x-2">
                        <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        <div className="flex items-center space-x-2 text-sm font-medium text-gray-800">
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{getCountryFlag(delivery.fromCountry)}</span>
                            <span>{delivery.fromCity}</span>
                          </div>
                          <span className="text-gray-400">→</span>
                          <div className="flex items-center space-x-1">
                            <span className="text-lg">{getCountryFlag(delivery.toCountry)}</span>
                            <span>{delivery.toCity}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Date and price in a compact row */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center space-x-1.5 bg-gray-50 rounded-lg p-2">
                        <Calendar className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700 font-medium">
                          {delivery.arrivalDate ? 
                            `By ${new Date(delivery.arrivalDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` :
                            delivery.departureDate ? `${new Date(delivery.departureDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : 'TBD'
                          }
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5 bg-gray-50 rounded-lg p-2">
                        <DollarSign className="w-3.5 h-3.5 text-gray-500 flex-shrink-0" />
                        <span className="text-xs font-bold text-gray-800">{delivery.price || 0} {delivery.currency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Footer with user info and actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                    <div className="flex items-center space-x-2">
                      <div className="w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                        <User className="w-3 h-3 text-gray-500" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium text-gray-700">{delivery.sender?.name || 'Anonymous'}</span>
                        <div className="flex items-center bg-yellow-50 px-1.5 py-0.5 rounded-full">
                          <Star className="w-2.5 h-2.5 text-yellow-500 fill-current" />
                          <span className="text-xs font-medium text-yellow-700 ml-1">4.5</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Management buttons for user's own posts */}
                    {(delivery as any).isOwnedByCurrentUser ? (
                      <div className="flex items-center space-x-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDelivery(delivery);
                          }}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteDelivery(delivery);
                          }}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className={`px-3 py-1 rounded-full text-xs font-bold transition-colors group-hover:scale-105 ${
                        delivery.type === 'request' 
                          ? 'bg-orange-100 text-orange-700 group-hover:bg-orange-200' 
                          : 'bg-blue-100 text-blue-700 group-hover:bg-blue-200'
                      }`}>
                        VIEW DETAILS
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            // Empty state
            <div className="col-span-full flex flex-col items-center justify-center py-12 text-gray-400">
              <Search className="w-16 h-16 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No deliveries found</h3>
              <p className="text-center">Try adjusting your search filters or create a new delivery request.</p>
            </div>
          )}
        </div>

        {/* Load More Button */}
        {pagination?.hasMore && deliveries.length > 0 && (
          <div className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-8 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Loading...</span>
                </>
              ) : (
                <span>Load More</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {/* Alert Modal */}
      {showAlertModal && (
        <AlertModal 
          isOpen={showAlertModal} 
          onClose={() => setShowAlertModal(false)}
          currentFilters={{
            searchQuery,
            departureCountry,
            destinationCountry,
            activeFilter
          }}
        />
      )}

      {/* Delivery Details Modal */}
      {showDeliveryModal && selectedDelivery && (
        <DeliveryDetailsModal 
          isOpen={showDeliveryModal} 
          onClose={() => {
            setShowDeliveryModal(false);
            setSelectedDelivery(null);
          }}
          delivery={selectedDelivery}
          setActiveConversationId={() => {}} // Not needed for standalone page
          session={session}
          status={status}
        />
      )}

      {/* Post/Edit Modal */}
      {showPostModal && (
        <PostModal 
          isOpen={showPostModal} 
          onClose={() => {
            setShowPostModal(false);
            setEditingDelivery(null);
          }}
          editingDelivery={editingDelivery}
          onSuccess={() => {
            refetchDeliveries(); // Refresh deliveries after successful post/edit
          }}
        />
      )}

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200/50 z-50 safe-bottom shadow-[0_-4px_16px_rgba(0,0,0,0.08)]">
        <div className="grid grid-cols-4 h-16 max-w-screen-xl mx-auto">
          {/* Home */}
          <button
            onClick={() => router.push('/')}
            className="group flex flex-col items-center justify-center space-y-1 text-gray-600 hover:text-gray-900 transition-all duration-200 active:scale-95"
          >
            <Home className="w-6 h-6 transition-transform group-hover:scale-110" />
            <span className="text-[10px] font-semibold tracking-wide">Home</span>
          </button>

          {/* Deliveries - Active */}
          <button className="relative flex flex-col items-center justify-center space-y-1 transition-all duration-200 active:scale-95">
            {/* Active indicator bar */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-gradient-to-r from-orange-500 to-orange-600 rounded-b-full" />
            
            <div className="relative">
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl blur-md opacity-40" />
              
              {/* Icon container */}
              <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 p-2 rounded-2xl shadow-lg">
                <Package className="w-5 h-5 text-white" />
              </div>
            </div>
            
            <span className="text-[10px] font-semibold text-orange-600 tracking-wide">Deliveries</span>
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
    </div>
  );
}