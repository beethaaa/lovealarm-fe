// import React from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
// import { useTranslation } from 'react-i18next';
// import { View, Text, StyleSheet } from 'react-native';

// import HomeScreen from '../screens/HomeScreen';
// import BLEScreen from '../screens/BLEScreen';
// import SettingsScreen from '../screens/SettingsScreen';

// import { RootStackParamList, BottomTabParamList } from '../types/index';

// const Stack = createNativeStackNavigator<RootStackParamList>();
// const Tab = createBottomTabNavigator<BottomTabParamList>();

// // Tab Icon - defined outside of render to avoid recreation
// const makeTabIcon =
//   (emoji: string) =>
//   ({ focused }: { focused: boolean; color: string; size: number }) =>
//     (
//       <View style={[styles.tabIcon, focused ? styles.tabIconFocused : null]}>
//         <Text style={styles.tabEmoji}>{emoji}</Text>
//       </View>
//     );

// // Bottom Tab Navigator
// const BottomTabs = () => {
//   const { t } = useTranslation();

//   return (
//     <Tab.Navigator
//       screenOptions={{
//         headerShown: false,
//         tabBarStyle: {
//           backgroundColor: '#0f172a',
//           borderTopColor: '#1e293b',
//           borderTopWidth: 1,
//           paddingBottom: 8,
//           paddingTop: 8,
//           height: 65,
//         },
//         tabBarActiveTintColor: '#ec4899',
//         tabBarInactiveTintColor: '#64748b',
//         tabBarLabelStyle: {
//           fontSize: 11,
//           fontWeight: '600',
//           marginTop: 2,
//         },
//       }}
//     >
//       <Tab.Screen
//         name="Home"
//         component={HomeScreen}
//         options={{
//           tabBarLabel: t('navigation.home'),
//           tabBarIcon: makeTabIcon('🏠'),
//         }}
//       />
//       <Tab.Screen
//         name="BLE"
//         component={BLEScreen}
//         options={{
//           tabBarLabel: t('navigation.ble'),
//           tabBarIcon: makeTabIcon('📡'),
//         }}
//       />
//       <Tab.Screen
//         name="Settings"
//         component={SettingsScreen}
//         options={{
//           tabBarLabel: t('navigation.settings'),
//           tabBarIcon: makeTabIcon('⚙️'),
//         }}
//       />
//     </Tab.Navigator>
//   );
// };

// // Root Navigator
// const AppNavigator = () => {
//   return (
//     <NavigationContainer>
//       <Stack.Navigator
//         screenOptions={{
//           headerStyle: { backgroundColor: '#0f172a' },
//           headerTitleStyle: { color: '#f8fafc', fontWeight: '700' },
//           headerTintColor: '#ec4899',
//           contentStyle: { backgroundColor: '#0f172a' },
//         }}
//       >
//         <Stack.Screen
//           name="Main"
//           component={BottomTabs}
//           options={{ headerShown: false }}
//         />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default AppNavigator;

// const styles = StyleSheet.create({
//   tabIcon: {
//     alignItems: 'center',
//     justifyContent: 'center',
//     width: 40,
//     height: 40,
//     borderRadius: 20,
//   },
//   tabIconFocused: {
//     backgroundColor: 'rgba(236,72,153,0.15)',
//   },
//   tabEmoji: {
//     fontSize: 20,
//   },
// });
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
          headerStyle: { backgroundColor: '#0f172a' },
          headerTitleStyle: { color: '#f8fafc', fontWeight: '700' },
          headerTintColor: COLOR_PALETTE.brightPink,
          contentStyle: { backgroundColor: '#0f172a' },
          headerShown: false,
        }}
      >
        {isLoggedIn ? (
          <Stack.Screen name="Main" component={BottomTabs} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;

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
