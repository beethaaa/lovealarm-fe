import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Initialize i18n FIRST before any component renders
import './src/i18n';

import AppNavigator from './src/navigation/AppNavigator';
import { bleService } from './src/services/ble/BleService';
import { useBleStore } from './src/store/bleStore';
import { useAppStore } from './src/store/appStore';

const App = () => {
  const { setHasPermissions, setBluetoothState } = useBleStore();
  const { setIsInitialized } = useAppStore();

  useEffect(() => {
    // Initialize permissions on startup
    const init = async () => {
      const granted = await bleService.requestAndroidPermissions();
      setHasPermissions(granted);
      setIsInitialized(true);
    };

    init();

    // Listen to Bluetooth state changes globally
    const unsubscribe = bleService.onStateChange(state => {
      setBluetoothState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [setHasPermissions, setBluetoothState, setIsInitialized]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <AppNavigator />
    </GestureHandlerRootView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
});

export default App;
