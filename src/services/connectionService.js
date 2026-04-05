import apiClient from './apiClient';

/**
 * Connection Service for Mobile
 * Handles investor-startup connections and interactions (BR-016, BR-017)
 * Ported from Web version for full feature parity
 */
const connectionService = {
  /**
   * Create a connection request (investor shows interest in a startup project)
   * POST /api/connections/requests
   */
  createConnectionRequest: async (projectId, message = '') => {
    try {
      const payload = {
        projectId: projectId,
        message: message || 'Tôi quan tâm đến dự án này'
      };
      const response = await apiClient.post('/api/connections/requests', payload);
      return response;
    } catch (error) {
      console.error('[connectionService] createConnectionRequest Error:', error);
      throw error;
    }
  },

  /**
   * Get founder contact information for a project
   * GET /api/projects/{id}/founder-contact
   */
  getFounderContact: async (projectId) => {
    try {
      const response = await apiClient.get(`/api/projects/${projectId}/founder-contact`);
      return response;
    } catch (error) {
      console.error('[connectionService] getFounderContact Error:', error);
      throw error;
    }
  },

  /**
   * Get all connection requests sent by current investor
   */
  getMyConnections: async () => {
    try {
      const response = await apiClient.get('/api/connections/requests');
      return response;
    } catch (error) {
      console.error('[connectionService] getMyConnections Error:', error);
      throw error;
    }
  },

  /**
   * Get sent requests with optional params
   */
  getMyConnectionRequests: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/connections/requests', { params });
      return response;
    } catch (error) {
      console.error('[connectionService] getMyConnectionRequests Error:', error);
      throw error;
    }
  },

  /**
   * Respond to a connection request (For Startups)
   * PATCH /api/connections/requests/{id}/respond
   */
  respondToConnection: async (requestId, isAccepted) => {
    try {
      const response = await apiClient.patch(
        `/api/connections/requests/${requestId}/respond`,
        { isAccepted: isAccepted }
      );
      return response;
    } catch (error) {
      console.error('[connectionService] respondToConnection Error:', error);
      throw error;
    }
  },

  /**
   * Get connection requests received by startup (for startup dashboard)
   */
  getReceivedConnectionRequests: async () => {
    try {
      console.log('[connectionService] Fetching received requests from /api/connections/requests/received');
      try {
        const response = await apiClient.get('/api/connections/requests/received');
        return response;
      } catch (receivedError) {
        console.warn('[connectionService] /api/connections/requests/received failed, trying alternative endpoint');
        const altResponse = await apiClient.get('/api/connections/requests?type=received');
        return altResponse;
      }
    } catch (error) {
      console.error('[connectionService] All endpoints failed:', error);
      return {
        success: false,
        data: { items: [], totalCount: 0 },
        message: error?.message || 'Failed to fetch received requests'
      };
    }
  }
};

export default connectionService;
