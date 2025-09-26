import React, { createContext, useContext, useEffect, useState } from 'react';
import { webSocketService } from '../services/WebSocketService';
import { useAuth } from './AuthContext';

type NotificationContextType = {
  connectToWebSocket: () => void;
  disconnectFromWebSocket: () => void;
  markNotificationAsRead: (notificationId: string) => void;
  isConnected: boolean;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      try {
        const tokenParts = token.split('.');
        if (tokenParts.length === 3) {
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.userId || payload.user_id || payload.id) {
            const extractedUserId = payload.userId || payload.user_id || payload.id;
            setUserId(extractedUserId);
          }
        }
      } catch (error) {
        console.error('Error parsing token:', error);
      }
    } else {
      setUserId(null);
    }
  }, [token]);

  // Connect to ws
  useEffect(() => {
    if (token && userId) {
      connectToWebSocket();
    } else {
      disconnectFromWebSocket();
    }

    return () => {// Clean up
      disconnectFromWebSocket();
    };
  }, [token, userId]);

  // Connect to ws
  const connectToWebSocket = () => {
    if (userId) {
      webSocketService.connect(userId);
      setIsConnected(true);
    }
  };

  // Disconnect from ws
  const disconnectFromWebSocket = () => {
    webSocketService.disconnect();
    setIsConnected(false);
  };

  // Mark as read
  const markNotificationAsRead = (notificationId: string) => {
    webSocketService.markNotificationAsRead(notificationId);
  };

  return (
    <NotificationContext.Provider
      value={{
        connectToWebSocket,
        disconnectFromWebSocket,
        markNotificationAsRead,
        isConnected,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};