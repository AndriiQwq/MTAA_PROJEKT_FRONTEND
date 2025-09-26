import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../context/NetworkContext';
import { useTheme } from '../theme/ThemeContext';

export const OfflineNotice = () => {
  const { isConnected, isFirstCheck } = useNetwork();
  const { colors } = useTheme();
  
  if (isFirstCheck || isConnected) {
    return null;
  }
  
  return (
    <View style={[styles.container, { backgroundColor: colors.error || '#ff6b6b' }]}>
      <Text style={styles.text}>
        Nie ste pripojení k internetu. Niektoré funkcie nemusia byť dostupné.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
    alignItems: 'center',
    width: '100%',
    position: 'absolute',
    top: 0,
    zIndex: 1000,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});