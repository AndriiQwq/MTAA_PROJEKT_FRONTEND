import React, { createContext, useState, useEffect, useContext } from 'react';
import NetInfo from '@react-native-community/netinfo';

// This code was genereded by ChatGPT and is not a direct copy of any existing code.

type NetworkContextType = {
  isConnected: boolean;
  isFirstCheck: boolean;
};

const NetworkContext = createContext<NetworkContextType>({
  isConnected: true,
  isFirstCheck: true
});

export const NetworkProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isFirstCheck, setIsFirstCheck] = useState<boolean>(true);

  useEffect(() => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      setIsConnected(state.isConnected ?? false);
      setIsFirstCheck(false);
    };

    checkConnection();

    const unsubscribe = NetInfo.addEventListener(state => {
      console.log("Network connection state:", state.isConnected);
      setIsConnected(state.isConnected ?? false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <NetworkContext.Provider value={{ isConnected, isFirstCheck }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);