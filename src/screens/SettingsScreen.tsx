import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { SettingsStackParamList } from '../navigation/navigation';
import { navigationRef } from '../navigation/navigation';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/apiConfig';
import { Accelerometer } from 'expo-sensors';
import AsyncStorage from '@react-native-async-storage/async-storage';


type Subscription = { remove: () => void };

type SettingsScreenNavigationProp = NativeStackNavigationProp<SettingsStackParamList>;

const SettingsScreen = () => {
  const navigation = useNavigation<SettingsScreenNavigationProp>();
  const { colors, toggleTheme, isDarkMode } = useTheme();
  const { logout, token } = useAuth();

  const [showAppInfo, setShowAppInfo] = useState(false);
  const [isShakeDetectorActive, setIsShakeDetectorActive] = useState(true);
  const [lastShakeTime, setLastShakeTime] = useState(0);
  
  const [showReportBugModal, setShowReportBugModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [bugReportText, setBugReportText] = useState('');
  const [helpRequestText, setHelpRequestText] = useState('');

  const handleReportBugSubmit = () => {
    console.log('Nahlásená chyba:', bugReportText);
    setBugReportText('');
    setShowReportBugModal(false);
  };

  const handleHelpRequestSubmit = () => {
    console.log('Žiadosť o pomoc:', helpRequestText);
    setHelpRequestText('');
    setShowHelpModal(false);
  };


  useEffect(() => {
     const loadShakeDetectorState = async () => {
      try {
        const savedState = await AsyncStorage.getItem('shakeDetectorActive');
        if (savedState !== null) {
          setIsShakeDetectorActive(savedState === 'true');
        }
      } catch (error) {
        console.error('Error loading shake detector state:', error);
      }
    };
    
    loadShakeDetectorState();
  }, []);

  useEffect(() => {
    let subscription: Subscription | null = null;
    
    const _subscribe = () => {
      subscription = Accelerometer.addListener(data => {
        const { x, y, z } = data;
        const acceleration = Math.sqrt(x*x + y*y + z*z);
        
        if (isShakeDetectorActive) {
          const currentTime = Date.now();
          
          if (currentTime - lastShakeTime > 1000) {
            if (acceleration > 1.8) {
              toggleTheme();
              setLastShakeTime(currentTime);
            }
          }
        }
      });
      
      Accelerometer.setUpdateInterval(200);
    };
    
    const _unsubscribe = () => {
      subscription && subscription.remove();
      subscription = null;
    };
    
    _subscribe();
    
    return () => _unsubscribe();
  }, [isShakeDetectorActive, lastShakeTime, toggleTheme]);

  const handleShakeDetectorToggle = useCallback(() => {
    const newState = !isShakeDetectorActive;
    setIsShakeDetectorActive(newState);
    try {
      AsyncStorage.setItem('shakeDetectorActive', newState.toString());
    } catch (error) {
      console.error('Error saving shake detector state:', error);
    }
  }, [isShakeDetectorActive]);

  const showTermsOfUse = () => {
    Alert.alert(
      "Podmienky používania"
    );
  };

  const showPrivacyPolicy = () => {
    Alert.alert(
      "Ochrana súkromia"
    );
  };
    
  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>

          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <Text style={[styles.headerTitle, { color: colors.text }]}>Nastavenia</Text>

          <TouchableOpacity onPress={() => navigation.goBack()}>
              <Text style={[styles.doneButton, { color: colors.primary }]}>Hotovo</Text>
          </TouchableOpacity>

        </View>
        
        {/* Settings */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Účet</Text>
            
            <TouchableOpacity 
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => navigation.navigate('Preferences')}
            >
                <Text style={[styles.settingText, { color: colors.text }]}>Preferencie</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.tertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity
                style={[styles.settingItem, { borderBottomColor: colors.border }]}
                onPress={() => navigation.navigate('ProfileSettings')}
            >
                <Text style={[styles.settingText, { color: colors.text }]}>Profil</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.tertiary} />
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.settingItem, { borderBottomColor: colors.border }]}>
                <Text style={[styles.settingText, { color: colors.text }]}>Nastavenia súkromia</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.tertiary} />
            </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Prístupnosť a vzhľad</Text>
          
          <TouchableOpacity
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => navigation.navigate('AccessibilitySettings')}
          >
            <Text style={[styles.settingText, { color: colors.text }]}>Prístupnosť</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.tertiary} />
          </TouchableOpacity>

        </View>
        
        {/* Support Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => setShowReportBugModal(true)}
          >
            <Text style={[styles.settingText, { color: colors.text }]}>Nahlásiť chybu</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.tertiary} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.settingItem, { borderBottomColor: colors.border }]}
            onPress={() => setShowHelpModal(true)}
          >
            <Text style={[styles.settingText, { color: colors.text }]}>Potrebujem pomoc</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.tertiary} />
          </TouchableOpacity>

        </View>
        
        {/* Dark/Light Mode Section */}
        <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Vzhľad</Text>
            
            <View style={styles.themeSelector}>
                <TouchableOpacity 
                style={[
                    styles.themeButton, 
                    { backgroundColor: isDarkMode ? colors.primary : '#000' }
                ]}
                onPress={() => !isDarkMode && toggleTheme()}
                >
                    <Ionicons name="moon" size={20} color={isDarkMode ? colors.background : "#fff"} />
                    <Text style={{ color: isDarkMode ? colors.background : "#fff", marginLeft: 5 }}>DARK</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                style={[
                    styles.themeButton, 
                    { backgroundColor: !isDarkMode ? colors.primary : '#fff' }
                ]}
                onPress={() => isDarkMode && toggleTheme()}
                >
                    <Ionicons name="sunny" size={20} color={!isDarkMode ? colors.background : "#000"} />
                    <Text style={{ color: !isDarkMode ? colors.background : "#000", marginLeft: 5 }}>LIGHT</Text>
                </TouchableOpacity>
            </View>

            {/* Shake to toggle theme setting */}
            <View style={[styles.settingItem, { borderBottomColor: colors.border, marginTop: 15 }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons name="phone-portrait-outline" size={20} color={colors.text} style={{ marginRight: 8 }} />
                    <Text style={[styles.settingText, { color: colors.text }]}>
                        Prepnúť tému potrasením zariadenia
                    </Text>
                </View>
                <TouchableOpacity onPress={handleShakeDetectorToggle}>
                    <View style={[
                        styles.toggleButton, 
                        { backgroundColor: isShakeDetectorActive ? colors.primary : colors.border }
                    ]}>
                        <View style={[
                            styles.toggleCircle, 
                            { 
                              backgroundColor: colors.background,
                              transform: [{ translateX: isShakeDetectorActive ? 20 : 0 }] 
                            }
                        ]} />
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    
        {/* Logout button */}
        <TouchableOpacity 
          style={[styles.logoutButton, { backgroundColor: colors.primary }]}
          onPress={async () => {
                try {
                  await fetch(`${API_ENDPOINTS.USERS.LOGOUT}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                  });
                } catch (error) {
                  console.error("Logout error:", error);
                }

                await logout();
                if (navigationRef.current) {
                    navigationRef.current.reset({
                      index: 0,
                      routes: [{ name: 'Login' }]
                    });
                } 
            }}
            >
          <Text style={[styles.logoutText, { color: colors.background }]}>ODHLÁSIŤ SA</Text>

          {/* <View style={colors.background} /> */}
        </TouchableOpacity>
      
        <View style={styles.footerSpacer} />

        {/* Footer */}
        <View style={styles.footer}>
            <TouchableOpacity onPress={showTermsOfUse}>
                <Text style={[styles.footerText, { color: colors.text }]}>Podmienky používania</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={showPrivacyPolicy}>
                <Text style={[styles.footerText, { color: colors.text }]}>Ochrana súkromia</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowAppInfo(true)}>
                <Text style={[styles.footerText, { color: colors.text }]}>O aplikácii</Text>
            </TouchableOpacity>
        </View>

        <Modal
            visible={showAppInfo}
            animationType="fade"
            transparent={true}
            onRequestClose={() => setShowAppInfo(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
                    <View style={styles.modalHeader}>
                        <Text style={[styles.modalTitle, { color: colors.text }]}>O aplikácii</Text>
                        
                        <TouchableOpacity onPress={() => setShowAppInfo(false)}>
                            <Ionicons name="close" size={24} color={colors.text} />
                        </TouchableOpacity>
                    </View>
                    
                    <View style={styles.modalContent}>
                        <Text style={[styles.modalText, { color: colors.text }]}>
                            Názov: MTAA Projekt
                        </Text>

                        <Text style={[styles.modalText, { color: colors.text }]}>
                            Verzia: 1.0.0
                        </Text>

                        <Text style={[styles.modalText, { color: colors.text, marginTop: 10 }]}>
                            Táto aplikácia bola vytvorená ako súčasť projektu pre predmet MTAA.
                        </Text>
                    </View>
                    
                    <TouchableOpacity 
                        style={[styles.modalButton, { backgroundColor: colors.primary }]}
                        onPress={() => setShowAppInfo(false)}
                    >
                        <Text style={[styles.modalButtonText, { color: colors.background }]}>OK</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
        {/* Modal pre Nahlásiť chybu */}
        <Modal
          visible={showReportBugModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowReportBugModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Nahlásiť chybu</Text>
                <TouchableOpacity onPress={() => setShowReportBugModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalContent}>
                <Text style={[styles.modalText, { color: colors.text }]}>
                  Popíšte chybu, ktorú ste zaznamenali:
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
                  ]}
                  value={bugReportText}
                  onChangeText={setBugReportText}
                  multiline
                  placeholder="Zadajte popis chyby..."
                  placeholderTextColor={colors.tertiary}
                />
              </View>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleReportBugSubmit}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Odoslať</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Modal pre Potrebujem pomoc */}
        <Modal
          visible={showHelpModal}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowHelpModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: colors.text }]}>Potrebujem pomoc</Text>
                <TouchableOpacity onPress={() => setShowHelpModal(false)}>
                  <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
              </View>
              <View style={styles.modalContent}>
                <Text style={[styles.modalText, { color: colors.text }]}>
                  Popíšte, s čím potrebujete pomoc:
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }
                  ]}
                  value={helpRequestText}
                  onChangeText={setHelpRequestText}
                  multiline
                  placeholder="Zadajte popis problému..."
                  placeholderTextColor={colors.tertiary}
                />
              </View>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleHelpRequestSubmit}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Odoslať</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  header: {
    paddingVertical: 15,
    paddingHorizontal: 15,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneButton: {
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  settingText: {
    fontSize: 16,
  },
  themeSelector: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginVertical: 10,
  },
  themeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 4,
    marginRight: 10,
  },
  logoutButton: {
    marginHorizontal: 15,
    paddingVertical: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  logoutText: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    marginBottom: 5,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContainer: {
    width: '80%',
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    marginBottom: 20,
  },
  modalText: {
    fontSize: 14,
    marginBottom: 5,
  },
  modalButton: {
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 5,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },  
  toggleButton: {
    width: 50,
    height: 30,
    borderRadius: 15,
    padding: 5,
  },
  toggleCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  scrollContent: {
    flexGrow: 1,
  },
  footerSpacer: {
  height: 100,
  },
  input: {
  height: 100,
  borderWidth: 1,
  borderRadius: 5,
  padding: 10,
  marginTop: 10,
  textAlignVertical: 'top',
},
});

export default SettingsScreen;