import { Dimensions, useWindowDimensions } from 'react-native';
import { useEffect, useState } from 'react';

// Minimálna šírka tabletu
const TABLET_BREAKPOINT = 1000;

// Funkcia na zistenie, či je zariadenie tablet
export const isTablet = (): boolean => {
  const { width, height } = Dimensions.get('window');
  return Math.max(width, height) >= TABLET_BREAKPOINT;
};

// Hook pre sledovanie zmien rozmerov
export const useResponsive = () => {
  const dimensions = useWindowDimensions();
  const [isTabletDevice, setIsTabletDevice] = useState(
    Math.max(dimensions.width, dimensions.height) >= TABLET_BREAKPOINT
  );

  useEffect(() => {
    setIsTabletDevice(Math.max(dimensions.width, dimensions.height) >= TABLET_BREAKPOINT);
  }, [dimensions.width, dimensions.height]);

  return {
    isTablet: isTabletDevice,
    width: dimensions.width,
    height: dimensions.height
  };
};
