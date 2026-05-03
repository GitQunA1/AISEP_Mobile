import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { Platform, Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import signalRService from '../services/signalRService';
import notificationService from '../services/notificationService';
import { useAuth } from './AuthContext';
import { useRouter } from 'expo-router';
import NotificationRouter from '../services/NotificationRouter';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState('');
  const [loading, setLoading] = useState(false);
  
  const notificationListener = useRef();
  const responseListener = useRef();

  // 1. Initialize SignalR listener and fetch initial notifications
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Register SignalR callback
      const unsubscribe = signalRService.onNotificationReceived((newNotif) => {
        console.log('[NotificationContext] Real-time notification received:', newNotif);
        
        // Add to list
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Also show a local notification if needed (handled by setNotificationHandler above if app is active)
        // But SignalR notifications don't automatically trigger Expo Notifications unless we call them
        showLocalNotification(newNotif);
      });

      // Register for Push Notifications
      registerForPushNotificationsAsync().then(token => {
        if (token) {
          setExpoPushToken(token);
          // TODO: Send this token to backend to associate with user
          // await userService.updatePushToken(token);
        }
      });

      return () => {
        if (unsubscribe) unsubscribe();
      };
    } else {
      // Clear data on logout
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  // 2. Setup Expo Notification Listeners & Configuration
  useEffect(() => {
    // 2a. Configure how notifications are handled when the app is in foreground
    try {
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
    } catch (e) {
      console.log('[NotificationContext] setNotificationHandler error:', e);
    }

    // 2b. Listener for when a notification is received while the app is foregrounded
    try {
      notificationListener.current = Notifications.addNotificationReceivedListener(notification => {
        console.log('[NotificationContext] Foreground notification:', notification);
      });
    } catch (e) {
      console.log('[NotificationContext] addNotificationReceivedListener error:', e);
    }

    // 2c. Listener for when a user interacts with a notification (taps it)
    try {
      responseListener.current = Notifications.addNotificationResponseReceivedListener(response => {
        const data = response.notification.request.content.data;
        console.log('[NotificationContext] Notification tapped:', data);
        handleNotificationAction(data);
      });
    } catch (e) {
      console.log('[NotificationContext] addNotificationResponseReceivedListener error:', e);
    }

    return () => {
      if (notificationListener.current) {
        notificationListener.current.remove();
      }
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await notificationService.getNotifications({ pageSize: 1000 });
      // Handle different API response shapes (array vs paged object with .items)
      const data = response?.items || response?.data?.items || (Array.isArray(response) ? response : response?.data || []);
      
      console.log(`[NotificationContext] Fetched ${data?.length || 0} notifications`);
      
      setNotifications(data);
      const unread = Array.isArray(data) ? data.filter(n => !n.isRead).length : 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('[NotificationContext] Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => 
        prev.map(n => n.notificationId === id ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('[NotificationContext] MarkAsRead error:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('[NotificationContext] MarkAllAsRead error:', error);
    }
  };

  const showLocalNotification = async (notif) => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: notif.title || 'Thông báo mới',
        body: notif.message || '',
        data: notif,
        sound: true,
      },
      trigger: null, // show immediately
    });
  };

  const handleNotificationAction = (notif) => {
    if (!notif) return;
    
    try {
      const path = NotificationRouter.resolvePath(notif, user);
      if (path) {
        console.log('[NotificationContext] Navigating to:', path);
        router.push(path);
      }
    } catch (e) {
      console.log('[NotificationContext] Navigation error:', e);
    }
  };

  async function registerForPushNotificationsAsync() {
    // Expo Go (SDK 53+) on Android no longer supports remote push notifications
    // Using a more robust check for Expo Go
    const isExpoGo = Constants.appOwnership === 'expo' || Constants.executionEnvironment === 'storeClient';
    
    if (isExpoGo && Platform.OS === 'android') {
      console.warn('[NotificationContext] Remote push notifications are not supported in Expo Go on Android. Please use a Development Build for this feature.');
      // We still setup the local channel for SignalR notifications to work
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      return null;
    }

    let token;
    if (Device.isDevice) {
      try {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        
        if (finalStatus !== 'granted') {
          console.log('[NotificationContext] Failed to get push token for push notification!');
          return null;
        }
        
        const projectId = Constants?.expoConfig?.extra?.eas?.projectId || Constants?.easConfig?.projectId;
        if (!projectId) {
          console.warn('[NotificationContext] No EAS Project ID found, skipping push token registration.');
          return null;
        }

        token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
        console.log('[NotificationContext] Push Token:', token);
      } catch (e) {
        console.warn('[NotificationContext] Error getting push token (this is expected in Expo Go/Simulators):', e.message);
      }
    } else {
      console.log('[NotificationContext] Must use physical device for Push Notifications');
    }

    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return token;
  }

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      handleNotificationAction,
      expoPushToken
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);

export default NotificationContext;
