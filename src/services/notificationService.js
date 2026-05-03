import apiClient from './apiClient';

/**
 * Notification Service for Mobile
 * Handles API calls for notifications
 */
const notificationService = {
  /**
   * Get all notifications for current user
   */
  getNotifications: async (params = {}) => {
    try {
      const response = await apiClient.get('/api/Notifications', { params });
      return response.data || response || [];
    } catch (error) {
      console.error('[NotificationService] GetNotifications error:', error);
      return [];
    }
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId) => {
    try {
      return await apiClient.put(`/api/Notifications/${notificationId}/read`);
    } catch (error) {
      console.error('[NotificationService] MarkAsRead error:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    try {
      return await apiClient.put('/api/Notifications/read-all');
    } catch (error) {
      console.error('[NotificationService] MarkAllAsRead error:', error);
      throw error;
    }
  },

  /**
   * Get style configuration based on notification type
   * Ported from Web for consistency
   */
  getNotificationStyle: (notification) => {
    const type = notification.type || notification.referenceType || '';
    const title = (notification.title || '').toLowerCase();
    
    const types = {
      'Deal': { icon: '📋', color: '#0ea5e9', bgColor: '#e0f2fe' },
      'ChatSession': { icon: '💭', color: '#06b6d4', bgColor: '#ecfeff' },
      'ConnectionRequest': { icon: '💬', color: '#8b5cf6', bgColor: '#f5f3ff' },
      'Contract': { icon: '✍️', color: '#10b981', bgColor: '#ecfdf5' },
      'Investment': { icon: '💼', color: '#6366f1', bgColor: '#eef2ff' },
      'Project': { icon: '🚀', color: '#f59e0b', bgColor: '#fffbeb' },
      'Booking': { icon: '📅', color: '#ec4899', bgColor: '#fdf2f8' },
      'Subscription': { icon: '👑', color: '#a855f7', bgColor: '#f3e8ff' },
    };

    if (title.includes('hợp đồng')) return types['Contract'];
    if (title.includes('đầu tư')) return types['Investment'];
    if (title.includes('kết nối')) return types['ConnectionRequest'];
    if (title.includes('lịch hẹn') || title.includes('tư vấn')) return types['Booking'];
    
    return types[type] || { icon: '🔔', color: '#64748b', bgColor: '#f8fafc' };
  }
};

export default notificationService;
