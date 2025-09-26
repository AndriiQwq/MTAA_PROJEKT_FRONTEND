import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  ScrollView, 
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigation';
import { OfflineNotice } from '../components/OfflineNotice';
import { useNetwork } from '../context/NetworkContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../config/apiConfig';
import { useApiClient } from '../utils/apiClient';
import { Accelerometer } from 'expo-sensors';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

type Subscription = { remove: () => void };

interface UserProfile {
  id: string;
  name: string;
  xp: number;
  created_at: string;
  group_id: string | null;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  condition_type: string;
  condition_value: number;
  icon_path: string;
  unlocked: boolean;
  achieved_at: string | null;
  current_value: number | null;
  last_updated: string | null;
  progress_percent: number;
}

interface ProfileStats {
  message_count: number;
  achievements_count: number;
}

const getLevel = (xp: number) => {
  return Math.floor(Math.sqrt(xp / 100)) + 1;
};

const calculateXpProgress = (xp: number) => {
  const level = getLevel(xp);
  const currentLevelMinXp = ((level - 1) * (level - 1)) * 100;
  const nextLevelXp = (level * level) * 100;
  
  return {
    progressPercent: Math.min(100, Math.round(((xp - currentLevelMinXp) / (nextLevelXp - currentLevelMinXp)) * 100)),
    xpToNextLevel: nextLevelXp - xp
  };
};

const AchievementItem = ({ 
  achievement, 
  colors,
  isTablet
}: { 
  achievement: Achievement,
  colors: any,
  isTablet: boolean
}) => {
  const getIconName = (type: string) => {
    switch (type) {
      case 'message_sent':
        return 'chatbubble-outline';
      case 'login_count':
        return 'log-in-outline';
      default:
        return 'trophy-outline';
    }
  };

  return (
    <View style={[
      styles.achievementItem, 
      isTablet && styles.tabletAchievementItem,
      { 
        backgroundColor: achievement.unlocked 
          ? colors.primary 
          : colors.secondary,
        opacity: achievement.unlocked ? 1 : 0.7
      }
    ]}>
      <View style={styles.achievementIcon}>
        <Ionicons 
          name={getIconName(achievement.condition_type)} 
          size={isTablet ? 30 : 24} 
          color={achievement.unlocked ? colors.background : colors.primary} 
        />
      </View>
      
      <View style={styles.achievementInfo}>
        <Text style={[
          styles.achievementTitle, 
          isTablet && styles.tabletAchievementTitle,
          { color: achievement.unlocked ? colors.background : colors.text }
        ]}>
          {achievement.title}
        </Text>
        
        <Text style={[
          styles.achievementDesc, 
          isTablet && styles.tabletAchievementDesc,
          { color: achievement.unlocked ? colors.background : colors.text }
        ]}>
          {achievement.description}
        </Text>
        
        {!achievement.unlocked && (
          <View style={styles.progressContainer}>
            <View style={[
              styles.progressBar, 
              { 
                backgroundColor: colors.backgroundDarker || colors.background,
                width: '100%'
              }
            ]}>
              <View style={[
                styles.progressFill, 
                { 
                  backgroundColor: colors.primary, 
                  width: `${achievement.progress_percent}%`
                }
              ]} />
            </View>
            <Text style={[
              styles.progressText, 
              { color: colors.text }
            ]}>
              {achievement.progress_percent}%
            </Text>
          </View>
        )}
        
        {achievement.unlocked && achievement.achieved_at && (
          <Text style={[
            styles.achievedDate, 
            { color: colors.background }
          ]}>
            Získané: {new Date(achievement.achieved_at).toLocaleDateString()}
          </Text>
        )}
      </View>
    </View>
  );
};

const ProfileScreen = () => {
  const { colors, isTablet } = useTheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const { isConnected } = useNetwork();
  const api = useApiClient();

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);

  useFocusEffect(
    useCallback(() => {
      console.log('Profile screen is focused, fetching data...');
      fetchUserProfile();
    }, [isConnected])
  );

  useEffect(() => {
    let subscription: Subscription | null = null;
    
    const _subscribe = () => {
      subscription = Accelerometer.addListener(data => {
        const { x, y, z } = data;
        const acceleration = Math.sqrt(x*x + y*y + z*z);
        
        if (acceleration > 1.8) { fetchUserProfile();}
      });
      
      Accelerometer.setUpdateInterval(200);
    };
    
    const _unsubscribe = () => {
      subscription && subscription.remove();
      subscription = null;
    };
    _subscribe();
    
    return () => _unsubscribe();
  }, []);

  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);
      if (!isConnected) {
        setIsLoadingProfile(false);
        return;
      }
      const profileResponse = await api.get(API_ENDPOINTS.USERS.PROFILE);
      if (profileResponse.ok) {
        const data = await profileResponse.json();
        if (data.success) {
          setProfileData(data.data);
          setProfileStats(data.stats);
          if (data.achievements && Array.isArray(data.achievements)) {
            setAchievements(data.achievements);
          }
        }
      }

      try {
        const avatarResponse = await api.get(API_ENDPOINTS.AVATARS.OWN);
        if (avatarResponse.ok) {
          const blob = await avatarResponse.blob();
          const reader = new FileReader();
          reader.readAsDataURL(blob);
          reader.onload = () => setProfilePhoto(reader.result as string);
        }
      } catch (e) {
        console.error('Error fetching avatar:', e);
      }
    } catch (e) {
      console.error('Error fetching user data:', e);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  const level = profileData ? getLevel(profileData.xp) : 1;
  const { progressPercent, xpToNextLevel } = profileData 
    ? calculateXpProgress(profileData.xp) 
    : { progressPercent: 0, xpToNextLevel: 100 };

  const renderProfileHeader = () => (
    <View style={isTablet ? styles.tabletProfileHeader : styles.fullWidthContainer}>
      <View style={isTablet ? styles.tabletProfileImageContainer : styles.profileImageContainer}>
        {profilePhoto ? (
          <Image source={{ uri: profilePhoto }} style={isTablet ? styles.tabletProfileImage : styles.profileImage} />
        ) : (
          <View style={[
            isTablet ? styles.tabletProfileImagePlaceholder : styles.profileImagePlaceholder, 
            { backgroundColor: colors.secondary }
          ]}>
            <Ionicons name="person" size={isTablet ? 60 : 40} color={colors.primary} />
          </View>
        )}
      </View>
    
      <View style={isTablet ? styles.tabletProfileInfo : styles.profileInfo}>
        <View style={styles.nameContainer}>
          <Text style={[
            styles.profileName, 
            isTablet && styles.tabletProfileName,
            { color: colors.text }
          ]}>
            {profileData?.name || 'Používateľ'}
          </Text>
          
          <TouchableOpacity 
            style={styles.settingsButton}
            onPress={() => navigation.navigate('SettingsFlow')}
          >
            <Ionicons name="settings-outline" size={isTablet ? 30 : 24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {profileData && (
          <View style={styles.memberSinceContainer}>
            <Text style={[
              styles.memberSince, 
              isTablet && styles.tabletMemberSince,
              { color: colors.text }
            ]}>
              Člen od: {new Date(profileData.created_at).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const renderLevelProgress = () => (
    <View style={isTablet ? styles.tabletLevelContainer : styles.fullWidthContainer}>
      <View style={styles.levelContainer}>
        <View style={styles.levelHeaderRow}>
          <Text style={[
            styles.levelTitle, 
            isTablet && styles.tabletLevelTitle,
            { color: colors.text }
          ]}>Úroveň {level}</Text>
          <Text style={[
            styles.xpText, 
            isTablet && styles.tabletXpText,
            { color: colors.text }
          ]}>
            {profileData?.xp || 0} XP
          </Text>
        </View>
        
        <View style={[styles.xpProgressContainer, { backgroundColor: colors.secondary }]}>
          <View 
            style={[
              styles.xpProgressBar, 
              { 
                width: `${progressPercent}%`,
                backgroundColor: colors.primary 
              }
            ]} 
          />
        </View>
        
        <Text style={[
          styles.xpToNextLevel, 
          isTablet && styles.tabletXpToNextLevel,
          { color: colors.text }
        ]}>
          {xpToNextLevel} XP do ďalšej úrovne
        </Text>
      </View>
    </View>
  );

  const renderStats = () => (
    <View style={isTablet ? styles.tabletStatsContainer : styles.fullWidthContainer}>
      <Text style={[
        styles.sectionTitle, 
        isTablet && styles.tabletSectionTitle,
        { color: colors.text }
      ]}>Prehľad</Text>
      <View style={isTablet ? styles.tabletStatsGrid : styles.statsGrid}>
        <View style={[styles.statBox, isTablet && styles.tabletStatBox, { backgroundColor: colors.primary }]}>
          <Text style={[styles.statValue, isTablet && styles.tabletStatValue, { color: colors.background }]}>{level}</Text>
          <Text style={[styles.statLabel, isTablet && styles.tabletStatLabel, { color: colors.background }]}>Úroveň</Text>
        </View>
        <View style={[styles.statBox, isTablet && styles.tabletStatBox, { backgroundColor: colors.primary }]}>
          <Text style={[styles.statValue, isTablet && styles.tabletStatValue, { color: colors.background }]}>{profileData?.xp || 0}</Text>
          <Text style={[styles.statLabel, isTablet && styles.tabletStatLabel, { color: colors.background }]}>XP celkom</Text>
        </View>
        <View style={[styles.statBox, isTablet && styles.tabletStatBox, { backgroundColor: colors.primary }]}>
          <Text style={[styles.statValue, isTablet && styles.tabletStatValue, { color: colors.background }]}>
            {profileStats?.message_count || 0}
          </Text>
          <Text style={[styles.statLabel, isTablet && styles.tabletStatLabel, { color: colors.background }]}>Správy</Text>
        </View>
        <View style={[styles.statBox, isTablet && styles.tabletStatBox, { backgroundColor: colors.primary }]}>
          <Text style={[styles.statValue, isTablet && styles.tabletStatValue, { color: colors.background }]}>
            {profileStats?.achievements_count || 0}
          </Text>
          <Text style={[styles.statLabel, isTablet && styles.tabletStatLabel, { color: colors.background }]}>Dosiahnutia</Text>
        </View>
      </View>
    </View>
  );

  const renderAchievements = () => (
    <View style={isTablet ? styles.tabletAchievementsContainer : styles.fullWidthContainer}>
      <Text style={[
        styles.sectionTitle, 
        isTablet && styles.tabletSectionTitle,
        { color: colors.text }
      ]}>Dosiahnutia</Text>
      {achievements.length > 0 ? (
        <View style={isTablet ? styles.tabletAchievementsGrid : styles.achievementsContainer}>
          {achievements.map(achievement => (
            <AchievementItem 
              key={achievement.id} 
              achievement={achievement} 
              colors={colors} 
              isTablet={isTablet}
            />
          ))}
        </View>
      ) : (
        <Text style={[
          styles.comingSoonText, 
          isTablet && styles.tabletComingSoonText,
          { color: colors.text }
        ]}>
          Zatiaľ nemáte žiadne dosiahnutia
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />
      <OfflineNotice />

      <ScrollView style={{ flex: 1 }}>
        {isLoadingProfile ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <View style={[styles.profileSection, isTablet && styles.tabletProfileSection]}>
            {isTablet ? (
              <>
                <View style={styles.tabletSidebar}>
                  {renderProfileHeader()}
                  {renderLevelProgress()}
                </View>
                <View style={styles.tabletMainContent}>
                  {renderStats()}
                  {renderAchievements()}
                </View>
              </>
            ) : (
              <View style={styles.mobileContainer}>
                {renderProfileHeader()}
                {renderLevelProgress()}
                {renderStats()}
                {renderAchievements()}
              </View>
            )}
          </View>
        )}
      </ScrollView>
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
    padding: 50,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  profileSection: {
    padding: 15,
  },
  tabletProfileSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tabletSidebar: {
    flex: 1,
    paddingRight: 15,
    minWidth: 250,
    alignItems: 'center',
  },
  tabletMainContent: {
    flex: 3,
    paddingLeft: 15,
    minWidth: 450,
  },
  mobileContainer: {
    flex: 1,
    alignItems: 'center',
  },
  fullWidthContainer: {
    width: '100%',
  },
  tabletProfileHeader: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tabletProfileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  tabletProfileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabletProfileImagePlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tabletProfileInfo: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  tabletProfileName: {
    fontSize: 30,
    fontWeight: 'bold',
  },
  tabletMemberSince: {
    fontSize: 16,
    fontStyle: 'italic',
  },
  tabletLevelContainer: {
    width: '100%',
    marginTop: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  tabletLevelTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  tabletXpText: {
    fontSize: 18,
  },
  tabletXpToNextLevel: {
    fontSize: 16,
    textAlign: 'right',
  },
  tabletStatsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  tabletSectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  tabletStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabletStatBox: {
    width: '30%',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tabletStatValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  tabletStatLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  tabletAchievementsContainer: {
    width: '100%',
    marginTop: 20,
  },
  tabletAchievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  tabletAchievementItem: {
    width: '45%',
    flexDirection: 'row',
    borderRadius: 15,
    padding: 20,
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  tabletAchievementTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  tabletAchievementDesc: {
    fontSize: 16,
    marginBottom: 8,
  },
  tabletComingSoonText: {
    fontSize: 16,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 15,
  },
  profileImageContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  profileImagePlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    marginBottom: 20,
    width: '100%',
    alignItems: 'center',
  },
  nameContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  memberSinceContainer: {
    marginTop: 5,
  },
  memberSince: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  settingsButton: {
    padding: 5,
  },
  levelContainer: {
    marginBottom: 20,
    width: '100%',
  },
  levelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  levelTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  xpText: {
    fontSize: 16,
  },
  xpProgressContainer: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 5,

  },
  xpProgressBar: {
    height: '100%',
  },
  xpToNextLevel: {
    fontSize: 14,
    textAlign: 'right',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statBox: {
    width: '48%',
    borderRadius: 10,
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  comingSoonText: {
    fontSize: 14,
    textAlign: 'center',
    fontStyle: 'italic',
    marginVertical: 10,
  },
  achievementsContainer: {
    marginBottom: 20,
  },
  achievementItem: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
  },
  achievementIcon: {
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  achievementInfo: {
    flex: 1,
  },
  achievementTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  achievementDesc: {
    fontSize: 14,
    marginBottom: 6,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  progressBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 12,
    width: 35,
    textAlign: 'right',
  },
  achievedDate: {
    fontSize: 12,
    marginTop: 6,
    fontStyle: 'italic',
  },
});


export default ProfileScreen;
