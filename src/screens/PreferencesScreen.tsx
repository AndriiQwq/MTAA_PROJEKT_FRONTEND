import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../theme/ThemeContext';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';


const PreferencesScreen = () => {
    const { colors } = useTheme();
    const navigation = useNavigation();

    const [soundEnabled, setSoundEnabled] = useState(true);
    const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
    return (
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>

            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </TouchableOpacity>

            <Text style={[styles.headerTitle, { color: colors.text }]}>Preferencie</Text>
            <View style={{ width: 24 }} />

          </View>
          
          {/* Content */}
          <View style={styles.content}>

            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Prispôsobenie aplikácie
            </Text>
            
            {/* Sound */}
            <View style={[styles.preferenceItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.preferenceText, { color: colors.text }]}>zvuk</Text>
              
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={"#f4f3f4"}
              />

            </View>
            
            {/* Notifications */}
            <View style={[styles.preferenceItem, { borderBottomColor: colors.border }]}>
              <Text style={[styles.preferenceText, { color: colors.text }]}>notifikácie</Text>
              
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: "#767577", true: colors.primary }}
                thumbColor={"#f4f3f4"}
              />
              
            </View>
            
          </View>
        </SafeAreaView>
    );
};
    
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  preferenceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    marginVertical: 5,
    borderBottomWidth: 1,
  },
  preferenceText: {
    fontSize: 16,
  },
});
    
export default PreferencesScreen;