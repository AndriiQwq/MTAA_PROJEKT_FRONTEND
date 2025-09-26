import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SettingsStackParamList } from './navigation';

import SettingsScreen from '../screens/SettingsScreen';
import PreferencesScreen from '../screens/PreferencesScreen';
import SettingsProfileScreen from '../screens/SettingsProfileScreen';
import AccessibilitySettingsScreen from '../screens/AccessibilitySettingsScreen';

const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const SettingsNavigator = () => {
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <SettingsStack.Screen name="Settings" component={SettingsScreen} />
      <SettingsStack.Screen name="Preferences" component={PreferencesScreen} />
      <SettingsStack.Screen name="ProfileSettings" component={SettingsProfileScreen} />
      <SettingsStack.Screen name="AccessibilitySettings" component={AccessibilitySettingsScreen} />
    </SettingsStack.Navigator>
  );
};

export default SettingsNavigator;
