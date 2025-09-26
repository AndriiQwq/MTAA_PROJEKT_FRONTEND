import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import { getToken, storeToken, removeToken, getRefreshToken, storeRefreshToken, removeRefreshToken } from '../utils/tokenStorage';
import { BASE_URL } from '../config/apiConfig';

type AuthContextType = {
  token: string | null;
  login: (accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  isTokenRefreshing: boolean;
};

const AuthContext = createContext<AuthContextType>({
  token: null,
  login: async () => {},
  logout: async () => {},
  refreshToken: async () => null,
  isTokenRefreshing: false,
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [token, setToken] = useState<string | null>(null);
  const [isTokenRefreshing, setIsTokenRefreshing] = useState<boolean>(false);

  // Check token on startup
  useEffect(() => {
    const loadToken = async () => {
      const savedToken = await getToken();
      if (savedToken) setToken(savedToken);
    };
    
    loadToken();
  }, []);

  // Updated to store both tokens
  const login = async (accessToken: string, refreshToken: string) => {
    await storeToken(accessToken);
    await storeRefreshToken(refreshToken);
    setToken(accessToken);
  };

  // Updated to clear both tokens
  const logout = async () => {
    try {
      // Optional: Logout on the server
      if (token) {
        await fetch(`${BASE_URL}/users/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await removeToken();
      await removeRefreshToken();
      setToken(null);
    }
  };

  const refreshToken = async (): Promise<string | null> => {
    
    console.log("Starting token refresh process");
    
    if (isTokenRefreshing) {
      // If token refresh is already in progress, wait for it to complete
      console.log("⏳ Token refresh already in progress, waiting...");
      return new Promise((resolve) => {
        const checkToken = setInterval(() => {
          if (!isTokenRefreshing) {
            clearInterval(checkToken);
            console.log("✅ Using existing refreshed token:", token);
            resolve(token);
          }
        }, 100);
      });
    }

    try {
      setIsTokenRefreshing(true);
      
      console.log("🔍 Getting stored refresh token");
      // Get stored refresh token
      const storedRefreshToken = await getRefreshToken();
      console.log("📝 Stored refresh token exists:", !!storedRefreshToken);
      
      if (!storedRefreshToken) {
        // No refresh token available, can't refresh
        console.log("❌ No refresh token available, logging out");
        await logout();
        return null;
      }
      
      console.log("🌐 Calling refresh token API endpoint");
      // Call the refresh token endpoint with the refresh token
      const response = await fetch(`${BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ refreshToken: storedRefreshToken })
      });
      
      console.log("📡 Refresh API response status:", response.status);
      const data = await response.json();
       console.log("📡 Refresh API response data:", data);
      
      if (response.ok && data.success && data.accessToken) {
        console.log("✅ Token refresh successful, storing new token");
        const newToken = data.accessToken;
        await storeToken(newToken);
        setToken(newToken);
        
        // If a new refresh token is also provided, store it
        if (data.refreshToken) {
          console.log("📝 New refresh token received, storing it");
          await storeRefreshToken(data.refreshToken);
        }
        
        console.log("🔄 Token refresh completed successfully");
        return newToken;
      }
      
      console.log("❌ Token refresh failed, logging out");
      // If refresh failed, logout
      await logout();
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, log out the user
      await logout();
      return null;
    } finally {
      console.log("🏁 Token refresh process finished");
      setIsTokenRefreshing(false);
    }
  };

  return (
    <AuthContext.Provider value={{ token, login, logout, refreshToken, isTokenRefreshing }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
