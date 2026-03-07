import React, { useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Image,
} from 'react-native';
import { State } from 'react-native-ble-plx';

import { useLoveAlarm, ScanResult } from '../hooks/useLoveAlarm';
import COLOR_PALETTE from '../styles/colorPalette';

const COLORS = {
  bg: '#0A0A0A',
  surface: '#17050A',
  surfaceDeep: '#050102',
  border: '#3D0E1E',
  primary: COLOR_PALETTE.brightPink,
  primaryBg: COLOR_PALETTE.roseRed,
  textPrimary: '#FFFFFF',
  textSecondary: COLOR_PALETTE.cherryBlossomPink,
  textMuted: COLOR_PALETTE.amaranthPink,
  green: '#22c55e',
  yellow: '#eab308',
  red: '#ef4444',
};

const getSignalColor = (rssi: number | null): string => {
  if (!rssi) return COLORS.textMuted;
  if (rssi > -60) return COLOR_PALETTE.pink;
  if (rssi > -80) return COLOR_PALETTE.mimiPink;
  return COLOR_PALETTE.lavenderBlush;
};

const DeviceCard = ({ user }: { user: ScanResult }) => {
  const signalColor = getSignalColor(user.rssi);

  return (
    <View style={styles.deviceCard}>
      <View style={styles.deviceCardInner}>
        <View style={styles.deviceIconWrap}>
          {user.avatarUrl ? (
            <Image
              source={{ uri: user.avatarUrl }}
              style={styles.avatarImage}
            />
          ) : (
            <Text style={styles.deviceIconText}>💌</Text>
          )}
        </View>
        <View style={styles.deviceInfo}>
          <Text style={styles.deviceName} numberOfLines={1}>
            {user.name || 'Secret Admirer'}
          </Text>
          <Text style={styles.deviceId} numberOfLines={1}>
            ID: {user.bleSessionUuid.substring(0, 8)}...
          </Text>
          <View style={styles.signalRow}>
            <Text style={styles.rssiText}>
              Signal Strength: {user.rssi ? `${user.rssi} dBm` : 'N/A'}
            </Text>
          </View>
        </View>

        <View style={[styles.signalDot, { backgroundColor: signalColor }]} />
      </View>
    </View>
  );
};

const EmptyState = ({
  isScanning,
  bluetoothState,
}: {
  isScanning: boolean;
  bluetoothState: State;
}) => {
  if (bluetoothState !== State.PoweredOn) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyEmoji}>💔</Text>
        <Text style={styles.emptyTitle}>Bluetooth is Offline</Text>
        <Text style={styles.emptySubtitle}>
          Please turn on Bluetooth to connect with nearby hearts.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyEmoji}>📡</Text>
      <Text style={styles.emptyTitle}>
        {isScanning ? 'Syncing...' : 'No Hearts Nearby'}
      </Text>
      {!isScanning && (
        <Text style={styles.emptySubtitle}>
          Tap "OPEN LOVE ALARM" to start receiving signals.
        </Text>
      )}
    </View>
  );
};

const BLEScreen = () => {
  const {
    isScanning,
    nearbyUsers,
    bluetoothState,
    startLoveAlarm,
    stopLoveAlarm,
  } = useLoveAlarm();

  const renderDevice = useCallback(
    ({ item }: { item: ScanResult }) => <DeviceCard user={item} />,
    [],
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Love Radar</Text>
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
              ? 'Scanning area for signals...'
              : `${nearbyUsers.length} connection(s) nearby`}
          </Text>
        </View>
      </View>

      <View style={styles.scanButtonWrap}>
        <TouchableOpacity
          onPress={isScanning ? stopLoveAlarm : startLoveAlarm}
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
            {isScanning ? 'STOP SYNCING' : 'OPEN LOVE ALARM'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={nearbyUsers}
        keyExtractor={item => item.bleSessionUuid}
        renderItem={renderDevice}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState isScanning={isScanning} bluetoothState={bluetoothState} />
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
    fontWeight: '900',
    textShadowColor: COLORS.primaryBg,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
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
    fontWeight: '500',
  },
  scanButtonWrap: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  scanButton: {
    borderRadius: 30,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonStart: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  scanButtonStop: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
  },
  scanButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 15,
    letterSpacing: 1,
  },
  activityIndicator: {
    marginRight: 12,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  deviceCard: {
    marginHorizontal: 24,
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
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
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
    fontSize: 16,
    marginBottom: 4,
  },
  deviceId: {
    color: COLORS.textMuted,
    fontSize: 12,
  },
  signalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  rssiText: {
    color: COLORS.textSecondary,
    fontSize: 13,
  },
  signalDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginLeft: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    marginTop: 60,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    color: COLORS.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  emptySubtitle: {
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 12,
    fontSize: 15,
    lineHeight: 22,
  },
});
