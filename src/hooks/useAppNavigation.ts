import { useNavigation, NavigationProp, CompositeNavigationProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TestStackParamList } from '../navigation/navigation';

// Pre navigáciu z hlavných obrazoviek
export function useRootNavigation() {
  return useNavigation<NativeStackNavigationProp<RootStackParamList>>();
}

// Pre navigáciu v rámci testu
export function useTestNavigation() {
  return useNavigation<NativeStackNavigationProp<TestStackParamList>>();
}

// Pre navigáciu z testu do hlavných obrazoviek
export function useCompositeNavigation() {
  return useNavigation<CompositeNavigationProp<
    NativeStackNavigationProp<TestStackParamList>,
    NativeStackNavigationProp<RootStackParamList>
  >>();
}
