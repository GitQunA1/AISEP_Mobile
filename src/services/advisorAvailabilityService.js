import apiClient from './apiClient';

const BASE_URL = '/api/advisor-availabilities';

/**
 * Advisor Availability Service for Mobile
 * Manages advisor's free slots (BR-01, BR-02)
 * Ported from Web version for full feature parity
 */
const advisorAvailabilityService = {
  /**
   * Get current advisor's slots (Advisor only)
   * GET /api/advisor-availabilities/me
   */
  getMyAvailabilities: async () => {
    try {
      const response = await apiClient.get(`${BASE_URL}/me`, {
        params: { pageSize: 200, sorts: 'SlotDate,StartTime' },
      });
      // Handle both direct array and PagedResult
      const payload = response?.data ?? response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      return [];
    } catch (error) {
      console.error('[Availability Service] getMyAvailabilities error:', error);
      return [];
    }
  },

  /**
   * Create new free slots (Advisor only)
   * POST /api/advisor-availabilities/me
   */
  createMyAvailability: async (data) => {
    try {
      const response = await apiClient.post(`${BASE_URL}/me`, {
        SlotDate: data.slotDate,
        StartTime: data.startTime,
        EndTime: data.endTime,
      });
      return response?.data ?? response;
    } catch (error) {
      console.error('[Availability Service] createMyAvailability error:', error);
      throw error;
    }
  },

  /**
   * Update an existing slot (Advisor only)
   * PUT /api/advisor-availabilities/me/{availabilityId}
   */
  updateMyAvailability: async (availabilityId, data) => {
    try {
      const response = await apiClient.put(`${BASE_URL}/me/${availabilityId}`, {
        SlotDate: data.slotDate,
        StartTime: data.startTime,
        EndTime: data.endTime,
      });
      return response?.data ?? response;
    } catch (error) {
      console.error('[Availability Service] updateMyAvailability error:', error);
      throw error;
    }
  },

  /**
   * Delete a slot (Advisor only - only Available status)
   * DELETE /api/advisor-availabilities/me/{availabilityId}
   */
  deleteMyAvailability: async (availabilityId) => {
    try {
      await apiClient.delete(`${BASE_URL}/me/${availabilityId}`);
      return true;
    } catch (error) {
      console.error('[Availability Service] deleteMyAvailability error:', error);
      throw error;
    }
  },

  /**
   * Get slots for a specific advisor (Used for booking by Startups)
   * GET /api/advisor-availabilities/advisor/{advisorId}
   */
  getByAdvisorId: async (advisorId) => {
    try {
      const response = await apiClient.get(`${BASE_URL}/advisor/${advisorId}`, {
        params: { pageSize: 200, sorts: 'SlotDate,StartTime' },
      });
      const payload = response?.data ?? response;
      if (Array.isArray(payload)) return payload;
      if (Array.isArray(payload?.items)) return payload.items;
      return [];
    } catch (error) {
      console.error('[Availability Service] getByAdvisorId error:', error);
      return [];
    }
  },
};

export default advisorAvailabilityService;
