import { NavigationContainerRef, createNavigationContainerRef } from '@react-navigation/native';

export type GroupSettingsStackParamList = {
  GroupSettings: { groupId: string; groupName: string; isOwner: boolean };
  EditGroupName: { groupId: string; currentName: string };
  EditGroupDescription: { groupId: string; currentDescription: string };
};

// Root navigation
export type RootStackParamList = {
    Login: undefined;
  Registration: undefined;
  Main: undefined;
  TestFlow: { 
    screen?: keyof TestStackParamList;
    params?: {
      subjectName: string;
    }};
  SettingsFlow: undefined | { screen?: keyof SettingsStackParamList };
  Messages: undefined;
  GroupChat: { 
    groupId: string; 
    groupName: string; 
    members: Array<{ id: string; name: string }> };
  GroupProfile: { 
    groupId: string; 
    groupName: string; 
    description: string; 
    members: Array<{ id: string; name: string }>;
    level: number;
    isMember: boolean;
    logo?: string;
  };
  GroupSettingsFlow: { 
    groupId: string; 
    groupName: string;
    isOwner: boolean;
    screen?: keyof GroupSettingsStackParamList 
  };
  CreateGroup: undefined;
};

// Bottom tabs
export type BottomTabParamList = {
  Home: undefined;
  Study: undefined;
  Friends: undefined;
  Profile: undefined;
};

export type TestStackParamList = {
  TestSelection: { 
    subjectName: string 
  };
  Test: { 
    testId: string; 
    testName: string;
  };
  TestResults: { 
    score: number; 
    total: number; 
    timeSpent: string;
    percentage: number;
    resultId: string;
    incorrectQuestions?: any[];
    testId: string;
    testName: string;
  };
};


// Settings flow navigation
export type SettingsStackParamList = {
  Settings: undefined; // Settings screen
  Preferences: undefined; // Preferences screen
  ProfileSettings: undefined; // Profile settings screen
  AccessibilitySettings: undefined;
};


export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// Helper function for logout
export const resetToLogin = () => {
  if (navigationRef.isReady()) {
    navigationRef.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  }
};
