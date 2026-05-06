import apiClient from './apiClient';

/**
 * Investor Service
 * Interacts with /api/Investor endpoints
 */
const investorService = {
  /**
   * Fetch all investors (optionally with Sieve filters)
   * @param {Object} queryParams - e.g., { page, pageSize, filters }
   * @returns {Promise<Object>} Object containing data.items and pagination info
   */
  getAllInvestors: async (queryParams = {}) => {
    try {
      const response = await apiClient.get('/api/Investor', { params: queryParams });
      return response?.data ?? response;
    } catch (error) {
       if (error?.statusCode === 404 || error?.response?.status === 404) {
          return { items: [], totalCount: 0 };
       }
       console.error('Error fetching all investors:', error);
       throw error;
    }
  },

  /**
   * Fetch matching investors for the current startup
   * @returns {Promise<Object>} Object containing data.items
   */
  getMatchingInvestors: async () => {
    try {
      const response = await apiClient.get('/api/Investor/matching/startup');
      return response?.data ?? response;
    } catch (error) {
      if (error?.statusCode === 404 || error?.response?.status === 404) {
        return { items: [], totalCount: 0 };
      }
      console.error('Error fetching matching investors:', error);
      throw error;
    }
  },

  /**
   * Fetch investor details by ID
   * @param {number|string} investorId 
   * @returns {Promise<Object>} Investor details
   */
  getInvestorById: async (investorId) => {
    try {
      const response = await apiClient.get(`/api/Investor/${investorId}`);
      return response?.data ?? response;
    } catch (error) {
      if (error?.statusCode === 404 || error?.response?.status === 404) {
         return null;
      }
      console.error(`Error fetching investor ${investorId}:`, error);
      throw error;
    }
  },
  getMyProfile: async () => {
    try {
      const response = await apiClient.get('/api/Investor/me');
      return response?.data ?? response;
    } catch (error) {
      if (error.statusCode === 404 || error?.response?.status === 404) return null;
      console.error('Error fetching investor profile:', error);
      throw error;
    }
  }
};

export default investorService;
