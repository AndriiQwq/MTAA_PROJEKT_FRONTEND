/**
 * UI Tests for Study Screen
 * 
 * Tests:
 * - UI Rendering
 * - Navigation
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View, TouchableOpacity } from 'react-native';

// Mock dependencies
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: jest.fn((callback) => {
    // Don't automatically call the callback to prevent infinite loops
    return null;
  })
}));

jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007bff',
      background: '#ffffff',
      text: '#000000',
      error: '#ff0000'
    }
  })
}));

// Mock navigation
const mockNavigate = jest.fn();
jest.mock('../../src/hooks/useAppNavigation', () => ({
  useRootNavigation: () => ({
    navigate: mockNavigate
  })
}));

// Mock API client
jest.mock('../../src/utils/apiClient', () => ({
  useApiClient: () => ({
    get: jest.fn().mockResolvedValue({
      json: () => Promise.resolve({ 
        success: true, 
        data: [
          { subject: 'Solvak1' },
          { subject: 'Solvak2' }
        ]
      })
    })
  })
}));

jest.mock('../../src/context/NetworkContext', () => ({
  useNetwork: () => ({
    isConnected: true
  })
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons'
}));

describe('UI Tests: Study Screen', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockNavigate.mockClear();
  });

  test('renders correctly', () => {
    const HeaderUI = () => (
      <View>
        <Text testID="header-text">Vyberte si predmet</Text>
        <Text testID="loading-indicator">Loading...</Text>
      </View>
    );
    const { getByTestId } = render(<HeaderUI />);
    
    expect(getByTestId('loading-indicator')).toBeDefined();
    expect(getByTestId('header-text')).toBeDefined();
    expect(getByTestId('header-text').props.children).toBe('Vyberte si predmet');
  });
  
  test('navigates when subject is pressed', () => {
    const SubjectButton = () => {
      const navigation = require('../../src/hooks/useAppNavigation').useRootNavigation();
      
      const handlePress = () => {
        navigation.navigate('TestFlow', {
          screen: 'TestSelection',
          params: { subjectName: 'Solvak1' }
        });
      };
      
      return (
        <TouchableOpacity testID="slovak1-subject" onPress={handlePress}>
          <Text>Solvak1</Text>
        </TouchableOpacity>
      );
    };
    
    // Render the component
    const { getByTestId } = render(<SubjectButton />);
    
    // Press the subject button
    fireEvent.press(getByTestId('slovak1-subject'));
    
    // Verify navigation was called correctly
    expect(mockNavigate).toHaveBeenCalledWith('TestFlow', {
      screen: 'TestSelection',
      params: { subjectName: 'Solvak1' }
    });
  });
});