import { createNavigationContainerRef } from '@react-navigation/native';
import { RootStackParamList } from '../types/index';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export function navigate(name: keyof RootStackParamList, params: any) {
  if (navigationRef.isReady()) {
    navigationRef.navigate(name as any, params);
  } else {
    // Alternatively, queue the navigation if not ready
    console.log('[NavigationService] Navigation ref not ready');
  }
}
