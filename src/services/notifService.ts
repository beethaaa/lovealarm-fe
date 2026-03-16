import { SERVER_URL } from '@/constants/service';
import AsyncStorage from '@react-native-async-storage/async-storage';
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

export const requestUserPermission = async (): Promise<void> => {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted');
  }
};

export const getFcmToken = async (): Promise<void> => {
  try {
    const fcmToken = await messaging().getToken();
    const deviceId: string = await DeviceInfo.getUniqueId();

    const accesstoken = await AsyncStorage.getItem('token');
    await axios.post(
      `${SERVER_URL}/api/devices/register`,
      {
        deviceId: deviceId,
        fcmToken: fcmToken,
        platform: Platform.OS,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accesstoken}`,
        },
      },
    );
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }
};
