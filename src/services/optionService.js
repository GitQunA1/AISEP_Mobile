import apiClient from './apiClient';

/**
 * Option Service
 * Fetches and manages industry and stage options for mobile.
 */
export const optionService = {
  /**
   * Get all industry options
   * @returns {Promise<Array>}
   */
  getIndustries: async () => {
    try {
      const response = await apiClient.get('/api/industry-options');
      const data = response?.data || response;
      const items = Array.isArray(data) ? data : (data.items || data.results || data.data || []);
      return items.map(item => ({
        label: item.value || 'Unknown Industry',
        value: item.id,
        isActive: item.isActive ?? true
      }));
    } catch (error) {
      console.error('Error fetching industries:', error);
      return [];
    }
  },

  /**
   * Get all development stage options
   * @returns {Promise<Array>}
   */
  getStages: async () => {
    try {
      const response = await apiClient.get('/api/stage-options');
      const data = response?.data || response;
      const items = Array.isArray(data) ? data : (data.items || data.results || data.data || []);
      return items.map(item => ({
        label: item.value || 'Unknown Stage',
        value: item.id,
        isActive: item.isActive ?? true
      }));
    } catch (error) {
      console.error('Error fetching stages:', error);
      return [];
    }
  }
};

export default optionService;
