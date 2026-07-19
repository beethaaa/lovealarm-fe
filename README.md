# DearU - React Native CLI Project

A production-ready React Native CLI project with BLE, NativeWind (Tailwind CSS), and i18n support.

## 🏗 Architecture

```
DearU/
├── src/
│   ├── components/          # Reusable UI components
│   ├── screens/             # App screens
│   │   ├── HomeScreen.tsx   # Main screen with BLE radar animation
│   │   ├── BLEScreen.tsx    # BLE device scanner & list  
│   │   ├── SettingsScreen.tsx  # Language & theme settings
│   │   └── DeviceDetailScreen.tsx  # BLE device details
│   ├── navigation/
│   │   └── AppNavigator.tsx # Stack + Bottom tab navigation
│   ├── services/
│   │   └── ble/
│   │       └── BleService.ts  # BLE singleton service (iOS + Android)
│   ├── store/
│   │   ├── bleStore.ts      # Zustand BLE state
│   │   └── appStore.ts      # Zustand app state (language, theme)
│   ├── hooks/
│   │   └── useBLE.ts        # Custom BLE hook with auto-timeout
│   ├── i18n/
│   │   ├── index.ts         # i18next configuration
│   │   └── locales/
│   │       ├── en.json      # English translations
│   │       ├── vi.json      # Vietnamese translations
│   │       └── zh.json      # Chinese translations
│   ├── types/
│   │   └── index.ts         # TypeScript types & navigation params
│   └── global.css           # NativeWind CSS entry
├── android/                 # Android native code
├── ios/                     # iOS native code  
├── tailwind.config.js       # Tailwind / NativeWind config
├── babel.config.js          # Babel with path aliases
├── metro.config.js          # Metro with NativeWind
└── tsconfig.json            # TypeScript with path aliases
```

## 🛠 Tech Stack

| Category | Library | Purpose |
|----------|---------|---------|
| Framework | React Native CLI | Core framework |
| Language | TypeScript | Type safety |
| Styling | NativeWind v4 + Tailwind CSS | Utility-first CSS |
| BLE | react-native-ble-plx | Bluetooth Low Energy |
| i18n | i18next + react-i18next | Internationalization |
| Navigation | React Navigation v6 | App navigation |
| State | Zustand | Lightweight state management |
| Bundler | Metro | JS bundler |

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18
- React Native CLI: `npm install -g @react-native/cli`
- Android Studio (for Android)
- Xcode (for iOS, macOS only)

### Installation

```bash
# Install dependencies
npm install

# iOS only: install pods
cd ios && pod install && cd ..
```

### Running the App

```bash
# Start Metro bundler
npm start

# Run on Android
npm run android

# Run on iOS (macOS only)  
npm run ios
```

## 📱 Features

### 🔵 BLE (Bluetooth Low Energy)
- Auto-request permissions on startup (Android 12+ and Android < 12)
- Scan for nearby BLE devices with 10-second auto-timeout
- Display device name, RSSI signal strength with visual indicators
- Connect/disconnect to devices
- View GATT services and characteristics
- iOS NSBluetooth permissions pre-configured in Info.plist

### 🎨 Styling (NativeWind / Tailwind CSS)
- Dark theme with primary pink color palette
- Animated pulse radar effect on Home screen
- Signal strength color indicators (green/yellow/red)
- Responsive design for all screen sizes

### 🌍 i18n (Internationalization)
- **English** 🇬🇧 - Default
- **Vietnamese** 🇻🇳 - Tiếng Việt  
- **Chinese** 🇨🇳 - 中文
- Auto-detects device language on first launch
- Change language in Settings screen
- Uses i18next with react-native-localize

### 📁 Path Aliases
Import using `@/` aliases (configured in both tsconfig.json and babel.config.js):
```typescript
import {useBLE} from '@hooks/useBLE';
import {bleService} from '@services/ble/BleService';
import {LANGUAGES} from '@i18n';
```

## 🔧 Permissions

### Android (AndroidManifest.xml)
- `BLUETOOTH`, `BLUETOOTH_ADMIN` (Android < 12)
- `BLUETOOTH_SCAN`, `BLUETOOTH_CONNECT`, `BLUETOOTH_ADVERTISE` (Android 12+)
- `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION` (required for BLE scan)

### iOS (Info.plist)
- `NSBluetoothAlwaysUsageDescription`
- `NSBluetoothPeripheralUsageDescription`
- `NSLocationWhenInUseUsageDescription`

## ➕ Adding a New Language

1. Create `src/i18n/locales/<lang-code>.json`
2. Add to `resources` object in `src/i18n/index.ts`
3. Add to `LANGUAGES` array in `src/i18n/index.ts`

## 📦 Adding New Screens

1. Create screen in `src/screens/MyScreen.tsx`
2. Add route to `src/types/index.ts` navigation params
3. Register in `src/navigation/AppNavigator.tsx`

### 📁 Terminate PID
```typescript
netstat -ano | findstr 8081
taskkill /PID 11580 (PID) /F 

npx react-native start --reset-cache
npx react-native run-android  // run in new terminal
npx react-native log-android  // check log (emulator or only 1 physical device)

npx react-native run-android --deviceId <device_id>  // run on specific device
adb -s <device_id> logcat *:S ReactNativeJS:V  // check log (multiple physical devices)


```

---

Built with ♥ using React Native CLI • NativeWind • react-native-ble-plx • i18next • Zustand
