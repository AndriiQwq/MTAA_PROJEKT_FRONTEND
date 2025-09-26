import 'react-native-gesture-handler';
import React, { useEffect, useRef } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import RootNavigator from './navigation/RootNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ThemeProvider } from './theme/ThemeContext';
import { navigationRef } from './navigation/navigation';
import { AuthProvider } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { NotificationProvider } from './context/NotificationContext';
import { requestNotificationPermissions, setupNotificationChannel } from './services/NotificationService';

export default function App() {
  // Track initialization to prevent duplicate effects
  const isInitializedRef = useRef(false);
  
  useEffect(() => {
    // Skip if already initialized
    if (isInitializedRef.current) {return;}
    isInitializedRef.current = true;
    
    // Initialize notifications
    const initNotifications = async () => {
      try {
        const hasPermission = await requestNotificationPermissions();
        if (hasPermission) {
          await setupNotificationChannel();
          console.log('Notification system initialized');
        } else {
          console.log('Notification permission denied');
        }
      } catch (error) {
        console.error('Error initializing notifications:', error);
      }
    };
    
    initNotifications();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, width: '100%', alignSelf: 'stretch',}}>
      <SafeAreaProvider style={{ flex: 1, width: '100%', alignSelf: 'stretch',}}>
        <NetworkProvider>
          <ThemeProvider>
            <AuthProvider>
              <NotificationProvider>
                <NavigationContainer 
                  ref={navigationRef}
                  onReady={() => {
                    navigationRef.current?.resetRoot({
                      index: 0,
                      routes: []
                    });
                  }}
                >
                  <RootNavigator />
                </NavigationContainer>
              </NotificationProvider>
            </AuthProvider>
          </ThemeProvider>
        </NetworkProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
