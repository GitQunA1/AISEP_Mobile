import apiClient from './apiClient';

const API_URL = '/api/Booking';

const bookingService = {
  createBooking: async (bookingData) => {
    try {
      const response = await apiClient.post(API_URL, bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },
  getMyCustomerBookings: async (customerId) => {
    try {
      const response = await apiClient.get(`${API_URL}/customer/${customerId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      return null;
    }
  },
  getBookingsByAdvisorId: async (advisorId) => {
    try {
      const response = await apiClient.get(`${API_URL}/advisor/${advisorId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching advisor bookings:', error);
      return null;
    }
  }
};

export default bookingService;
