import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/apiConfig';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/navigation';

type CreateGroupNavigationProp = StackNavigationProp<RootStackParamList, 'CreateGroup'>;

const CreateGroupScreen = () => {
  const { colors } = useTheme();
  const { token } = useAuth();
  const navigation = useNavigation<CreateGroupNavigationProp>();
  
  const [groupName, setGroupName] = useState('');
  const [description, setDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      Alert.alert('Chyba', 'Názov skupiny nemôže byť prázdny');
      return;
    }
    
    setIsCreating(true);
    try {
      const response = await fetch(API_ENDPOINTS.GROUPS.CREATE, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: groupName.trim(),
          description: description.trim() || undefined
        })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error creating group:', errorText);
        throw new Error('Failed to create group');
      }
      
      Alert.alert(
        'Úspech',
        'Skupina bola úspešne vytvorená!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to create group');
    } finally {
      setIsCreating(false);
    }
  };
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Vytvoriť skupinu</Text>
        <View style={{ width: 24 }} />
      </View>
      
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.label, { color: colors.text }]}>Názov skupiny</Text>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="Zadajte názov skupiny"
          placeholderTextColor={`${colors.text}80`}
          value={groupName}
          onChangeText={setGroupName}
        />
        
        <Text style={[styles.label, { color: colors.text, marginTop: 20 }]}>
          Popis skupiny (voliteľné)
        </Text>
        <TextInput
          style={[styles.textArea, { 
            backgroundColor: colors.background,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder="Zadajte popis skupiny"
          placeholderTextColor={`${colors.text}80`}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
        
        <TouchableOpacity
          style={[
            styles.button, 
            { backgroundColor: colors.primary },
            isCreating && { opacity: 0.7 }
          ]}
          onPress={handleCreateGroup}
          disabled={isCreating}
        >
          {isCreating ? (
            <ActivityIndicator color={colors.background} size="small" />
          ) : (
            <Text style={[styles.buttonText, { color: colors.background }]}>
              Vytvoriť skupinu
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    height: 120,
  },
  button: {
    marginTop: 30,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CreateGroupScreen;