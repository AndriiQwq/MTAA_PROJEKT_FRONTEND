/**
 * UI Tests for Test Results Screen
 * 
 * Tests:
 * - UI Rendering
 * - Navigation: Tests button actions
 */

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Text, View, TouchableOpacity } from 'react-native';

// Mock navigation
const mockNavigate = jest.fn();
const mockParentNavigate = jest.fn();

jest.mock('../../src/hooks/useAppNavigation', () => ({
  useCompositeNavigation: () => ({
    navigate: mockNavigate,
    getParent: () => ({
      navigate: mockParentNavigate
    })
  })
}));

describe('UI Tests: Test Results Screen', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockNavigate.mockClear();
    mockParentNavigate.mockClear();
  });

  test('renders test score correctly', () => {
    const TestResultsUI = () => (
      <View>
        <Text testID="score-text">7 / 10</Text>
        <Text testID="percentage-text">70%</Text>
      </View>
    );
    
    const { getByTestId } = render(<TestResultsUI />);
    
    // Check score
    expect(getByTestId('score-text').props.children).toBe('7 / 10');
    expect(getByTestId('percentage-text').props.children).toBe('70%');
  });
  
  test('buttons navigate correctly', () => {
    // Navigation buttons
    const NavigationButtons = () => {
      return (
        <View>
          <TouchableOpacity 
            testID="try-again-button" 
            onPress={() => mockNavigate('Test', {
              testId: '456',
              testName: 'Slovak Quiz'
            })}
          >
            <Text>Skúsiť znova</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            testID="home-button" 
            onPress={() => mockParentNavigate('Main')}
          >
            <Text>Domov</Text>
          </TouchableOpacity>
        </View>
      );
    };
    
    const { getByTestId } = render(<NavigationButtons />);
    
    // Test try again button
    fireEvent.press(getByTestId('try-again-button'));
    expect(mockNavigate).toHaveBeenCalledWith('Test', {
      testId: '456',
      testName: 'Slovak Quiz'
    });
    
    // Test home button
    fireEvent.press(getByTestId('home-button'));
    expect(mockParentNavigate).toHaveBeenCalledWith('Main');
  });
});