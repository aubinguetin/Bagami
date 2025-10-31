'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  ArrowLeft,
  Save,
  User,
  Mail,
  Phone,
  ChevronDown,
  Search
} from 'lucide-react';
import { countryCodes, getDefaultCountry } from '@/data/countryCodes';
import OtpModal from '@/components/OtpModal';

export default function MyInformationPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });

  // Original values to track changes
  const [originalData, setOriginalData] = useState({
    fullName: '',
    email: '',
    phoneNumber: ''
  });

  // Verification status
  const [verificationStatus, setVerificationStatus] = useState({
    email: true, // Assume verified initially
    phone: true  // Assume verified initially
  });

  // Country code state
  const [selectedCountry, setSelectedCountry] = useState(() => getDefaultCountry());
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');

  // OTP verification state
  const [otpState, setOtpState] = useState({
    show: false,
    type: '' as 'email' | 'phone' | '',
    contact: '',
    isVerifying: false
  });

  // Filtered countries based on search
  const filteredCountries = () => {
    if (!countrySearch.trim()) return countryCodes;
    
    return countryCodes.filter(country => 
      country.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      country.dialCode.includes(countrySearch)
    );
  };

  // Load user information on component mount
  useEffect(() => {
    if (session?.user) {
      console.log('Loading user data...');
      // Fetch latest user data from API instead of relying on session
      fetchUserData();
    }
  }, [session]);

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (showCountryDropdown && !target.closest('[data-country-dropdown]')) {
        setShowCountryDropdown(false);
        setCountrySearch('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCountryDropdown]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Update verification status when email or phone changes
    if (field === 'email') {
      if (value !== originalData.email) {
        setVerificationStatus(prev => ({ ...prev, email: false }));
      } else {
        // If user returns to original verified value, restore verified status
        setVerificationStatus(prev => ({ ...prev, email: true }));
      }
    }
    if (field === 'phoneNumber') {
      if (value !== originalData.phoneNumber) {
        setVerificationStatus(prev => ({ ...prev, phone: false }));
      } else {
        // If user returns to original verified value, restore verified status
        setVerificationStatus(prev => ({ ...prev, phone: true }));
      }
    }
  };

  // Loading states for individual buttons
  const [loadingStates, setLoadingStates] = useState({
    fullName: false,
    email: false,
    phone: false
  });

  // Function to fetch user data from API
  const fetchUserData = async () => {
    try {
      const response = await fetch('/api/user/profile');
      const result = await response.json();
      
      if (result.success && result.user) {
        const user = result.user;
        
        // Extract phone number without country code
        let phoneWithoutCode = '';
        let detectedCountry = getDefaultCountry();
        
        if (user.phone) {
          // Try to detect country from phone number (if it starts with country code)
          for (const country of countryCodes) {
            if (user.phone.startsWith(country.dialCode)) {
              phoneWithoutCode = user.phone.substring(country.dialCode.length);
              detectedCountry = country;
              break;
            }
          }
          
          // Fallback 1: use stored country code
          if (!phoneWithoutCode && user.countryCode) {
            const countryFromCode = countryCodes.find(c => c.dialCode === user.countryCode);
            if (countryFromCode) {
              // Check if phone starts with country code
              if (user.phone.startsWith(user.countryCode)) {
                phoneWithoutCode = user.phone.substring(user.countryCode.length);
              } else {
                // Phone doesn't include country code, use as is
                phoneWithoutCode = user.phone;
              }
              detectedCountry = countryFromCode;
            }
          }
          
          // Fallback 2: if still no phone parsed, assume it's without country code
          if (!phoneWithoutCode) {
            phoneWithoutCode = user.phone;
            // Use default country or keep current selected
            detectedCountry = getDefaultCountry();
          }
        }
        
        // Update form data
        setFormData({
          fullName: user.name || '',
          email: user.email || '',
          phoneNumber: phoneWithoutCode
        });
        
        // Update original data
        setOriginalData({
          fullName: user.name || '',
          email: user.email || '',
          phoneNumber: phoneWithoutCode
        });
        
        // Update verification status
        setVerificationStatus({
          email: !!user.emailVerified,
          phone: !!user.phoneVerified
        });
        
        // Set selected country
        setSelectedCountry(detectedCountry);
        
        console.log('✅ User data loaded from API:', {
          user: user,
          detectedCountry: detectedCountry,
          phoneWithoutCode: phoneWithoutCode
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Save full name
  const handleSaveFullName = async () => {
    if (!formData.fullName?.trim()) {
      alert('Please enter a valid full name');
      return;
    }

    setLoadingStates(prev => ({ ...prev, fullName: true }));
    try {
      // API call to save full name
      const response = await fetch('/api/user/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.fullName.trim()
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Update original data
        setOriginalData(prev => ({ ...prev, fullName: formData.fullName }));
        alert('Full name updated successfully!');
      } else {
        alert(result.error || 'Failed to update full name');
      }
    } catch (error) {
      console.error('Error saving full name:', error);
      alert('Failed to update full name. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, fullName: false }));
    }
  };

  // Verify email
  const handleVerifyEmail = async () => {
    if (!formData.email) {
      alert('Please enter an email address');
      return;
    }

    // Check if email is the same as current (no need to verify)
    if (formData.email === originalData.email && verificationStatus.email) {
      alert('This email is already verified for your account');
      return;
    }

    setLoadingStates(prev => ({ ...prev, email: true }));
    try {
      // Send OTP to email
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: formData.email, // API expects 'phoneNumber' for both email and phone
          type: 'email_verification'
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Show OTP verification modal
        setOtpState({
          show: true,
          type: 'email',
          contact: formData.email,
          isVerifying: false
        });
      } else {
        alert(result.message || 'Failed to send verification email');
      }
    } catch (error) {
      console.error('Error sending email verification:', error);
      alert('Failed to send verification email. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, email: false }));
    }
  };

  // Verify phone number
  const handleVerifyPhone = async () => {
    if (!formData.phoneNumber) {
      alert('Please enter a phone number');
      return;
    }

    const fullPhoneNumber = selectedCountry.dialCode + formData.phoneNumber;
    
    // Check if phone is the same as current (no need to verify)
    if (formData.phoneNumber === originalData.phoneNumber && verificationStatus.phone) {
      alert('This phone number is already verified for your account');
      return;
    }

    setLoadingStates(prev => ({ ...prev, phone: true }));
    
    try {
      // Send OTP to phone
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: fullPhoneNumber, // API expects 'phoneNumber' for both email and phone
          type: 'phone_verification',
          countryInfo: { dialCode: selectedCountry.dialCode } // Include country info for validation
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Show OTP verification modal
        setOtpState({
          show: true,
          type: 'phone',
          contact: fullPhoneNumber,
          isVerifying: false
        });
      } else {
        alert(result.message || 'Failed to send verification SMS');
      }
    } catch (error) {
      console.error('Error sending SMS verification:', error);
      alert('Failed to send verification SMS. Please try again.');
    } finally {
      setLoadingStates(prev => ({ ...prev, phone: false }));
    }
  };

  // Handle OTP verification
  const handleOtpVerification = async (otp: string) => {
    setOtpState(prev => ({ ...prev, isVerifying: true }));
    
    try {
      // Use the profile-specific OTP verification endpoint
      const response = await fetch('/api/user/verify-profile-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact: otpState.contact,
          otp,
          userId: session?.user?.id,
          ...(otpState.type === 'phone' && {
            countryCode: selectedCountry.dialCode
          })
        })
      });

      const result = await response.json();
      
      console.log('📤 OTP verification response:', {
        status: response.status,
        result: result
      });
      
      if (result.success) {
        // Update verification status and original data based on the updated user data
        if (otpState.type === 'email') {
          setVerificationStatus(prev => ({ ...prev, email: true }));
          setOriginalData(prev => ({ ...prev, email: formData.email }));
        } else if (otpState.type === 'phone') {
          setVerificationStatus(prev => ({ ...prev, phone: true }));
          setOriginalData(prev => ({ ...prev, phoneNumber: formData.phoneNumber }));
        }
        
        // Refresh user data to get the latest information
        await fetchUserData();
        
        alert(`${otpState.type === 'email' ? 'Email' : 'Phone number'} verified and updated successfully!`);
        
        // Close OTP modal
        setOtpState({ show: false, type: '', contact: '', isVerifying: false });
      } else {
        console.error('❌ OTP verification failed:', result);
        
        // Handle specific error cases
        if (response.status === 409) {
          // Duplicate email/phone error
          const contactType = otpState.type === 'email' ? 'email address' : 'phone number';
          alert(`This ${contactType} is already in use by another account. Please use a different ${contactType}.`);
        } else {
          // Generic error
          alert(result.message || 'Invalid OTP. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error verifying OTP:', error);
      alert('Verification failed. Please try again.');
    } finally {
      setOtpState(prev => ({ ...prev, isVerifying: false }));
    }
  };



  // Close OTP modal
  const handleOtpClose = () => {
    setOtpState({ show: false, type: '', contact: '', isVerifying: false });
  };



  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-100 sticky top-0 z-10">
        <div className="flex items-center justify-between px-4 py-4">
          <button
            onClick={() => router.back()}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">My Information</h1>
          <div className="w-9 h-9"></div> {/* Spacer for centering */}
        </div>
      </div>

      {/* Form Content */}
      <div className="px-4 py-6 space-y-6 max-w-md mx-auto">
        
        {/* Full Name Field */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <User className="w-4 h-4 text-gray-600" />
            <label className="text-xs font-medium text-gray-700">Full Name</label>
          </div>
          <div className="flex space-x-2">
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              placeholder="Enter your full name"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-gray-50 text-gray-900"
            />
            <button
              onClick={handleSaveFullName}
              disabled={loadingStates.fullName || formData.fullName === originalData.fullName}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                formData.fullName !== originalData.fullName
                  ? 'bg-orange-500 hover:bg-orange-600 text-white'
                  : 'bg-green-100 text-green-700 cursor-default'
              } ${loadingStates.fullName ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingStates.fullName ? 'Saving...' : formData.fullName !== originalData.fullName ? 'Save' : 'Saved'}
            </button>
          </div>
        </div>

        {/* Email Field */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <Mail className="w-4 h-4 text-gray-600" />
            <label className="text-xs font-medium text-gray-700">Email</label>
          </div>
          <div className="flex space-x-2">
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              placeholder="Enter your email address"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-gray-50 text-gray-900"
            />
            <button
              onClick={handleVerifyEmail}
              disabled={loadingStates.email || (verificationStatus.email && formData.email === originalData.email)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-all ${
                !verificationStatus.email || formData.email !== originalData.email
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-100 text-green-700 cursor-not-allowed'
              } ${loadingStates.email ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingStates.email ? 'Verifying...' : (verificationStatus.email && formData.email === originalData.email) ? 'Verified' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Phone Number Field */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center space-x-3 mb-2">
            <Phone className="w-4 h-4 text-gray-600" />
            <label className="text-xs font-medium text-gray-700">Phone Number</label>
          </div>
          <div className="flex space-x-2">
            {/* Country Code Dropdown */}
            <div className="relative" data-country-dropdown>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowCountryDropdown(!showCountryDropdown);
                }}
                className="flex items-center px-2 py-2 border border-gray-200 rounded-lg bg-gray-50 hover:bg-gray-100 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all duration-200"
              >
                <span className="mr-1 text-sm">{selectedCountry.flag}</span>
                <span className="text-xs font-medium text-gray-700">{selectedCountry.dialCode}</span>
                <ChevronDown className={`w-3 h-3 ml-1 text-gray-500 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {showCountryDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                  {/* Search Bar */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="text"
                        placeholder="Search countries..."
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  
                  {/* Country List */}
                  <div className="max-h-64 overflow-y-auto">
                    {filteredCountries().map((country) => (
                      <button
                        key={country.code}
                        type="button"
                        onClick={() => {
                          setSelectedCountry(country);
                          setShowCountryDropdown(false);
                          setCountrySearch('');
                        }}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 focus:bg-gray-50 focus:outline-none flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <span className="mr-3 text-lg">{country.flag}</span>
                          <span className="text-sm font-medium text-gray-900">{country.name}</span>
                        </div>
                        <span className="text-sm text-gray-500">{country.dialCode}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Phone Number Input */}
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
              placeholder="Enter your phone number"
              className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-colors bg-gray-50 text-gray-900"
            />

            {/* Verify Button */}
            <button
              onClick={handleVerifyPhone}
              disabled={loadingStates.phone || (verificationStatus.phone && formData.phoneNumber === originalData.phoneNumber)}
              className={`px-3 py-2 text-xs rounded-lg font-medium transition-all whitespace-nowrap ${
                !verificationStatus.phone || formData.phoneNumber !== originalData.phoneNumber
                  ? 'bg-blue-500 hover:bg-blue-600 text-white'
                  : 'bg-green-100 text-green-700 cursor-not-allowed'
              } ${loadingStates.phone ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {loadingStates.phone ? 'Verifying...' : (verificationStatus.phone && formData.phoneNumber === originalData.phoneNumber) ? 'Verified' : 'Verify'}
            </button>
          </div>
        </div>

        {/* Information Note */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
          <div className="flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-white text-xs font-bold">i</span>
            </div>
            <div>
              <h3 className="font-medium text-blue-900 mb-1">Information Security</h3>
              <p className="text-sm text-blue-700">
                Your personal information is encrypted and securely stored. We will never share your details with third parties without your consent.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* OTP Verification Modal */}
      <OtpModal
        isOpen={otpState.show}
        contact={otpState.contact}
        type={otpState.type as 'email' | 'phone'}
        onVerify={handleOtpVerification}
        onClose={handleOtpClose}
        isLoading={otpState.isVerifying}
      />
    </div>
  );
}
