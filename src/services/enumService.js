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
      // Special handling for Industry and Stage which are separate entities, not simple Enums
      if (enumName === 'Industry') {
        const response = await apiClient.get('/api/industry-options', { params: { pageSize: 100 } });
        const items = Array.isArray(response?.data) ? response.data : (response?.data?.items || []);
        return items.map(item => ({
          label: item.value || item.name || 'Unknown Industry',
          value: item.id,
          isActive: item.isActive ?? true
        }));
      }

      if (enumName === 'DevelopmentStage' || enumName === 'Stage') {
        const response = await apiClient.get('/api/stage-options', { params: { pageSize: 100 } });
        const items = Array.isArray(response?.data) ? response.data : (response?.data?.items || []);
        return items.map(item => ({
          label: item.value || item.name || 'Unknown Stage',
          value: item.id,
          isActive: item.isActive ?? true
        }));
      }

      // Default logic for true Enums (like Status, Role, etc.)
      const response = await apiClient.get('/api/Enum/enums', {
        params: { enumName }
      });
      return response?.data || [];
    } catch (error) {
      console.error(`Error fetching enum ${enumName}:`, error);
      return [];
    }
  }
};

export default enumService;
