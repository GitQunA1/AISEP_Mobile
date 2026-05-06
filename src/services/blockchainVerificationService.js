import apiClient from './apiClient';

/**
 * blockchainVerificationService - Real API implementation for mobile
 */
const blockchainVerificationService = {
  /**
   * Verify if a project is fully stored on blockchain
   * @param {number} projectId - The ID of the project
   * @returns {Promise} - API response with verification details
   */
  verifyProjectBlockchain: async (projectId) => {
    try {
      const response = await apiClient.get(`/api/Projects/${projectId}/verify-blockchain`);
      return response;
    } catch (error) {
      console.error('[blockchainVerificationService] Error verifying blockchain:', {
        status: error.response?.status,
        message: error.message,
        projectId: projectId,
        errorData: error.response?.data
      });
      throw error;
    }
  }
};

export default blockchainVerificationService;
