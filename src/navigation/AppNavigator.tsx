import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';

import HomeScreen from '../screens/HomeScreen';
import BLEScreen from '../screens/BLEScreen';
import SettingsScreen from '../screens/SettingsScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import { useAppStore } from '../store/appStore';
import { RootStackParamList, BottomTabParamList } from '../types/index';
import COLOR_PALETTE from '../styles/colorPalette';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<BottomTabParamList>();

const makeTabIcon =
  (emoji: string) =>
  ({ focused }: { focused: boolean }) =>
    (
      <View style={[styles.tabIcon, focused ? styles.tabIconFocused : null]}>
        <Text style={styles.tabEmoji}>{emoji}</Text>
      </View>
    );

const BottomTabs = () => {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f172a',
          borderTopColor: '#1e293b',
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 65,
        },
        tabBarActiveTintColor: COLOR_PALETTE.brightPink,
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: t('navigation.home'),
          tabBarIcon: makeTabIcon('🏠'),
        }}
      />
      <Tab.Screen
        name="BLE"
        component={BLEScreen}
        options={{
          tabBarLabel: t('navigation.ble'),
          tabBarIcon: makeTabIcon('📡'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: t('navigation.settings'),
          tabBarIcon: makeTabIcon('⚙️'),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const { isLoggedIn, isInitialized, checkLoginStatus } = useAppStore();

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
          headerShown: false,
          contentStyle: { backgroundColor: '#000' }, // Đặt màu nền đen cho toàn bộ Stack
        }}
      >
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={BottomTabs} />
        ) : (
          <Stack.Group>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
          </Stack.Group>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  tabIcon: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  tabIconFocused: {
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
  },
  tabEmoji: {
    fontSize: 20,
  },
});

export default AppNavigator;
