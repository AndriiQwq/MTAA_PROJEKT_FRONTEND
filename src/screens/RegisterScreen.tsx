import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  Keyboard,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/navigation';
import { useTheme } from '../theme/ThemeContext';
import { API_ENDPOINTS } from '../config/apiConfig';

const RegistrationScreen = ({ navigation }: NativeStackScreenProps<RootStackParamList, 'Registration'>) => {
  const { colors } = useTheme();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ 
    username?: string; 
    password?: string;
    confirmPassword?: string; 
  }>({});

  // Validate form for input data
  const validateForm = () => {
    const errors: { 
      username?: string; 
      password?: string;
      confirmPassword?: string;
    } = {};
    
    if (!username || username.length < 3 || username.length > 32 || !/^[a-zA-Z0-9_]*$/.test(username)) {
      errors.username = 'Username must be 3-32 characters (letters, numbers, underscore)';
    }
    
    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }
    
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_ENDPOINTS.USERS.REGISTER}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          name: username, 
          password: password 
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        Alert.alert(
          "Registration Successful",
          "Your account has been created successfully. Please login.",
          [
            { 
              text: "OK", 
              onPress: () => navigation.replace('Login') 
            }
          ]
        );
      } else {
        console.error("Registration failed:", data.message, "Status:", response.status);
        Alert.alert(
          "Registration Failed",
          data.message || "Could not create account. Try another username.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      console.error("Connection error:", error);
      Alert.alert(
        "Connection Error",
        "Failed to connect to the server. Please check your internet connection.",
        [{ text: "OK" }]
      );
    } finally {
      setLoading(false);
    }
  };

  const handleGoToLogin = () => {
    navigation.navigate('Login');
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.title, { color: colors.text }]}>Create Account</Text>

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

        <TextInput
          style={[
            styles.input, 
            { 
              borderColor: errors.confirmPassword ? 'red' : colors.primary, 
              color: colors.text 
            }
          ]}
          placeholder="Confirm Password"
          placeholderTextColor={colors.tertiary}
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            if (errors.confirmPassword) {
              setErrors({...errors, confirmPassword: undefined});
            }
          }}
          secureTextEntry
        />
        {errors.confirmPassword ? (
            <Text style={styles.errorText}>{errors.confirmPassword}</Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.registerButton, 
            { 
              backgroundColor: colors.primary,
              opacity: loading ? 0.7 : 1
            }
          ]}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={[styles.registerButtonText, { color: colors.background }]}>
              Register
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={handleGoToLogin} disabled={loading}>
            <Text style={[styles.loginText, { color: colors.text }]}>
              Already have an account? Login
            </Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
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
  registerButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 30,
    marginBottom: 20,
    borderRadius: 6,
    height: 50,
  },
  registerButtonText: {
    fontSize: 16,
  },
  loginText: {
    fontSize: 16,
  },
});

export default RegistrationScreen;
