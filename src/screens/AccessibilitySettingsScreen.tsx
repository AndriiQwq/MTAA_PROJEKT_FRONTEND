import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme } from '../theme/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

type ContrastLevel = 'normal' | 'medium' | 'high';

const AccessibilitySettingsScreen = () => {
  const { colors, contrastLevel, setContrastLevel } = useTheme();
  const navigation = useNavigation();

  const renderContrastOption = (level: ContrastLevel, label: string) => (
    <TouchableOpacity
      style={[
        styles.optionButton, { 
          backgroundColor: contrastLevel === level ? colors.primary : colors.card,
          borderColor: colors.border
        }
      ]}
      onPress={() => setContrastLevel(level)}
    >
      <Text style={{ fontSize: 16, color: contrastLevel === level ? '#FFFFFF' : colors.text }}>
        {label}
      </Text>
      {contrastLevel === level && (
        <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Nastavenia prístupnosti
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          Kontrast
        </Text>
        
        {renderContrastOption('normal', 'Normálny')}
        {renderContrastOption('medium', 'Stredný')}
        {renderContrastOption('high', 'Vysoký')}
      </View>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold'
  },
  section: {
    marginBottom: 24
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12
  }
});

export default AccessibilitySettingsScreen;