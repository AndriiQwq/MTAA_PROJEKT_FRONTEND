import React, { useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { useApiClient } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import { useRootNavigation } from '../hooks/useAppNavigation';
import { useFocusEffect } from '@react-navigation/native';
import { useNetwork } from '../context/NetworkContext';
interface Subject {
  name: string;
}

const StudyScreen = () => {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { colors } = useTheme();
  const navigation = useRootNavigation();
  const apiClient = useApiClient();
  const { isConnected } = useNetwork();

  const isLoadingRef = useRef(false);

  useFocusEffect( 
    useCallback(() => {
      if (!isConnected) {
        setError('Nie ste pripojení k internetu. Pripojte sa a skúste to znova.');
        setLoading(false);
        return;
      }

      if (!isLoadingRef.current) {
        loadSubjects();
      }
    }, [isConnected]) 
  );

  const loadSubjects = async () => {
    if (isLoadingRef.current) return;

    isLoadingRef.current = true;
    setLoading(true);

    try {
      const response = await apiClient.get(API_ENDPOINTS.TESTS.GET_SUBJECTS);
      const result = await response.json();
      
      if (result.success && result.data) {
        console.log("Loaded subjects:", result.data);
        
        setSubjects(
          result.data.map((row: { subject: string }) => ({
            name: row.subject,
          }))
        );
        setError(null);
      } else {
        setError('Nepodarilo sa načítať predmety');
      }
    } catch (error) {
      console.error('Chyba pri načítaní predmetov:', error);
      setError('Nepodarilo sa načítať predmety. Skúste to znova.');
    } finally {
      setLoading(false);
      isLoadingRef.current = false;
    }
  };

  const handleSubjectPress = (subject: Subject) => {
    console.log('⏳ Posielam subject:', subject.name);
    navigation.navigate('TestFlow', { 
      screen: 'TestSelection',
      params: { subjectName: subject.name }
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headerContainer}>
          <Text style={[styles.headerText, { color: colors.text }]}>Vyberte si predmet</Text>
        </View>
        
        {error ? (
          <Text style={[styles.errorText, { color: colors.error || 'red' }]}>{error}</Text>
        ) : (
          <View style={styles.subjectsContainer}>
            {subjects.map((subject, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.subjectButton, { backgroundColor: colors.primary }]}
                onPress={() => handleSubjectPress(subject)}
              >
                <Text style={[styles.subjectButtonText, { color: colors.background }]}>
                  {subject.name}
                </Text>
                <TouchableOpacity style={styles.shareButton}>
                  <Ionicons name="share-outline" size={24} color={colors.background} />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subjectsContainer: {
    alignItems: 'center',
  },
  subjectButton: {
    width: '90%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
  },
  subjectButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  shareButton: {
    padding: 5,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 20,
    fontSize: 16,
  },
});

export default StudyScreen;
