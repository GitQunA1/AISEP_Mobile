import apiClient from './apiClient';

const advisorService = {
  getAllAdvisors: async (queryParams = {}) => {
    try {
      return await apiClient.get('/api/Advisor', { params: queryParams });
    } catch (error) {
      console.error('Error fetching all advisors:', error);
      throw error;
    }
  },
  getAdvisorById: async (id) => {
    try {
      const response = await apiClient.get(`/api/Advisor/${id}`);
      return response?.data ?? response;
    } catch (error) {
      console.error(`Error fetching advisor by id ${id}:`, error);
      throw error;
    }
  },
  getMyProfile: async () => {
    try {
      const response = await apiClient.get('/api/Advisor/me');
      return response?.data ?? response;
    } catch (error) {
      if (error.statusCode === 404) return null;
      console.error('Error fetching advisor profile:', error);
      throw error;
    }
  }
};

export default advisorService;
