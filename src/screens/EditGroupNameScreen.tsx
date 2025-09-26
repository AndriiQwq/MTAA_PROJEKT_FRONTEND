import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput,
  TouchableOpacity, 
  SafeAreaView,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NavigationProp } from '@react-navigation/native';
import { GroupSettingsStackParamList } from '../navigation/navigation';
import { CustomHeader } from '../navigation/BottomTabsNavigator';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/apiConfig';

type EditGroupNameRouteProp = RouteProp<GroupSettingsStackParamList, 'EditGroupName'>;

const EditGroupNameScreen = () => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation();
  const route = useRoute<EditGroupNameRouteProp>();
  const { groupId, currentName } = route.params;
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (newName === currentName) {
      navigation.goBack();
      return;
    }

    if (!newName.trim()) {
      Alert.alert('Chyba', 'Názov skupiny nemôže byť prázdny');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(API_ENDPOINTS.GROUPS.EDIT_NAME(groupId), {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ newName: newName.trim() })
      });

      if (!response.ok) { throw new Error('Failed to update group name');}

      Alert.alert(
        'Úspech',
        'Názov skupiny bol úspešne zmenený',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating group name:', error);
      Alert.alert('Chyba', 'Nepodarilo sa zmeniť názov skupiny');
    } finally {
      setLoading(false);
    }
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
        <Text style={[styles.title, { color: colors.text }]}>Zmeniť názov skupiny</Text>
        
        <TextInput
          style={[styles.input, { 
            color: colors.text, 
            backgroundColor: colors.secondary,
            borderColor: colors.border 
          }]}
          value={newName}
          onChangeText={setNewName}
          placeholder="Zadajte nový názov skupiny"
          placeholderTextColor={colors.text}
          editable={!loading}
        />
        
        <TouchableOpacity 
          style={[
            styles.saveButton, 
            { backgroundColor: colors.primary },
            loading && { opacity: 0.7 }
          ]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>Uložiť</Text>
        </TouchableOpacity>
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  input: {
    padding: 15,
    borderRadius: 4,
    borderWidth: 1,
    marginBottom: 20,
  },
  saveButton: {
    padding: 15,
    borderRadius: 4,
    alignItems: 'center',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: 'bold',
  }
});

export default EditGroupNameScreen;
