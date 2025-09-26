import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import TestSelectionScreen from '../screens/TestSelectionScreen';
import TestScreen from '../screens/TestScreen';
import TestResultsScreen from '../screens/TestResultsScreen';
import { TestStackParamList } from './navigation';
import { RouteProp, useRoute } from '@react-navigation/native';
import { RootStackParamList } from './navigation';

const TestStack = createNativeStackNavigator<TestStackParamList>();

type TestNavigatorRouteProp = RouteProp<RootStackParamList, 'TestFlow'>;

const TestNavigator = () => {
  const route = useRoute<TestNavigatorRouteProp>();
  const subjectName = route.params?.params?.subjectName;

  return (
    <TestStack.Navigator
      screenOptions={{
        headerShown: false
      }}
      initialRouteName="TestSelection"
    >
      <TestStack.Screen 
        name="TestSelection" 
        component={TestSelectionScreen} 
        initialParams={{ subjectName }}
      />
      <TestStack.Screen name="Test" component={TestScreen} />
      <TestStack.Screen name="TestResults" component={TestResultsScreen} />
    </TestStack.Navigator>
  );
};

export default TestNavigator;
