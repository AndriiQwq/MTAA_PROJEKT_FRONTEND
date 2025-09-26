import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList,
  SafeAreaView 
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/navigation';
import { useAuth } from '../context/AuthContext';
import { BASE_URL, API_ENDPOINTS } from '../config/apiConfig';

import { useNetwork } from '../context/NetworkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type GroupChatScreenRouteProp = RouteProp<RootStackParamList, 'GroupChat'>;

interface ChatMessage {
  id: string;
  sender_id: string;
  sender_name: string;
  message: string;
  created_at: string;
}


const GroupChatScreen = () => {
  const { colors } = useTheme();
  const route = useRoute<GroupChatScreenRouteProp>();
  const navigation = useNavigation();
  const { groupId, groupName } = route.params;
  const { token } = useAuth();

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [userId, setUserId] = useState<string | null>(null);
  const { isConnected } = useNetwork(); // Check network connection

  // Ref to WS to save the connection
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const fetchUserInfo = async () => {
      if (!isConnected) {
        setError('Nie ste pripojený k internetu');
        return;
      }
      try {
        if (!token) {
          setError('Nie ste prihlásený');
          return;
        }

        const response = await fetch(API_ENDPOINTS.USERS.ME, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch user info');
        }

        const responseData = await response.json();
        console.log('User info:', responseData);

        if (responseData.success && responseData.data) {
          setUserId(responseData.data.id);
        } else {
          throw new Error('Invalid response format');
        }
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('Nepodarilo sa načítať informácie');
      }
    };

    fetchUserInfo();
  }, [token]);

  // Connect to WS 
  useEffect(() => {
    if (!userId) return;

    const wsUrl = BASE_URL.replace(/^http/, 'ws') + '/ws';

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      setConnected(true);
      setError(null);

      ws.send(JSON.stringify({
        event: 'joinGroup',
        data: {
          group_id: groupId,
          user_id: userId
        }
      }));
    };

    ws.onerror = (e) => {
      console.error('WebSocket error:', e);
      setError('Chyba spojenia.');
      setConnected(false);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.event === 'chatHistory') { // After joining the group, we get the chat history
          setMessages(data.data || []);
        } else if (data.event === 'newMessage') { // Get new message
          const newMessage = data.data;
          setMessages(prev => [...prev, newMessage]);
        }
      } catch (error) {
        console.error('Error parsing ws:', error);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setConnected(false);
    };

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [groupId, userId]);

  const sendMessage = () => {
    if (!message.trim() || !connected || !wsRef.current) return;
    
    wsRef.current.send(JSON.stringify({
      event: 'sendMessage',
      data: {
        message: message.trim(),
        group_id: groupId,
        user_id: userId
      }
    }));
  
    setMessage(''); // Clear the input field
  };

  // Format date 
  const formatMessageDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Custom Header */}
      <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <View style={[styles.groupAvatarContainer, { backgroundColor: colors.secondary }]}>
            <Ionicons name="people" size={20} color={colors.background} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.text }]}>
            {groupName}
          </Text>
        </View>
      </View>

      {/* Connection error message */}
      {error && (
        <View style={[styles.errorContainer, { backgroundColor: colors.error || '#ff6b6b' }]}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => {
              if (wsRef.current) { // Reconnect logic
                wsRef.current.close();
                wsRef.current = null;
              }
              setError(null); // Restart the effect
            }}
          >
            <Text style={styles.retryText}>Skúsiť znova</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Messages list */}
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const isCurrentUser = item.sender_id === userId;
          
          return (
            <View style={styles.messageWrapper}>
              {!isCurrentUser && (
                <Text style={[styles.messageSender, { color: colors.text }]}>
                  {item.sender_name}
                </Text>
              )}
              <View style={[
                styles.messageContainer,
                isCurrentUser ? styles.myMessage : styles.theirMessage,
                { backgroundColor: isCurrentUser ? colors.primary : colors.secondary }
              ]}>
                <Text style={[styles.messageText, { color: isCurrentUser ? colors.background : colors.text }]}>
                  {item.message}
                </Text>
                <Text style={[
                  styles.messageTime,
                  { color: isCurrentUser ? colors.background : colors.text, opacity: 0.7 }
                ]}>
                  {formatMessageDate(item.created_at)}
                </Text>
              </View>
            </View>
          );
        }}
        inverted={false}
        contentContainerStyle={styles.messagesContainer}
      />
      
      {/* Input */}
      <View style={[styles.inputContainer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colors.secondary }]}
          value={message}
          onChangeText={setMessage}
          placeholder="Napíšte správu..."
          placeholderTextColor={colors.text}
          editable={connected}
        />
        <TouchableOpacity 
          style={[
            styles.sendButton, 
            { backgroundColor: connected ? colors.primary : colors.border }
          ]}
          onPress={sendMessage}
          disabled={!connected || message.trim() === ''}
        >
          <Ionicons name="send" size={24} color={colors.background} />
        </TouchableOpacity>
      </View>
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
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 5,
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  groupAvatarContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    padding: 5,
  },
  errorContainer: {
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    fontSize: 14,
  },
  retryButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 5,
  },
  retryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  messagesContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  messageWrapper: {
    marginVertical: 5,
  },
  messageSender: {
    fontSize: 12,
    marginLeft: 10,
    marginBottom: 2,
  },
  messageContainer: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
  },
  myMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  messageText: {
    fontSize: 16,
  },
  messageTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 10,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 10,
    borderRadius: 20,
    marginRight: 10,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default GroupChatScreen;
