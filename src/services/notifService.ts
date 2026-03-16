import messaging from '@react-native-firebase/messaging';

export const requestUserPermission = async (): Promise<void> => {
  const authStatus = await messaging().requestPermission();

  const enabled =
    authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
    authStatus === messaging.AuthorizationStatus.PROVISIONAL;

  if (enabled) {
    console.log('Notification permission granted');
  }
};

export const getFcmToken = async (): Promise<string | null> => {
  try {
    const token = await messaging().getToken();
    console.log('FCM TOKEN:', token);
    return token;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
};
