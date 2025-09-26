import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native'; 
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigation';
import { useTheme } from '../theme/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { API_ENDPOINTS } from '../config/apiConfig';

const LoginScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList>) => {
  const { colors } = useTheme();
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    username?: string; 
    password?: string 
  }>({});

  const validateForm = () => {
    const errors: { 
      username?: string; 
      password?: string 
    } = {};
    
    // User name validation 
    if (!username || username.length < 3 || username.length > 32 || !/^[a-zA-Z0-9_]*$/.test(username)) {
      errors.username = 'Invalid username format';
    }
    
    // User password validation
    if (!password || password.length < 8) {
      errors.password = 'Invalid password format';
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0; // return true if no errors
  };

  const handleLogin = async () => {
    if (!validateForm()) { // Validate form before making API call 
      return;
    }

    setLoading(true); // Set loading state to true
    console.log("🔐 Starting login process for user:", username);

    try {
      const response = await fetch(`${API_ENDPOINTS.USERS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: username, password: password }),
      });
      console.log("API response status:", response.status);

      if (response.status === 404) { 
        Alert.alert(
          "Login Failed",
          "User not found",
          [{ text: "OK" }]
        );
        return;
      }

      const data = await response.json();
      // console.log("API response data:", data);

      if (response.ok && data.accessToken) {
        // Get the refresh token from the response or use an empty string as fallback
        const refreshToken = data.refreshToken || '';
        
        // Call login with both tokens
        await login(data.accessToken, refreshToken);
        console.log("✅ Login successful, navigating to Main screen");
        navigation.navigate('Main');
      } else {
        console.error("Login failed:", data.message, "Status:", response.status);
        Alert.alert(
          "Login Failed",
          data.message || "Invalid username or password",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Connection error:", error);
      Alert.alert(
        "Connection Error",
        "Could not connect to the server. Please try again later.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };
  
  const handleRegister = () => {
    navigation.navigate('Registration');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { backgroundColor: colors.background }]}>
          <Text style={[styles.title, { color: colors.text }]}>Login</Text>

          <TextInput
            style={[
              styles.input, 
              { 
                borderColor: errors.username ? 'red' : colors.primary, 
                color: colors.text 
              }
            ]}
            placeholder="Nickname"
            placeholderTextColor={colors.tertiary}
            value={username}
            onChangeText={(text) => {
              setUsername(text);
              if (errors.username) {
                setErrors({...errors, username: undefined});
              }
            }}
            autoCapitalize="none"
          />
          {errors.username ? (
            <Text style={styles.errorText}>{errors.username}</Text>
          ) : null}

          <TextInput
            style={[
              styles.input, 
              { 
                borderColor: errors.password ? 'red' : colors.primary, 
                color: colors.text 
              }
            ]} 
            placeholder="Password"
            placeholderTextColor={colors.tertiary}
            value={password}
            onChangeText={(text) => {
              setPassword(text);
              if (errors.password) {
                setErrors({...errors, password: undefined});
              }
            }}
            secureTextEntry
          />
          {errors.password ? (
            <Text style={styles.errorText}>{errors.password}</Text>
          ) : null}

          <TouchableOpacity 
            style={[
              styles.loginButton, 
              { 
                backgroundColor: colors.primary,
                opacity: loading ? 0.7 : 1
              }
            ]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.background} />
            ) : (
              <Text style={[styles.loginButtonText, { color: colors.background }]}>
                Login
              </Text>
            )}
          </TouchableOpacity>


          <TouchableOpacity onPress={handleRegister} disabled={loading}>
            <Text style={[styles.registerText, { color: colors.text }]}>
              Registration
            </Text>
          </TouchableOpacity>
        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
  },
  input: {
    width: '100%',
    padding: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderRadius: 6,
  },
  errorText: {
    color: 'red',
    fontSize: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  loginButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
    borderRadius: 6,
    height: 50,
  },
  loginButtonText: {
    fontSize: 16,
  },
  registerText: {
    fontSize: 16,
  },
});

export default LoginScreen;
