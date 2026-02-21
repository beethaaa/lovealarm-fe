import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Alert,
  StyleSheet,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { State } from 'react-native-ble-plx';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useBLE } from '../hooks/useBLE';
import { BleDevice } from '../store/bleStore';
import { RootStackParamList } from '../types/index';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Color palette
const COLORS = {
  bg: '#0f172a',
  surface: '#1e293b',
  surfaceDeep: '#0f172a',
  border: '#334155',
  borderDeep: '#1e2d40',
  primary: '#ec4899',
  primaryBg: '#831843',
  textPrimary: '#ffffff',
  textSecondary: '#94a3b8',
  textMuted: '#475569',
  green: '#22c55e',
  greenBg: '#14532d',
  yellow: '#eab308',
  red: '#ef4444',
};

// Signal strength helper
const getSignalBars = (rssi: number | null): string => {
  if (!rssi) return '○○○';
  if (rssi > -60) return '●●●';
  if (rssi > -80) return '●●○';
  return '●○○';
};

const getSignalColor = (rssi: number | null): string => {
  if (!rssi) return COLORS.textMuted;
  if (rssi > -60) return COLORS.green;
  if (rssi > -80) return COLORS.yellow;
  return COLORS.red;
};

// Device Card Component
const DeviceCard = ({
  device,
  onPress,
  onConnect,
}: {
  device: BleDevice;
  onPress: () => void;
  onConnect: () => void;
}) => {
  const { t } = useTranslation();
  const signalColor = getSignalColor(device.rssi);
  const signalBars = getSignalBars(device.rssi);

  return (
    <TouchableOpacity
      onPress={onPress}
      style={styles.deviceCard}
      activeOpacity={0.75}
    >
      <View style={styles.deviceCardInner}>
        {/* Icon */}
        <View style={styles.deviceIconWrap}>
          <Text style={styles.deviceIconText}>
            {device.isConnected ? '🔗' : '📱'}
          </Text>
        </View>

        {/* Info */}
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {device.name || 'Unknown Device'}
          </Text>
          <Text style={styles.deviceId} numberOfLines={1}>
            {device.id}
          </Text>
          <View style={styles.signalRow}>
            <Text style={[styles.signalBars, { color: signalColor }]}>
              {signalBars}
            </Text>
            <Text style={styles.rssiText}>
              {device.rssi ? `${device.rssi} dBm` : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Status + Connect Button */}
        <View style={styles.deviceActions}>
          {device.isConnected ? (
            <View style={styles.connectedBadge}>
              <Text style={styles.connectedBadgeText}>
                {t('ble.connected')}
              </Text>
            </View>
          ) : (
            <TouchableOpacity
              onPress={onConnect}
              style={styles.connectButton}
              activeOpacity={0.8}
            >
              <Text style={styles.connectButtonText}>{t('ble.connect')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Empty state
const EmptyState = ({
  isScanning,
  hasPermissions,
  bluetoothState,
}: {
  isScanning: boolean;
  hasPermissions: boolean;
  bluetoothState: State;
}) => {
  const { t } = useTranslation();

  if (bluetoothState !== State.PoweredOn) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔵</Text>
        <Text style={styles.emptyTitle}>{t('ble.bluetooth_off')}</Text>
        <Text style={styles.emptySubtitle}>
          {t('ble.bluetooth_off_message')}
        </Text>
      </View>
    );
  }

  if (!hasPermissions) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>🔒</Text>
        <Text style={styles.emptyTitle}>{t('ble.permission_required')}</Text>
        <Text style={styles.emptySubtitle}>{t('ble.permission_message')}</Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📡</Text>
      <Text style={styles.emptyTitle}>
        {isScanning ? t('ble.scanning') : t('ble.no_devices')}
      </Text>
      {!isScanning && (
        <Text style={styles.emptySubtitle}>
          Tap the scan button to search for nearby devices
        </Text>
      )}
    </View>
  );
};

const BLEScreen = () => {
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  const {
    isScanning,
    devices,
    bluetoothState,
    hasPermissions,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
  } = useBLE();

  const handleConnectDevice = useCallback(
    async (device: BleDevice) => {
      if (device.isConnected) {
        Alert.alert(t('ble.disconnect'), `Disconnect from ${device.name}?`, [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: t('ble.disconnect'),
            style: 'destructive',
            onPress: () => disconnectFromDevice(device.id),
          },
        ]);
      } else {
        await connectToDevice(device.id);
      }
    },
    [connectToDevice, disconnectFromDevice, t],
  );

  const renderDevice = useCallback(
    ({ item }: { item: BleDevice }) => (
      <DeviceCard
        device={item}
        onPress={() =>
          navigation.navigate('DeviceDetail', {
            deviceId: item.id,
            deviceName: item.name || undefined,
          })
        }
        onConnect={() => handleConnectDevice(item)}
      />
    ),
    [navigation, handleConnectDevice],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{t('ble.title')}</Text>
        <View style={styles.headerStatus}>
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor: isScanning ? COLORS.primary : COLORS.textMuted,
              },
            ]}
          />
          <Text style={styles.headerSubtitle}>
            {isScanning
              ? t('ble.scanning')
              : t('ble.devices_nearby', { count: devices.length })}
          </Text>
        </View>
      </View>

      {/* Scan button */}
      <View style={styles.scanButtonWrap}>
        <TouchableOpacity
          onPress={isScanning ? stopScan : () => startScan()}
          style={[
            styles.scanButton,
            isScanning ? styles.scanButtonStop : styles.scanButtonStart,
          ]}
          activeOpacity={0.8}
        >
          {isScanning && (
            <ActivityIndicator
              size="small"
              color={COLORS.primary}
              style={styles.activityIndicator}
            />
          )}
          <Text style={styles.scanButtonText}>
            {isScanning ? t('home.stop_scanning') : t('home.start_scanning')}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Device list */}
      <FlatList
        data={devices}
        keyExtractor={item => item.id}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState
            isScanning={isScanning}
            hasPermissions={hasPermissions}
            bluetoothState={bluetoothState}
          />
        }
      />
    </View>
  );
};

export default BLEScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 28,
    fontWeight: 'bold',
  },
  headerStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  headerSubtitle: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  scanButtonWrap: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  scanButton: {
    borderRadius: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonStart: {
    backgroundColor: COLORS.primary,
  },
  scanButtonStop: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primaryBg,
  },
  scanButtonText: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  activityIndicator: {
    marginRight: 8,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  // Device Card
  deviceCard: {
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deviceIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceDeep,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  deviceIconText: {
    fontSize: 22,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: COLORS.textPrimary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  deviceId: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  signalBars: {
    fontSize: 10,
    fontWeight: 'bold',
    marginRight: 4,
  },
  rssiText: {
    color: COLORS.textMuted,
    fontSize: 11,
  },
  deviceActions: {
    alignItems: 'flex-end',
  },
  connectedBadge: {
    backgroundColor: COLORS.greenBg,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  connectedBadgeText: {
    color: COLORS.green,
    fontSize: 11,
    fontWeight: 'bold',
  },
  connectButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  connectButtonText: {
    color: COLORS.textPrimary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  // Empty state
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
  },
});
