# MTAA Frontend Project

This is a mobile application project developed for the **MTAA (Mobile Technologies and Applications)** university course during the **summer semester 2024/2025**.

## Project Description

A React Native mobile application built with Expo that provides study functionality, group management, messaging, and test features. The app includes user authentication, real-time notifications, offline support, and accessibility features.

## Technologies Used

- **React Native** with **Expo SDK 53**
- **TypeScript**
- **React Navigation** for routing
- **WebSocket** for real-time messaging
- **Expo Notifications** for push notifications
- **AsyncStorage** for local data persistence
- **Jest** for testing

## Prerequisites

Before running this project, make sure you have:

- **Node.js** (version 18 or higher)
- **npm** or **yarn**
- **Expo CLI** installed globally: `npm install -g @expo/cli`
- **EAS CLI** for building: `npm install -g @expo/eas-cli`
- **Android Studio** (for Android development) or **Xcode** (for iOS development)

## Setup and Installation

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure API URL

Change the `API_URL` to your backend URL in the file `./src/config/apiConfig.tsx`:

```typescript
export const API_URL = 'YOUR_BACKEND_URL_HERE';
```

### 3. Install Expo Plugins

```bash
npx expo install expo-build-properties
```

## Running the Project

### Development Mode

To start the development server:

```bash
npm start
```

This will open the Expo Developer Tools. You can then:

- Scan the QR code with the Expo Go app on your phone
- Press `a` to run on Android emulator
- Press `i` to run on iOS simulator
- Press `w` to run in web browser

### Platform-Specific Commands

```bash
# Run on Android
npm run android

# Run on iOS  
npm run ios

# Run on Web
npm run web
```

## Building for Production

### Using EAS Build

1. **Login to Expo:**

   ```bash
   eas login
   ```

2. **Build for Android:**

   ```bash
   eas build --profile preview --platform android
   ```

3. **Build for iOS:**

   ```bash
   eas build --profile preview --platform ios
   ```

4. **Install the built APK/IPA file** and run it on your device.

## Testing

Run tests using:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

## Troubleshooting

If the app doesn't work properly, try these steps:

1. **Clear dependencies and reinstall:**

   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Clear Expo cache:**

   ```bash
   npx expo start --clear
   ```

3. **Reinstall Expo plugins:**

   ```bash
   npx expo install expo-build-properties
   ```

4. **Rebuild with EAS:**

   ```bash
   eas build --profile preview --platform android --clear-cache
   ```

## Project Structure

- `/src` - Main source code
  - `/components` - Reusable UI components
  - `/screens` - Application screens
  - `/navigation` - Navigation configuration
  - `/services` - External services (WebSocket, Notifications)
  - `/context` - React context providers
  - `/hooks` - Custom React hooks
  - `/utils` - Utility functions
  - `/theme` - Styling and theme configuration

## Features

- User authentication (login/register)
- Study management with tests
- Group creation and management
- Real-time messaging
- Push notifications
- Offline support
- Accessibility features
- Friends system
- Profile management
