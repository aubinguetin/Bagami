import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  X,
  Bell,
  MapPin
} from 'lucide-react';
import { getCountriesList, getCitiesByCountry, searchCitiesByCountry } from '@/data/locations';

// SearchableSelect component with optimization
function SearchableSelect({ 
  value, 
  onChange, 
  options, 
  placeholder, 
  label,
  className = ""
}: {
  value: string;
  onChange: (value: string) => void;
  options: { code: string; name: string }[];
  placeholder: string;
  label: string;
  className?: string;
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
  
  // Optimized callbacks
  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

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
          className={`w-full px-3 py-2 text-left border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent bg-white ${className}`}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </button>
        
        {isOpen && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder={`Search ${label.toLowerCase()}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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

// Optimized city searchable select component for better performance with large datasets
function CitySearchableSelect({
  label,
  value,
  onChange,
  placeholder = "Select an option",
  countryCode,
  required = false,
  disabled = false,
  className = ''
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  countryCode: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedTerm, setDebouncedTerm] = useState('');
  
  // Ultra-fast debounce for Trie-based instant search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedTerm(searchTerm);
    }, 50); // Trie search is so fast we can use minimal debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // High-performance Trie-based city search
  const cities = useMemo(() => {
    if (!countryCode) return [];
    
    // Trie-based search provides instant autocomplete experience
    const cityNames = searchCitiesByCountry(countryCode, debouncedTerm, 40);
    return cityNames.map(city => ({ code: city, name: city }));
  }, [countryCode, debouncedTerm]);
  
  const selectedOption = cities.find(option => option.code === value) || 
    (value ? { code: value, name: value } : null);
  
  // Optimized callbacks
  const handleClear = useCallback(() => {
    onChange('');
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

  const handleSelect = useCallback((optionCode: string) => {
    onChange(optionCode);
    setIsOpen(false);
    setSearchTerm('');
    setDebouncedTerm('');
  }, [onChange]);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  }, []);
  
  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          className={`w-full px-3 py-2 text-left border border-gray-200 rounded-lg bg-white transition-colors ${
            disabled 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'focus:ring-2 focus:ring-orange-500 focus:border-transparent hover:border-gray-300'
          } ${className}`}
        >
          {selectedOption ? selectedOption.name : placeholder}
        </button>
        
        {isOpen && !disabled && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-hidden">
            <div className="p-2">
              <input
                type="text"
                placeholder={`Start typing city name...`}
                value={searchTerm}
                onChange={handleSearchChange}
                className="w-full px-3 py-2 border border-gray-200 rounded focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                autoFocus
                autoComplete="off"
              />
              {debouncedTerm.length === 0 && (
                <div className="text-xs text-gray-600 mt-1 px-2">Instant search as you type</div>
              )}
              {cities.length > 0 && debouncedTerm.length > 0 && (
                <div className="text-xs text-gray-500 mt-1 px-2">{cities.length} cities found</div>
              )}
            </div>
            <div className="max-h-40 overflow-y-auto">
              <button
                onClick={handleClear}
                className="w-full px-3 py-2 text-left hover:bg-gray-50 text-gray-500 italic"
              >
                {placeholder}
              </button>
              {cities.length === 0 && debouncedTerm.length >= 1 && (
                <div className="px-3 py-2 text-gray-500 italic">
                  No cities found for "{debouncedTerm}"
                  <div className="text-xs text-gray-400 mt-1">Try a different spelling or shorter term</div>
                </div>
              )}
              {cities.map((option) => (
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

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilters: {
    searchQuery: string;
    departureCountry: string;
    destinationCountry: string;
    activeFilter: string;
  };
}

export function AlertModal({ isOpen, onClose, currentFilters }: AlertModalProps) {
  const [alertData, setAlertData] = useState({
    name: '',
    departureCountry: currentFilters.departureCountry,
    destinationCountry: currentFilters.destinationCountry,
    alertType: currentFilters.activeFilter,
    emailNotifications: true,
    keywords: currentFilters.searchQuery
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const countries = getCountriesList();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alertData),
      });

      const result = await response.json();

      if (response.ok) {
        alert('Alert created successfully! You\'ll be notified when matching deliveries are found.');
        onClose();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error('Network error:', error);
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string | boolean) => {
    setAlertData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[95vh] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="w-6 h-6" />
              <div>
                <h2 className="text-xl font-bold">Create Alert</h2>
                <p className="text-white/80 text-sm">Get notified of matching deliveries</p>
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

        {/* Form Content */}
        <div className="overflow-y-auto max-h-[calc(95vh-120px)]">
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div className="bg-blue-50/50 rounded-2xl p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Alert Name
              </label>
              <input
                type="text"
                value={alertData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                placeholder="e.g., Paris to Ouagadougou documents"
                required
              />
            </div>

            <div className="bg-purple-50/50 rounded-2xl p-4 space-y-3">
              <div className="flex items-center space-x-2 mb-2">
                <MapPin className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-gray-700">Route</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <SearchableSelect
                  value={alertData.departureCountry}
                  onChange={(value) => handleInputChange('departureCountry', value)}
                  options={countries}
                  placeholder="Any country"
                  label="From"
                  className="focus:ring-blue-500"
                />
                
                <SearchableSelect
                  value={alertData.destinationCountry}
                  onChange={(value) => handleInputChange('destinationCountry', value)}
                  options={countries}
                  placeholder="Any country"
                  label="To"
                  className="focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="bg-green-50/50 rounded-2xl p-4 space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Alert Type
                </label>
                <select
                  value={alertData.alertType}
                  onChange={(e) => handleInputChange('alertType', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  required
                >
                  <option value="all">All deliveries</option>
                  <option value="requests">Delivery requests only</option>
                  <option value="offers">Travel offers only</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Keywords (Optional)
                </label>
                <input
                  type="text"
                  value={alertData.keywords}
                  onChange={(e) => handleInputChange('keywords', e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent"
                  placeholder="documents, electronics, gifts..."
                />
              </div>
            </div>

            <div className="bg-gray-50/50 rounded-2xl p-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="emailNotifications"
                  checked={alertData.emailNotifications}
                  onChange={(e) => handleInputChange('emailNotifications', e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="emailNotifications" className="ml-2 text-sm text-gray-700">
                  Send email notifications when matches are found
                </label>
              </div>
            </div>

            <div className="bg-blue-50/50 rounded-2xl p-4">
              <div className="flex items-start space-x-2">
                <Bell className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-blue-800 mb-1">How alerts work:</p>
                  <p className="text-blue-700 text-xs leading-relaxed">
                    Get notified when new deliveries match your criteria. 
                    Manage alerts from your profile settings.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 bg-blue-500 text-white rounded-xl font-medium transition-all hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed shadow-sm hover:shadow-md shadow-blue-200"
              >
                {isSubmitting ? '⏳ Creating...' : '🔔 Create Alert'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}