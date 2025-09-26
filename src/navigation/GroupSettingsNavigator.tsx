import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { GroupSettingsStackParamList, RootStackParamList } from './navigation';
import GroupSettingsScreen from '../screens/GroupSettingsScreen';
import EditGroupNameScreen from '../screens/EditGroupNameScreen';
import EditGroupDescriptionScreen from '../screens/EditGroupDescriptionScreen';
import { RouteProp } from '@react-navigation/native';

const Stack = createStackNavigator<GroupSettingsStackParamList>();

type GroupSettingsNavigatorProps = {
  route?: RouteProp<RootStackParamList, 'GroupSettingsFlow'>;
};

const GroupSettingsNavigator = ({route}: GroupSettingsNavigatorProps) => {
  const initialParams = route?.params || {};
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen 
        name="GroupSettings" 
        component={GroupSettingsScreen}
        initialParams={initialParams}
      />
      <Stack.Screen name="EditGroupName" component={EditGroupNameScreen} />
      <Stack.Screen name="EditGroupDescription" component={EditGroupDescriptionScreen} />
    </Stack.Navigator>
  );
};

export default GroupSettingsNavigator;
