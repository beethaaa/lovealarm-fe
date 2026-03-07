/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, StyleSheet, ActivityIndicator, Alert } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import BLEScreen from '../screens/BLEScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';
import OnboardingScreen from '../screens/OnboardingScreen';

import GNB, { GNBProps } from '../components/GNB';
import { useLoveAlarm } from '../hooks/useLoveAlarm';
import { useAppStore } from '../store/appStore';
import { RootStackParamList } from '../types/index';
import COLOR_PALETTE from '../styles/colorPalette';
import { State } from 'react-native-ble-plx';

type TabKey = NonNullable<GNBProps['activeTab']>;

const Stack = createNativeStackNavigator<RootStackParamList>();

const MainTabsWithGNB = () => {
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const {
    isScanning,
    startLoveAlarm,
    stopLoveAlarm,
    nearbyUsers,
    bluetoothState,
  } = useLoveAlarm();

  const isBluetoothOn = bluetoothState === State.PoweredOn;

  const handleScan = () => {
    if (!isBluetoothOn) {
      Alert.alert(
        'Oops bluetooth is off!',
        'Bạn vui lòng bật bluetooth để rung chuông',
      );
      return;
    }
    if (isScanning) {
      stopLoveAlarm();
    } else {
      startLoveAlarm();
    }
    setActiveTab('home');
  };

  const handleTabPress = (tab: TabKey) => {
    if (tab !== 'scan') {
      setActiveTab(tab);
    }
  };

  const renderScreen = () => {
    switch (activeTab) {
      case 'matched':
        return <BLEScreen />;
      case 'profile':
        return <BLEScreen />;
      case 'settings':
        return <SettingsScreen />;
      case 'home':
      default:
        return (
          <HomeScreen
            isScanning={isScanning}
            startLoveAlarm={startLoveAlarm}
            stopLoveAlarm={stopLoveAlarm}
            nearbyUsers={nearbyUsers}
          />
        );
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.screenArea}>{renderScreen()}</View>
      <GNB
        activeTab={activeTab}
        isScanning={isScanning}
        onHome={() => handleTabPress('home')}
        onMatched={() => handleTabPress('matched')}
        onScan={handleScan}
        onProfile={() => handleTabPress('profile')}
        onSettings={() => handleTabPress('settings')}
      />
    </View>
  );
};

const AppNavigator = () => {
  const { isLoggedIn, isOnboarded, isInitialized, checkLoginStatus } = useAppStore();

  useEffect(() => {
    checkLoginStatus();
  }, []);

  if (!isInitialized) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLOR_PALETTE.brightPink} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0A0A0A' },
          headerTitleStyle: { color: '#f8fafc', fontWeight: '700' },
          headerTintColor: '#ec4899',
          contentStyle: { backgroundColor: '#0A0A0A' },
        }}
      >
        {isLoggedIn ? (
          <Stack.Group screenOptions={{ headerShown: false }}>
            {!isOnboarded ? (
              <Stack.Screen name="Onboarding" component={OnboardingScreen} />
            ) : (
              <Stack.Screen name="Main" component={MainTabsWithGNB} />
            )}
          </Stack.Group>
        ) : (
          <Stack.Group screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen
              name="ForgotPassword"
              component={ForgotPasswordScreen}
            />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  screenArea: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
});

export default AppNavigator;
