import { Country as CountryStateCity, City } from 'country-state-city';
import countries from 'i18n-iso-countries';

// Initialize the i18n-iso-countries with English locale
countries.registerLocale(require('i18n-iso-countries/langs/en.json'));

export interface Country {
  code: string;
  name: string;
  cities: string[];
}

// Cache implementation for performance optimization
class LocationCache {
  private countriesCache = new Map<string, Country[]>();
  private citiesCache = new Map<string, string[]>();
  private countriesListCache = new Map<string, { code: string; name: string }[]>();
  private registeredLocales = new Set<string>(['en']);
  
  constructor() {
    // Pre-generate English data on initialization
    this.preGenerateForLocale('en');
  }

  private preGenerateForLocale(locale: string): void {
    if (this.countriesCache.has(locale)) return;
    
    // Ensure locale is registered
    this.registerLocale(locale);
    
    // Get all countries from country-state-city
    const allCountries = CountryStateCity.getAllCountries();
    
    // Generate countries data with caching
    const countriesData = allCountries
      .map(country => {
        // Get translated country name
        const translatedName = countries.getName(country.isoCode, locale) || country.name;
        
        // Get and cache cities for this country
        let cityNames: string[] = [];
        if (!this.citiesCache.has(country.isoCode)) {
          const citiesData = City.getCitiesOfCountry(country.isoCode) || [];
          cityNames = citiesData.map(city => city.name).sort();
          this.citiesCache.set(country.isoCode, cityNames);
        } else {
          cityNames = this.citiesCache.get(country.isoCode)!;
        }
        
        return {
          code: country.isoCode,
          name: translatedName,
          cities: cityNames
        };
      })
      .filter(country => country.cities.length > 0)
      .sort((a, b) => a.name.localeCompare(b.name, locale));
    
    // Cache the results
    this.countriesCache.set(locale, countriesData);
    this.countriesListCache.set(locale, 
      countriesData.map(country => ({ code: country.code, name: country.name }))
    );
  }

  private registerLocale(locale: string): void {
    if (this.registeredLocales.has(locale)) return;
    
    try {
      const localeData = require(`i18n-iso-countries/langs/${locale}.json`);
      countries.registerLocale(localeData);
      this.registeredLocales.add(locale);
    } catch (error) {
      console.warn(`Locale ${locale} not found, falling back to English`);
    }
  }

  getCountries(locale: string = 'en'): Country[] {
    if (!this.countriesCache.has(locale)) {
      this.preGenerateForLocale(locale);
    }
    return this.countriesCache.get(locale)!;
  }

  getCountriesList(locale: string = 'en'): { code: string; name: string }[] {
    if (!this.countriesListCache.has(locale)) {
      this.preGenerateForLocale(locale);
    }
    return this.countriesListCache.get(locale)!;
  }

  getCities(countryCode: string): string[] {
    return this.citiesCache.get(countryCode) || [];
  }

  // Method to pre-cache multiple languages for better performance
  preloadLanguages(locales: string[]): void {
    locales.forEach(locale => this.preGenerateForLocale(locale));
  }

  // Get cache statistics for debugging
  getCacheStats(): { languages: number; countries: number; cities: number } {
    const firstCountryList = this.countriesCache.values().next().value;
    return {
      languages: this.countriesCache.size,
      countries: firstCountryList ? firstCountryList.length : 0,
      cities: this.citiesCache.size
    };
  }
}

// Create singleton cache instance
const locationCache = new LocationCache();

/**
 * Generate countries list with multilingual support using cached data
 * @param locale Language code (default: 'en')
 * @returns Array of countries with cities (cached for performance)
 */
export function generateCountriesList(locale: string = 'en'): Country[] {
  return locationCache.getCountries(locale);
}

/**
 * Get list of countries (optimized with caching)
 */
export function getCountriesList(locale: string = 'en'): { code: string; name: string }[] {
  return locationCache.getCountriesList(locale);
}

/**
 * Get cities for a specific country (optimized with caching)
 */
export function getCitiesByCountry(countryCode: string): string[] {
  return locationCache.getCities(countryCode);
}

/**
 * Trie Node for efficient prefix searching
 */
class TrieNode {
  children: Map<string, TrieNode> = new Map();
  cities: string[] = []; // Cities that end at this node or have this prefix
  isEndOfWord: boolean = false;
}

/**
 * High-performance Trie data structure for city search
 */
class CityTrie {
  private root: TrieNode = new TrieNode();

  /**
   * Insert a city into the trie
   */
  insert(city: string): void {
    const cityLower = city.toLowerCase();
    let current = this.root;

    for (const char of cityLower) {
      if (!current.children.has(char)) {
        current.children.set(char, new TrieNode());
      }
      current = current.children.get(char)!;
      // Add city to each node along the path for prefix matching
      if (!current.cities.includes(city)) {
        current.cities.push(city);
      }
    }
    
    current.isEndOfWord = true;
  }

  /**
   * Search for cities with given prefix
   */
  searchPrefix(prefix: string, limit: number = 50): string[] {
    if (!prefix) return [];
    
    const prefixLower = prefix.toLowerCase();
    let current = this.root;

    // Navigate to the prefix node
    for (const char of prefixLower) {
      if (!current.children.has(char)) {
        return []; // Prefix not found
      }
      current = current.children.get(char)!;
    }

    // Return cities at this prefix node, sorted and limited
    return current.cities
      .sort((a, b) => {
        const aLower = a.toLowerCase();
        const bLower = b.toLowerCase();
        
        // Prioritize exact prefix matches
        const aStartsWithPrefix = aLower.startsWith(prefixLower);
        const bStartsWithPrefix = bLower.startsWith(prefixLower);
        
        if (aStartsWithPrefix && !bStartsWithPrefix) return -1;
        if (!aStartsWithPrefix && bStartsWithPrefix) return 1;
        
        // Then sort alphabetically
        return a.localeCompare(b);
      })
      .slice(0, limit);
  }
}

/**
 * Cache for country-specific tries
 */
class TrieCache {
  private tries: Map<string, CityTrie> = new Map();

  /**
   * Get or create trie for a country
   */
  getTrieForCountry(countryCode: string): CityTrie {
    if (!this.tries.has(countryCode)) {
      const trie = new CityTrie();
      const cities = locationCache.getCities(countryCode);
      
      // Build trie from all cities
      cities.forEach(city => trie.insert(city));
      
      this.tries.set(countryCode, trie);
    }
    
    return this.tries.get(countryCode)!;
  }

  /**
   * Clear cache for a specific country
   */
  clearCountry(countryCode: string): void {
    this.tries.delete(countryCode);
  }

  /**
   * Clear entire cache
   */
  clearAll(): void {
    this.tries.clear();
  }
}

// Global trie cache instance
const trieCache = new TrieCache();

/**
 * High-performance Trie-based city search with fallback
 * Provides instant autocomplete experience like Google/Amazon
 */
export function searchCitiesByCountry(countryCode: string, query: string = '', limit: number = 100): string[] {
  if (!countryCode || !query || query.length < 1) return [];
  
  const searchTerm = query.toLowerCase().trim();
  const trie = trieCache.getTrieForCountry(countryCode);
  
  // Phase 1: Fast trie-based prefix search (primary results)
  const prefixResults = trie.searchPrefix(searchTerm, Math.min(limit, 30));
  
  // Phase 2: Fallback contains search for broader matching (if needed)
  let containsResults: string[] = [];
  if (prefixResults.length < 10 && searchTerm.length >= 2) {
    const allCities = locationCache.getCities(countryCode);
    containsResults = allCities
      .filter(city => {
        const cityLower = city.toLowerCase();
        return cityLower.includes(searchTerm) && 
               !prefixResults.some(result => result.toLowerCase() === cityLower);
      })
      .sort()
      .slice(0, limit - prefixResults.length);
  }
  
  // Combine results: prefix matches first, then contains matches
  return [...prefixResults, ...containsResults].slice(0, limit);
}

/**
 * Enhanced search that supports both cities and countries using country-state-city package
 * When user types a country name, returns ALL cities from that country
 * When user types a city name, returns matching cities globally
 */
export function searchCitiesAndCountries(query: string = '', limit: number = 100): { 
  cities: string[], 
  countries: string[], 
  cityCountryPairs: { city: string, country: string, countryCode: string }[] 
} {
  if (!query || query.length < 2) {
    return { cities: [], countries: [], cityCountryPairs: [] };
  }

  const searchTerm = query.toLowerCase().trim();
  let cityCountryPairs: { city: string, country: string, countryCode: string }[] = [];
  
  // Get all countries using country-state-city package
  const allCountries = CountryStateCity.getAllCountries();
  
  // Find matching countries
  const matchingCountries = allCountries.filter(country => 
    country.name.toLowerCase().includes(searchTerm)
  );

  // If we find matching countries, get ALL cities from those countries
  for (const country of matchingCountries) {
    // Use country-state-city package to get all cities for this country
    const citiesInCountry = City.getCitiesOfCountry(country.isoCode);
    
    if (citiesInCountry) {
      citiesInCountry.forEach(city => {
        cityCountryPairs.push({
          city: city.name,
          country: country.name,
          countryCode: country.isoCode
        });
      });
    }
  }

  // Also search for direct city matches across all countries
  const allCities = City.getAllCities();
  const directCityMatches = allCities
    .filter(city => city.name.toLowerCase().includes(searchTerm))
    .slice(0, 50) // Limit direct city matches to avoid too many results
    .map(city => {
      const country = allCountries.find(c => c.isoCode === city.countryCode);
      return {
        city: city.name,
        country: country ? country.name : city.countryCode,
        countryCode: city.countryCode
      };
    });

  // When country matches are found, prioritize major cities
  if (matchingCountries.length > 0 && cityCountryPairs.length > 100) {
    console.log('🏙️ Large country detected, prioritizing major cities...');
    
    // Define major cities to prioritize (these are more likely to have deliveries)
    const majorCityNames = [
      'Paris', 'Lyon', 'Marseille', 'Toulouse', 'Nice', 'Nantes', 'Strasbourg', 'Montpellier', 'Bordeaux', 'Lille',
      'London', 'Manchester', 'Birmingham', 'Leeds', 'Glasgow', 'Liverpool', 'Bristol', 'Sheffield', 'Edinburgh',
      'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas',
      'Berlin', 'Munich', 'Hamburg', 'Cologne', 'Frankfurt', 'Stuttgart', 'Dresden', 'Leipzig',
      'Madrid', 'Barcelona', 'Valencia', 'Seville', 'Zaragoza', 'Malaga', 'Murcia', 'Palma',
      'Rome', 'Milan', 'Naples', 'Turin', 'Palermo', 'Genoa', 'Bologna', 'Florence', 'Venice',
      'Moscow', 'Saint Petersburg', 'Novosibirsk', 'Yekaterinburg', 'Nizhny Novgorod', 'Kazan',
      'Tokyo', 'Yokohama', 'Osaka', 'Nagoya', 'Sapporo', 'Kobe', 'Kyoto', 'Fukuoka',
      'Beijing', 'Shanghai', 'Guangzhou', 'Shenzhen', 'Tianjin', 'Wuhan', 'Dongguan', 'Chengdu',
      'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune', 'Ahmedabad',
      'São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte',
      'Toronto', 'Montreal', 'Vancouver', 'Calgary', 'Edmonton', 'Ottawa', 'Winnipeg',
      'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Canberra',
      'Ouagadougou', 'Bobo-Dioulasso'
    ];
    
    // Split cities into major and other
    const majorCities: { city: string, country: string, countryCode: string }[] = [];
    const otherCities: { city: string, country: string, countryCode: string }[] = [];
    
    cityCountryPairs.forEach(pair => {
      if (majorCityNames.includes(pair.city)) {
        majorCities.push(pair);
      } else {
        otherCities.push(pair);
      }
    });
    
    // Prioritize major cities + first 100 other cities
    cityCountryPairs = [...majorCities, ...otherCities.slice(0, 100)];
    console.log(`🏙️ Prioritized ${majorCities.length} major cities + ${Math.min(100, otherCities.length)} others`);
  }

  // Combine results, prioritizing country matches
  const allCityCountryPairs = [...cityCountryPairs, ...directCityMatches];
  
  // Remove duplicates based on city name and country
  const uniquePairs = allCityCountryPairs.filter((pair, index, self) => 
    index === self.findIndex(p => p.city === pair.city && p.countryCode === pair.countryCode)
  );

  return {
    cities: uniquePairs.map(pair => pair.city),
    countries: matchingCountries.map(country => country.name),
    cityCountryPairs: uniquePairs.slice(0, limit)
  };
}

/**
 * Preload multiple languages for better performance
 * Call this at app initialization to cache commonly used languages
 */
export function preloadLanguages(locales: string[]): void {
  locationCache.preloadLanguages(locales);
}

/**
 * Get cache statistics for performance monitoring
 */
export function getCacheStats(): { languages: number; countries: number; cities: number } {
  return locationCache.getCacheStats();
}

/**
 * Get available locales supported by i18n-iso-countries
 */
export function getSupportedLocales(): string[] {
  return [
    'en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'zh', 'ja', 'ko',
    'ar', 'hi', 'th', 'vi', 'tr', 'pl', 'nl', 'sv', 'da', 'no',
    'fi', 'el', 'he', 'cs', 'sk', 'hu', 'ro', 'bg', 'hr', 'sr',
    'sl', 'lt', 'lv', 'et', 'mt', 'is', 'ga', 'cy', 'eu', 'ca'
  ];
}

// Export cache instance for advanced usage
export { locationCache };