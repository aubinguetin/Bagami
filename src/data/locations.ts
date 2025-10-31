// Re-export the interface from our location service for backward compatibility
export type { Country } from '../utils/locationService';
import { 
  generateCountriesList, 
  getCountriesList as getCountriesListFromService, 
  getCitiesByCountry as getCitiesByCountryFromService,
  searchCitiesByCountry as searchCitiesByCountryFromService,
  searchCitiesAndCountries as searchCitiesAndCountriesFromService,
  preloadLanguages,
  getCacheStats
} from '../utils/locationService';

// Pre-load commonly used languages for better performance
// This happens once at app startup
preloadLanguages(['en', 'fr', 'es', 'de']); // Add more languages as needed

// Generate countries list using cached data for optimal performance
// Default to English, language switching is now instant due to caching
export const countries = generateCountriesList('en');

// Backward compatible functions
export const getCountriesList = (locale: string = 'en'): { code: string; name: string }[] => {
  return getCountriesListFromService(locale);
};

export const getCitiesByCountry = (countryCode: string): string[] => {
  return getCitiesByCountryFromService(countryCode);
};

export const searchCitiesByCountry = (countryCode: string, query: string = '', limit: number = 100): string[] => {
  return searchCitiesByCountryFromService(countryCode, query, limit);
};

export const searchCitiesAndCountries = (query: string = '', limit: number = 100) => {
  return searchCitiesAndCountriesFromService(query, limit);
};