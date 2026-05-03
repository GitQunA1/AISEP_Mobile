import apiClient from './apiClient';

/**
 * Subscription Service (Mobile)
 * Handles user subscription data fetching.
 */
const subscriptionService = {
  /**
   * Fetch current user's subscription.
   * GET /api/Subscriptions/me
   */
  getMySubscription: async () => {
    try {
      const response = await apiClient.get('/api/Subscriptions/me');
      return response?.data ?? response;
    } catch (error) {
      if (error.response?.status === 404) {
        return null;
      }
      console.error('[subscriptionService] Error fetching my subscription:', error);
      throw error;
    }
  }
};

export default subscriptionService;
