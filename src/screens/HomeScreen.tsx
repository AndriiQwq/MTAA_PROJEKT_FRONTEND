import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { BottomTabParamList } from '../navigation/navigation';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useApiClient } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';

type NavigationProp = BottomTabNavigationProp<BottomTabParamList, 'Home'>;

const HomeScreen = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const apiClient = useApiClient();
  const [userName, setUserName] = useState('name'); // State to store user's name
  const [isLoading, setIsLoading] = useState(true); // Optional loading state

  // Fetch user's name on component mount
  useEffect(() => {
    const fetchUserName = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get(API_ENDPOINTS.USERS.ME);
        if (!response.ok) {
          throw new Error('Failed to fetch user data');
        }
        const userData = await response.json();
        if (userData.data && userData.data.name) {
          setUserName(userData.data.name); // Set the fetched name
        } else {
          setUserName('User'); // Fallback if name is not available
        }
      } catch (error) {
        console.warn('Failed to fetch user name, using fallback:', error);
        setUserName('User'); // Fallback on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserName();
  }, [apiClient]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.subtitle, { color: colors.text }]}>Vitaj !</Text>
      <Text style={[styles.title, { color: colors.text }]}>
        {isLoading ? 'Loading...' : userName}
      </Text>
      
      <View style={[styles.quote, { backgroundColor: colors.card, borderLeftColor: colors.primary }]}>
        <Text style={[styles.quoteText, { color: colors.text }]}>
          „Bez práce nie sú koláče.“ 
          <Text style={[styles.quoteAuthor, { color: colors.secondary }]}>
            – Slovenské príslovie 
          </Text>
        </Text>
      </View>
      
      <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]}
      onPress={() => navigation.navigate('Study')}>
        <Text style={[styles.buttonText, { color: colors.background }]}>Prejdi si testy !</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
  },
  button: {
    paddingVertical: 25,
    paddingHorizontal: 70,
    borderRadius: 8,
    marginTop: 150,
  },
  buttonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  quote: {
    margin: 30,
    borderLeftWidth: 5,
    borderRadius: 10,
    padding: 20,
    maxWidth: '85%',
    alignItems: 'center', 
    justifyContent: 'center',
    position: 'relative', 
  },
  quoteText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 22,
  },
  quoteAuthor: {
    fontSize: 14,
    fontStyle: 'italic',
    fontWeight: '500', 
  },
});

export default HomeScreen;
