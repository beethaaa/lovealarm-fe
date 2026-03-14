import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import './src/i18n';

import AppNavigator from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/appStore';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem("token");
      await useAppStore.getState().setLogout();
    }
    return Promise.reject(error);
  }
);

const App = () => {
  const { setIsInitialized } = useAppStore();

  useEffect(() => {
    const init = async () => {
      setIsInitialized(true);
    };

    init();
  }, [setIsInitialized]);

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
