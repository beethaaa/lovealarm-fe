import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import './src/i18n';

import AppNavigator from './src/navigation/AppNavigator';
import { useAppStore } from './src/store/appStore';

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';

import { handleNotificationOpen } from './src/utils/notificationHandler';
import { EventType } from '@notifee/react-native';

axios.interceptors.response.use(
  response => response,
  async error => {
    if (error.response && error.response.status === 401) {
      await AsyncStorage.removeItem('token');
      await useAppStore.getState().setLogout();
    }
    return Promise.reject(error);
  },
);

const App = () => {
  const { setIsInitialized } = useAppStore();

  useEffect(() => {
    const init = async () => {
      try {
        // request notification permission
        await notifee.requestPermission();

        // request FCM permission
        await messaging().requestPermission();

        // create Android notification channel
        await notifee.createChannel({
          id: 'default',
          name: 'Default Channel',
          importance: AndroidImportance.HIGH,
        });

        // get FCM token
        const token = await messaging().getToken();
        console.log('FCM TOKEN:', token);

        // 1. Handle Quit state (App closed)
        const initialNotification = await messaging().getInitialNotification();
        if (initialNotification) {
          console.log('[App] Initial notification:', initialNotification);
          handleNotificationOpen(initialNotification.data);
        }

        // 2. Handle Background state (App minimized)
        messaging().onNotificationOpenedApp(remoteMessage => {
          console.log('[App] Background notification:', remoteMessage);
          handleNotificationOpen(remoteMessage.data);
        });

        // 3. Handle Foreground state (Local notification interaction)
        notifee.onForegroundEvent(({ type, detail }) => {
          if (type === EventType.PRESS) {
            console.log(
              '[App] Foreground notification press:',
              detail.notification,
            );
            handleNotificationOpen(detail.notification?.data);
          }
        });

        // listen for foreground notifications (Incoming FCM message)
        messaging().onMessage(async remoteMessage => {
          console.log('Foreground message received:', remoteMessage);

          await notifee.displayNotification({
            title: remoteMessage.notification?.title,
            body: remoteMessage.notification?.body,
            data: remoteMessage.data, // Important: pass data to notifee so it can be accessed on press
            android: {
              channelId: 'default',
              smallIcon: 'ic_launcher',
              pressAction: {
                id: 'default',
              },
            },
          });
        });
      } catch (error) {
        console.log('Notification setup error:', error);
      }

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
