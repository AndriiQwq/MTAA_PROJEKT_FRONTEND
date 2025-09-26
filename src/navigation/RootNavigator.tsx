import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './navigation';
import LoginScreen from '../screens/LoginScreen';
import RegistrationScreen from '../screens/RegisterScreen';
import BottomTabsNavigator from './BottomTabsNavigator';
import TestNavigator from './TestNavigator';
import SettingsNavigator from './SettingsNavigator';
import MessagesScreen from '../screens/MessagesScreen';
import GroupChatScreen from '../screens/GroupChatScreen';
import GroupProfileScreen from '../screens/GroupProfileScreen';
import GroupSettingsNavigator from './GroupSettingsNavigator';
import CreateGroupScreen from '../screens/CreateGroupScreen';
import { useAuth } from '../context/AuthContext';

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { token } = useAuth();

  return (
    <Stack.Navigator
      initialRouteName={token ? "Main" : "Login"}
      screenOptions={{
        headerShown: false,
        gestureEnabled: false
      }}
    >
      {/* Auth screens */}
      <Stack.Screen 
        name="Login" 
        component={LoginScreen}
      />
      <Stack.Screen 
        name="Registration" 
        component={RegistrationScreen} 
      />

      {/* Main app */}
      <Stack.Screen 
        name="Main" 
        component={BottomTabsNavigator}
        options={{ gestureEnabled: false }}
      />

      {/* Nested navigators */}
      <Stack.Screen 
        name="TestFlow" 
        component={TestNavigator}
      />
      
      <Stack.Screen 
        name="SettingsFlow" 
        component={SettingsNavigator}
      />

      <Stack.Screen 
        name="GroupSettingsFlow" 
        component={GroupSettingsNavigator} 
        options={{ headerShown: false }}
      />
      
      {/* Messages screen */}
      <Stack.Screen 
        name="Messages" 
        component={MessagesScreen}
      />
      
      {/* Chat screen */}
      <Stack.Screen
        name="GroupChat"
        component={GroupChatScreen}
      />
      
      {/* Group Profile */}
      <Stack.Screen
        name="GroupProfile"
        component={GroupProfileScreen}
      />

      {/* Create Group */}
      <Stack.Screen 
        name="CreateGroup" 
        component={CreateGroupScreen}
      />
    </Stack.Navigator>
  );
};

export default RootNavigator;
