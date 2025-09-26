import React, { useEffect, useState, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView,
  SafeAreaView,
  Image,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp, RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../navigation/navigation';
import { API_ENDPOINTS } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';

import { CustomHeader } from '../navigation/BottomTabsNavigator';

import { useNetwork } from '../context/NetworkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

type GroupMember = {
  id: string;
  name: string;
  xp: number;
  created_at: string;
  is_owner: boolean;
  avatar?: string;
};

type GroupData = {
  id: string;
  name: string;
  description: string | null;
  xp: number;
  created_at: string;
  created_by: string;
  member_count: number;
  is_owner: boolean;
  owner_name: string;
  members: GroupMember[];
};

type GroupProfileRouteProps = RouteProp<RootStackParamList, 'GroupProfile'>;

type GroupProfileProps = {
  route: GroupProfileRouteProps;
};

const NetworkIndicator = () => {
  const { isConnected } = useNetwork();
  const { colors } = useTheme();
  
  if (isConnected) {return null; }
  
  return (
    <View style={styles.networkIndicator}>
      <Ionicons name="cloud-offline" size={20} color={colors.error || '#ff6b6b'} />
      <Text style={[styles.networkIndicatorText, { color: colors.error || '#ff6b6b' }]}>
        Offline
      </Text>
    </View>
  );
};

const GroupProfileScreen = ({ route }: GroupProfileProps) => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const { groupId } = route.params;

  const [loading, setLoading] = useState(true);
  const [groupDetails, setGroupDetails] = useState<GroupData | null>(null);
  const [avatarUrls, setAvatarUrls] = useState<Record<string, string>>({});
  const [loadingAvatars, setLoadingAvatars] = useState(false);

  const { isConnected } = useNetwork();

  // After mounting, fetch group details(after returning from settings)
  useFocusEffect(
    useCallback(() => {
      fetchGroupDetails();
      return () => {
        // Cleanup function????
      };
    }, [groupId])
  );
  
  // Load avatars for members 
  useEffect(() => {
    if ((groupDetails?.members ?? []).length > 0) {fetchMemberAvatars(); }
  }, [groupDetails]);

  const fetchGroupDetails = async () => {
    setLoading(true);
    if (!isConnected) {
      Alert.alert('Offline', 'Nie ste pripojený k internetu. Skontrolujte pripojenie a skúste to znova.');
      setLoading(false);
      return;
    }
    try {
      const response = await fetch(API_ENDPOINTS.GROUPS.DETAIL(groupId), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {throw new Error('Failed to fetch group details'); }

      const responseData = await response.json();
      
      if (responseData.success && responseData.data) {
        setGroupDetails(responseData.data);
      } else {
        console.error('false or no data');
      }
    } catch (error) {
      console.error('Error fetching group details:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load avatars for group members
  const fetchMemberAvatars = async () => {
    if (!groupDetails?.members || groupDetails.members.length === 0) return;
    
    setLoadingAvatars(true);
    
    try {
      // Load only the first 5 members
      const membersToLoad = groupDetails.members.slice(0, 3);
      
      // Load avatars for each member in parallel
      await Promise.all(membersToLoad.map(member => fetchUserAvatar(member.id)));
    } catch (error) {
      console.error('Error fetching avatars:', error);
    } finally {
      setLoadingAvatars(false);
    }
  };

  // Load avatar for a specific user
  const fetchUserAvatar = async (userId: string) => {
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

  const handleGroupChat = () => {
    if (!groupDetails) return;
    
    navigation.navigate('GroupChat', { 
      groupId, 
      groupName: groupDetails.name,
      members: groupDetails.members
    });
  };

  const handleSettings = () => {
    if (!groupDetails) return;
    
    navigation.navigate('GroupSettingsFlow', {
      groupId: groupId,
      groupName: groupDetails.name,
      isOwner: groupDetails.is_owner,
    });
  };

  // Xp to level 
  const getLevel = (xp: number) => {
    return Math.floor(Math.sqrt(xp / 100)) + 1;
  };

  const removeMember = async (userId: string, memberName: string) => {
    if (!groupDetails?.is_owner) return;

    Alert.alert(
      "Odstrániť člena",
      `Naozaj chcete odstrániť používateľa ${memberName} zo skupiny?`,
      [
        { text: "Zrušiť", style: "cancel" },
        { 
          text: "Odstrániť", 
          style: "destructive",
          onPress: async () => {
            try {
              const response = await fetch(API_ENDPOINTS.GROUPS.REMOVE_MEMBER(groupId, userId), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              if (!response.ok) throw new Error('Failed to remove member');
              
              Alert.alert('Úspech', 'Člen bol úspešne odstránený zo skupiny');
              fetchGroupDetails(); // reload group details
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Chyba', 'Nepodarilo sa odstrániť člena zo skupiny');
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader />

      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 15, paddingTop: 5 }}>
        <NetworkIndicator />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.text }]}>Načítanie...</Text>
        </View>
      ) : groupDetails ? (
        <>
          <ScrollView>
            {/* navigation bar with settings */}
            <View style={styles.navigationRow}> 
              {//groupDetails.is_owner
               route.params.isMember && (
                <TouchableOpacity onPress={handleSettings}>
                  <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
              )}
            </View>

            {/* Group header */}
            <View style={styles.groupHeaderContainer}>
              <View style={[styles.logoContainer, { backgroundColor: colors.secondary }]}>
                <Ionicons name="people" size={40} color={colors.background} />
              </View>
              
              <Text style={[styles.groupName, { color: colors.text }]}>
                {groupDetails.name}
              </Text>
              
              <Text style={[styles.ownerLabel, { color: colors.text }]}>
                Vlastník: <Text style={{ fontWeight: 'bold' }}>{groupDetails.owner_name}</Text>
              </Text>
            </View>

            {/* Description */}
            {groupDetails.description && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Popis</Text>
                <Text style={[styles.description, { color: colors.text }]}>
                  {groupDetails.description}
                </Text>
              </View>
            )}

            {/* Group stats */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Informácie</Text>
              <View style={styles.infoContainer}>
                <View style={[styles.infoBox, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.infoNumber, { color: colors.background }]}>
                    {groupDetails.member_count}
                  </Text>
                  <Text style={[styles.infoLabel, { color: colors.background }]}>Členovia</Text>
                </View>
                <View style={[styles.infoBox, { backgroundColor: colors.primary }]}>
                  <Text style={[styles.infoNumber, { color: colors.background }]}>
                    {getLevel(groupDetails.xp)}
                  </Text>
                  <Text style={[styles.infoLabel, { color: colors.background }]}>Úroveň skupiny</Text>
                </View>
              </View>
            </View>

            {/* Members list */}
            <View style={[styles.section, { marginBottom: 80 }]}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Členovia</Text>
              {loadingAvatars && (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginBottom: 10 }} />
              )}
              {groupDetails.members && groupDetails.members.length > 0 ? (
                groupDetails.members.map(member => (
                  <View key={member.id} style={[styles.memberItem, { borderBottomColor: colors.border }]}>
                    <View style={styles.memberInfo}>
                      <View style={[styles.avatar, { backgroundColor: colors.secondary }]}>
                        {avatarUrls[member.id] ? (
                          <Image source={{ uri: avatarUrls[member.id] }} style={styles.memberAvatar} />
                        ) : (
                          <Ionicons name="person" size={20} color={colors.background} />
                        )}
                      </View>
                      <View>
                        <View style={styles.memberNameRow}>
                          <Text style={[styles.memberName, { color: colors.text }]}>
                            {member.name}
                          </Text>
                          {member.is_owner && (
                            <View style={[styles.ownerBadge, { backgroundColor: colors.primary }]}>
                              <Text style={[styles.ownerBadgeText, { color: colors.background }]}>
                                Vlastník
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.memberXp, { color: colors.text }]}>
                          XP: {member.xp} (Úroveň {getLevel(member.xp)})
                        </Text>
                      </View>
                    </View>
                    {/* Remove member button (Owner only )*/}
                    {groupDetails.is_owner && !member.is_owner && (
                      <TouchableOpacity
                        style={styles.removeButton}
                        onPress={() => removeMember(member.id, member.name)}
                      >
                        <Ionicons name="close-circle" size={22} color={colors.primary} />
                      </TouchableOpacity>
                    )}
                  </View>
                ))
              ) : (
                <Text style={{ color: colors.text, textAlign: 'center', padding: 10 }}>
                  Žiadni členovia
                </Text>
              )}
            </View>
          </ScrollView>

          {/* Group chat button */}
          {(route.params.isMember) && (
            <TouchableOpacity 
              style={[styles.groupChatButton, { backgroundColor: colors.primary }]}
              onPress={handleGroupChat}
            >
              <Ionicons name="chatbubbles-outline" size={20} color={colors.background} style={styles.chatIcon} />
              <Text style={[styles.groupChatButtonText, { color: colors.background }]}>
              Skupinový chat
              </Text>
            </TouchableOpacity>
            )}
        </>
      ) : (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={50} color={colors.error || '#ff6b6b'} />
          <Text style={[styles.errorText, { color: colors.text }]}>
            Nepodarilo sa načítať skupinu
          </Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: colors.primary }]}
            onPress={fetchGroupDetails}
          >
            <Text style={[styles.retryButtonText, { color: colors.background }]}>
              Skúsiť znova
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 18,
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  retryButtonText: {
    fontWeight: 'bold',
  },
  navigationRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  groupHeaderContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    overflow: 'hidden',
  },
  logo: {
    width: 100,
    height: 100,
  },
  groupName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  ownerLabel: {
    fontSize: 14,
    marginBottom: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    lineHeight: 22,
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 5,
  },
  infoBox: {
    width: '48%',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
  },
  infoNumber: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  infoLabel: {
    marginTop: 5,
  },
  memberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    overflow: 'hidden',
  },
  memberAvatar: {
    width: 40,
    height: 40,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: 8,
  },
  memberXp: {
    fontSize: 14,
    opacity: 0.8,
  },
  ownerBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  ownerBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  groupChatButton: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -80 }],
    width: 160,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  chatIcon: {
    marginRight: 5,
  },
  groupChatButtonText: {
    fontWeight: 'bold',
  },
  removeButton: {
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
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

export default GroupProfileScreen;