import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  StatusBar,
  StyleSheet,
  TextInput,
  Alert,
} from 'react-native';
import { State } from 'react-native-ble-plx';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLoveAlarm } from '@hooks/useLoveAlarm';
import COLOR_PALETTE from '@/styles/colorPalette';
import Icon from 'react-native-vector-icons/Ionicons';

const COLORS = {
  bg: '#0A0A0A',
  surface: '#17050A',
  border: '#3D0E1E',
  primary: COLOR_PALETTE.brightPink,
  primaryLight: COLOR_PALETTE.pink,
  primaryDark: COLOR_PALETTE.roseRed,
  textPrimary: '#FFFFFF',
  textSecondary: COLOR_PALETTE.cherryBlossomPink,
  textMuted: COLOR_PALETTE.amaranthPink,
  green: '#22c55e',
  red: '#ef4444',
};

const PulseRing = ({
  delay = 0,
  isActive,
  size = 240,
  staticOpacity = 0.25,
}: {
  delay?: number;
  isActive: boolean;
  size?: number;
  staticOpacity?: number;
}) => {
  const scale = React.useRef(new Animated.Value(1)).current;
  const opacity = React.useRef(new Animated.Value(staticOpacity)).current;
  const animRef = React.useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }

    if (!isActive) {
      const staticAnim = Animated.parallel([
        Animated.timing(scale, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: staticOpacity,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
      animRef.current = staticAnim;
      staticAnim.start(() => {
        animRef.current = null;
      });
      return;
    }

    scale.setValue(0);
    opacity.setValue(0.8);

    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.5,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 2500,
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
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    animRef.current = loop;
    loop.start();

    return () => {
      animRef.current?.stop();
      animRef.current = null;
    };
  }, [isActive, delay, scale, opacity, staticOpacity]);

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity,
          transform: [{ scale }],
        },
      ]}
    />
  );
};

const HomeScreen = () => {
  const {
    isScanning,
    nearbyUsers,
    bluetoothState,
    startLoveAlarm,
    stopLoveAlarm,
  } = useLoveAlarm();

  const [tokenInput, setTokenInput] = useState('');

  const heartScale = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isScanning) {
      heartScale.setValue(1);
      return;
    }
    const beat = Animated.loop(
      Animated.sequence([
        Animated.timing(heartScale, {
          toValue: 1.1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.05,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(heartScale, {
          toValue: 1.0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(600),
      ]),
    );
    beat.start();
    return () => beat.stop();
  }, [isScanning, heartScale]);

  const handleSaveToken = async () => {
    try {
      if (tokenInput.trim() !== '') {
        await AsyncStorage.setItem('token', tokenInput.trim());
        Alert.alert(
          'Success',
          `Token saved: ${await AsyncStorage.getItem('token')}`,
        );
      } else {
        await AsyncStorage.removeItem('token');
        Alert.alert(
          'Success',
          `Token cleared: ${await AsyncStorage.getItem('token')}`,
        );
      }
    } catch (e) {
      console.error('Error saving token', e);
      Alert.alert('Error', 'Failed to save token');
    }
  };

  const isBluetoothOn = bluetoothState === State.PoweredOn;

  const getRssiSignal = (rssi: number) => {
    if (rssi > -60) return { label: 'Strong', color: COLOR_PALETTE.pink };
    if (rssi > -80) return { label: 'Good', color: COLOR_PALETTE.mimiPink };
    return { label: 'Weak', color: COLOR_PALETTE.lavenderBlush };
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.brandText}>LOVE ALARM</Text>
          <View style={styles.welcomeTextContainer}>
            <Icon
              name="radio-outline"
              size={20}
              color={COLOR_PALETTE.cherryBlossomPink}
            />
            <Text style={styles.welcomeText}>Are you crushing on anyone?</Text>
          </View>
        </View>

        <View style={styles.tokenContainer}>
          <TextInput
            style={styles.tokenInput}
            placeholder="Enter token..."
            placeholderTextColor={COLORS.textMuted}
            value={tokenInput}
            onChangeText={setTokenInput}
          />
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveToken}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.radarContainer}>
          <View style={styles.radarInner}>
            <PulseRing
              delay={1600}
              isActive={isScanning}
              size={160}
              staticOpacity={0.65}
            />
            <PulseRing
              delay={800}
              isActive={isScanning}
              size={220}
              staticOpacity={0.45}
            />
            <PulseRing
              delay={0}
              isActive={isScanning}
              size={280}
              staticOpacity={0.2}
            />

            <View
              style={[
                styles.centerCircle,
                isScanning && styles.centerCircleActive,
              ]}
            >
              <Animated.View
                style={[
                  { transform: [{ scale: heartScale }] },
                  styles.heartGlow,
                ]}
              >
                <Icon
                  style={styles.heartIcon}
                  name="heart"
                  size={72}
                  color={COLOR_PALETTE.cherryBlossomPink}
                />
              </Animated.View>
            </View>
          </View>
        </View>

        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <View style={styles.statusLeft}>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isBluetoothOn
                      ? COLORS.primary
                      : COLORS.border,
                  },
                ]}
              />
              <Text style={styles.statusLabel}>Bluetooth Shield</Text>
            </View>
            <Text style={styles.statusValue}>
              {isBluetoothOn ? 'Active' : 'Offline'}
            </Text>
          </View>
          <View style={styles.statusRow2}>
            <Text style={styles.statusLabel}>Hearts Nearby</Text>
            <View style={styles.statusRight}>
              <Text style={styles.countText}>{nearbyUsers.length}</Text>
              {isScanning && (
                <Text style={styles.scanningText}>{' (Syncing...)'}</Text>
              )}
            </View>
          </View>
        </View>

        {nearbyUsers.length > 0 && (
          <View style={styles.devicesContainer}>
            <Text style={styles.devicesTitle}>Sparks around you</Text>
            {nearbyUsers.slice(0, 3).map((user, index) => {
              const signal = getRssiSignal(user.rssi);
              return (
                <View
                  key={user.bleSessionUuid || index}
                  style={styles.deviceRow}
                >
                  <View style={styles.deviceIcon}>
                    <Icon name="mail" size={22} color={COLORS.primary} />
                  </View>
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>Secret Admirer</Text>
                    <Text style={styles.deviceRssi}>
                      Signal Strength: {user.rssi} dBm
                    </Text>
                  </View>
                  <View
                    style={[styles.signalBadge, { borderColor: signal.color }]}
                  >
                    <Text
                      style={[styles.signalBadgeText, { color: signal.color }]}
                    >
                      {signal.label}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.scanButtonContainer}>
          <TouchableOpacity
            onPress={isScanning ? stopLoveAlarm : startLoveAlarm}
            style={[
              styles.scanButton,
              isScanning ? styles.scanButtonStop : styles.scanButtonStart,
            ]}
            activeOpacity={0.8}
          >
            <Text style={styles.scanButtonText}>
              {isScanning ? 'STOP SYNCING' : 'OPEN LOVE ALARM'}
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
    alignItems: 'center',
  },
  brandText: {
    color: COLORS.primaryLight,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 4,
    marginBottom: 16,
  },
  welcomeTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: COLOR_PALETTE.cherryBlossomPinkLight,
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  welcomeText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: COLORS.primaryDark,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  radarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 40,
  },
  radarInner: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: COLOR_PALETTE.cherryBlossomPink,
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 8,
  },
  centerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCircleActive: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 25,
    elevation: 20,
  },
  heartGlow: {
    shadowColor: COLOR_PALETTE.cherryBlossomPink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 20,
    elevation: 20,
  },
  heartIcon: {
    textShadowColor: COLOR_PALETTE.cherryBlossomPink,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  statusCard: {
    marginHorizontal: 24,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#3D0E1E',
    shadowColor: COLORS.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
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
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countText: {
    color: COLORS.primaryLight,
    fontSize: 16,
    fontWeight: 'bold',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusLabel: {
    color: COLORS.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  statusValue: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
  scanningText: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
    fontStyle: 'italic',
  },
  devicesContainer: {
    marginHorizontal: 24,
    marginBottom: 24,
  },
  devicesTitle: {
    color: COLORS.textPrimary,
    fontWeight: '800',
    fontSize: 18,
    marginBottom: 16,
  },
  deviceRow: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  deviceIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 77, 109, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  deviceIconText: {
    fontSize: 20,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    color: COLOR_PALETTE.amaranthPink,
    fontWeight: '700',
    fontSize: 15,
    marginBottom: 4,
  },
  deviceRssi: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
  signalBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'transparent',
  },
  signalBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  scanButtonContainer: {
    marginHorizontal: 24,
    marginBottom: 48,
  },
  scanButton: {
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
    elevation: 8,
  },
  scanButtonStart: {
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
  },
  scanButtonStop: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: COLORS.primary,
    shadowOpacity: 0,
  },
  scanButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1.5,
  },
  tokenContainer: {
    flexDirection: 'row',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: -16,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  tokenInput: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.surface,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    color: COLORS.textPrimary,
    marginRight: 12,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  saveButtonText: {
    color: COLORS.textPrimary,
    fontWeight: '700',
    fontSize: 15,
  },
});
