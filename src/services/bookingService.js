import apiClient from './apiClient';

const API_URL = '/api/Booking';

const bookingService = {
  /**
   * Tạo booking mới
   * POST /api/Booking
   * @param {{ AdvisorId: number, ProjectId: number, AdvisorAvailabilitySlotIds: number[], Note?: string, SourceBookingId?: number }} bookingData
   */
  createBooking: async (bookingData) => {
    try {
      const response = await apiClient.post(API_URL, bookingData);
      return response.data || response;
    } catch (error) {
      console.error('[bookingService] Error creating booking:', error);
      throw error;
    }
  },

  /**
   * Lấy danh sách project để chọn khi booking (Investor thấy tất cả Approved, Startup thấy project của mình)
   * GET /api/Booking/project-options
   */
  getProjectOptions: async () => {
    try {
      const response = await apiClient.get(`${API_URL}/project-options`);
      return response.data || response || [];
    } catch (error) {
      console.error('[bookingService] Error fetching project options:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách advisor được phân công cho project
   * GET /api/Booking/advisor-options?projectId={id}
   */
  getAdvisorOptions: async (projectId) => {
    try {
      const response = await apiClient.get(`${API_URL}/advisor-options`, {
        params: { projectId }
      });
      return response.data || response || [];
    } catch (error) {
      console.error('[bookingService] Error fetching advisor options:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách advisor thay thế cho booking đã bị từ chối
   * GET /api/Booking/{id}/replacement-advisor-options
   */
  getReplacementAdvisorOptions: async (bookingId) => {
    try {
      const response = await apiClient.get(`${API_URL}/${bookingId}/replacement-advisor-options`);
      return response.data || response || [];
    } catch (error) {
      console.error('[bookingService] Error fetching replacement advisor options:', error);
      return [];
    }
  },

  /**
   * Lấy danh sách bookings của chính mình (với vai trò khách hàng: Investor/Startup)
   * GET /api/Booking/me/customer
   */
  getMyCustomerBookings: async (filters = '', sorts = '-Id', page = 1, pageSize = 50) => {
    try {
      const params = new URLSearchParams();
      if (filters) params.append('filters', filters);
      if (sorts) params.append('sorts', sorts);
      params.append('page', page);
      params.append('pageSize', pageSize);

      const response = await apiClient.get(`${API_URL}/me/customer?${params.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error('[bookingService] Error fetching customer bookings:', error);
      return { items: [] };
    }
  },

  /**
   * Lấy danh sách bookings của chính mình (với vai trò Advisor)
   * GET /api/Booking/me/advisor
   */
  getMyAdvisorBookings: async (filters = '', sorts = '-Id', page = 1, pageSize = 50) => {
    try {
      const params = new URLSearchParams();
      if (filters) params.append('filters', filters);
      if (sorts) params.append('sorts', sorts);
      params.append('page', page);
      params.append('pageSize', pageSize);

      const response = await apiClient.get(`${API_URL}/me/advisor?${params.toString()}`);
      return response.data || response;
    } catch (error) {
      console.error('[bookingService] Error fetching advisor bookings:', error);
      return { items: [] };
    }
  },

  /**
   * Advisor chấp nhận booking → chuyển sang ApprovedAwaitingPayment
   * PATCH /api/Booking/{id}/approve
   */
  approveBooking: async (id) => {
    try {
      const response = await apiClient.patch(`${API_URL}/${id}/approve`);
      return response.data || response;
    } catch (error) {
      console.error('[bookingService] Error approving booking:', error);
      throw error;
    }
  },

  /**
   * Advisor từ chối booking
   * PATCH /api/Booking/{id}/reject
   */
  rejectBooking: async (id, reason = null) => {
    try {
      const response = await apiClient.patch(`${API_URL}/${id}/reject`, { reason });
      return response.data || response;
    } catch (error) {
      console.error('[bookingService] Error rejecting booking:', error);
      throw error;
    }
  },

  /**
   * Lấy booking bằng ID
   * GET /api/Booking/{id}
   */
  getBookingById: async (id) => {
    try {
      const response = await apiClient.get(`${API_URL}/${id}`);
      return response.data || response;
    } catch (error) {
      console.error('[bookingService] Error getting booking by ID:', error);
      throw error;
    }
  }
};

export default bookingService;
