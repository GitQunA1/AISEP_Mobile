import * as signalR from '@microsoft/signalr';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

const API_URL = 'https://api.aisep.tech';

/**
 * SignalR Service for Mobile
 * Managed real-time notifications and chat updates
 * Ported from Web version with mobile-specific adaptations (AppState handling)
 */
class SignalRService {
  constructor() {
    this.notificationConnection = null;
    this.chatConnection = null;
    this.accessToken = null;
    this.appStateSubscription = null;
    
    // Callbacks
    this.notificationListeners = new Set();
    this.chatMessageListeners = new Set();
    this.chatSessionClosedListeners = new Set();
    this.chatStateListeners = new Set();
  }

  /**
   * Initialize connections with JWT token
   */
  async initialize(token) {
    if (!token) {
      console.log('[SignalRService] No token provided for initialization');
      return;
    }

    this.accessToken = token;

    try {
      await this.connectNotificationHub();
      await this.connectChatHub();
      
      // Start listening to app state changes
      this.startAppStateListener();
    } catch (error) {
      console.error('[SignalRService] Initialization failed:', error);
    }
  }

  startAppStateListener() {
    if (this.appStateSubscription) return;

    this.appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        console.log('[SignalRService] App came to foreground, checking connections...');
        this.ensureConnected();
      }
    });
  }

  async ensureConnected() {
    if (this.accessToken) {
      if (!this.notificationConnection || this.notificationConnection.state === signalR.HubConnectionState.Disconnected) {
        await this.connectNotificationHub();
      }
      if (!this.chatConnection || this.chatConnection.state === signalR.HubConnectionState.Disconnected) {
        await this.connectChatHub();
      }
    }
  }

  /**
   * Connect to NotificationHub
   */
  async connectNotificationHub() {
    if (this.notificationConnection && this.notificationConnection.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

    this.notificationConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/notifications`, {
        accessTokenFactory: () => this.accessToken
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .withHubProtocol(new signalR.JsonHubProtocol())
      .build();

    this.notificationConnection.on('notification_received', (notification) => {
      console.log('[SignalRService] Notification received:', notification);
      this.notificationListeners.forEach(cb => cb(notification));
    });

    try {
      await this.notificationConnection.start();
      console.log('[SignalRService] NotificationHub connected');
    } catch (err) {
      console.error('[SignalRService] NotificationHub start failed:', err);
    }
  }

  /**
   * Connect to ChatHub
   */
  async connectChatHub() {
    if (this.chatConnection && this.chatConnection.state !== signalR.HubConnectionState.Disconnected) {
      return;
    }

    this.chatConnection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_URL}/hubs/chat`, {
        accessTokenFactory: () => this.accessToken
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .withHubProtocol(new signalR.JsonHubProtocol())
      .build();

    this.chatConnection.on('chat_message_received', (message) => {
      console.log('[SignalRService] Chat message received:', message);
      this.chatMessageListeners.forEach(cb => cb(message));
    });

    this.chatConnection.on('chat_session_closed', (sessionId) => {
      console.log('[SignalRService] Chat session closed:', sessionId);
      this.chatSessionClosedListeners.forEach(cb => cb(sessionId));
    });

    this.chatConnection.onreconnected(() => {
      this.chatStateListeners.forEach(cb => cb('Connected'));
    });

    this.chatConnection.onreconnecting(() => {
      this.chatStateListeners.forEach(cb => cb('Reconnecting'));
    });

    this.chatConnection.onclose(() => {
      this.chatStateListeners.forEach(cb => cb('Disconnected'));
    });

    try {
      await this.chatConnection.start();
      console.log('[SignalRService] ChatHub connected');
      this.chatStateListeners.forEach(cb => cb('Connected'));
    } catch (err) {
      console.error('[SignalRService] ChatHub start failed:', err);
      this.chatStateListeners.forEach(cb => cb('Disconnected'));
    }
  }

  /**
   * Callbacks Registration
   */
  onChatStateChanged(callback) { 
    this.chatStateListeners.add(callback);
    if (this.chatConnection) {
      const stateMap = {
        [signalR.HubConnectionState.Connected]: 'Connected',
        [signalR.HubConnectionState.Connecting]: 'Reconnecting',
        [signalR.HubConnectionState.Reconnecting]: 'Reconnecting',
        [signalR.HubConnectionState.Disconnected]: 'Disconnected',
        [signalR.HubConnectionState.Disconnecting]: 'Disconnected'
      };
      callback(stateMap[this.chatConnection.state] || 'Disconnected');
    }
    return () => this.chatStateListeners.delete(callback);
  }
  
  onNotificationReceived(callback) { 
    this.notificationListeners.add(callback);
    return () => this.notificationListeners.delete(callback);
  }
  
  onChatMessageReceived(callback) { 
    this.chatMessageListeners.add(callback);
    return () => this.chatMessageListeners.delete(callback);
  }
  
  onChatSessionClosed(callback) { 
    this.chatSessionClosedListeners.add(callback);
    return () => this.chatSessionClosedListeners.delete(callback);
  }

  async waitForChatConnection(maxRetries = 20) {
    let retries = 0;
    while (retries < maxRetries) {
      if (this.chatConnection?.state === signalR.HubConnectionState.Connected) return true;
      await new Promise(resolve => setTimeout(resolve, 500));
      retries++;
    }
    return false;
  }

  async joinChatSession(sessionId) {
    if (!sessionId) return;
    const isConnected = await this.waitForChatConnection();
    if (isConnected) {
      try {
        console.log('[SignalRService] Attempting to join session:', sessionId);
        await this.chatConnection.invoke('JoinSession', sessionId);
        console.log('[SignalRService] Joined session successfully:', sessionId);
      } catch (error) {
        console.warn('[SignalRService] JoinSession error (Non-fatal):', error.message);
        // We don't throw here to prevent UI crashes, the app might still receive 
        // messages via direct user targeting if the server supports it.
      }
    }
  }

  async leaveChatSession(sessionId) {
    if (!sessionId) return;
    if (this.chatConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        await this.chatConnection.invoke('LeaveSession', sessionId);
        console.log('[SignalRService] Left session successfully:', sessionId);
      } catch (error) {
        console.warn('[SignalRService] LeaveSession error (Non-fatal):', error.message);
      }
    }
  }

  async disconnect() {
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
      this.appStateSubscription = null;
    }
    if (this.notificationConnection) await this.notificationConnection.stop();
    if (this.chatConnection) await this.chatConnection.stop();
    console.log('[SignalRService] Disconnected');
  }
}

export default new SignalRService();
