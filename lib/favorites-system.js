// Favorites System - Interline Asia
// User-specific saved cruises and preferences management

import { createClient } from '@supabase/supabase-js';

class FavoritesManager {
  constructor() {
    this.supabase = null;
    this.currentUser = null;
    this.favorites = [];
    this.savedSearches = [];
    
    this.initializeClient();
  }

  initializeClient() {
    try {
      if (typeof window !== 'undefined') {
        // Use existing supabaseClient if available
        if (window.supabaseClient) {
          this.supabase = window.supabaseClient.supabase;
          this.currentUser = window.supabaseClient.currentUser;
        } else {
          // Fallback initialization
          const supabaseUrl = window.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
          const supabaseKey = window.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
          
          if (supabaseUrl && supabaseKey) {
            this.supabase = createClient(supabaseUrl, supabaseKey);
          }
        }
      }
    } catch (error) {
      console.warn('Favorites: Supabase client initialization failed:', error.message);
    }
  }

  // Set current user (called when user logs in)
  setUser(user) {
    this.currentUser = user;
    if (user) {
      this.loadUserFavorites();
      this.loadSavedSearches();
    } else {
      this.favorites = [];
      this.savedSearches = [];
    }
  }

  // Add cruise to favorites
  async addFavorite(cruiseData) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be logged in to save favorites');
      }

      // Check if already favorited
      const existingFavorite = this.favorites.find(fav => fav.cruise_id === cruiseData.id);
      if (existingFavorite) {
        return { success: true, message: 'Already in favorites' };
      }

      const favoriteData = {
        user_id: this.currentUser.id,
        cruise_id: cruiseData.id,
        cruise_data: {
          cruiseLine: cruiseData.cruiseLine,
          shipName: cruiseData.shipName,
          region: cruiseData.region,
          departureDate: cruiseData.departureDate,
          nights: cruiseData.nights,
          price: cruiseData.price,
          cruiseType: cruiseData.cruiseType
        },
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('user_favorites')
        .insert([favoriteData])
        .select()
        .single();

      if (error) throw error;

      // Add to local cache
      this.favorites.push(data);

      // Track analytics
      if (window.analytics) {
        window.analytics.track('cruise_favorited', {
          cruiseId: cruiseData.id,
          cruiseLine: cruiseData.cruiseLine,
          shipName: cruiseData.shipName
        });
      }

      return { success: true, data, message: 'Added to favorites' };

    } catch (error) {
      console.error('Failed to add favorite:', error);
      return { success: false, error: error.message };
    }
  }

  // Remove cruise from favorites
  async removeFavorite(cruiseId) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be logged in');
      }

      const { error } = await this.supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', this.currentUser.id)
        .eq('cruise_id', cruiseId);

      if (error) throw error;

      // Remove from local cache
      this.favorites = this.favorites.filter(fav => fav.cruise_id !== cruiseId);

      // Track analytics
      if (window.analytics) {
        window.analytics.track('cruise_unfavorited', {
          cruiseId: cruiseId
        });
      }

      return { success: true, message: 'Removed from favorites' };

    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if cruise is favorited
  isFavorited(cruiseId) {
    return this.favorites.some(fav => fav.cruise_id === cruiseId);
  }

  // Get all user favorites
  async loadUserFavorites() {
    try {
      if (!this.currentUser) return [];

      const { data, error } = await this.supabase
        .from('user_favorites')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.favorites = data || [];
      return this.favorites;

    } catch (error) {
      console.error('Failed to load favorites:', error);
      return [];
    }
  }

  // Get favorites with enhanced data
  async getFavoritesWithDetails() {
    try {
      const favorites = await this.loadUserFavorites();
      
      // Enhance with current pricing if available
      const enhancedFavorites = favorites.map(favorite => ({
        ...favorite,
        isStillAvailable: this.checkCruiseAvailability(favorite.cruise_id),
        daysUntilDeparture: this.calculateDaysUntilDeparture(favorite.cruise_data?.departureDate)
      }));

      return enhancedFavorites;

    } catch (error) {
      console.error('Failed to get enhanced favorites:', error);
      return this.favorites;
    }
  }

  // Save search filters
  async saveSearch(searchName, filters) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be logged in to save searches');
      }

      const searchData = {
        user_id: this.currentUser.id,
        search_name: searchName,
        filters: filters,
        created_at: new Date().toISOString()
      };

      const { data, error } = await this.supabase
        .from('saved_searches')
        .insert([searchData])
        .select()
        .single();

      if (error) throw error;

      // Add to local cache
      this.savedSearches.push(data);

      // Track analytics
      if (window.analytics) {
        window.analytics.track('search_saved', {
          searchName: searchName,
          filterCount: Object.keys(filters).length
        });
      }

      return { success: true, data, message: 'Search saved' };

    } catch (error) {
      console.error('Failed to save search:', error);
      return { success: false, error: error.message };
    }
  }

  // Load saved searches
  async loadSavedSearches() {
    try {
      if (!this.currentUser) return [];

      const { data, error } = await this.supabase
        .from('saved_searches')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      this.savedSearches = data || [];
      return this.savedSearches;

    } catch (error) {
      console.error('Failed to load saved searches:', error);
      return [];
    }
  }

  // Apply saved search
  applySavedSearch(searchId) {
    const savedSearch = this.savedSearches.find(search => search.id === searchId);
    if (!savedSearch) return false;

    // Apply filters to the current page
    const filters = savedSearch.filters;
    
    Object.entries(filters).forEach(([key, value]) => {
      const element = document.getElementById(key);
      if (element) {
        element.value = value;
        // Trigger change event
        element.dispatchEvent(new Event('change'));
      }
    });

    // Track analytics
    if (window.analytics) {
      window.analytics.track('saved_search_applied', {
        searchName: savedSearch.search_name,
        searchId: searchId
      });
    }

    return true;
  }

  // Delete saved search
  async deleteSavedSearch(searchId) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be logged in');
      }

      const { error } = await this.supabase
        .from('saved_searches')
        .delete()
        .eq('id', searchId)
        .eq('user_id', this.currentUser.id);

      if (error) throw error;

      // Remove from local cache
      this.savedSearches = this.savedSearches.filter(search => search.id !== searchId);

      return { success: true, message: 'Search deleted' };

    } catch (error) {
      console.error('Failed to delete saved search:', error);
      return { success: false, error: error.message };
    }
  }

  // Get user preferences
  async getUserPreferences() {
    try {
      if (!this.currentUser) return {};

      const { data, error } = await this.supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', this.currentUser.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // Ignore not found

      return data?.preferences || {};

    } catch (error) {
      console.error('Failed to load user preferences:', error);
      return {};
    }
  }

  // Save user preferences
  async saveUserPreferences(preferences) {
    try {
      if (!this.currentUser) {
        throw new Error('User must be logged in');
      }

      const { data, error } = await this.supabase
        .from('user_preferences')
        .upsert({
          user_id: this.currentUser.id,
          preferences: preferences,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return { success: true, data };

    } catch (error) {
      console.error('Failed to save user preferences:', error);
      return { success: false, error: error.message };
    }
  }

  // Helper methods
  checkCruiseAvailability(cruiseId) {
    // This would check against current deals data
    // For now, return true (would need integration with deals system)
    return true;
  }

  calculateDaysUntilDeparture(departureDate) {
    if (!departureDate) return null;
    
    const departure = new Date(departureDate);
    const now = new Date();
    const diffTime = departure - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : null;
  }

  // Get favorites summary for dashboard
  getFavoritesSummary() {
    const summary = {
      total: this.favorites.length,
      recentlyAdded: this.favorites.slice(0, 5),
      cruiseTypes: {},
      regions: {},
      avgPrice: 0
    };

    this.favorites.forEach(favorite => {
      const cruiseData = favorite.cruise_data;
      
      // Count by cruise type
      const type = cruiseData?.cruiseType || 'Unknown';
      summary.cruiseTypes[type] = (summary.cruiseTypes[type] || 0) + 1;
      
      // Count by region
      const region = cruiseData?.region || 'Unknown';
      summary.regions[region] = (summary.regions[region] || 0) + 1;
    });

    // Calculate average price
    const prices = this.favorites
      .map(fav => fav.cruise_data?.price)
      .filter(price => price && price > 0);
    
    if (prices.length > 0) {
      summary.avgPrice = Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length);
    }

    return summary;
  }

  // Export favorites data
  exportFavorites() {
    const exportData = {
      favorites: this.favorites,
      savedSearches: this.savedSearches,
      summary: this.getFavoritesSummary(),
      exportedAt: new Date().toISOString(),
      userId: this.currentUser?.id
    };

    return exportData;
  }
}

// Create singleton instance
const favoritesManager = new FavoritesManager();

// Export main functions
export const addFavorite = (cruiseData) => favoritesManager.addFavorite(cruiseData);
export const removeFavorite = (cruiseId) => favoritesManager.removeFavorite(cruiseId);
export const isFavorited = (cruiseId) => favoritesManager.isFavorited(cruiseId);
export const getFavorites = () => favoritesManager.loadUserFavorites();
export const getFavoritesWithDetails = () => favoritesManager.getFavoritesWithDetails();
export const saveSearch = (name, filters) => favoritesManager.saveSearch(name, filters);
export const getSavedSearches = () => favoritesManager.loadSavedSearches();
export const applySavedSearch = (searchId) => favoritesManager.applySavedSearch(searchId);
export const deleteSavedSearch = (searchId) => favoritesManager.deleteSavedSearch(searchId);
export const getUserPreferences = () => favoritesManager.getUserPreferences();
export const saveUserPreferences = (prefs) => favoritesManager.saveUserPreferences(prefs);
export const getFavoritesSummary = () => favoritesManager.getFavoritesSummary();
export const setUser = (user) => favoritesManager.setUser(user);

// Make available globally
if (typeof window !== 'undefined') {
  window.favoritesManager = favoritesManager;
}

export default favoritesManager;