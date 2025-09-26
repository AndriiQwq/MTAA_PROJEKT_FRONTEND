import { showNotification } from './NotificationService';
import { BASE_URL } from '../config/apiConfig';

// This code was generated with usage ChatGPT and was corrected by the developer. 
// Is not a direct copy of any existing code.

type WebSocketMessage = {
  event: string;
  data: any;
};

class WebSocketService {
  private socket: WebSocket | null = null;
  private userId: string | null = null;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  // Connect to the ws
  connect(userId: string) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    this.userId = userId;
    this.socket = new WebSocket(`${BASE_URL.replace('http', 'ws')}/notifications`);
    
    this.socket.onopen = this.handleOpen;
    this.socket.onmessage = this.handleMessage;
    this.socket.onerror = this.handleError;
    this.socket.onclose = this.handleClose;
  }

  // connection open
  private handleOpen = () => {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    
    this.sendMessage('startNotifications', { user_id: this.userId });
  };

  // incoming messages
  private handleMessage = (event: MessageEvent) => {
    try {
      const message: WebSocketMessage = JSON.parse(event.data);
      
      switch (message.event) {
        case 'newNotification':
          this.handleNewNotification(message.data);
          break;
          
        case 'notificationHistory':
          this.handleNotificationHistory(message.data);
          break;
          
        case 'notificationMarkedAsRead':
          console.log('Notification marked as read:', message.data.id);
          break;
          
        default:
          console.log('Unknown event type:', message.event);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  };

  // new notification
  private handleNewNotification(notification: any) {
    console.log('New notification received:', notification);
    
    showNotification(
      'New Notification', 
      notification.message || 'You have a new notification'
    );
  }

  // notification history
  private handleNotificationHistory(notifications: any[]) {
    console.log('Received notification history:', notifications);
    
    if (notifications && notifications.length > 0) {
      const mostRecent = notifications[0];
      showNotification(
        'Unread Notification', 
        mostRecent.message || 'You have an unread notification'
      );
    }
  }

  // WebSocket errors
  private handleError = (error: Event) => {
    console.error('WebSocket error:', error);
  };

  // WebSocket connection close
  private handleClose = (event: CloseEvent) => {
    console.log('WebSocket connection closed:', event.code, event.reason);
    this.isConnected = false;
    this.attemptReconnect();    // Attempt to reconnect

  };

  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts})`);
      
      this.reconnectTimeout = setTimeout(() => {
        if (this.userId) {
          this.connect(this.userId);
        }
      }, delay);
    } else {
      console.log('Max reconnect attempts reached');
    }
  }

  // Send a message to the ws
  sendMessage(event: string, data: any) {
    if (this.socket?.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ event, data }));
    } else {
      console.warn('Cannot send message - ws not connected');
    }
  }

  // Mark a notification as read
  markNotificationAsRead(notificationId: string) {
    this.sendMessage('markAsRead', { notification_id: notificationId });
  }

  // Disconnect from the ws
  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    this.isConnected = false;
    this.userId = null;
    console.log('WebSocket disconnected');
  }

  // Check if ws connection
  isWebSocketConnected() {
    return this.isConnected;
  }
}

export const webSocketService = new WebSocketService();