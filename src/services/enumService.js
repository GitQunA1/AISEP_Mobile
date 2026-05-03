import apiClient from './apiClient';

/**
 * Enum Service for Mobile
 * Fetches common enums from the backend for use in filters and forms.
 */
export const enumService = {
  /**
   * Get options for a specific enum type
   * @param {string} enumName - The name of the enum (e.g., 'Industry', 'DevelopmentStage')
   * @returns {Promise<Array>} Array of { label, value } objects
   */
  getEnumOptions: async (enumName) => {
    try {
      const response = await apiClient.get('/api/Enum/enums', {
        params: { enumName }
      });
      // The backend returns the list of enum options in the data field
      return response?.data || [];
    } catch (error) {
      console.error(`Error fetching enum ${enumName}:`, error);
      return []; // Return empty array on error to prevent app crashes
    }
  }
};

export default enumService;
