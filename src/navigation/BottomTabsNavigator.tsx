import React from 'react';
import { 
  View,
  Text, 
  TouchableOpacity
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { BottomTabParamList } from './navigation';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';

import HomeScreen from '../screens/HomeScreen';
import StudyScreen from '../screens/StudyScreen';
import FriendsScreen from '../screens/FriendsScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

export const CustomHeader = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const route = useRoute();
  
  // show Back Button everywhere but not Home screen
  const showBackButton = route.name !== 'Home';
  
  return (
    <View style={{
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 15,
      paddingHorizontal: 15,
      backgroundColor: colors.background,
      // marginTop: 40,
    }}>
      {showBackButton ? (
        <TouchableOpacity 
          style={{ padding: 5 }}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
      ) : (
        <View style={{ width: 24 }} />
      )}
      
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
      }}>
        <Text style={{
          marginRight: 15,
          fontWeight: 'bold',
          color: colors.text,
        }}>
          <Ionicons name="flame" size={18} color="orange" /> 20
        </Text>
        <Text style={{
          marginRight: 15,
          fontWeight: 'bold',
          color: colors.text,
        }}>
          <Ionicons name="trophy" size={18} color={colors.text} /> lvl 6
        </Text>
        <TouchableOpacity onPress={() => navigation.navigate('Messages' as never)}>
          <Ionicons name="mail" size={24} color={colors.text} />
        </TouchableOpacity>       
      </View>
    </View>
  );
};

const BottomTabsNavigator = () => {
  const { colors } = useTheme();

  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        header: () => <CustomHeader />,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.text,
        tabBarStyle: {
          backgroundColor: colors.background,
          height: 60,
          paddingBottom: 5,
        },
        tabBarLabelStyle: {
          fontSize: 12,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="home" size={size} color={colors.text} />
          ),
        }}
      />
      <Tab.Screen
        name="Study"
        component={StudyScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="school" size={size} color={colors.text} />
          ),
        }}
      />
      <Tab.Screen
        name="Friends"
        component={FriendsScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="people" size={size} color={colors.text} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ size }) => (
            <Ionicons name="person" size={size} color={colors.text} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default BottomTabsNavigator;
