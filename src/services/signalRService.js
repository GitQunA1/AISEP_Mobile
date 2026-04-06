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
    this.notificationReceived = null;
    this.chatMessageReceived = null;
    this.chatSessionClosed = null;
    this.chatStateChanged = null;
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
      if (this.notificationReceived) this.notificationReceived(notification);
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
      if (this.chatMessageReceived) this.chatMessageReceived(message);
    });

    this.chatConnection.on('chat_session_closed', (sessionId) => {
      console.log('[SignalRService] Chat session closed:', sessionId);
      if (this.chatSessionClosed) this.chatSessionClosed(sessionId);
    });

    this.chatConnection.onreconnected(() => {
      if (this.chatStateChanged) this.chatStateChanged('Connected');
    });

    this.chatConnection.onreconnecting(() => {
      if (this.chatStateChanged) this.chatStateChanged('Reconnecting');
    });

    this.chatConnection.onclose(() => {
      if (this.chatStateChanged) this.chatStateChanged('Disconnected');
    });

    try {
      await this.chatConnection.start();
      console.log('[SignalRService] ChatHub connected');
      if (this.chatStateChanged) this.chatStateChanged('Connected');
    } catch (err) {
      console.error('[SignalRService] ChatHub start failed:', err);
      if (this.chatStateChanged) this.chatStateChanged('Disconnected');
    }
  }

  /**
   * Callbacks Registration
   */
  onChatStateChanged(callback) { this.chatStateChanged = callback; }
  onNotificationReceived(callback) { this.notificationReceived = callback; }
  onChatMessageReceived(callback) { this.chatMessageReceived = callback; }
  onChatSessionClosed(callback) { this.chatSessionClosed = callback; }

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
    const isConnected = await this.waitForChatConnection();
    if (isConnected) {
      try {
        const numericId = Number(sessionId);
        await this.chatConnection.invoke('JoinSession', numericId);
        console.log('[SignalRService] Joined session:', numericId);
      } catch (error) {
        console.error('[SignalRService] JoinSession error:', error);
      }
    }
  }

  async leaveChatSession(sessionId) {
    if (this.chatConnection?.state === signalR.HubConnectionState.Connected) {
      try {
        const numericId = Number(sessionId);
        await this.chatConnection.invoke('LeaveSession', numericId);
        console.log('[SignalRService] Left session:', numericId);
      } catch (error) {
        console.error('[SignalRService] LeaveSession error:', error);
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
