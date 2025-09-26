import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  RefreshControl,
  Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { showNotification } from '../services/NotificationService';
import { SafeAreaView } from 'react-native-safe-area-context';
import { API_ENDPOINTS } from '../config/apiConfig';

type Notification = {
  id: string;
  message: string;
  created_at: string;
  is_read: boolean;
};

const MessagesScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { token } = useAuth();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      setLoading(true);
      
      if (!token) {
        console.log('No token available');
        setLoading(false);
        return;
      }
      
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.ALL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setNotifications(result.data);
        setUnreadCount(result.data.filter((notif: Notification) => !notif.is_read).length);
      } else {
        console.error('Error fetching notifications:', result.message);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Initial load
  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchNotifications();
  }, [fetchNotifications]);

  const markAsRead = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.MARK_READ(id), {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        // Update local state
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => 
            notif.id === id ? { ...notif, is_read: true } : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        return true;
      } else {
        console.error('Error marking notification as read:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.MARK_ALL_READ, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        setNotifications(prevNotifications => 
          prevNotifications.map(notif => ({ ...notif, is_read: true }))
        );
        setUnreadCount(0);
        
        showNotification(
          'Všetky notifikácie prečítané',
          'Všetky vaše notifikácie boli označené ako prečítané'
        );
        
        return true;
      } else {
        console.error('Error marking all notifications as read:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      return false;
    }
  };

  // Delete notification
  const deleteNotification = async (id: string) => {
    try {
      const response = await fetch(API_ENDPOINTS.NOTIFICATIONS.DELETE(id), {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const result = await response.json();
      
      if (response.ok && result.success) {
        const notificationToDelete = notifications.find(n => n.id === id);
        setNotifications(prevNotifications => 
          prevNotifications.filter(notif => notif.id !== id)
        );
        
        if (notificationToDelete && !notificationToDelete.is_read) {
          setUnreadCount(prev => Math.max(0, prev - 1));
        }
        
        return true;
      } else {
        console.error('Error deleting notification:', result.message);
        return false;
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      return false;
    }
  };

  // notification details
  const viewNotificationDetails = async (notification: Notification) => {
    if (!notification.is_read) {
      const success = await markAsRead(notification.id);
      
      if (success) {
        showNotification(
          'Notifikácia prečítaná',
          'Notifikácia bola označená ako prečítaná'
        );
      }
    }

    Alert.alert(
      'Notifikácia',
      notification.message,
      [
        { 
          text: 'Zmazať', 
          onPress: () => confirmDeleteNotification(notification.id),
          style: 'destructive'
        },
        { text: 'OK', onPress: () => console.log('OK Pressed') }
      ]
    );
  };

  // Confirm delete notification
  const confirmDeleteNotification = (id: string) => {
    Alert.alert(
      'Zmazať notifikáciu',
      'Naozaj chcete zmazať túto notifikáciu?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        { 
          text: 'Zmazať', 
          onPress: async () => {
            const success = await deleteNotification(id);
            if (success) {
              showNotification(
                'Notifikácia zmazaná',
                'Notifikácia bola úspešne zmazaná'
              );
            }
          },
          style: 'destructive'
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    if (date.toDateString() === now.toDateString()) {
      return `Dnes, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Včera, ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
    }
    
    return `${date.getDate()}.${date.getMonth() + 1}.${date.getFullYear()}`;
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="notifications-outline" size={64} color={colors.text} />
      <Text style={[styles.emptyText, { color: colors.text }]}>
        Žiadne notifikácie
      </Text>
      <Text style={[styles.emptySubtext, { color: colors.text }]}>
        Keď dostanete notifikáciu, zobrazí sa tu
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Notifikácie</Text>
        </View>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header and unread count */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Notifikácie</Text>
        {unreadCount > 0 && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
        
        {/* Mark all as read */}
        {unreadCount > 0 && (
          <TouchableOpacity 
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={[styles.markAllText, { color: colors.primary }]}>Prečítať všetko</Text>
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={notifications}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => viewNotificationDetails(item)}
            style={[
              styles.notificationItem, 
              { 
                borderLeftColor: item.is_read ? colors.border : colors.primary,
                borderLeftWidth: 4,
                backgroundColor: item.is_read ? colors.card : colors.card + '88',
              }
            ]}
          >
            <View style={styles.notificationHeader}>
              <Text 
                style={[styles.notificationMessage, { color: colors.text }]}
                numberOfLines={2}
              >
                {item.message}
              </Text>
              <Text style={[styles.date, { color: colors.text }]}>
                {formatDate(item.created_at)}
              </Text>
            </View>
            
            <View style={styles.notificationFooter}>
              {!item.is_read && (
                <View style={[styles.unreadIndicator, { backgroundColor: colors.primary }]} />
              )}
              <Text style={{ 
                color: item.is_read ? 'green' : colors.primary, 
                fontWeight: item.is_read ? 'normal' : 'bold' 
              }}>
                {item.is_read ? 'Prečítané' : 'Neprečítané'}
              </Text>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => confirmDeleteNotification(item.id)}
              >
                <Ionicons name="trash-outline" size={18} color={colors.error || 'red'} />
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={notifications.length === 0 ? { flex: 1 } : styles.list}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
  },
  title: { 
    fontSize: 22, 
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    marginLeft: 10,
    padding: 5,
  },
  markAllText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  list: {
    padding: 16,
  },
  notificationItem: { 
    padding: 16,
    marginBottom: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  notificationHeader: {
    marginBottom: 8,
  },
  notificationMessage: { 
    fontSize: 16,
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    opacity: 0.7,
  },
  notificationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unreadIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  deleteButton: {
    padding: 5,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    opacity: 0.7,
  },
});

export default MessagesScreen;