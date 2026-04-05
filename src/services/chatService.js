import apiClient from './apiClient';

/**
 * Chat Service for Mobile
 * Handles chat messaging and session operations
 * Ported from Web version for full feature parity
 */
const chatService = {
  /**
   * Get all chat messages for a session
   */
  getChatMessages: async (sessionId) => {
    try {
      const response = await apiClient.get(`/api/ChatMessage`, {
        params: { sessionId }
      });
      return response;
    } catch (error) {
      console.error('[chatService] getChatMessages Error:', error);
      throw error;
    }
  },

  /**
   * Send a new chat message
   */
  sendChatMessage: async (sessionId, content) => {
    try {
      const response = await apiClient.post(`/api/ChatMessage`, { content }, {
        params: { sessionId }
      });
      return response;
    } catch (error) {
      console.error('[chatService] sendChatMessage Error:', error);
      throw error;
    }
  },

  /**
   * Open or get chat session for booking (Confirmed status)
   */
  openBookingSession: async (bookingId) => {
    try {
      const response = await apiClient.post(`/api/ChatSession/${bookingId}`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[chatService] openBookingSession Error:', error);
      throw error;
    }
  },

  /**
   * Alias for openBookingSession
   */
  createOrGetBookingChat: async (bookingId) => {
    return await chatService.openBookingSession(bookingId);
  },

  /**
   * Get session details and messages
   */
  getSession: async (sessionId) => {
    try {
      const response = await apiClient.get(`/api/ChatSession/${sessionId}`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[chatService] getSession Error:', error);
      throw error;
    }
  },

  /**
   * Get all chat sessions for the current user
   */
  getMySessions: async () => {
    try {
      const response = await apiClient.get('/api/ChatSession');
      return response?.data ?? response ?? [];
    } catch (error) {
      console.error('[chatService] getMySessions Error:', error);
      return [];
    }
  },

  /**
   * Close chat session (when booking completes)
   */
  closeSession: async (sessionId) => {
    try {
      const response = await apiClient.patch(`/api/ChatSession/${sessionId}/close`);
      return response?.data ?? response;
    } catch (error) {
      console.error('[chatService] closeSession Error:', error);
      throw error;
    }
  },
};

export default chatService;
