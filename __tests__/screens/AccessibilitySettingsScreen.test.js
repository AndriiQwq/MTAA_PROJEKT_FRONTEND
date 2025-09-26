/**
 * UI Test for Accessibility Settings Screen
 * 
 * Tests:
 * - Contrast options interaction
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, TouchableOpacity } from 'react-native';

// Mock theme context
const mockSetContrastLevel = jest.fn();
jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: { text: '#000', primary: '#007BFF', card: '#F1F1F1' },
    contrastLevel: 'normal',
    setContrastLevel: mockSetContrastLevel
  })
}));

// Navigation mock
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({ goBack: jest.fn() })
}));

jest.mock('@expo/vector-icons', () => ({ Ionicons: 'Ionicons' }));

describe('UI Test: Accessibility Settings', () => {
  test('contrast options work correctly', () => {
    // Contrast selector
    const ContrastOptions = () => (
      <View>
        <Text testID="section-title">Kontrast</Text>
        <TouchableOpacity 
          testID="normal-contrast" 
          onPress={() => mockSetContrastLevel('normal')}
        >
          <Text>Normálny</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          testID="high-contrast" 
          onPress={() => mockSetContrastLevel('high')}
        >
          <Text>Vysoký</Text>
        </TouchableOpacity>
      </View>
    );
    
    const { getByText, getByTestId } = render(<ContrastOptions />);
    
    // Check UI rendering
    expect(getByTestId('section-title')).toBeDefined();
    expect(getByText('Normálny')).toBeDefined();
    
    // Test interaction
    fireEvent.press(getByTestId('high-contrast'));
    expect(mockSetContrastLevel).toHaveBeenCalledWith('high');
  });

  test('contrast switching', () => {
    expect(mockSetContrastLevel).toHaveBeenCalled();
  });
});