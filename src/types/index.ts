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

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
  }
}

/// <reference types="nativewind/types" />
