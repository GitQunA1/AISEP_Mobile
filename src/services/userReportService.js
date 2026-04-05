import apiClient from './apiClient';

/**
 * User Report Service for Mobile
 * Handles creation and management of user reports/complaints (Khiếu nại)
 * Ported from Web version for full feature parity
 */
const userReportService = {
  /**
   * Create a new violation report (Startup/Investor).
   * POST /api/UserReports
   * @param {FormData} formData - category, description, bookingId?, evidenceImages?, videoEvidenceUrl?
   */
  createReport: async (formData) => {
    try {
      const response = await apiClient.post('/api/UserReports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response?.data ?? response;
    } catch (error) {
      console.error('[userReportService] createReport Error:', error);
      throw error;
    }
  },

  /**
   * Get all reports (Staff/Admin view)
   * GET /api/UserReports
   */
  getAllReports: async () => {
    try {
      const response = await apiClient.get('/api/UserReports');
      return response?.data ?? response;
    } catch (error) {
      console.error('[userReportService] getAllReports Error:', error);
      return [];
    }
  },

  /**
   * Resolve report as valid
   * PATCH /api/UserReports/${reportId}/resolve-valid
   */
  resolveValid: async (reportId) => {
    try {
      const response = await apiClient.patch(`/api/UserReports/${reportId}/resolve-valid`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[userReportService] resolveValid Error:', error);
      throw error;
    }
  },

  /**
   * Resolve report as false/invalid
   * PATCH /api/UserReports/${reportId}/resolve-false
   */
  resolveFalse: async (reportId) => {
    try {
      const response = await apiClient.patch(`/api/UserReports/${reportId}/resolve-false`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[userReportService] resolveFalse Error:', error);
      throw error;
    }
  },
};

export default userReportService;
