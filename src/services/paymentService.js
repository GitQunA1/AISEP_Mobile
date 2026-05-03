import apiClient from './apiClient';

/**
 * Payment Service (Mobile)
 * Handles booking payment flows via SePay QR.
 */
const paymentService = {
  /**
   * Initialize checkout for a booking → returns QR code URL, target amount, and payment code.
   * POST /api/payments/bookings/{bookingId}/checkout
   * @param {number} bookingId
   */
  checkoutBooking: async (bookingId) => {
    try {
      const response = await apiClient.post(`/api/payments/bookings/${bookingId}/checkout`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[paymentService] Error initializing checkout:', error);
      throw error;
    }
  },

  /**
   * Fetch payment status for a specific booking (used for polling).
   * GET /api/payments/bookings/{bookingId}/status
   * @param {number} bookingId
   */
  getBookingPaymentStatus: async (bookingId) => {
    try {
      const response = await apiClient.get(`/api/payments/bookings/${bookingId}/status`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[paymentService] Error fetching payment status:', error);
      throw error;
    }
  },

  /**
   * Fetch status for a specific transaction ID.
   * GET /api/payments/{transactionId}/status
   * @param {number} transactionId
   */
  getTransactionStatus: async (transactionId) => {
    try {
      const response = await apiClient.get(`/api/payments/${transactionId}/status`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[paymentService] Error fetching transaction status:', error);
      throw error;
    }
  },

  /**
   * Fetch investor packages.
   * GET /api/payments/packages/investor
   */
  getInvestorPackages: async () => {
    try {
      const response = await apiClient.get('/api/payments/packages/investor');
      return response?.data ?? response;
    } catch (error) {
      console.error('[paymentService] Error fetching investor packages:', error);
      throw error;
    }
  },

  /**
   * Fetch startup packages.
   * GET /api/payments/packages/startup
   */
  getStartupPackages: async () => {
    try {
      const response = await apiClient.get('/api/payments/packages/startup');
      return response?.data ?? response;
    } catch (error) {
      console.error('[paymentService] Error fetching startup packages:', error);
      throw error;
    }
  },

  /**
   * Checkout subscription
   * POST /api/payments/subscriptions/checkout
   * @param {number} packageId
   */
  checkoutSubscription: async (packageId) => {
    try {
      const response = await apiClient.post('/api/payments/subscriptions/checkout', { packageId });
      return response?.data ?? response;
    } catch (error) {
      console.error('[paymentService] Error in checkout subscription:', error);
      throw error;
    }
  }
};

export default paymentService;
