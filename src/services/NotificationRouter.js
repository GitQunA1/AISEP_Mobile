/**
 * NotificationRouter.js for Mobile
 * Centralizes the mapping logic for notification deep linking in React Native.
 * Maps backend ReferenceType to Expo Router routes.
 */

const NotificationRouter = {
  /**
   * Resolves the navigation path based on the notification payload and user role.
   * @param {object} notification - The notification object from API or SignalR.
   * @param {object} user - Current user object with role information.
   * @returns {string|null} Expo Router path or null if invalid.
   */
  resolvePath: (notification, user) => {
    if (!user || !notification) return null;

    const referenceType = notification.referenceType || notification.ReferenceType;
    const referenceId = notification.referenceId || notification.ReferenceId;
    
    if (!referenceType) return null;

    const roleValue = user.role;
    const roleStr = typeof roleValue === 'string' ? roleValue.toLowerCase() : (roleValue === 0 ? 'startup' : roleValue === 1 ? 'investor' : roleValue === 2 ? 'advisor' : '');
    
    const type = referenceType.toString().toLowerCase();
    const id = referenceId ? referenceId.toString() : null;

    console.log(`[NotificationRouter] Resolving: type=${type}, id=${id}, role=${roleStr}`);

    switch (type) {
      case 'connectionrequest':
      case 'connection':
        // Startups view connections in Dashboard -> Connections tab
        if (roleStr === 'startup') return '/(tabs)/dashboard?tab=connections';
        // Investors view connections in Dashboard -> My Requests tab
        if (roleStr === 'investor') return '/(tabs)/dashboard?tab=requests';
        break;

      case 'chatsession':
      case 'chatmessage':
        // Deep link to chat screen if it exists, otherwise dashboard
        if (id) return `/chat/${id}`;
        return '/(tabs)/dashboard';

      case 'deal':
      case 'investment':
        // Both view deals in Dashboard -> Deals tab
        if (roleStr === 'startup' || roleStr === 'investor') return '/(tabs)/dashboard?tab=deals';
        break;

      case 'booking':
      case 'appointment':
        // Everyone views bookings in Dashboard -> Bookings tab
        return '/(tabs)/dashboard?tab=bookings';

      case 'startup':
      case 'project':
        // Staff/Admin might need to see project details
        if (id) return `/startup/${id}`;
        return '/(tabs)/dashboard';

      case 'subscription':
        return '/subscription/management';

      case 'consultingreport':
        // Consulting report is viewed inside a booking
        return '/(tabs)/dashboard?tab=bookings';

      default:
        break;
    }

    // Default fallback to dashboard
    return '/(tabs)/dashboard';
  }
};

export default NotificationRouter;
