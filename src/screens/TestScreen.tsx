import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRoute, RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { TestStackParamList } from '../navigation/navigation';
import { useTheme } from '../theme/ThemeContext';
import { useApiClient } from '../utils/apiClient';
import { API_ENDPOINTS } from '../config/apiConfig';
import { useTestNavigation } from '../hooks/useAppNavigation';
import { AccessibilityInfo } from 'react-native';

type TestScreenRouteProp = RouteProp<TestStackParamList, 'Test'>;

interface Answer {
  id: string;
  answer_text: string;
  is_correct?: boolean;
}

interface Question {
  id: string;
  question: string;
  answers: Answer[];
}

const TestScreen = () => {
  const route = useRoute<TestScreenRouteProp>();
  const navigation = useTestNavigation();
  const { testId, testName } = route.params;
  const { colors, isTablet } = useTheme();
  const apiClient = useApiClient();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [elapsedTime, setElapsedTime] = useState(0);
  
  const isMounted = useRef(true);
  const startTime = useRef(Date.now());

  // Timer pre aktualizáciu času
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime.current) / 1000));
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  // Function to announce messages for accessibility
  const announceForAccessibility = (message: string) => {
    AccessibilityInfo.announceForAccessibility(message);
  };
  
  // Načítaj dáta len raz
  useEffect(() => {
    console.log('TestScreen mounted with params:', route.params);
    console.log('testId:', testId, 'testName:', testName);
    
    if (!testId) {
      setError('Chýba ID testu');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        console.log('Loading questions for test ID:', testId);
        const questionsRes = await apiClient.post(API_ENDPOINTS.TESTS.GET_QUESTIONS, { id: testId });
        const questionsData = await questionsRes.json();
        
        if (!isMounted.current) return;
        
        if (!questionsData.success) {
          setError('Nepodarilo sa načítať otázky');
          setLoading(false);
          return;
        }
        
        const questionsArray = questionsData.data || [];
        console.log(`Loaded ${questionsArray.length} questions`);
        
        if (questionsArray.length === 0) {
          setError('Test neobsahuje žiadne ot |ázky');
          setLoading(false);
          return;
        }
        
        // Pre každú otázku načítaj odpovede
        const questionsWithAnswers: Question[] = [];
        
        for (let i = 0; i < questionsArray.length; i++) {
          if (!isMounted.current) return;
          
          const question = questionsArray[i];
          const answersRes = await apiClient.post(API_ENDPOINTS.TESTS.GET_ANSWERS, { id: question.id });
          const answersData = await answersRes.json();
          
          if (answersData.success && answersData.data) {
            questionsWithAnswers.push({
              ...question,
              answers: answersData.data
            });
          } else {
            questionsWithAnswers.push({
              ...question,
              answers: []
            });
          }
        }
        
        if (!isMounted.current) return;
        
        console.log(`Successfully loaded ${questionsWithAnswers.length} questions with answers`);
        setQuestions(questionsWithAnswers);
        
      } catch (err) {
        if (isMounted.current) {
          console.error('Error loading test:', err);
          setError('Nepodarilo sa načítať test');
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };
    
    fetchData();
    
    return () => {
      isMounted.current = false;
    };
  }, [testId]);
  
  const handleSelectAnswer = (answerId: string) => {
    const currentQuestion = questions[currentIndex];
    if (!currentQuestion) return;

    // Find the selected answer to announce it
    const selectedAnswer = currentQuestion.answers.find(a => a.id === answerId);

    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answerId
    }));

    if (selectedAnswer) {
      announceForAccessibility(`Vybraná odpoveď: ${selectedAnswer.answer_text}`);
    }
  };
  
  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);

      // Announce the next question
      setTimeout(() => {
        const nextQuestionNumber = currentIndex + 2;
        announceForAccessibility(`Otázka ${nextQuestionNumber} z ${questions.length}: ${questions[currentIndex + 1].question}`);
      }, 500); // Delay 
    } else {
      announceForAccessibility('Odosielanie testu');
      handleSubmit();
    }
  };

  // Add effect to announce the first question after loading
  useEffect(() => {
    if (!loading && questions.length > 0) {
      setTimeout(() => {
        announceForAccessibility(`Test: ${testName}. Otázka 1 z ${questions.length}: ${questions[0].question}`);
      }, 1000);
    }
  }, [loading, questions]);
  
  const handleSubmit = async () => {
    try {
      const userAnswers = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
        questionId,
        answerId
      }));
      
      const timeSpentSeconds = Math.floor((Date.now() - startTime.current) / 1000);
      
      console.log('Submitting answers:', userAnswers);
      
      // Najprv vyhodnotíme test
      const res = await apiClient.post(API_ENDPOINTS.TESTS.SUBMIT_ANSWERS, {
        testId,
        userAnswers
      });
      
      const result = await res.json();
      
      if (result.success) {
        // Potom uložíme výsledky
        try {
          const saveRes = await apiClient.post(API_ENDPOINTS.TESTS.SAVE_RESULTS, {
            testId,
            score: result.data.correctAnswers,
            maxScore: result.data.totalQuestions,
            timeSpent: timeSpentSeconds
          });
          
          const saveResult = await saveRes.json();
          console.log('Test results saved:', saveResult);
          
          // Navigácia na obrazovku s výsledkami
          navigation.navigate('TestResults', {
            score: result.data.correctAnswers,
            total: result.data.totalQuestions,
            percentage: result.data.score,
            timeSpent: `${timeSpentSeconds}s`,
            resultId: saveResult.data?.id || '',
            incorrectQuestions: result.data.incorrectQuestions,
            testId,
            testName
          });
        } catch (saveErr) {
          console.error('Error saving test results:', saveErr);
          // Pokračujeme na obrazovku s výsledkami aj keď sa nepodarilo uložiť
          navigation.navigate('TestResults', {
            score: result.data.correctAnswers,
            total: result.data.totalQuestions,
            percentage: result.data.score,
            timeSpent: `${timeSpentSeconds}s`,
            resultId: '',
            incorrectQuestions: result.data.incorrectQuestions,
            testId,
            testName
          });
        }
      } else {
        setError('Nepodarilo sa odoslať test');
      }
    } catch (err) {
      console.error('Submit error:', err);
      setError('Chyba pri odosielaní testu');
    }
  };

  // Formátovanie času
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
    
  if (loading) {
    return (
      <View 
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLanguage="sk-SK"
      >
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 20 }}>Načítavam test...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View 
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLanguage="sk-SK"
      >
        <Text style={{ color: colors.error || 'red', marginBottom: 20 }}>{error}</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.background }}>Späť</Text>
        </TouchableOpacity>
      </View>
    );
  }
    
  if (questions.length === 0) {
    return (
      <View 
        style={[styles.container, { backgroundColor: colors.background }]}
        accessibilityLanguage="sk-SK"
      >
        <Text style={{ color: colors.text, marginBottom: 20 }}>Žiadne otázky v teste</Text>
        <TouchableOpacity 
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.background }}>Späť</Text>
        </TouchableOpacity>
      </View>
    );
  }
  
  const currentQuestion = questions[currentIndex];
  const selectedAnswerId = selectedAnswers[currentQuestion.id];
  const progress = (currentIndex + 1) / questions.length;
  
  // Tablet layout
  if (isTablet) {
    return (
      <View 
        style={[styles.fullContainer, { backgroundColor: colors.background }]}
        accessible={false}
        accessibilityLanguage="sk-SK"
      >
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            accessible={true}
            accessibilityLabel="Späť"
            accessibilityRole="button"
            accessibilityHint="Návrat na zoznam testov"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text 
            style={[styles.title, { color: colors.text }]}
            accessible={true}
            accessibilityRole="header"
            importantForAccessibility="no-hide-descendants"
          >
            {testName}
          </Text>
          <Text 
            style={[styles.progress, { color: colors.text }]}
            accessible={true}
            accessibilityLabel={`Otázka ${currentIndex + 1} z ${questions.length}`}
          >
            {currentIndex + 1}/{questions.length}
          </Text>
        </View>
        
        <View style={styles.tabletContainer}>
          {/* Ľavá strana - test */}
          <View style={styles.tabletMainContent}>
            <View 
              style={styles.questionContainer}
              accessible={true}
              accessibilityLabel={`Otázka ${currentIndex + 1}: ${currentQuestion.question}`}
              accessibilityRole="text"
              accessibilityLanguage="sk-SK"
            >
              <Text style={[styles.question, { color: colors.text }]}>
                {currentQuestion.question}
              </Text>
              
              <View style={styles.options} accessible={false}>
                {currentQuestion.answers && currentQuestion.answers.map(answer => (
                  <TouchableOpacity
                    key={answer.id}
                    style={[
                      styles.option,
                      { 
                        borderColor: colors.border,
                        borderWidth: 1,
                        backgroundColor: selectedAnswerId === answer.id ? colors.primary + '20' : 'transparent'
                      }
                    ]}
                    onPress={() => handleSelectAnswer(answer.id)}
                    accessible={true}
                    accessibilityLabel={answer.answer_text}
                    accessibilityRole="radio"
                    accessibilityState={{ 
                      checked: selectedAnswerId === answer.id,
                      disabled: false
                    }}
                    accessibilityHint="Dvojitým ťuknutím vyberiete túto odpoveď"
                  >
                    <View 
                      style={[
                        styles.circle,
                        {
                          backgroundColor: selectedAnswerId === answer.id ? colors.primary : 'transparent',
                          borderColor: colors.border
                        }
                      ]}
                      importantForAccessibility="no"
                    >
                      {selectedAnswerId === answer.id && (
                        <View style={[styles.innerCircle, { backgroundColor: colors.background }]} />
                      )}
                    </View>
                    <Text style={[
                      styles.optionText,
                      { color: colors.text }
                    ]}>
                      {answer.answer_text}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  {
                    backgroundColor: selectedAnswerId ? colors.primary : colors.secondary,
                    opacity: selectedAnswerId ? 1 : 0.7
                  }
                ]}
                onPress={handleNext}
                disabled={!selectedAnswerId}
                accessible={true}
                accessibilityLabel={currentIndex === questions.length - 1 ? 'Dokončiť test' : 'Ďalšia otázka'}
                accessibilityRole="button"
                accessibilityLanguage="sk-SK"
                accessibilityState={{ disabled: !selectedAnswerId }}
                accessibilityHint={!selectedAnswerId 
                  ? "Najprv vyberte odpoveď" 
                  : currentIndex === questions.length - 1 
                    ? "Dvojitým ťuknutím ukončíte a odošlete test" 
                    : "Dvojitým ťuknutím prejdete na ďalšiu otázku"
                }
              >
                <Text style={[styles.buttonText, { color: colors.background }]}>
                  {currentIndex === questions.length - 1 ? 'Dokončiť' : 'Ďalej'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Pravá strana - informácie */}
          <View style={styles.tabletSidebar}>
            <View style={styles.sidebarCard}>
              <Text style={[styles.sidebarTitle, { color: colors.text }]}>
                Čas
              </Text>
              <Text style={[styles.sidebarValue, { color: colors.text }]}>
                {formatTime(elapsedTime)}
              </Text>
            </View>
            
            <View style={styles.sidebarCard}>
              <Text style={[styles.sidebarTitle, { color: colors.text }]}>
                Priebeh testu
              </Text>
              <View style={styles.progressContainer}>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill, 
                      { 
                        backgroundColor: colors.primary,
                        width: `${progress * 100}%` 
                      }
                    ]} 
                  />
                </View>
                <Text style={[styles.progressText, { color: colors.text }]}>
                  {Math.round(progress * 100)}%
                </Text>
              </View>
              <Text style={[styles.progressInfo, { color: colors.text }]}>
                Otázka {currentIndex + 1} z {questions.length}
              </Text>
            </View>
            
            <View style={styles.sidebarCard}>
              <Text style={[styles.sidebarTitle, { color: colors.text }]}>
                Zodpovedané
              </Text>
              <Text style={[styles.sidebarValue, { color: colors.text }]}>
                {Object.keys(selectedAnswers).length} z {questions.length}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  }
  
  // Mobile layout
  return (
    <View 
      style={[styles.fullContainer, { backgroundColor: colors.background }]}
      accessible={false}
      accessibilityLanguage="sk-SK"
    >
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          accessible={true}
          accessibilityLabel="Späť"
          accessibilityRole="button"
          accessibilityHint="Návrat na zoznam testov"
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text 
          style={[styles.title, { color: colors.text }]}
          accessible={true}
          accessibilityRole="header"
          importantForAccessibility="no-hide-descendants"
        >
          {testName}
        </Text>
        <Text 
          style={[styles.progress, { color: colors.text }]}
          accessible={true}
          accessibilityLabel={`Otázka ${currentIndex + 1} z ${questions.length}`}
        >
          {currentIndex + 1}/{questions.length}
        </Text>
      </View>
      
      {/* Progress bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.primary,
                width: `${progress * 100}%` 
              }
            ]} 
          />
        </View>
      </View>
      
      {/* Čas */}
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, { color: colors.text }]}>
          Čas: {formatTime(elapsedTime)}
        </Text>
      </View>
      
      <View 
        style={styles.questionContainer}
        accessible={true}
        accessibilityLabel={`Otázka ${currentIndex + 1}: ${currentQuestion.question}`}
        accessibilityRole="text"
        accessibilityLanguage="sk-SK"
      >
        <Text style={[styles.question, { color: colors.text }]}>
          {currentQuestion.question}
        </Text>
        
        <View style={styles.options} accessible={false}>
          {currentQuestion.answers && currentQuestion.answers.map(answer => (
            <TouchableOpacity
              key={answer.id}
              style={[
                styles.option,
                { 
                  borderColor: colors.border,
                  borderWidth: 1,
                  backgroundColor: selectedAnswerId === answer.id ? colors.primary + '20' : 'transparent'
                }
              ]}
              onPress={() => handleSelectAnswer(answer.id)}
              accessible={true}
              accessibilityLabel={answer.answer_text}
              accessibilityRole="radio"
              accessibilityState={{ 
                checked: selectedAnswerId === answer.id,
                disabled: false
              }}
              accessibilityHint="Dvojitým ťuknutím vyberiete túto odpoveď"
            >
              <View 
                style={[
                  styles.circle,
                  {
                    backgroundColor: selectedAnswerId === answer.id ? colors.primary : 'transparent',
                    borderColor: colors.border
                  }
                ]}
                importantForAccessibility="no"
              >
                {selectedAnswerId === answer.id && (
                  <View style={[styles.innerCircle, { backgroundColor: colors.background }]} />
                )}
              </View>
              <Text style={[
                styles.optionText,
                { color: colors.text }
              ]}>
                {answer.answer_text}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: selectedAnswerId ? colors.primary : colors.secondary,
              opacity: selectedAnswerId ? 1 : 0.7
            }
          ]}
          onPress={handleNext}
          disabled={!selectedAnswerId}
          accessible={true}
          accessibilityLabel={currentIndex === questions.length - 1 ? 'Dokončiť test' : 'Ďalšia otázka'}
          accessibilityRole="button"
          accessibilityLanguage="sk-SK"
          accessibilityState={{ disabled: !selectedAnswerId }}
          accessibilityHint={!selectedAnswerId 
            ? "Najprv vyberte odpoveď" 
            : currentIndex === questions.length - 1 
              ? "Dvojitým ťuknutím ukončíte a odošlete test" 
              : "Dvojitým ťuknutím prejdete na ďalšiu otázku"
          }
        >
          <Text style={[styles.buttonText, { color: colors.background }]}>
            {currentIndex === questions.length - 1 ? 'Dokončiť' : 'Ďalej'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  fullContainer: {
    flex: 1,
    width: '100%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginTop: 20
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold'
  },
  progress: {
    fontSize: 14
  },
  questionContainer: {
    flex: 1,
    width: '100%',
    padding: 20
  },
  question: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 30
  },
  options: {
    marginTop: 20
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 8,
    borderWidth: 1
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10
  },
  innerCircle: {
    width: 12,
    height: 12,
    borderRadius: 6
  },
  optionText: {
    fontSize: 16
  },
  buttonContainer: {
    width: '100%',
    padding: 20,
    alignItems: 'center'
  },
  button: {
    width: '100%',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center'
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // Nové štýly pre tablet layout
  tabletContainer: {
    flex: 1,
    flexDirection: 'row',
    width: '100%',
  },
  tabletMainContent: {
    flex: 2,
    borderRightWidth: 1,
    borderRightColor: '#e0e0e0',
  },
  tabletSidebar: {
    flex: 1,
    padding: 20,
    justifyContent: 'flex-start',
  },

  sidebarCard: {
    padding: 15,
    marginBottom: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  sidebarTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  sidebarValue: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  
  // Progress bar štýly
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    borderRadius: 4
  },
  progressText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5
  },
  progressInfo: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 5
  },
  
  // Čas pre mobilnú verziu
  timeContainer: {
    paddingHorizontal: 20,
    paddingBottom: 10,
    alignItems: 'flex-end'
  },
  timeText: {
    fontSize: 14,
    fontWeight: 'bold'
  }
});

export default TestScreen;