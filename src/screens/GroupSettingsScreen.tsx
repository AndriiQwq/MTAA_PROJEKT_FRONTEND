import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { GroupSettingsStackParamList, RootStackParamList } from '../navigation/navigation';
import { CustomHeader } from '../navigation/BottomTabsNavigator';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/apiConfig';

type GroupSettingsScreenRouteProp = RouteProp<GroupSettingsStackParamList, 'GroupSettings'>;

const GroupSettingsScreen = () => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation<NavigationProp<GroupSettingsStackParamList>>();
  const rootNavigation = useNavigation<NavigationProp<RootStackParamList>>();
  const route = useRoute<GroupSettingsScreenRouteProp>();
  const { groupId, groupName, isOwner } = route.params;
  
  const [loading, setLoading] = useState(false);

  const handleLeaveGroup = () => {
    Alert.alert(
      "Opustiť skupinu",
      "Naozaj chcete opustiť túto skupinu?",
      [
        {
          text: "Zrušiť",
          style: "cancel"
        },
        { 
          text: "Opustiť", 
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(API_ENDPOINTS.GROUPS.LEAVE, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!response.ok) {throw new Error('Failed to leave group');}

              Alert.alert(
                'Úspech', 
                'Úspešne ste opustili skupinu',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    rootNavigation.reset({
                      index: 0,
                      routes: [
                        { 
                          name: 'Main',
                          state: {
                            routes: [{ name: 'Friends' }],
                            index: 0
                          }
                        }
                      ]
                    });
                  } 
                }]
              );
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Chyba', 'Nepodarilo sa opustiť skupinu');
            } finally {
              setLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  const handleDeleteGroup = () => {
    Alert.alert(
      "Vymazať skupinu",
      "Naozaj chcete vymazať túto skupinu? Táto akcia je nevratná.",
      [
        {
          text: "Zrušiť",
          style: "cancel"
        },
        { 
          text: "Vymazať", 
          onPress: async () => {
            setLoading(true);
            try {
              const response = await fetch(API_ENDPOINTS.GROUPS.DELETE(groupId), {
                method: 'DELETE',
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });

              if (!response.ok) {
                throw new Error('Failed to delete group');
              }

              Alert.alert(
                'Úspech', 
                'Skupina bola úspešne vymazaná',
                [{ 
                  text: 'OK', 
                  onPress: () => {
                    rootNavigation.reset({
                      index: 0,
                      routes: [
                        { 
                          name: 'Main',
                          state: {
                            routes: [{ name: 'Friends' }],
                            index: 0
                          }
                        }
                      ]
                    });
                  } 
                }]
              );
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Chyba', 'Nepodarilo sa vymazať skupinu');
            } finally {
              setLoading(false);
            }
          },
          style: "destructive"
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <CustomHeader />
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
      
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            {isOwner ? 'Nastavenia skupiny' : 'Skupina'}
          </Text>
        </View>
        
        {/* OWNER OPTIONS */}
        {isOwner ? (
          <>
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Názov skupiny</Text>
              <TouchableOpacity 
                style={[styles.optionButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('EditGroupName', { groupId, currentName: groupName })}
                disabled={loading}
              >
                <Text style={styles.optionButtonText}>Zmeniť názov skupiny</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.text }]}>Popis skupiny</Text>
              <TouchableOpacity 
                style={[styles.optionButton, { backgroundColor: colors.primary }]}
                onPress={() => navigation.navigate('EditGroupDescription', { groupId, currentDescription: '' })}
                disabled={loading}
              >
                <Text style={styles.optionButtonText}>Zmeniť popis skupiny</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.deleteButton, { backgroundColor: colors.error || '#ff6b6b' }]}
                onPress={handleDeleteGroup}
                disabled={loading}
              >
                <Text style={styles.deleteButtonText}>Vymazať skupinu</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* MEMBER OPTIONS */
          <View style={styles.memberOptions}>
            <Text style={[styles.memberText, { color: colors.text }]}>
              Ste členom skupiny "{groupName}"
            </Text>
            
            <TouchableOpacity 
              style={[styles.leaveButton, { backgroundColor: colors.error || '#ff6b6b' }]}
              onPress={handleLeaveGroup}
              disabled={loading}
            >
              <Text style={styles.leaveButtonText}>Opustiť skupinu</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  content: {
    padding: 20,
    flex: 1,
  },
  header: {
    marginBottom: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  optionButton: {
    padding: 15,
    borderRadius: 4,
  },
  optionButtonText: {
    color: 'white',
    textAlign: 'center',
  },
  actionButtons: {
    paddingVertical: 25,
    borderRadius: 4,
  },
  dangerButton: {
    padding: 15,
    borderRadius: 4,
    marginBottom: 20,
  },
  dangerButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 15,
    borderRadius: 4,
  },
  deleteButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  memberOptions: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 30,
  },
  leaveButton: {
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 4,
  },
  leaveButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 16,
  }
});

export default GroupSettingsScreen;
