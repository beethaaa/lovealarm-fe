// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Onboarding: undefined;
  Main: undefined;
  Permissions: undefined;
};

export type BottomTabParamList = {
  Home: undefined;
  BLE: undefined;
  Settings: undefined;
};

// Extend i18n types for type safety
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
  }
}

// NativeWind types
/// <reference types="nativewind/types" />
