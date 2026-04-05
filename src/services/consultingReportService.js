import apiClient from './apiClient';

/**
 * Consulting Report Service for Mobile
 * Handles creation and management of consulting reports (BR-05, BR-06)
 * Ported from Web version for full feature parity
 */
const consultingReportService = {
  /**
   * Submit a consulting report (Advisor only)
   * POST /api/ConsultingReport
   */
  createReport: async (data) => {
    try {
      const response = await apiClient.post('/api/ConsultingReport', data);
      return response?.data ?? response;
    } catch (error) {
      console.error('[consultingReportService] createReport Error:', error);
      throw error;
    }
  },

  /**
   * Get report by booking ID
   * GET /api/ConsultingReport/booking/{bookingId}
   */
  getReportByBookingId: async (bookingId) => {
    try {
      const response = await apiClient.get(`/api/ConsultingReport/booking/${bookingId}`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[consultingReportService] getReportByBookingId Error:', error);
      throw error;
    }
  },

  /**
   * Startup/Investor accepts the report
   * PATCH /api/ConsultingReport/{id}/startup-approve
   */
  approveReport: async (reportId) => {
    try {
      const response = await apiClient.patch(`/api/ConsultingReport/${reportId}/startup-approve`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[consultingReportService] approveReport Error:', error);
      throw error;
    }
  },

  /**
   * Startup/Investor requests report revision
   * PATCH /api/ConsultingReport/{id}/startup-request-revision
   */
  requestRevision: async (reportId, reason) => {
    try {
      const response = await apiClient.patch(`/api/ConsultingReport/${reportId}/startup-request-revision`, { reason });
      return response?.data ?? response;
    } catch (error) {
      console.error('[consultingReportService] requestRevision Error:', error);
      throw error;
    }
  },
};

export default consultingReportService;
