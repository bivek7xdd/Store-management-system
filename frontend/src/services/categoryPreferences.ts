import { CategoryPreferences } from '@/types/enhanced-signup';

/**
 * Service for managing category preferences in localStorage
 * This provides a centralized way to store and retrieve business category selections
 */

const CATEGORY_PREFERENCES_KEY = 'category-preferences';

export const categoryPreferencesService = {
  /**
   * Store category preferences in localStorage
   */
  store: (preferences: Omit<CategoryPreferences, 'configured_at'>): void => {
    const categoryPreferences: CategoryPreferences = {
      ...preferences,
      configured_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CATEGORY_PREFERENCES_KEY, JSON.stringify(categoryPreferences));
    } catch (error) {
      console.error('Failed to store category preferences:', error);
      throw new Error('Failed to save category preferences');
    }
  },

  /**
   * Retrieve category preferences from localStorage
   */
  retrieve: (): CategoryPreferences | null => {
    try {
      const stored = localStorage.getItem(CATEGORY_PREFERENCES_KEY);
      if (!stored) {
        return null;
      }

      const preferences = JSON.parse(stored) as CategoryPreferences;
      
      // Validate the structure
      if (!preferences.business_category || !Array.isArray(preferences.product_subcategories)) {
        console.warn('Invalid category preferences structure, removing from storage');
        categoryPreferencesService.clear();
        return null;
      }

      return preferences;
    } catch (error) {
      console.error('Failed to retrieve category preferences:', error);
      // Clear corrupted data
      categoryPreferencesService.clear();
      return null;
    }
  },

  /**
   * Check if category preferences exist
   */
  exists: (): boolean => {
    return categoryPreferencesService.retrieve() !== null;
  },

  /**
   * Clear category preferences from localStorage
   */
  clear: (): void => {
    try {
      localStorage.removeItem(CATEGORY_PREFERENCES_KEY);
    } catch (error) {
      console.error('Failed to clear category preferences:', error);
    }
  },

  /**
   * Update existing category preferences
   */
  update: (updates: Partial<Omit<CategoryPreferences, 'configured_at'>>): void => {
    const existing = categoryPreferencesService.retrieve();
    if (!existing) {
      throw new Error('No existing category preferences to update');
    }

    const updated: CategoryPreferences = {
      ...existing,
      ...updates,
      configured_at: new Date().toISOString(),
    };

    try {
      localStorage.setItem(CATEGORY_PREFERENCES_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to update category preferences:', error);
      throw new Error('Failed to update category preferences');
    }
  },

  /**
   * Get category preferences with fallback values
   */
  getWithDefaults: (): CategoryPreferences => {
    const preferences = categoryPreferencesService.retrieve();
    
    if (preferences) {
      return preferences;
    }

    // Return default empty preferences
    return {
      business_category: '',
      product_subcategories: [],
      configured_at: new Date().toISOString(),
    };
  },
};

export default categoryPreferencesService;