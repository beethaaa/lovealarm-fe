import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  Animated,
  StatusBar,
  StyleSheet,
  Image,
} from 'react-native';
import { useLoveAlarm, ScanResult } from '@hooks/useLoveAlarm';
import COLOR_PALETTE from '@/styles/colorPalette';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const TYPEWRITER_TEXT = 'Are you crushing on anyone...';

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

interface HomeScreenProps {
  isScanning?: boolean;
  startLoveAlarm?: () => void;
  stopLoveAlarm?: () => void;
  nearbyUsers?: ScanResult[];
}

const HomeScreen = (props: HomeScreenProps) => {
  const { isScanning: isScanningHook, nearbyUsers: nearbyUsersHook } =
    useLoveAlarm();

  const isScanning = props.isScanning ?? isScanningHook;
  const nearbyUsers = props.nearbyUsers ?? nearbyUsersHook;

  const heartScale = React.useRef(new Animated.Value(1)).current;

  const [displayedText, setDisplayedText] = useState('');
  const [showBanner, setShowBanner] = useState(false);
  const bannerOpacity = useRef(new Animated.Value(0)).current;
  const typewriterRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const charIndexRef = useRef(0);

  useEffect(() => {
    if (isScanning) {
      charIndexRef.current = 0;
      setDisplayedText('');
      setShowBanner(true);
      bannerOpacity.setValue(0);
      Animated.timing(bannerOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start();

      const type = () => {
        if (charIndexRef.current <= TYPEWRITER_TEXT.length) {
          setDisplayedText(TYPEWRITER_TEXT.slice(0, charIndexRef.current));
          charIndexRef.current += 1;
          typewriterRef.current = setTimeout(type, 55);
        }
      };
      typewriterRef.current = setTimeout(type, 200);
    } else {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
        typewriterRef.current = null;
      }
      Animated.timing(bannerOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setShowBanner(false);
        setDisplayedText('');
        charIndexRef.current = 0;
      });
    }

    return () => {
      if (typewriterRef.current) {
        clearTimeout(typewriterRef.current);
        typewriterRef.current = null;
      }
    };
  }, [isScanning, bannerOpacity]);

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

  const userPositionsRef = useRef<
    Record<string, { angle: number; ring: number }>
  >({});
  const userOpacitiesRef = useRef<Record<string, Animated.Value>>({});

  useEffect(() => {
    const activeIds = new Set((nearbyUsers || []).map(u => u.userId));

    Object.keys(userPositionsRef.current).forEach(id => {
      if (!activeIds.has(id)) {
        delete userPositionsRef.current[id];
        delete userOpacitiesRef.current[id];
      }
    });

    (nearbyUsers || []).forEach((user, index) => {
      if (!userPositionsRef.current[user.userId]) {
        const ring = index % 3;
        const existing = Object.values(userPositionsRef.current).map(
          p => p.angle,
        );
        let angle = 0;
        let best = -1;
        for (let attempt = 0; attempt < 30; attempt++) {
          const candidate = Math.random() * 2 * Math.PI;
          const minDist = existing.length
            ? Math.min(...existing.map(a => Math.abs(a - candidate)))
            : Infinity;
          if (minDist > best) {
            best = minDist;
            angle = candidate;
          }
        }
        userPositionsRef.current[user.userId] = { angle, ring };

        const opacity = new Animated.Value(0);
        userOpacitiesRef.current[user.userId] = opacity;
        Animated.timing(opacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start();
      }
    });
  }, [nearbyUsers]);

  const BUBBLE_SIZE = 48;
  const RADAR_CENTER = 150;
  const RING_RADII = [80, 110, 140];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showBanner && (
          <Animated.View style={[styles.header, { opacity: bannerOpacity }]}>
            <View style={styles.welcomeTextContainer}>
              <Icon name="radio-outline" size={24} color={COLOR_PALETTE.pink} />
              <Text style={styles.welcomeText}>{displayedText}</Text>
            </View>
          </Animated.View>
        )}

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
                  size={80}
                  color={COLOR_PALETTE.cherryBlossomPink}
                />
              </Animated.View>
            </View>

            {isScanning &&
              (nearbyUsers || []).map(user => {
                const pos = userPositionsRef.current[user.userId];
                const opacityAnim = userOpacitiesRef.current[user.userId];
                if (!pos || !opacityAnim) return null;

                const radius = RING_RADII[pos.ring];
                const cx =
                  RADAR_CENTER + radius * Math.cos(pos.angle) - BUBBLE_SIZE / 2;
                const cy =
                  RADAR_CENTER + radius * Math.sin(pos.angle) - BUBBLE_SIZE / 2;

                return (
                  <Animated.View
                    key={user.userId}
                    style={[
                      styles.userBubbleWrapper,
                      { left: cx, top: cy, opacity: opacityAnim },
                    ]}
                  >
                    <LinearGradient
                      colors={['#FFF6E4', '#FFECC9', '#F6889A']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.userBubbleGradient}
                    >
                      {user.avatarUrl ? (
                        <Image
                          source={{ uri: user.avatarUrl }}
                          style={styles.userBubbleImage}
                        />
                      ) : (
                        <View style={styles.userBubbleFallback}>
                          <Text style={styles.userBubbleInitial}>
                            {user.name?.[0]?.toUpperCase() ?? '?'}
                          </Text>
                        </View>
                      )}
                    </LinearGradient>
                  </Animated.View>
                );
              })}
          </View>
        </View>

        {/* <View style={styles.statusCard}>
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
        </View> */}
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
    paddingBottom: 320,
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
    backgroundColor: '#0A0A0A',
    borderRadius: 16,
    marginTop: 40,
    paddingHorizontal: 24,
    paddingVertical: 14,
    gap: 12,
    boxShadow: 'inset 0px -1px 4px 0px #FFB2C5',
  },
  welcomeText: {
    color: COLORS.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textShadowColor: COLORS.primaryDark,
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  cursor: {
    color: COLOR_PALETTE.pink,
    fontWeight: '300',
    opacity: 1,
  },
  radarContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarInner: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position: 'absolute',
    borderWidth: 4,
    borderColor: COLOR_PALETTE.cherryBlossomPink,
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
    marginTop: 64,
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
  userBubbleWrapper: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    shadowColor: COLOR_PALETTE.pink,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 10,
  },
  userBubbleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 24,
    padding: 3,
  },
  userBubbleImage: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
  },
  userBubbleFallback: {
    width: '100%',
    height: '100%',
    borderRadius: 21,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userBubbleInitial: {
    color: COLOR_PALETTE.amaranthPink,
    fontSize: 18,
    fontWeight: '700',
  },
});
