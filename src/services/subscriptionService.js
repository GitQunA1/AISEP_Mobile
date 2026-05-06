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
  },

  /**
   * Fetch user's bonus free bookings (for those without subscription)
   * GET /api/Users/me/bonus
   */
  getBonusQuota: async () => {
    try {
      const response = await apiClient.get('/api/Users/me/bonus');
      return response?.data ?? response;
    } catch (error) {
      console.error('[subscriptionService] Error fetching bonus quota:', error);
      return 0; // Default to 0 if failed
    }
  }
};

export default subscriptionService;
