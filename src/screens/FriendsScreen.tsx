import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  TextInput,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/apiConfig';

import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/navigation';

// For updating the screen when it is focused(we returned on this screen) 
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

import { OfflineNotice } from '../components/OfflineNotice';
import { useNetwork } from '../context/NetworkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  name: string;
  avatar?: string | null;
  is_friend?: boolean;
  xp?: number;
}

interface Group {
  id: string;
  name: string;
  members_count: number;
  description?: string;
  members?: Array<{ id: string; name: string }>;
  level?: number;
  is_member?: boolean;
  is_owner?: boolean;
}

const NetworkIndicator = () => {
  const { isConnected } = useNetwork();
  const { colors } = useTheme();
  
  if (isConnected) {
    return null;
  }
  
  return (
    <View style={styles.networkIndicator}>
      <Ionicons name="cloud-offline" size={20} color={colors.error || '#ff6b6b'} />
      <Text style={[styles.networkIndicatorText, { color: colors.error || '#ff6b6b' }]}>
        Offline
      </Text>
    </View>
  );
};

const FriendsScreen = () => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('friends');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  const { isConnected } = useNetwork();

  // Cleanup function for search between tabs
  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  }, [activeTab]);

  
  // Function for searching users 
  const handleSearch = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimeout) { clearTimeout(searchTimeout); }
    
    // Set new timeout for search
    if (text.length >= 2) {
      const timeout = setTimeout(() => {
        searchUsers(text);
      }, 500);
      setSearchTimeout(timeout as unknown as NodeJS.Timeout);
    } else {
      setSearchResults([]);
    }
  };
  
  // Search users function
  const searchUsers = async (query: string) => {
    if (!isConnected) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }
    
    if (query.length < 2) return;
    
    setIsSearching(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.FRIENDS.SEARCH}?name=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to search users');
      }
      
      const responseJson = await response.json();
      console.log('Search results:', responseJson);
      
      let users: User[] = [];
      
      if (responseJson.data && Array.isArray(responseJson.data)) {
        users = responseJson.data;
      }
      
      console.log('Processed users:', users);
      setSearchResults(users);
    } catch (error) {
      console.warn('Error searching users, continuing silently:', error);
      setSearchResults([]); // Set empty list on error
      // No Alert to keep it silent; just log a warning for debugging
    } finally {
      setIsSearching(false);
    }
  };
  
  // Очистка поиска
  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Offline notation */}
      <OfflineNotice />

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 15, paddingTop: 5 }}>
        <NetworkIndicator />
      </View>

      {/* MAIN */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Switch between friends and groups */}
        <View style={styles.tabSwitchContainer}>
          <TouchableOpacity 
            style={[
              styles.tabButton,
              activeTab === 'friends' && { backgroundColor: colors.primary },
              { borderColor: colors.primary }
            ]}
            onPress={() => setActiveTab('friends')}
          >
            <Text style={[
              styles.tabButtonText, 
              { color: activeTab === 'friends' ? colors.background : colors.primary }
            ]}>
              Priatelia
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[
              styles.tabButton, 
              activeTab === 'group' && { backgroundColor: colors.primary },
              { borderColor: colors.primary }
            ]}
            onPress={() => setActiveTab('group')}
          >
            <Text style={[
              styles.tabButtonText, 
              { color: activeTab === 'group' ? colors.background : colors.primary }
            ]}>
              Skupiny
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* search panel */}
        <View style={[styles.searchContainer, { backgroundColor: colors.background, borderColor: colors.primary}]}>
          <Ionicons name="search" size={20} color={colors.text} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.text }]}
            placeholder={activeTab === 'friends' ? "Vyhľadať používateľa..." : "Vyhľadať skupinu..."}
            placeholderTextColor={colors.text}
            value={searchQuery}
            onChangeText={handleSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch}>
              <Ionicons name="close-circle" size={20} color={colors.text} />
            </TouchableOpacity>
          )}
        </View>

        {/* content depends on active tab */}
        {activeTab === 'friends' ? (
          <FriendsContent 
            searchResults={searchResults} 
            setSearchResults={setSearchResults}
            isSearching={isSearching}
            searchQuery={searchQuery}
          />
        ) : (
          <GroupsContent 
            searchQuery={searchQuery}
          />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// component for friends
const FriendsContent = ({ 
  searchResults, 
  setSearchResults, 
  isSearching,
  searchQuery
}: { 
  searchResults: User[], 
  setSearchResults: React.Dispatch<React.SetStateAction<User[]>>,
  isSearching: boolean,
  searchQuery: string
}) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const [friends, setFriends] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingFriend, setAddingFriend] = useState<string | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  
  const { isConnected } = useNetwork();

  // For showing profile modal 
  const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  // User list for friends
  useEffect(() => {
    fetchFriends();
  }, []);

  // Function for loading friends
  const fetchFriends = async () => {
    if (!isConnected) {
      setFriends([]); // Set empty list if offline
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(API_ENDPOINTS.FRIENDS.ALL, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch friends');
      }
      
      const responseJson = await response.json();
      console.log('Friends data:', responseJson);
      
      let friendsList: User[] = [];
      
      if (responseJson.data && Array.isArray(responseJson.data)) {
        friendsList = responseJson.data;
      }
      
      console.log('Processed friends:', friendsList);
      setFriends(friendsList);
    } catch (error) {
      console.warn('Failed to fetch friends, continuing silently:', error);
      setFriends([]); // Set empty list on error to avoid showing stale data
      // No Alert here to keep it silent; just log a warning for debugging
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAvatar = async (userId: string) => {
    if (!isConnected) { return;}

    try {
      const response = await fetch(API_ENDPOINTS.AVATARS.USER(userId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.log(`Failed to load avatar for user ${userId}, status: ${response.status}`);
        return null;
      }
      
      // Convert blob to base64
      const blob = await response.blob();
        
      return new Promise((resolve, reject) => {
        const fileReader = new FileReader();
        fileReader.onload = () => {
          const base64 = fileReader.result;
          
          // Save avatar URL in state
          setAvatarUrls(prev => ({
            ...prev,
            [userId]: base64 as string
          }));
          
          resolve(base64);
        };
        fileReader.onerror = reject;
        fileReader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error(`Error fetching avatar for user ${userId}:`, error);
      return null;
    }
  };

  // Load avatars for search results
  useEffect(() => {
    searchResults.forEach(user => {
      if (!avatarUrls[user.id]) {fetchUserAvatar(user.id);}
    });
  }, [searchResults]);

  // Load avatars for friends 
  useEffect(() => {
    friends.forEach(friend => {
      if (!avatarUrls[friend.id]) { fetchUserAvatar(friend.id); }
    });
  }, [friends]); 

  // Add  friend function
  const handleAddFriend = async (userId: string) => {
    if (!isConnected) { return;}

    setAddingFriend(userId);
    try {
      console.log(`Add friend : ${API_ENDPOINTS.FRIENDS.ADD(userId)}`);
      
      const response = await fetch(API_ENDPOINTS.FRIENDS.ADD(userId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        // ???
        body: JSON.stringify({})
      });
            
      // get response text for debugging
      const responseText = await response.text();
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.log("Not a valid JSON response");
      }
      
      if (!response.ok) {
        throw new Error(responseData?.message || `Request failed with status ${response.status}`);
      }
      
      await fetchFriends();      // Update friends list
      
      // Update search results
      const updatedSearchResults = searchResults.map(user => {
        if (user.id === userId) { return { ...user, is_friend: true }; }
        return user;
      });
      setSearchResults(updatedSearchResults);
      
      Alert.alert('Success', 'Friend added successfully!');
    } catch (error) {
      console.error('Error adding friend:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add friend');
    } finally {
      setAddingFriend(null);
    }
  };

  // Check if user is a friend
  const isFriend = (userId: string) => {
    // check in friends list
    const isInFriendsList = friends.some(friend => friend.id === userId);
    
    // Check is_friend flag in search results
    const userInSearchResults = searchResults.find(user => user.id === userId);
    const hasIsFriendFlag = userInSearchResults && 'is_friend' in userInSearchResults && userInSearchResults.is_friend;
    
    return isInFriendsList || hasIsFriendFlag;
  };

  const handleRemoveFriend = async (userId: string) => {
    if (!isConnected) { return;}

    Alert.alert(
      "Potvrdenie",
      "Naozaj chcete odstrániť tohto priateľa?",
      [
        {
          text: "Zrušiť",
          style: "cancel"
        },
        { 
          text: "Odstrániť", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(API_ENDPOINTS.FRIENDS.REMOVE(userId), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (!response.ok) {
                const errorText = await response.text();
                console.error('Error removing friend:', errorText);
                throw new Error('Failed to remove friend');
              }
              
              // Delete friend from friends list
              setFriends(friends.filter(friend => friend.id !== userId));
              
              // Close modal and clear selected friend
              setIsProfileModalVisible(false);
              setSelectedFriend(null);
              
              Alert.alert('Success', 'Friend removed successfully');
            } catch (error) {
              console.error('Error removing friend:', error);
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to remove friend');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={styles.contentContainer}>
      {/* Search section */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <Text style={[styles.resultsTitle, { color: colors.text }]}>
            Výsledky vyhľadávania
          </Text>
          
          {isSearching ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : searchResults.length > 0 ? (
            searchResults.map(user => (
              <View key={user.id} style={[styles.userItem, { borderBottomColor: colors.border }]}>
                {avatarUrls[user.id] ? (
                  <Image 
                    source={{ uri: avatarUrls[user.id] }}
                    style={styles.avatar}
                    onError={() => { 
                      console.log(`Error loading avatar for user ${user.id}`);
                    }}
                  />
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="person" size={24} color={colors.background} />
                  </View>
                )}
                <View style={[styles.userInfo, { marginLeft: 10 }]}>
                  <Text style={[styles.userName, { color: colors.text }]}>{user.name}</Text>
                </View>
                {!isFriend(user.id) ? (
                  <TouchableOpacity 
                    style={[styles.addButton, { backgroundColor: colors.primary }]}
                    disabled={addingFriend === user.id}
                    onPress={() => handleAddFriend(user.id)}
                  >
                    {addingFriend === user.id ? (
                      <ActivityIndicator size="small" color={colors.background} />
                    ) : (
                      <Text style={[styles.addButtonText, { color: colors.background }]}>Pridať</Text>
                    )}
                  </TouchableOpacity>
                ) : (
                  <Text style={{ color: colors.text, fontStyle: 'italic' }}>Priateľ</Text>
                )}
              </View>
            ))
          ) : (
            <Text style={{ color: colors.text, textAlign: 'center', padding: 10 }}>
              Nenašli sa žiadni používatelia
            </Text>
          )}
        </View>
      )}

      <Text style={[styles.title, { color: colors.text }]}>Moji priatelia</Text>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : friends.length > 0 ? (
        friends.map((friend) => (
          <TouchableOpacity 
        key={friend.id} 
        onPress={() => {
          setSelectedFriend(friend);
          setIsProfileModalVisible(true);
        }}
          >
        <FriendItem 
          friend={friend} 
          avatarUrl={avatarUrls[friend.id]}
          onProfilePress={(friend) => {
            setSelectedFriend(friend);
            setIsProfileModalVisible(true);
          }}
        />
          </TouchableOpacity>
        ))
      ) : (
        <Text style={{ color: colors.text, textAlign: 'center', padding: 20 }}>
          Nemáte žiadnych priateľov
        </Text>
      )}

      {/* Friend Profile Modal */}
      {isProfileModalVisible && selectedFriend && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Profil priateľa
              </Text>
              <TouchableOpacity 
                onPress={() => setIsProfileModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalContent}>
              <View style={styles.profileAvatarContainer}>
                {avatarUrls[selectedFriend.id] ? (
                  <Image 
                    source={{ uri: avatarUrls[selectedFriend.id] }}
                    style={styles.profileAvatar}
                    onError={() => { 
                      console.log(`Error loading avatar for friend ${selectedFriend.id}`);
                    }}
                  />
                ) : (
                  <View style={[styles.profileAvatarPlaceholder, { backgroundColor: colors.secondary }]}>
                    <Ionicons name="person" size={40} color={colors.background} />
                  </View>
                )}
              </View>
              
              <Text style={[styles.profileName, { color: colors.text }]}>
                {selectedFriend.name}
              </Text>
              
              <Text style={[styles.profileXP, { color: colors.text }]}>
                XP: {selectedFriend.xp || 0}
              </Text>
              
              <TouchableOpacity 
                style={[styles.removeFriendButton, { backgroundColor: colors.primary }]}
                onPress={() => handleRemoveFriend(selectedFriend.id)}
              >
                <Text style={styles.removeFriendButtonText}>Odstrániť priateľa</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.closeModalButton, { borderColor: colors.primary }]}
                onPress={() => setIsProfileModalVisible(false)}
              >
                <Text style={[styles.closeModalButtonText, { color: colors.primary }]}>Zavrieť</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </View>
  );
};

// Component for each friend showing 
const FriendItem = ({ 
  friend, 
  avatarUrl, 
}: { 
  friend: User, 
  avatarUrl?: string,
  onProfilePress: (friend: User) => void 
}) => {
  const { colors } = useTheme();
  
  return (
    <View style={[styles.friendItem, { borderBottomColor: colors.border }]}>
      <View style={styles.avatarContainer}>
        {avatarUrl ? (
          <Image 
            source={{ uri: avatarUrl }}
            style={styles.avatar}
            onError={() => { 
              console.log(`Error loading avatar for friend ${friend.id}`);
            }}
          />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.secondary }]}>
            <Ionicons name="person" size={24} color={colors.background} />
          </View>
        )}
      </View>
      <View style={styles.friendInfo}>
        <Text style={[styles.friendName, { color: colors.text }]}>{friend.name}</Text>
      </View>

      <Ionicons name="person-outline" size={24} color={colors.primary} />
    </View>
  ); 
};


const GroupsContent = ({ searchQuery }: { searchQuery: string }) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { isConnected } = useNetwork(); 

  // State for group management
  const [myGroup, setMyGroup] = useState<Group | null>(null); // Current group
  const [searchResults, setSearchResults] = useState<Group[]>([]); // Search results
  const [loading, setLoading] = useState(true);
  const [joiningGroup, setJoiningGroup] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  // Group info(not my group)
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [isGroupInfoVisible, setIsGroupInfoVisible] = useState(false);

  // Load all groups on screen focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, fetching current group');
      fetchCurrentGroup();
    }, [])
  );
  
  // Search effect for groups
  useEffect(() => {
    if (searchQuery.length >= 2) {
      searchGroups(searchQuery);
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  // TODO:
  // Get avaible groups for user, and display available groups
  
  const fetchCurrentGroup = async () => {
    setLoading(true); 
    try {
      if (!isConnected) {
        // Todo: Check chase for offline mode
        return null;
        // setMyGroup(null);
        // return null;
      }

      const response = await fetch(API_ENDPOINTS.GROUPS.CURRENT, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      // If user has no group, return null
      if (response.status === 404) {
        console.log('User has no group');
        setMyGroup(null);
        return null;
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch current group: ${response.status}`);
      }
      
      const responseText = await response.text();
      console.log('Raw current group response:', responseText);
      
      try {
        const responseJson = JSON.parse(responseText);
        console.log('Current group data:', responseJson);
        
        if (responseJson.data) {
          setMyGroup(responseJson.data);
          return responseJson.data;
        } else {
          setMyGroup(null);
          return null;
        }
      } catch (e) {
        console.error('Error parsing current group response:', e);
        return null;
      }
    } catch (e) {
      console.error('Error fetching current group:', e);
      if (!isConnected) {
        Alert.alert(
          'Offline režim', 
          'Používate aplikáciu v režime offline. Niektoré údaje nemusia byť aktuálne.'
        );
      }
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  const searchGroups = async (query: string) => {
    if (!isConnected) { return;}

    if (myGroup) {
      if (query.length < 2) return;
    }
    
    setIsSearching(true);
    try {
      const response = await fetch(`${API_ENDPOINTS.GROUPS.SEARCH}?name=${encodeURIComponent(query)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) { throw new Error('Failed to search groups'); }

      const responseJson = await response.json();
      console.log('Search groups results:', responseJson);

      let groups: Group[] = [];

      if (responseJson.data && Array.isArray(responseJson.data)) {
        groups = responseJson.data;
        
        // Delete my group from search results
        if (myGroup) { 
          groups = groups.filter(group => group.id !== myGroup.id);
        }
      }

      console.log('Processed groups:', groups);
      setSearchResults(groups);
    } catch (error) {
      console.error('Error searching groups:', error);
      Alert.alert('Error', 'Failed to search groups');
    } finally {
      setIsSearching(false);
    }
  };
  
  // Join group function
  const handleJoinGroup = async (groupId: string) => {
    if (!isConnected) {
      Alert.alert(
        'Offline režim',
        'Táto akcia nie je dostupná v režime offline. Pripojte sa k internetu a skúste to znova.',
        [{ text: 'OK' }]
      );
      return;
    }
    // If user is already in a group, show alert
    if (myGroup) {
      Alert.alert(
        'Upozornenie',
        'Už ste členom skupiny. Môžete byť členom iba jednej skupiny.',
        [{ text: 'OK' }]
      );
      return;
    }

    setJoiningGroup(groupId);
    try {
      const response = await fetch(API_ENDPOINTS.GROUPS.JOIN(groupId), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error joining group:', errorText);
        throw new Error('Failed to join group');
      }
      
      await fetchCurrentGroup();
      
      // Update search results to remove the joined group
      const searchResponse = await fetch(`${API_ENDPOINTS.GROUPS.SEARCH}?name=${encodeURIComponent(searchQuery)}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.data && Array.isArray(searchData.data)) {
          // Remove the joined group from search results
            const updatedResults: Group[] = searchData.data.filter((group: Group) => group.id !== groupId);
          setSearchResults(updatedResults);
        }
      }
      
      Alert.alert('Success', 'Úspešne ste sa pripojili k skupine!');
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to join group');
    } finally {
      setJoiningGroup(null);
    }
  };
  
  // Go to group profile function
  const handleGroupPress = (group: Group) => {
    if (!isConnected) { return;}

    navigation.navigate('GroupProfile', {
      groupId: group.id,
      groupName: group.name,
      description: group.description || '',
      members: group.members || [],
      level: group.level || 0,
      isMember: group.is_member || false, // add || isOwner if needed
    });
  };
  
  return (
    <View style={styles.contentContainer}>
      {/* Search section for groups */}
      {searchQuery.length > 0 && (
        <View style={styles.searchResultsContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text style={[styles.resultsTitle, { color: colors.text }]}>
              Výsledky vyhľadávania
            </Text>
            
            <TouchableOpacity 
            onPress={() => searchGroups(searchQuery)}
            disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Ionicons name="refresh" size={24} color={colors.primary} />
              )}
            </TouchableOpacity>
          </View>

          {isSearching ? (
            <ActivityIndicator size="small" color={colors.primary} style={styles.loader} />
          ) : searchResults.length > 0 ? (
            searchResults.map(group => (
              // Group info
              <TouchableOpacity 
                key={group.id} 
                style={[styles.groupItem, { borderBottomColor: colors.border }]}
                onPress={() => {
                  setSelectedGroup(group);
                  setIsGroupInfoVisible(true);
                }}
              >
                <View style={[styles.groupAvatarContainer, { backgroundColor: colors.secondary }]}>
                  <Ionicons name="people" size={24} color={colors.background} />
                </View>
                <View style={styles.groupInfo}>
                  <Text style={[styles.groupName, { color: colors.text }]}>{group.name}</Text>
                  <Text style={[styles.groupMembers, { color: colors.text }]}>
                    {group.members_count}{" "}
                    {group.members_count === 1
                      ? "člen"
                      : group.members_count > 1 && group.members_count < 5
                      ? "členovia"
                      : "členov"}
                  </Text>
                </View>
                <TouchableOpacity 
                  style={[styles.joinButton, { borderColor: colors.primary }]}
                  onPress={(e) => {
                    e.stopPropagation(); // Prevent triggering group press event
                    handleJoinGroup(group.id);
                  }}
                  disabled={joiningGroup === group.id}
                >
                  {joiningGroup === group.id ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Text style={[styles.joinButtonText, { color: colors.primary }]}>Pripojiť</Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={{ color: colors.text, textAlign: 'center', padding: 10 }}>
              Nenašli sa žiadne skupiny
            </Text>
          )}
        </View>
      )}

      {/* Current group section */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <Text style={[styles.title, { color: colors.text }]}>Moja skupina</Text>
        {/* <TouchableOpacity onPress={() => fetchCurrentGroup()} */}
      </View>
      
      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
      ) : myGroup ? (
        <TouchableOpacity 
          key={myGroup.id} 
          style={[styles.groupItem, { borderBottomColor: colors.border }]}
          onPress={() => handleGroupPress(myGroup)}
        >
          <View style={[styles.groupAvatarContainer, { backgroundColor: colors.secondary }]}>
            <Ionicons name="people" size={24} color={colors.background} />
          </View>
          <View style={styles.groupInfo}>
            <Text style={[styles.groupName, { color: colors.text }]}>{myGroup.name}</Text>
            <Text style={[styles.groupMembers, { color: colors.text }]}>
              {myGroup.members_count}{" "}
              {myGroup.members_count === 1
                ? "člen"
                : myGroup.members_count > 1 && myGroup.members_count < 5
                ? "členovia"
                : "členov"}
            </Text>
          </View>
          <View style={styles.messageButton}>
            <Ionicons name="chevron-forward" size={24} color={colors.primary} />
          </View>
        </TouchableOpacity>
      ) : (
        <View style={styles.noGroupContainer}>
          <Text style={{ color: colors.text, textAlign: 'center', padding: 10, marginBottom: 10 }}>
            Nie ste členom žiadnej skupiny
          </Text>
          if (isConnected) {
            <TouchableOpacity 
              style={[styles.createGroupButton, { backgroundColor: colors.primary }]}
              onPress={() =>{
                if (!isConnected) {
                  Alert.alert( 
                    'Offline režim',
                    'Táto akcia nie je dostupná v režime offline. Pripojte sa k internetu a skúste to znova.',
                    [{ text: 'OK' }]
                  );
                } else {
                  navigation.navigate('CreateGroup')
                }
              }}
            >
              <Text style={[styles.createGroupButtonText, { color: colors.background }]}>
                Vytvoriť skupinu
              </Text>
            </TouchableOpacity>
          }
        </View>
      )}

      {/* Group info modal */}
      {isGroupInfoVisible && selectedGroup && (
        <View style={styles.groupInfoOverlay}>
          <View style={[styles.groupInfoModal, { backgroundColor: colors.background }]}>
            <View style={styles.groupInfoHeader}>
              <Text style={[styles.groupInfoTitle, { color: colors.text }]}>
                O skupine
              </Text>
              <TouchableOpacity 
                onPress={() => setIsGroupInfoVisible(false)}
                style={styles.groupInfoCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
            
            <View style={styles.groupInfoContent}>
              <View style={[styles.groupInfoIcon, { backgroundColor: colors.secondary }]}>
                <Ionicons name="people" size={30} color={colors.background} />
              </View>
              
              <Text style={[styles.groupInfoName, { color: colors.text }]}>
                {selectedGroup.name}
              </Text>
              
              <Text style={[styles.groupInfoStats, { color: colors.text }]}>
                {selectedGroup.members_count}{" "}
                {selectedGroup.members_count === 1
                  ? "člen"
                  : selectedGroup.members_count > 1 && selectedGroup.members_count < 5
                  ? "členovia"
                  : "členov"}
              </Text>
              
              {selectedGroup.description && (
                <View style={styles.groupInfoDescriptionContainer}>
                  <Text style={[styles.groupInfoDescriptionLabel, { color: colors.text }]}>
                    Popis:
                  </Text>
                  <Text style={[styles.groupInfoDescription, { color: colors.text }]}>
                    {selectedGroup.description || 'Bez popisu'}
                  </Text>
                </View>
              )}
              
              <View style={styles.groupInfoButtonsContainer}>
                <TouchableOpacity 
                  style={[styles.groupInfoJoinButton, { backgroundColor: colors.primary }]}
                  onPress={() => {
                    handleJoinGroup(selectedGroup.id);
                    setIsGroupInfoVisible(false);
                  }}
                  disabled={joiningGroup === selectedGroup.id || !!myGroup}
                >
                  {joiningGroup === selectedGroup.id ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.groupInfoJoinButtonText}>
                      {myGroup ? 'Už ste v skupine' : 'Pripojiť sa'}
                    </Text>
                  )}
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.groupInfoViewButton, { borderColor: colors.primary }]}
                  onPress={() => {
                    setIsGroupInfoVisible(false);
                    handleGroupPress(selectedGroup); // Open group profile
                  }}
                >
                  <Text style={[styles.groupInfoViewButtonText, { color: colors.primary }]}>
                    Zobraziť profil
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loader: {
    marginVertical: 20,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  avatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 15,
  },
  tabSwitchContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    borderRadius: 10,
    overflow: 'hidden',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
  },
  tabButtonText: {
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    marginBottom: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  searchResultsContainer: {
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  userStatus: {
    fontSize: 14,
  },
  addButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  addButtonText: {
    fontWeight: 'bold',
  },
  contentContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  messageButton: {
    padding: 10,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  groupAvatarContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  groupInfo: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  groupMembers: {
    fontSize: 14,
  },
  joinButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
    borderWidth: 1,
  },
  joinButtonText: {
    fontWeight: 'bold',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContainer: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  modalContent: {
    alignItems: 'center',
  },
  profileAvatarContainer: {
    marginBottom: 15,
  },
  profileAvatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileAvatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  profileXP: {
    fontSize: 16,
    marginBottom: 20,
  },
  removeFriendButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 15,
  },
  removeFriendButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  closeModalButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    borderWidth: 1,
  },
  closeModalButtonText: {
    fontWeight: 'bold',
  },
  noGroupContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  createGroupButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 150,
  },
  createGroupButtonText: {
    fontWeight: 'bold',
  },
  groupInfoOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  groupInfoModal: {
    width: '80%',
    borderRadius: 10,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  groupInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  groupInfoCloseButton: {
    padding: 5,
  },
  groupInfoContent: {
    alignItems: 'center',
  },
  groupInfoIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  groupInfoName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
  },
  groupInfoStats: {
    fontSize: 16,
    marginBottom: 15,
  },
  groupInfoDescriptionContainer: {
    width: '100%',
    marginBottom: 15,
  },
  groupInfoDescriptionLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  groupInfoDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  groupInfoButtonsContainer: {
    width: '100%',
  },
  groupInfoJoinButton: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  groupInfoJoinButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  groupInfoViewButton: {
    paddingVertical: 10,
    borderRadius: 5,
    alignItems: 'center',
    borderWidth: 1,
  },
  groupInfoViewButtonText: {
    fontWeight: 'bold',
  },
  networkIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
  },
  networkIndicatorText: {
    marginLeft: 5,
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default FriendsScreen;
