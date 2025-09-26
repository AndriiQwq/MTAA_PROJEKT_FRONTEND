import React, { useState, useEffect } from 'react';
import {
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Alert, 
  Modal, 
  TextInput,  
  Image, 
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigation';
import * as ImagePicker from 'expo-image-picker';
import { API_ENDPOINTS } from '../config/apiConfig';
import { useAuth } from '../context/AuthContext';
import { useApiClient } from '../utils/apiClient';

type SettingsProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SettingsProfileScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<SettingsProfileScreenNavigationProp>();
  const { token, logout } = useAuth();
  const api = useApiClient();

  const [username, setUsername] = useState('');
  const [profilePhoto, setProfilePhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [inputValue, setInputValue] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handle modal open
  const openModal = (type: string, currentValue: string = '') => {
    setModalType(type);
    setInputValue(currentValue);
    setConfirmPassword(''); 
    setModalVisible(true);
  };

  // To fetch user profile photo and username
  const fetchUserProfile = async () => {
    try {
      setIsLoadingProfile(true);

      // 1. Get user name using apiClient
      const profileResponse = await api.get(API_ENDPOINTS.USERS.PROFILE);

      if (!profileResponse.ok) { throw new Error('Failed to fetch user data'); }

      const responseData = await profileResponse.json();
      let userData = responseData;
      if (responseData.data) {userData = responseData.data;}
      if (userData.name) {  setUsername(userData.name); } 

      // 2. get user avatar using apiClient
      try {
        const avatarResponse = await api.get(API_ENDPOINTS.AVATARS.OWN);
              
        if (avatarResponse.ok) {
          // Use Base64 for showing image
          const base64Data = await avatarResponse.blob().then(blob => {
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          });
          
          setProfilePhoto(base64Data as string);
        } else {
          setProfilePhoto(null);
        }
      } catch (avatarError) {
        console.error("Error fetching avatar:", avatarError);
        setProfilePhoto(null);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Fetch user profile data when the component mounts
  useEffect(() => {
    fetchUserProfile();
  }, []);

  // Handle profile photo change
  const handleChangeProfilePhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Chyba', 'Na prístup k fotografiám potrebujeme povolenie');
      return;
    }
    // Open the gallery to select an image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images', // mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], // Square aspect ratio
      quality: 0.7,   // Quality of the images
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];

      try {
        setLoading(true);

        // Create a From to send the image
        const formData = new FormData();
        formData.append('avatar', {
          uri: selectedImage.uri,
          type: 'image/jpeg',
          name: 'profile-photo.jpg',
        } as unknown as Blob); // Cast to Blob for FormData

        // Send the image to the server
        const response = await fetch(API_ENDPOINTS.AVATARS.UPLOAD, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
          
          if (contentType && contentType.includes('application/json')) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Chyba pri nahrávaní fotografie');
          } else {
            const textResponse = await response.text();
            throw new Error(textResponse || 'Chyba pri nahrávaní fotografie');
          }
        }

        // Update the profile photo 
        setProfilePhoto(selectedImage.uri);
        Alert.alert('Success', 'Profilová fotka bola úspešne zmenená!');
      } catch (error) {
        console.error('Upload error:', error);
        Alert.alert('Chyba', 'Nastala neočakávaná chyba pri nahrávaní fotografie. Skontrolujte pripojenie k internetu a skúste to znova.');
      } finally {
        setLoading(false);
      }
    }
  };

  // handle save
const handleSave = async () => {
    setLoading(true)

    try {
      if (modalType === 'username') {
        if ((!inputValue.trim() || inputValue.length < 3 || inputValue.length > 32 || !/^[a-zA-Z0-9_]*$/.test(inputValue))) {
          Alert.alert('Error', 'Meno musí mať 3-32 znakov (písmená, čísla, podčiarkovník)');
          return;
        }
        if (inputValue === username) {
          Alert.alert('Error', 'Zadané meno je rovnaké ako aktuálne');
          setLoading(false);
          return;
        }

        // Použitie apiClient namiesto fetch
        const response = await api.patch(API_ENDPOINTS.USERS.EDIT_NAME, { 
          newName: inputValue 
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');

          if (contentType && contentType.includes('application/json')) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Chyba pri zmene mena');
          } else {
            const textResponse = await response.text();

            if (textResponse === "This name is already taken") {
              Alert.alert('Error', 'Toto používateľské meno je už obsadené');
              return;
            } else {
              throw new Error(textResponse || 'Chyba pri zmene mena');
            }
          }
        }

        setUsername(inputValue);
        Alert.alert('Success', 'Meno bolo úspešne zmenené!');
        setModalVisible(false);
      }
      if (modalType === 'password') {
        // Podobná úprava pre zmenu hesla
        if (inputValue.length < 8) {
          Alert.alert('Error', 'Heslo musí mať aspoň 8 znakov');
          return;
        }

        if (inputValue !== confirmPassword) {
          Alert.alert('Error', 'Heslá sa nezhodujú');
          return;
        }

        // Použitie apiClient namiesto fetch
        const response = await api.patch(API_ENDPOINTS.USERS.EDIT_PASSWORD, { 
          newPassword: inputValue 
        });

        if (!response.ok) {
          const contentType = response.headers.get('content-type');
  
          if (contentType && contentType.includes('application/json')) {
            const responseData = await response.json();
            throw new Error(responseData.message || 'Chyba pri zmene hesla');
          } else {
            const textResponse = await response.text();
            throw new Error(textResponse || 'Chyba pri zmene hesla');
          }
        }

        Alert.alert('Success', 'Vaše heslo bolo úspešne zmenené!');
        setModalVisible(false);
      }
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert('Chyba', 'Nastala neočakávaná chyba. Skontrolujte pripojenie k internetu a skúste to znova.');
    } finally {
      setLoading(false);
    }
  };

  // to show right label
  const getModalLabel = () => {
    switch (modalType) {
      case 'username': return 'Zadaj nové meno:';
      case 'password': return 'Zadaj nové heslo:';
      default: return '';
    }
  };

  const handleDeleteProfilePhoto = async () => {
    try {
      setLoading(true);
      const response = await api.delete(API_ENDPOINTS.AVATARS.DELETE);
      
      if (!response.ok) {throw new Error('Chyba pri odstraňovaní fotografie'); }

      setProfilePhoto(null);
      Alert.alert('Success', 'Profilová fotka bola úspešne odstránená!');
    } catch (error) {
      console.error("API Error:", error);
      Alert.alert('Chyba', 'Nastala neočakávaná chyba pri odstraňovaní fotografie');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Odstrániť účet',
      'Naozaj chcete odstrániť svoj účet?',
      [
        { text: 'Zrušiť', style: 'cancel' },
        { 
          text: 'Odstrániť', 
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Použitie apiClient namiesto fetch
              const response = await api.delete(API_ENDPOINTS.USERS.DELETE);

              if (!response.ok) {
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                  const responseData = await response.json();
                  throw new Error(responseData.message || 'Chyba pri odstraňovaní účtu');
                } else {
                  const textResponse = await response.text();
                  throw new Error(textResponse || 'Chyba pri odstraňovaní účtu');
                }
              }

              // Successfully deleted account
              Alert.alert(
                'Success', 
                'Váš účet bol úspešne odstránený',
                [
                  {
                    text: 'OK',
                    onPress: async () => {
                      try {
                        await logout();
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }]
                        });
                      } catch (logoutError) {
                        navigation.reset({
                          index: 0,
                          routes: [{ name: 'Login' }]
                        });
                      }
                    }
                  }
                ]
              );
            } catch (error) {
              console.error("API Error:", error);
              Alert.alert('Chyba', 'Nastala neočakávaná chyba pri odstraňovaní účtu. Skontrolujte pripojenie k internetu a skúste to znova.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Profil</Text>
        <View style={{ width: 24 }} />
      </View>

      {isLoadingProfile ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        // Content
        <View style={styles.content}>
          {/* Account Settings */}
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Nastavenia účtu</Text>

          {/* Username */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Používateľské meno</Text>
          {username?.trim() ? (
            <Text style={[styles.valueText, { color: colors.text }]}>{username}</Text>
          ) : (
            <Text style={[styles.valueText, { color: colors.secondary || colors.text, fontStyle: 'italic' }]}>
              Nie je nastavené
            </Text>
          )}
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal('username', username)}
          >
            <Text style={[styles.actionButtonText, { color: colors.background }]}>zmeniť meno</Text>
          </TouchableOpacity>

          {/* Password */}
          <Text style={[styles.fieldLabel, { color: colors.text }]}>Heslo</Text>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => openModal('password')}
          >
            <Text style={[styles.actionButtonText, { color: colors.background }]}>zmeniť heslo</Text>
          </TouchableOpacity>

          {/* Profile Appearance */}
          <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 30 }]}>Vzhľad účtu</Text>
          
          {/* Profile Photo */}
          <View style={{ alignItems: 'center', marginBottom: 10 }}>
            {profilePhoto ? (
              <Image source={{ uri: profilePhoto }} style={{ width: 80, height: 80, borderRadius: 40 }} />
            ) : (
              <Ionicons name="person-circle" size={80} color={colors.primary} />
            )}
          </View>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleChangeProfilePhoto}
          >
            <Text style={[styles.actionButtonText, { color: colors.background }]}>zmeniť profilovú fotku</Text>
          </TouchableOpacity>

          {profilePhoto && (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.text, marginTop: 10 }]}
              onPress={() => {
                Alert.alert(
                  'Odstrániť fotku',
                  'Naozaj chcete odstrániť profilovú fotku?',
                  [
                    { text: 'Zrušiť', style: 'cancel' },
                    { 
                      text: 'Odstrániť', 
                      style: 'destructive',
                      onPress: handleDeleteProfilePhoto
                    }
                  ]
                );
              }}
            >
              <Text style={[styles.actionButtonText, { color: colors.background }]}>odstrániť profilovú fotku</Text>
            </TouchableOpacity>
          )}

          {/* Delete Account */}
          <TouchableOpacity 
            style={[styles.deleteButton, { backgroundColor: colors.error }]}
            onPress={handleDeleteAccount}
          >
            <Text style={[styles.deleteButtonText, { color: colors.background }]}>ODSTRÁNIŤ ÚČET</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {/* Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <Text style={{ marginBottom: 10, color: colors.text }}>{getModalLabel()}</Text>
            <TextInput
              value={inputValue}
              onChangeText={setInputValue}
              style={[
                styles.input,
                { color: colors.text, borderBottomColor: colors.primary }
              ]}
              placeholder={modalType === 'password' ? 'Nové heslo' : ''}
              placeholderTextColor={colors.text + '99'}
              secureTextEntry={modalType === 'password'}
              autoCapitalize={modalType === 'username' ? 'none' : 'sentences'}
            />

            {modalType === 'password' && (
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                style={[
                  styles.input,
                  { color: colors.text, borderBottomColor: colors.primary }
                ]}
                placeholder="Potvrďte heslo"
                placeholderTextColor={colors.text + '99'}
                secureTextEntry={true}
              />
            )}

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
              <TouchableOpacity 
                style={[
                  styles.modalButton, 
                  { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }
                ]} 
                onPress={handleSave}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color={colors.background} />
                ) : (
                  <Text style={[styles.modalButtonText, { color: colors.background }]}>Uložiť</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, { backgroundColor: colors.text}]} 
                onPress={() => setModalVisible(false)}
                disabled={loading}
              >
                <Text style={[styles.modalButtonText, { color: colors.background }]}>Zrušiť</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    marginBottom: 5,
    marginTop: 10,
  },
  valueText: {
    fontSize: 15,
    marginBottom: 10,
  },
  actionButton: {
    width: '100%',
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
    borderRadius: 5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  deleteButton: {
    width: '100%',
    padding: 15,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 40,
  },
  deleteButtonText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  modalContainer: {
    padding: 20,
    borderRadius: 10,
    width: 300,
    elevation: 5,
  },
  input: {
    borderBottomWidth: 1,
    marginBottom: 15,
    fontSize: 18,
    paddingVertical: 6,
    paddingHorizontal: 2,
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  modalButton: {
    flex: 1,
    padding: 10,
    borderRadius: 5,
    marginHorizontal: 5,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SettingsProfileScreen;
