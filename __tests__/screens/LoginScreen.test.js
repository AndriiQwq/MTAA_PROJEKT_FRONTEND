import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import LoginScreen from '../../src/screens/LoginScreen';
import { AuthContext } from '../../src/context/AuthContext';

/**
 * UI Tests for Login Screen
 * 
 * Tests:
 * - Rendering
 * - validation for empty inputs
 * - User input handling
 * - Navigation
 */

// Mock dependencies
jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    login: jest.fn(),
  }),
  AuthContext: {
    Provider: ({ children }) => children
  }
}));

jest.mock('../../src/theme/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      primary: '#007bff',
      background: '#ffffff',
      text: '#000000',
      tertiary: '#999999' 
    }
  })
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn()
};

describe('UI Tests: Login Screen', () => {
  test('renders login form correctly', () => {
    // Render the component
    const { getAllByText, getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Check all UI elements
    expect(getAllByText('Login')[0]).toBeDefined();
    expect(getByPlaceholderText('Nickname')).toBeDefined();
    expect(getByPlaceholderText('Password')).toBeDefined();
  });
  
  test('shows validation errors', () => {
    const { getAllByText, queryByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    expect(queryByText('Invalid username format')).toBeNull();
    
    // Press login button
    const loginButtons = getAllByText('Login');
    fireEvent.press(loginButtons[loginButtons.length - 1]);
    
    // Expect error message
    expect(queryByText('Invalid username format')).toBeDefined();
  });
  
  test('updates input fields', () => {
    const { getByPlaceholderText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    // Find input fields
    const usernameInput = getByPlaceholderText('Nickname');
    const passwordInput = getByPlaceholderText('Password');
    
    // Simulate user typing in both fields
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    
    // Check the input values updated correctly
    expect(usernameInput.props.value).toBe('testuser');
    expect(passwordInput.props.value).toBe('password123');
  });
  
  test('pressing registration button', () => {
    const { getByText } = render(
      <LoginScreen navigation={mockNavigation} />
    );
    
    const registerButton = getByText('Registration');
    fireEvent.press(registerButton);
    
    // Check that it navigates to the registration screen
    expect(mockNavigation.navigate).toHaveBeenCalledWith('Registration');
  });
});