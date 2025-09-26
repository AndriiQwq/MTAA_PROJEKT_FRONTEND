module.exports = {
  name: "MTAA_PROJEKT_FRONTEND",
  slug: "mtaa_projekt_frontend",
  version: "1.0.0",
  orientation: "portrait",
  icon: "./src/assets/icon.png",
  userInterfaceStyle: "light",
  splash: {
    image: "./src/assets/splash.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff"
  },
  assetBundlePatterns: [
    "**/*"
  ],
  ios: {
    supportsTablet: true,
    bundleIdentifier: "com.andriiqwq.mtaaprojektfrontend"
  },
  android: {
    adaptiveIcon: {
      foregroundImage: "./src/assets/adaptive-icon.png",
      backgroundColor: "#ffffff"
    },
    permissions: [
      "INTERNET",
      "ACCESS_NETWORK_STATE",
      "VIBRATE"
    ],
    package: "com.andriiqwq.mtaa_projekt_frontend"
  },
  web: {
    favicon: "./src/assets/favicon.png"
  },
  plugins: [
    [
      "expo-notifications",
      {
        icon: "./src/assets/notification-icon.png",
        color: "#ffffff"
      }
    ],
    [
      "expo-build-properties",
      {
        android: {
          usesCleartextTraffic: true
        }
      }
    ]
  ],
  extra: {
    eas: {
      projectId: "24b1f273-8a0b-40ea-b629-3b6de7a83969"
    }
  }
};