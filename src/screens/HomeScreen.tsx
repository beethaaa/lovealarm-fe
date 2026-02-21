import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useBLE } from '@hooks/useBLE';
import { State } from 'react-native-ble-plx';

// Color palette
const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  border: '#334155',
  primary: '#ec4899',
  primaryDark: '#9d174d',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  green: '#22c55e',
  greenBg: '#14532d',
  red: '#ef4444',
  yellowBg: '#713f12',
  redBg: '#450a0a',
};

// Animated ring component
const PulseRing = ({
  delay = 0,
  isActive,
}: {
  delay?: number;
  isActive: boolean;
}) => {
  const scale = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [isActive, delay, scale, opacity]);

  return (
    <Animated.View
      style={[styles.pulseRing, { opacity, transform: [{ scale }] }]}
    />
  );
};

const HomeScreen = () => {
  const { t } = useTranslation();
  const { isScanning, devices, startScan, stopScan, bluetoothState } = useBLE();

  const isBluetoothOn = bluetoothState === State.PoweredOn;

  const getRssiSignal = (rssi: number | null | undefined) => {
    const val = rssi ?? -100;
    if (val > -60) return { label: '●●●', bg: COLORS.greenBg };
    if (val > -80) return { label: '●●○', bg: COLORS.yellowBg };
    return { label: '●○○', bg: COLORS.redBg };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brandText}>♥ Love Alarm</Text>
          <Text style={styles.welcomeText}>{t('home.welcome')}</Text>
          <Text style={styles.descriptionText}>{t('home.description')}</Text>
        </View>

        {/* Radar / Pulse Animation */}
        <View style={styles.radarContainer}>
          <View style={styles.radarInner}>
            <PulseRing delay={0} isActive={isScanning} />
            <PulseRing delay={600} isActive={isScanning} />
            <PulseRing delay={1200} isActive={isScanning} />

            {/* Center circle */}
            <View
              style={[
                styles.centerCircle,
                {
                  backgroundColor: isScanning ? COLORS.primary : COLORS.surface,
                },
                isScanning && styles.centerCircleActive,
              ]}
            >
              <Text style={styles.heartEmoji}>💗</Text>
            </View>
          </View>
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isBluetoothOn ? COLORS.green : COLORS.red,
                  },
                ]}
              />
              <Text style={styles.statusLabel}>Bluetooth</Text>
            </View>
            <Text style={styles.statusValue}>
              {isBluetoothOn ? '🟢 ON' : '🔴 OFF'}
            </Text>
          </View>
          <View style={styles.statusRow2}>
            <Text style={styles.statusLabel}>
              {t('ble.devices_nearby', { count: devices.length })}
            </Text>
            {isScanning && (
              <Text style={styles.scanningText}>{t('ble.scanning')}</Text>
            )}
          </View>
        </View>

        {/* Nearby devices preview */}
        {devices.length > 0 && (
          <View style={styles.devicesContainer}>
            <Text style={styles.devicesTitle}>📡 {t('ble.device_found')}</Text>
            {devices.slice(0, 3).map(device => {
              const signal = getRssiSignal(device.rssi);
              return (
                <View key={device.id} style={styles.deviceRow}>
                  <View style={styles.deviceIcon}>
                    <Text style={styles.deviceIconText}>📱</Text>
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                      {device.name || 'Unknown Device'}
                    </Text>
                    <Text style={styles.deviceRssi}>
                      RSSI: {device.rssi} dBm
                    </Text>
                  </View>
                  <View
                    style={[styles.signalBadge, { backgroundColor: signal.bg }]}
                  >
                    <Text style={styles.signalBadgeText}>{signal.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Scan Button */}
        <View style={styles.scanButtonContainer}>
          <TouchableOpacity
            onPress={isScanning ? stopScan : () => startScan()}
            style={[
              styles.scanButton,
              isScanning ? styles.scanButtonStop : styles.scanButtonStart,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.scanButtonText}>
              {isScanning
                ? `⏹ ${t('home.stop_scanning')}`
                : `▶ ${t('home.start_scanning')}`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  brandText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  welcomeText: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 4,
  },
  descriptionText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 8,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 32,
  },
  radarInner: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  centerCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircleActive: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 20,
  },
  heartEmoji: {
    fontSize: 36,
  },
  statusCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusRow2: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  statusLabel: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  statusValue: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  scanningText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  devicesContainer: {
    marginHorizontal: 24,
    marginBottom: 16,
  },
  devicesTitle: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 18,
    marginBottom: 12,
  },
  deviceRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#4a044e',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 18,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: COLORS.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  deviceRssi: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  signalBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  signalBadgeText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  scanButtonContainer: {
    marginHorizontal: 24,
    marginBottom: 40,
  },
  scanButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  scanButtonStart: {
    backgroundColor: COLORS.primary,
    shadowOpacity: 0.6,
  },
  scanButtonStop: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    shadowOpacity: 0.4,
  },
  scanButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 16,
  },
});
