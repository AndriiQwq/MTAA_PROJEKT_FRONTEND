import { Platform } from 'react-native';

const API_URL = 'http://10.10.10.168:3000';

export const BASE_URL = Platform.select({
    android: API_URL,
    ios: API_URL,
    default: API_URL,
  });
  
// API endpoints
export const API_ENDPOINTS = {
    // Achievements
    ACHIEVEMENTS: {
      ALL: `${BASE_URL}/achievements`,
      DETAIL: (id: string) => `${BASE_URL}/achievements/detail/${id}`,
      USER: (userId: string) => `${BASE_URL}/achievements/user/${userId}`,
    },
  
    // Friends
    FRIENDS: {
      ALL: `${BASE_URL}/friends`,
      ADD: (userId: string) => `${BASE_URL}/friends/${userId}`,
      REMOVE: (userId: string) => `${BASE_URL}/friends/${userId}`,
      SEARCH: `${BASE_URL}/friends/search`,
    },
  
    // Groups
    GROUPS: {
      CREATE: `${BASE_URL}/groups`,
      ALL: `${BASE_URL}/groups`,
      DETAIL: (id: string) => `${BASE_URL}/groups/${id}`,
      DELETE: (id: string) => `${BASE_URL}/groups/${id}`,
      MEMBERS: (id: string) => `${BASE_URL}/groups/${id}/members`,
      JOIN: (id: string) => `${BASE_URL}/groups/${id}/member`,
      EDIT_NAME: (id: string) => `${BASE_URL}/groups/${id}/edit-name`,
      EDIT_DESCRIPTION: (id: string) => `${BASE_URL}/groups/${id}/edit-description`,
      REMOVE_MEMBER: (groupId: string, userId: string) => `${BASE_URL}/groups/${groupId}/member/${userId}`,
      SEARCH: `${BASE_URL}/groups/search`,
      CURRENT: `${BASE_URL}/groups/current`,
      LEAVE: `${BASE_URL}/groups/leave`,
    },
  
    // Notifications
    NOTIFICATIONS: {
      ALL: `${BASE_URL}/notifications`,
      MARK_READ: (id: string) => `${BASE_URL}/notifications/read/${id}`,
      MARK_ALL_READ: `${BASE_URL}/notifications/read-all`,
      DELETE: (id: string) => `${BASE_URL}/notifications/${id}`,
    },
  
    // Tests
    TESTS: {
      GET_TESTS: `${BASE_URL}/tests/test`,
      GET_QUESTIONS: `${BASE_URL}/tests/questions`,
      GET_ANSWERS: `${BASE_URL}/tests/answers`,
      SUBMIT_ANSWERS: `${BASE_URL}/tests/check-answers`,
      GET_SUBJECTS: `${BASE_URL}/tests/subjects`,
      SAVE_RESULTS: `${BASE_URL}/tests/results`
    },
  
    // User Avatars
    AVATARS: {
      UPLOAD: `${BASE_URL}/users/avatar`,
      OWN: `${BASE_URL}/users/avatar`,
      DELETE: `${BASE_URL}/users/avatar`,
      USER: (userId: string) => `${BASE_URL}/users/avatar/${userId}`,
    },
    // Users
    USERS: {
      REGISTER: `${BASE_URL}/users/register/`,
      LOGIN: `${BASE_URL}/users/login/`,
      EDIT_NAME: `${BASE_URL}/users/edit-name`,
      EDIT_PASSWORD: `${BASE_URL}/users/edit-password`,
      DELETE: `${BASE_URL}/users`,
      PROFILE: `${BASE_URL}/users/profile`,
      LOGOUT: `${BASE_URL}/users/logout`,
      PROFILE_BY_ID: (userId: string) => `${BASE_URL}/users/${userId}`,
      ME: `${BASE_URL}/users/me`,
    },
  
    // Chats
    CHATS: {
      ALL: `${BASE_URL}/chats`,
      GROUP: (groupId: string) => `${BASE_URL}/chats/group/${groupId}`,
      SEND: `${BASE_URL}/chats/message`,
    },
};
  
// Note:
// We can add function to api colls with auth token, uploadingFile functions here
// How to use: 
// import { API_ENDPOINTS } from '../config/apiConfig';


