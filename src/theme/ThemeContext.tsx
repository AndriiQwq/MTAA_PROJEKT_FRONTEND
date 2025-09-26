import React, { createContext, useState, useContext, useEffect } from 'react';
import { LightColors, DarkColors } from './colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useColorScheme } from 'react-native';
import { useResponsive } from '../utils/deviceUtils';

// Types
type ContrastLevel = 'normal' | 'medium' | 'high';

// Theme context type
type ThemeContextType = {
  isDarkMode: boolean;
  colors: typeof LightColors;
  toggleTheme: () => void;
  contrastLevel: ContrastLevel;
  setContrastLevel: (level: ContrastLevel) => void;
  isTablet: boolean;
  useSystemTheme: boolean;
  setUseSystemTheme: (use: boolean) => void;
};

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

// Contrast color definitions
const contrastColors = {
  normal: { dark: {}, light: {} },
  medium: {
    dark: {
      background: '#142229', // Even darker teal-gray for background
      text: '#FFFFFF', // Pure white for better contrast
      card: '#1A3036', // Darker teal shade for cards
      border: '#6D8290', // Lighter border shade
      primary: '#00BCD4', // Bright teal primary
    },
    light: {
      background: '#FFFFFF', // Pure white background
      text: '#263238', // Darker text for contrast
      card: '#D9F0F3', // Lighter teal shade for cards
      border: '#A0CED9', // Darker border shade
      primary: '#00796B', // Darker teal primary
    }
  },
  high: {
    dark: {
      background: '#000000', // Black for maximum contrast
      text: '#FFFFFF', // Pure white text
      primary: '#00E5FF', // Bright cyan primary
      secondary: '#00E5FF', // Bright cyan as secondary
      tertiary: '#FFFFFF', // White tertiary
      buttonText: '#000000', // Black for button text
      card: '#000000', // Black card background
      border: '#FFFFFF', // White border
      error: '#FF1744', // Bright red for errors
    },
    light: {
      background: '#FFFFFF', // Pure white background
      text: '#000000', // Pure black text
      primary: '#0000CC', // Dark blue primary
      secondary: '#003366', // Dark blue secondary
      tertiary: '#000000', // Black tertiary
      buttonText: '#FFFFFF', // White for button text
      card: '#FFFFFF', // White card background
      border: '#000000', // Black border
      error: '#B71C1C', // Dark red for errors
    }
  }
};

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const { isTablet } = useResponsive();
  
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [contrastLevel, setContrastLevel] = useState<ContrastLevel>('normal');
  const [useSystemTheme, setUseSystemTheme] = useState(true);
  
  // Load settings on app start
  useEffect(() => {
    (async () => {
      try {
        const savedUseSystem = await AsyncStorage.getItem('use_system_theme');
        if (savedUseSystem !== null) {
          const useSystem = savedUseSystem === 'true';
          setUseSystemTheme(useSystem);
        }
        
        const savedTheme = await AsyncStorage.getItem('theme_mode');
        if (savedTheme) {
          setIsDarkMode(savedTheme === 'dark');
        } else if (systemColorScheme) {
          // Fallback to system theme if no saved theme exists
          setIsDarkMode(systemColorScheme === 'dark');
        }

        const savedContrast = await AsyncStorage.getItem('contrast_level') as ContrastLevel;
        if (savedContrast && ['normal', 'medium', 'high'].includes(savedContrast)) {
          setContrastLevel(savedContrast);
        }
      } catch (e) {
        console.error('Failed to load theme settings', e);
        // Fallback to system theme on error
        if (systemColorScheme) {
          setIsDarkMode(systemColorScheme === 'dark');
        }
      }
    })();
  }, [systemColorScheme]);

  // Apply system theme only if useSystemTheme is true and no manual override has occurred
  useEffect(() => {
    if (useSystemTheme && systemColorScheme) {
      setIsDarkMode(systemColorScheme === 'dark');
    }
  }, [useSystemTheme, systemColorScheme]);

  // Save settings to storage
  useEffect(() => {
    (async () => {
      try {
        await AsyncStorage.setItem('theme_mode', isDarkMode ? 'dark' : 'light');
        await AsyncStorage.setItem('contrast_level', contrastLevel);
        await AsyncStorage.setItem('use_system_theme', useSystemTheme.toString());
      } catch (e) {
        console.error('Failed to save theme settings', e);
      }
    })();
  }, [isDarkMode, contrastLevel, useSystemTheme]);
  
  // Get colors based on current theme and contrast level
  const colors = {
    ...(isDarkMode ? DarkColors : LightColors),
    ...(contrastLevel !== 'normal' 
      ? contrastColors[contrastLevel][isDarkMode ? 'dark' : 'light'] 
      : {})
  };

  // Allow toggling theme regardless of useSystemTheme, but disable system override if toggled manually
  const toggleTheme = () => {
    setIsDarkMode(prev => !prev);
    // If toggling manually, disable system theme to prevent override
    if (useSystemTheme) {
      setUseSystemTheme(false);
    }
  };

  return (
    <ThemeContext.Provider value={{ 
      isDarkMode, 
      colors, 
      toggleTheme,
      contrastLevel, 
      setContrastLevel,
      isTablet,
      useSystemTheme,
      setUseSystemTheme
    }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
