import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TestStackParamList } from '../navigation/navigation';
import { useTheme } from '../theme/ThemeContext';
import { useCompositeNavigation } from '../hooks/useAppNavigation';
import { AccessibilityInfo } from 'react-native';

type TestResultsScreenRouteProp = RouteProp<TestStackParamList, 'TestResults'>;

const TestResultsScreen = () => {
  const route = useRoute<TestResultsScreenRouteProp>();
  const navigation = useCompositeNavigation();
  const { 
    score, 
    total, 
    timeSpent, 
    percentage, 
    resultId,
    incorrectQuestions = [],
    testId,
    testName
  } = route.params;
  const { colors, isTablet } = useTheme();

  // Animácia pre fade-in efekt pri načítaní
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spustenie animácie pri načítaní
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    console.log('TestResults screen with params:', route.params);

    setTimeout(() => {
      const resultMessage = `Test ${testName} dokončený. Vaše skóre je ${score} z ${total} bodov, čo je ${percentage}%. Čas: ${timeSpent}`;
      AccessibilityInfo.announceForAccessibility(resultMessage);
    }, 1000);
  }, [fadeAnim]);

  const handleGoHome = () => {
    navigation.getParent()?.navigate('Main');
  };

  const handleTryAgain = () => {
    navigation.navigate('Test', {
      testId,
      testName,
    });
  };

  // Extrahujeme čas v sekundách z formátu "XXs"
  const timeInSeconds = parseInt(timeSpent.replace('s', ''), 10) || 0;
  
  // Formátujeme čas na minúty a sekundy
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  // Dynamická farba skóre podľa percenta
  const getScoreColor = () => {
    if (percentage >= 80) return '#4CAF50'; // Zelená pre vysoké skóre
    if (percentage >= 50) return '#FFC107'; // Žltá pre priemerné skóre
    return '#F44336'; // Červená pre nízke skóre
  };

  // Komponent pre výsledky a štatistiky
  const renderResults = () => (
    <Animated.View style={[isTablet ? styles.tabletResultsContainer : styles.fullWidthContainer, { opacity: fadeAnim }]}>
      <Text style={[styles.resultTitle, { color: colors.text }]}>Výsledok testu</Text>

      <View style={[styles.scoreContainer, { backgroundColor: getScoreColor(), elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 5 }]}>
        <Text style={[styles.scoreText, { color: '#fff' }]}>
          {score} / {total}
        </Text>
        <Text style={[styles.percentageText, { color: '#fff' }]}>
          {percentage}%
        </Text>
      </View>

      <View style={[styles.statsContainer, { backgroundColor: colors.card, borderRadius: 10, padding: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }]}>
        <View style={styles.statItem}>
          <Ionicons name="time-outline" size={24} color={colors.primary} />
          <Text style={[styles.statText, { color: colors.text }]}>
            Čas: {formatTime(timeInSeconds)}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle-outline" size={24} color="#4CAF50" />
          <Text style={[styles.statText, { color: colors.text }]}>
            Správne: {score}
          </Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="close-circle-outline" size={24} color="#F44336" />
          <Text style={[styles.statText, { color: colors.text }]}>
            Nesprávne: {total - score}
          </Text>
        </View>
      </View>
    </Animated.View>
  );

  // Komponent pre nesprávne odpovede
  const renderIncorrectQuestions = () => (
    <Animated.View style={[isTablet ? styles.tabletIncorrectContainer : styles.fullWidthContainer, { opacity: fadeAnim }]}>
      {incorrectQuestions?.length > 0 && (
        <View style={[styles.incorrectSection, { backgroundColor: colors.card, borderRadius: 10, padding: 15, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 }]}>
          <Text style={[styles.incorrectHeader, { color: colors.text }]}>
            Nesprávne odpovede
          </Text>
          {incorrectQuestions.map((q, index) => (
            <View key={index} style={[styles.incorrectItem, { backgroundColor: colors.background, borderRadius: 8, padding: 10, marginBottom: 10 }]}>
              <Text style={[styles.questionText, { color: colors.text }]}>
                {q.questionText}
              </Text>
              <Text style={[styles.answerText, { color: colors.text }]}>
                Tvoja odpoveď: {q.userAnswerId}
              </Text>
              <Text style={[styles.answerText, { color: '#4CAF50' }]}>
                Správna odpoveď: {q.correctAnswerText}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Animated.View>
  );

  // Komponent pre tlačidlá
  const renderButtons = () => (
    <View style={[styles.buttonsContainer, isTablet && styles.tabletButtonsContainer, { backgroundColor: colors.card, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.2, shadowRadius: 3 }]}>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 }]}
        onPress={handleTryAgain}
      >
        <Text style={[styles.buttonText, { color: colors.background }]}>
          Skúsiť znova
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: colors.secondary, borderColor: colors.primary, borderWidth: 1, elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.3, shadowRadius: 2 },
        ]}
        onPress={handleGoHome}
      >
        <Text style={[styles.buttonText, { color: colors.text }]}>
          Domov
        </Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView style={{ flex: 1 }}>
        <View style={[styles.container, isTablet && styles.tabletContainer]}>
          {isTablet ? (
            <>
              <View style={styles.tabletLeftColumn}>
                {renderResults()}
              </View>
              <View style={styles.tabletRightColumn}>
                {renderIncorrectQuestions()}
              </View>
            </>
          ) : (
            <View style={styles.mobileContainer}>
              {renderResults()}
              {renderIncorrectQuestions()}
            </View>
          )}
        </View>
      </ScrollView>
      {/* Tlačidlá sú fixované dole */}
      {renderButtons()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    width: '100%',
    alignSelf: 'stretch',
  },
  tabletContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  tabletLeftColumn: {
    flex: 1,
    paddingRight: 10,
    minWidth: 300,
  },
  tabletRightColumn: {
    flex: 2,
    paddingLeft: 10,
    minWidth: 400,
  },
  mobileContainer: {
    flex: 1,
    alignItems: 'center',
  },
  fullWidthContainer: {
    width: '100%',
  },
  tabletResultsContainer: {
    width: '100%',
    alignItems: 'center',
  },
  tabletIncorrectContainer: {
    width: '100%',
  },
  resultTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  scoreContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
  },
  scoreText: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  percentageText: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 30,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    padding: 10,
    borderRadius: 8,
  },
  statText: {
    fontSize: 16,
    marginLeft: 12,
    fontWeight: '500',
  },
  incorrectSection: {
    width: '100%',
    marginBottom: 30,
  },
  incorrectHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'left',
  },
  incorrectItem: {
    marginBottom: 15,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
    paddingBottom: 10,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 5,
  },
  answerText: {
    fontSize: 14,
    marginBottom: 3,
    lineHeight: 18,
  },
  buttonsContainer: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    backgroundColor: 'transparent',
  },
  tabletButtonsContainer: {
    justifyContent: 'space-between',
    padding: 20,
  },
  button: {
    width: '48%',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default TestResultsScreen;
