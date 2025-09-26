import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, RefreshControl } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TestStackParamList } from '../navigation/navigation';
import { useTheme } from '../theme/ThemeContext';
import { useApiClient } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import { useTestNavigation } from '../hooks/useAppNavigation';

type TestSelectionScreenRouteProp = RouteProp<TestStackParamList, 'TestSelection'>;

interface Test {
  id: string;
  title: string;
  subject: string;
}

const TestSelectionScreen = () => {
  const route = useRoute<TestSelectionScreenRouteProp>();
  const navigation = useTestNavigation();
  const { subjectName } = route.params;
  const { colors } = useTheme();
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const apiClient = useApiClient();

  const loadTests = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log("Loading tests for subject:", subjectName);
      const response = await apiClient.post(API_ENDPOINTS.TESTS.GET_TESTS, { subject: subjectName });
      const data = await response.json();
      
      if (data && data.success && data.data) {
        console.log("Loaded tests:", data.data);
        setTests(data.data);
      } else {
        console.error("API returned error or no data:", data);
        setTests([]);
        setError('Nepodarilo sa načítať testy. Neplatná odpoveď zo servera.');
      }
    } catch (error) {
      console.error('Chyba pri načítaní testov:', error);
      setError('Nepodarilo sa načítať testy. Skúste to znova.');
      setTests([]);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (subjectName) {
      loadTests();
    } else {
      setError('Chýba názov predmetu');
      setIsLoading(false);
    }
  }, [subjectName]);

  const handleTestPress = (test: Test) => {
    console.log('Navigating to test with ID:', test.id, 'and title:', test.title);
    navigation.navigate('Test', { 
      testId: test.id, 
      testName: test.title 
    });
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTests();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >
        <View style={styles.headerWithBackContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerText, { color: colors.text }]}>Vyberte si test</Text>
        </View>
        
        {isLoading && !refreshing ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loadingIndicator} />
        ) : error ? (
          <Text style={[styles.errorText, { color: colors.error || 'red' }]}>{error}</Text>
        ) : tests.length === 0 ? (
          <Text style={[styles.noTestsText, { color: colors.text }]}>Žiadne testy k dispozícii</Text>
        ) : (
          <View style={styles.subjectsContainer}>
            {tests.map((test) => (
              <TouchableOpacity
                key={test.id}
                style={[styles.subjectButton, { backgroundColor: colors.primary }]}
                onPress={() => handleTestPress(test)}
              >
                <Text style={[styles.subjectButtonText, { color: colors.background }]}>
                  {test.title}
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
  // Rovnaké štýly ako v pôvodnom kóde
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 15,
  },
  headerWithBackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    marginRight: 15,
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
  loadingIndicator: {
    marginVertical: 40,
  },
  errorText: {
    textAlign: 'center',
    marginVertical: 20,
  },
  noTestsText: {
    textAlign: 'center',
    marginVertical: 20,
  },
});

export default TestSelectionScreen;
