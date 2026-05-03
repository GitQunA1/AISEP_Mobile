import apiClient from './apiClient';

export const termsService = {
  /**
   * Fetch the currently active terms and conditions.
   * Caches the response to minimize redundant calls.
   */
  getActiveTerms: async () => {
    try {
      const response = await apiClient.get('/api/Terms/active');
      return response;
    } catch (error) {
      console.error('Error fetching terms and conditions:', error);
      throw error;
    }
  }
};

export default termsService;
