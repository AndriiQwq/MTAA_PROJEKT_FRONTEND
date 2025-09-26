import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// We use help of ai to generate this code

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function checkNotificationsAvailable() {
  try {
    return await Notifications.getPermissionsAsync().then(() => true).catch(() => false);
  } catch (error) {
    console.error('Error checking notification availability:', error);
    return false;
  }
}

export async function requestNotificationPermissions() {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    }
    return true;
  } catch (error) {
    console.error('Error requesting notification permissions:', error);
    return false;
  }
}

export async function setupNotificationChannel() {
  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
      console.log('Notification channel setup successful');
      return true;
    } catch (error) {
      console.error('Error setting up notification channel:', error);
      return false;
    }
  }
  return true;
}

export async function showNotification(title: string, body: string, data: any = {}) {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: null,
    });
    console.log('Local notification sent successfully with ID:', identifier);
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

export async function scheduleNotification(title: string, body: string, seconds: number, data: any = {}) {
  try {
    const identifier = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
      },
      trigger: seconds > 0 ? { seconds } : null,
    });
    
    if (seconds > 0) {
      console.log(`Local notification scheduled for ${seconds} seconds from now with ID: ${identifier}`);
    } else {
      console.log(`Local notification sent immediately with ID: ${identifier}`);
    }
    
    return true;
  } catch (error) {
    console.error('Error with notification:', error);
    return false;
  }
}

export async function cancelAllNotifications() {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('All scheduled notifications canceled');
    return true;
  } catch (error) {
    console.error('Error canceling notifications:', error);
    return false;
  }
}

export async function getAllScheduledNotifications() {
  try {
    const notifications = await Notifications.getAllScheduledNotificationsAsync();
    console.log(`Found ${notifications.length} scheduled notifications`);
    return notifications;
  } catch (error) {
    console.error('Error getting scheduled notifications:', error);
    return [];
  }
}